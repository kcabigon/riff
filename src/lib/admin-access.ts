const ADMIN_EMAILS = new Set(["kyle.cabigon@gmail.com", "cdpeders@gmail.com"]);

export function hasAdminAccess(email: string | null | undefined): boolean {
  return typeof email === "string" && ADMIN_EMAILS.has(email.toLowerCase());
}
