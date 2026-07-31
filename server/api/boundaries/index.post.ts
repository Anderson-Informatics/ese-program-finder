import { requireAdmin } from "~~/server/utils/requireAdmin";
import findBoundaryAssignments from "~~/server/utils/boundaryAssignment";

export default defineEventHandler(async (event) => {
  const provided = getRequestHeader(event, "x-admin-password");
  requireAdmin(provided);

  const body = await readBody(event);

  if (!Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Expected an array of student objects",
    });
  }

  if (body.length === 0 || body.length > 25) {
    throw createError({
      statusCode: 400,
      statusMessage: "Request must contain between 1 and 25 student objects",
    });
  }

  for (const item of body) {
    if (
      typeof item.lat !== "number" ||
      typeof item.lng !== "number" ||
      item.grade === undefined
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: "Each student must have numeric lat, lng, and a grade",
      });
    }
  }

  const results: ReturnType<typeof findBoundaryAssignments>[] = [];

  for (let i = 0; i < body.length; i += 10) {
    const batch = body.slice(i, i + 10);
    const batchResults = await Promise.all(
      batch.map((item) =>
        findBoundaryAssignments(
          Number(item.lat),
          Number(item.lng),
          item.grade
        )
      )
    );
    results.push(...batchResults);
  }

  return results;
});
