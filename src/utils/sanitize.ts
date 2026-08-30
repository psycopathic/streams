const sensitiveKeys = new Set([
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "secret",
  "apiKey",
]);

export const sanitizeObject = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitizeObject);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sensitiveKeys.has(key) ? "[REDACTED]" : sanitizeObject(nestedValue),
      ]),
    );
  }
  return value;
};
