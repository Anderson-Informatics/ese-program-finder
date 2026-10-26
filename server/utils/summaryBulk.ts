export const MAX_SUMMARY_BATCH_SIZE = 1000;

export type SummaryUpdate = {
  SchoolID: number;
  Program: string;
  GradeBand: string;
  ProgramCount: number;
  Capacity: number;
  Remaining: number;
  Enrolled: number;
};

const countFields = ["ProgramCount", "Capacity", "Remaining", "Enrolled"] as const;

export function validateSummaryUpdates(body: unknown): SummaryUpdate[] {
  if (!Array.isArray(body) || body.length === 0 || body.length > MAX_SUMMARY_BATCH_SIZE) {
    throw createError({
      statusCode: 400,
      statusMessage: `Expected an array of 1 to ${MAX_SUMMARY_BATCH_SIZE} summary records`,
    });
  }

  return body.map((row, index) => {
    if (
      !row ||
      typeof row !== "object" ||
      Array.isArray(row) ||
      !Number.isSafeInteger(row.SchoolID) ||
      typeof row.Program !== "string" ||
      !row.Program.trim() ||
      typeof row.GradeBand !== "string" ||
      !row.GradeBand.trim() ||
      countFields.some((field) => typeof row[field] !== "number" || !Number.isFinite(row[field]))
    ) {
      throw createError({ statusCode: 400, statusMessage: `Invalid summary record at index ${index}` });
    }

    return {
      SchoolID: row.SchoolID,
      Program: row.Program,
      GradeBand: row.GradeBand,
      ProgramCount: row.ProgramCount,
      Capacity: row.Capacity,
      Remaining: row.Remaining,
      Enrolled: row.Enrolled,
    };
  });
}

export function summaryUpdateOperations(rows: SummaryUpdate[], now: Date) {
  return rows.map(({ SchoolID, Program, GradeBand, ProgramCount, Capacity, Remaining, Enrolled }) => ({
    updateOne: {
      filter: { SchoolID, Program, GradeBand },
      update: { $set: { ProgramCount, Capacity, Remaining, Enrolled, LastUpdated: now } },
      upsert: false,
    },
  }));
}
