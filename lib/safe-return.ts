export function safeReturnPath(value: string | null | undefined, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//") && !/[\\\r\n]/.test(value)
    ? value
    : fallback
}
