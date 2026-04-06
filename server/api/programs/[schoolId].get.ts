import ProgramModel from "~~/server/models/program.model";
import SchoolModel from "~~/server/models/school.model";
import SummaryModel from "~~/server/models/summary.model";

export default defineEventHandler(async (event) => {
  const params = (event.context && (event.context as any).params) || {};
  const schoolId = params.schoolId;

  if (!schoolId) {
    throw createError({ statusCode: 400, statusMessage: "Missing schoolId parameter" });
  }

  // Try numeric SchoolID first, then string, to tolerate the mixed types in the DB
  let program = null;
  try {
    const numericId = Number(schoolId);
    if (!Number.isNaN(numericId)) {
      program = await ProgramModel.findOne({ SchoolID: numericId }).lean();
    }
    if (!program) {
      program = await ProgramModel.findOne({ SchoolID: schoolId }).lean();
    }
  } catch (err) {
    console.error("Error fetching program doc:", err);
    throw createError({ statusCode: 500, statusMessage: "Error fetching program document" });
  }

  if (!program) {
    throw createError({ statusCode: 404, statusMessage: `Program document not found for SchoolID ${schoolId}` });
  }

  // Fetch any program summaries for this school (capacity/enrolled/etc.)
  try {
    const numericId = Number(schoolId);
    const summaryQuery = !Number.isNaN(numericId) ? { SchoolID: numericId } : { SchoolID: schoolId };
    const summaries = await SummaryModel.find(summaryQuery).lean();

    // Build a map: summariesMap[Program][GradeBand] = summary
    const summariesMap: Record<string, Record<string, any>> = {};
    for (const s of summaries) {
      const p = String((s as any).Program || "");
      const g = String((s as any).GradeBand || "");
      if (!(summariesMap as any)[p]) (summariesMap as any)[p] = {};
      (summariesMap as any)[p][g] = s;
    }

    // Attach to program response under a non-conflicting key
    (program as any)._summaries = summariesMap;
  } catch (err) {
    console.error("Error fetching summary docs:", err);
    // Non-fatal: continue without summaries
    (program as any)._summaries = {};
  }

  return program;
});
