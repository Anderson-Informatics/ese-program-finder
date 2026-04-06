import ProgramModel from "~~/server/models/program.model";
import SchoolModel from "~~/server/models/school.model";

const ALLOWED_PROGRAMS = ["ASD", "MICI", "ECSE", "MOCI", "POHI", "EI", "VI", "DHH"];
const MAX_COUNT = 1000;

function sanitizeCount(val: any): number | null {
  const n = Number(val);
  if (!Number.isFinite(n) || Number.isNaN(n)) return null;
  const i = Math.floor(n);
  if (i < 0) return null;
  return Math.min(i, MAX_COUNT);
}

export default defineEventHandler(async (event) => {
  const params = (event.context && (event.context as any).params) || {};
  const schoolId = params.schoolId;

  if (!schoolId) {
    throw createError({ statusCode: 400, statusMessage: "Missing schoolId parameter" });
  }

  const body = await readBody(event);
  // Simple admin auth: expect header 'x-admin-password' or special field in body
  const providedPassword = getRequestHeader(event, "x-admin-password") || (body && body._admin_password);
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  if (!adminPassword || providedPassword !== adminPassword) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized: invalid admin password" });
  }
  // Remove any helper field so it doesn't get written to the DB
  if (body && body._admin_password) delete body._admin_password;
  if (!body || typeof body !== "object") {
    throw createError({ statusCode: 400, statusMessage: "Invalid request body" });
  }

  // Validate and build update object
  const setOps: Record<string, any> = {};
  let providedAny = false;

  for (const programKey of Object.keys(body)) {
    if (!ALLOWED_PROGRAMS.includes(programKey)) continue;
    const programVal = body[programKey];
    if (!programVal || typeof programVal !== "object") continue;
    for (const gradeBand of Object.keys(programVal)) {
      const cleaned = sanitizeCount(programVal[gradeBand]);
      if (cleaned === null) {
        throw createError({ statusCode: 400, statusMessage: `Invalid count for ${programKey}.${gradeBand}` });
      }
      setOps[`${programKey}.${gradeBand}`] = cleaned;
      providedAny = true;
    }
  }

  if (!providedAny) {
    throw createError({ statusCode: 400, statusMessage: "No valid program data provided" });
  }

  // Determine canonical SchoolID type by checking SchoolModel
  let school = null;
  try {
    school = await SchoolModel.findOne({ SchoolID: schoolId }).lean();
    if (!school) {
      const numericId = Number(schoolId);
      if (!Number.isNaN(numericId)) {
        school = await SchoolModel.findOne({ SchoolID: numericId }).lean();
      }
    }
  } catch (err) {
    console.error("Error querying School model:", err);
  }

  const canonicalSchoolId = school ? school.SchoolID : (Number.isNaN(Number(schoolId)) ? schoolId : Number(schoolId));

  const query = { $or: [{ SchoolID: Number(schoolId) }, { SchoolID: schoolId }] };
  const update: any = { $set: setOps, $setOnInsert: { SchoolID: canonicalSchoolId } };

  try {
    const updated = await ProgramModel.findOneAndUpdate(query, update, { new: true, upsert: true }).lean();
    return updated;
  } catch (err) {
    console.error("Error updating Program document:", err);
    throw createError({ statusCode: 500, statusMessage: "Error updating program document" });
  }
});
