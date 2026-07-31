import findBoundaryAssignments from "~~/server/utils/boundaryAssignment";

export default defineEventHandler(async (event) => {
  const { lat, lng, grade } = getQuery(event);

  if (!lat || !lng || !grade) {
    throw createError({
      statusCode: 400,
      statusMessage: "Missing lat, lng, or grade",
    });
  }

  return await findBoundaryAssignments(
    Number(lat),
    Number(lng),
    grade as string
  );
});
