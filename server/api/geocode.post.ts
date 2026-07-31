import { requireAdmin } from "~~/server/utils/requireAdmin";
import geocodeBatch from "~~/server/utils/geocodeBatch";
import { findAddressColumns } from "~~/server/utils/addressColumnAliases";

const BATCH_SIZE = 100;

export default defineEventHandler(async (event) => {
  const provided = getRequestHeader(event, "x-admin-password");
  requireAdmin(provided);

  const body = await readBody(event);

  if (!Array.isArray(body) || body.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Expected an array of address objects",
    });
  }

  if (body.length > BATCH_SIZE) {
    throw createError({
      statusCode: 413,
      statusMessage: `Maximum of ${BATCH_SIZE} addresses per batch`,
    });
  }

  const firstRow = body[0];
  if (!firstRow || typeof firstRow !== "object" || Array.isArray(firstRow)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Each row must be an object",
    });
  }

  const keys = Object.keys(firstRow);
  const { street, city, state, zip } = findAddressColumns(keys);

  const addresses = body.map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw createError({
        statusCode: 400,
        statusMessage: `Row ${index + 1} is not a valid object`,
      });
    }

    return {
      index,
      street: String(row[street] ?? ""),
      city: String(row[city] ?? ""),
      state: String(row[state] ?? ""),
      zip: String(row[zip] ?? ""),
    };
  });

  const geocoded = await geocodeBatch(addresses);

  return body.map((row, index) => {
    const point = geocoded.find((p) => p.index === index);
    return {
      ...row,
      lat: point?.lat ?? null,
      lng: point?.lng ?? null,
    };
  });
});
