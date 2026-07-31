import { requireAdmin } from "~~/server/utils/requireAdmin";
import findBoundaryAssignments from "~~/server/utils/boundaryAssignment";
import BoundaryJob from "~~/server/models/boundaryJob.model";
import BoundaryJobResult from "~~/server/models/boundaryJobResult.model";

const CHUNK_SIZE = 25;

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

  const job = await BoundaryJob.findById(jobId);
  if (!job) {
    throw createError({
      statusCode: 404,
      statusMessage: "Job not found",
    });
  }

  if (job.status === "completed") {
    return {
      jobId,
      status: "completed",
      total: job.total,
      processed: job.processed,
      hasMore: false,
    };
  }

  await BoundaryJob.findByIdAndUpdate(jobId, {
    status: "processing",
    updatedAt: new Date(),
  });

  const rows = await BoundaryJobResult.find({ jobId, processed: false })
    .sort({ index: 1 })
    .limit(CHUNK_SIZE)
    .lean();

  if (rows.length === 0) {
    await BoundaryJob.findByIdAndUpdate(jobId, {
      status: "completed",
      processed: job.total,
      completedAt: new Date(),
    });
    return {
      jobId,
      status: "completed",
      total: job.total,
      processed: job.total,
      hasMore: false,
    };
  }

  const results = await Promise.all(
    rows.map((row) =>
      findBoundaryAssignments(row.lat, row.lng, row.grade).catch(
        (err: any) => ({ error: err.message || "Lookup failed" })
      )
    )
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const result = results[i];
    const update: any = {
      processed: true,
      processedAt: new Date(),
    };

    if (Array.isArray(result)) {
      update.assignments = result;
      update.error = null;
    } else {
      update.error = (result as any).error;
      update.assignments = null;
    }

    await BoundaryJobResult.findByIdAndUpdate(row._id, update);
  }

  const processed = await BoundaryJobResult.countDocuments({
    jobId,
    processed: true,
  });
  const total = job.total;
  const completed = processed >= total;

  await BoundaryJob.findByIdAndUpdate(jobId, {
    status: completed ? "completed" : "processing",
    processed,
    updatedAt: new Date(),
    ...(completed ? { completedAt: new Date() } : {}),
  });

  return {
    jobId,
    status: completed ? "completed" : "processing",
    total,
    processed,
    hasMore: !completed,
  };
});
