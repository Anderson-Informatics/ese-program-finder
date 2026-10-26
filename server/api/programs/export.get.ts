import ProgramModel from "~~/server/models/program.model";
import { requireProgramSyncApiKey } from "~~/server/utils/requireProgramSyncApiKey";

export default defineEventHandler(async (event) => {
  requireProgramSyncApiKey(getRequestHeader(event, "x-api-key"));
  return ProgramModel.collection.find({}).toArray();
});
