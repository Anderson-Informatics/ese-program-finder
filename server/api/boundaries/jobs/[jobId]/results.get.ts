import { requireAdmin } from "~~/server/utils/requireAdmin";
import { formatAssignment } from "~~/server/utils/formatAssignment";
import BoundaryJob from "~~/server/models/boundaryJob.model";
import BoundaryJobResult from "~~/server/models/boundaryJobResult.model";

function toCsvValue(value: any): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

export default defineEventHandler(async (event) => {
  const provided = getRequestHeader(event, "x-admin-password");
  requireAdmin(provided);

  const jobId = (event.context as any).params?.jobId;
  if (!jobId) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing jobId",
    });
  }

  const job = await BoundaryJob.findById(jobId).lean();
  if (!job) {
    throw createError({
      statusCode: 404,
      statusMessage: "Job not found",
    });
  }

  const format = getQuery(event).format as string | undefined;

  const results = await BoundaryJobResult.find({ jobId })
    .sort({ index: 1 })
    .lean();

  if (format === "csv") {
    const inputKeys =
      results.length > 0 ? Object.keys(results[0].input || {}) : [];
    const extraKeys = ["elementary", "middle", "high", "neighborhood", "error"];
    const header = [...inputKeys, ...extraKeys];

    const lines = [header.map(toCsvValue).join(",")];

    for (const row of results) {
      const assignments = row.assignments || [];
      const cells = inputKeys.map((k) => toCsvValue(row.input[k]));
      cells.push(toCsvValue(formatAssignment(assignments[0] as any)));
      cells.push(toCsvValue(formatAssignment(assignments[1] as any)));
      cells.push(toCsvValue(formatAssignment(assignments[2] as any)));
      cells.push(toCsvValue(formatAssignment(assignments[3] as any)));
      cells.push(toCsvValue(row.error));
      lines.push(cells.join(","));
    }

    const csv = lines.join("\n");
    setResponseHeader(
      event,
      "Content-Disposition",
      `attachment; filename="bulk-boundaries-${jobId}.csv"`
    );
    setResponseHeader(event, "Content-Type", "text/csv; charset=utf-8");
    return csv;
  }

  return results.map((row) => ({
    ...row.input,
    assignments: row.assignments,
    error: row.error,
  }));
});
