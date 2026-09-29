export function safeIntegrationError(error: unknown) {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "YashFlow sync failed.";
  return message
    .replace(
      /sb_secret_[A-Za-z0-9._-]+(?:\r?\n[A-Za-z0-9._-]+)*/g,
      "sb_secret_[redacted]",
    )
    .replace(/Bearer\s+[A-Za-z0-9._-]{16,}/gi, "Bearer [redacted]")
    .replace(/eyJ[A-Za-z0-9._-]{20,}/g, "[redacted token]");
}
