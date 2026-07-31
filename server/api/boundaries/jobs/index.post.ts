import { requireAdmin } from "~~/server/utils/requireAdmin";
import normalizeGrade from "~~/server/utils/normalizeGrade";
import { parseCsv } from "~~/server/utils/parseCsv";
import { findCanonicalColumns } from "~~/server/utils/columnAliases";
import BoundaryJob from "~~/server/models/boundaryJob.model";
import BoundaryJobResult from "~~/server/models/boundaryJobResult.model";

const MAX_ROWS = 50000;

function firstRowShape(rows: any[]): Record<string, any> | null {
  for (const row of rows) {
    if (row && typeof row === "object" && !Array.isArray(row)) {
      return row;
    }
  }
  return null;
}

export default defineEventHandler(async (event) => {
  const provided = getRequestHeader(event, "x-admin-password");
  requireAdmin(provided);

  const contentType = getRequestHeader(event, "content-type") || "";
  let rows: Record<string, any>[];
  let fileType: string;

  if (contentType.startsWith("multipart/form-data")) {
    const formData = await readMultipartFormData(event);
    const file = formData?.find((f) => f.name === "file");
    if (!file || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing file field",
      });
    }

    const text = file.data.toString("utf-8");
    const filename = (file.filename || "").toLowerCase();

    if (filename.endsWith(".json")) {
      fileType = "json";
      rows = JSON.parse(text);
      if (!Array.isArray(rows)) {
        throw createError({
          statusCode: 400,
          statusMessage: "JSON file must contain an array of objects",
        });
      }
    } else {
      fileType = "csv";
      const parsed = parseCsv(text);
      rows = parsed.rows;
    }
  } else {
    const body = await readBody(event);
    if (!Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        statusMessage: "Expected a JSON array of objects or multipart CSV/JSON file",
      });
    }
    fileType = "json";
    rows = body;
  }

  if (rows.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "No rows provided" });
  }

  if (rows.length > MAX_ROWS) {
    throw createError({
      statusCode: 413,
      statusMessage: `Maximum of ${MAX_ROWS} rows allowed`,
    });
  }

  const firstRow = firstRowShape(rows);
  if (!firstRow) {
    throw createError({
      statusCode: 400,
      statusMessage: "Rows must be objects",
    });
  }

  const keys = Object.keys(firstRow);
  const { lat, lng, grade } = findCanonicalColumns(keys);

  const docs: {
    index: number;
    input: Record<string, any>;
    lat: number;
    lng: number;
    grade: number;
  }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Row ${i + 1}: invalid row data`,
      });
    }

    const rawLat = row[lat];
    const rawLng = row[lng];
    const rawGrade = row[grade];

    const nLat = Number(rawLat);
    const nLng = Number(rawLng);

    if (Number.isNaN(nLat) || Number.isNaN(nLng)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Row ${i + 1}: lat and lng must be numeric`,
      });
    }

    const nGrade = normalizeGrade(rawGrade);

    docs.push({
      index: i,
      input: row,
      lat: nLat,
      lng: nLng,
      grade: nGrade,
    });
  }

  const job = await BoundaryJob.create({
    status: "pending",
    total: rows.length,
    fileType,
    processed: 0,
  });

  const jobId = job._id;

  await BoundaryJobResult.insertMany(
    docs.map((d) => ({ ...d, jobId })),
    { ordered: false }
  );

  return { jobId: jobId.toString(), status: "pending", total: rows.length };
});
