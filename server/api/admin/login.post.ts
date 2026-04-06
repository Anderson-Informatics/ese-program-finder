export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}));
  const provided = (body && (body.password ?? body.pass)) || "";
  const adminPassword = process.env.ADMIN_PASSWORD || "";

  if (!adminPassword) {
    // If no admin password configured, disallow login for safety
    throw createError({ statusCode: 500, statusMessage: "Admin password not configured" });
  }

  if (provided === adminPassword) {
    return { ok: true };
  }

  throw createError({ statusCode: 401, statusMessage: "Invalid admin password" });
});
