import { requireAdmin } from "~~/server/utils/requireAdmin";
import BoundaryJob from "~~/server/models/boundaryJob.model";

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

  return {
    jobId: job._id,
    status: job.status,
    total: job.total,
    processed: job.processed,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    error: job.error,
  };
});
