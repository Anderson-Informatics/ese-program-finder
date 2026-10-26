import SummaryModel from "~~/server/models/summary.model";
import { requireProgramSyncApiKey } from "~~/server/utils/requireProgramSyncApiKey";
import { summaryUpdateOperations, validateSummaryUpdates } from "~~/server/utils/summaryBulk";

export default defineEventHandler(async (event) => {
  requireProgramSyncApiKey(getRequestHeader(event, "x-api-key"));
  const rows = validateSummaryUpdates(await readBody(event));
  const result = await SummaryModel.bulkWrite(summaryUpdateOperations(rows, new Date()));
  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount,
  };
});
