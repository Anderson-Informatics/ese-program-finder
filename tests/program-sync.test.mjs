import assert from "node:assert/strict";
import test from "node:test";
import { requireProgramSyncApiKey } from "../server/utils/requireProgramSyncApiKey.ts";
import {
  MAX_SUMMARY_BATCH_SIZE,
  summaryUpdateOperations,
  validateSummaryUpdates,
} from "../server/utils/summaryBulk.ts";

globalThis.createError = ({ statusCode, statusMessage }) =>
  Object.assign(new Error(statusMessage), { statusCode });
let configuredKey;
globalThis.useRuntimeConfig = () => ({ programSyncApiKey: configuredKey });

const validRow = {
  SchoolID: 123,
  Program: "ASD",
  GradeBand: "PK-2",
  ProgramCount: 0,
  Capacity: 20,
  Remaining: 5,
  Enrolled: 15,
};

test("requires a configured key and rejects missing and incorrect keys", () => {
  configuredKey = "";
  assert.throws(() => requireProgramSyncApiKey("provided"), { statusCode: 503 });
  configuredKey = "configured-secret";
  assert.throws(() => requireProgramSyncApiKey(), { statusCode: 401 });
  assert.throws(() => requireProgramSyncApiKey("incorrect"), { statusCode: 401 });
  assert.doesNotThrow(() => requireProgramSyncApiKey("configured-secret"));
});

test("validates full batches before preparing updates", () => {
  assert.throws(() => validateSummaryUpdates([]), { statusCode: 400 });
  assert.throws(() => validateSummaryUpdates({ ...validRow }), { statusCode: 400 });
  assert.throws(() => validateSummaryUpdates(Array(MAX_SUMMARY_BATCH_SIZE + 1).fill(validRow)), {
    statusCode: 400,
  });
  for (const row of [
    { ...validRow, SchoolID: "123" },
    { ...validRow, Program: "" },
    { ...validRow, GradeBand: null },
    { ...validRow, Capacity: null },
    { ...validRow, Remaining: Number.NaN },
    { ...validRow, Enrolled: Infinity },
  ]) {
    assert.throws(() => validateSummaryUpdates([validRow, row]), { statusCode: 400 });
  }
});

test("builds only no-upsert updates of the intended fields", () => {
  const timestamp = new Date("2026-10-26T12:00:00Z");
  const row = { ...validRow, OtherField: "ignored", LastUpdated: "client timestamp" };
  const operations = summaryUpdateOperations(validateSummaryUpdates([row]), timestamp);
  assert.deepEqual(operations, [
    {
      updateOne: {
        filter: { SchoolID: 123, Program: "ASD", GradeBand: "PK-2" },
        update: {
          $set: {
            ProgramCount: 0,
            Capacity: 20,
            Remaining: 5,
            Enrolled: 15,
            LastUpdated: timestamp,
          },
        },
        upsert: false,
      },
    },
  ]);
});
