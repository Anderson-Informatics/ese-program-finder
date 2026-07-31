export function requireAdmin(provided?: string | null): void {
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  if (!adminPassword || !provided || provided !== adminPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized: invalid admin password",
    });
  }
}
