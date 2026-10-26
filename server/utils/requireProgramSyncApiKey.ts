import { createHash, timingSafeEqual } from "node:crypto";

export function requireProgramSyncApiKey(provided?: string | null): void {
  const configured = useRuntimeConfig().programSyncApiKey;
  if (!configured) {
    throw createError({ statusCode: 503, statusMessage: "Program sync API key not configured" });
  }

  const expected = createHash("sha256").update(configured).digest();
  const actual = createHash("sha256").update(provided || "").digest();
  if (!provided || !timingSafeEqual(expected, actual)) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
}
