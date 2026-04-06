import ProgramModel from "~~/server/models/program.model";

export default defineEventHandler(async (event) => {
  const { program } = getQuery(event) as { program?: string };
  if (!program) return [];

  try {
    const docs = await ProgramModel.find({ [program]: { $exists: true } }).lean();
    return docs.map((d: any) => ({
      SchoolID: d.SchoolID,
      School: d.School || d["School Name"] || null,
      counts: d[program] || {},
    }));
  } catch (error) {
    console.error("Error fetching programs by program key:", error);
    return [];
  }
});
