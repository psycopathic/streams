const SENSITIVE_KEY_PATTERN = /password|secret|token|key|authorization|cookie/i;

export const sanitizeObject = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item));
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : sanitizeObject(entry),
    ]),
  );
};
