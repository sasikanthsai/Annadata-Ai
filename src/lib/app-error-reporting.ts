export function reportAppError(
  error: unknown,
  context: Record<string, unknown> = {},
) {
  console.error("[Annadata AI]", error, context);
}