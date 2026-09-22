import fs from "node:fs";
import path from "node:path";
import winston from "winston";
import { env, isProduction } from "./env.js";
import { getRequestContext } from "../utils/requestContext.js";

const logsDir = path.resolve(process.cwd(), "logs");
fs.mkdirSync(logsDir, { recursive: true });

const redactKeys = new Set([
  "password",
  "passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "apiKey",
  "secret",
]);

// here redact function is used to remove sensitive information from the log messages. 
// It recursively traverses the log message object and replaces any values associated with keys in the redactKeys set with "[REDACTED]". 
// This ensures that sensitive data such as passwords, tokens, and API keys are not logged in plaintext, enhancing security and privacy in the logging system.
const redact = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        redactKeys.has(key) ? "[REDACTED]" : redact(nestedValue),
      ]),
    );
  }
  return value;
};

// requestContextFormat is a custom Winston format that adds request context information to log messages.
const requestContextFormat = winston.format((info) => {
  const context = getRequestContext();
  if (context?.requestId && !info.requestId) info.requestId = context.requestId;
  return redact(info) as winston.Logform.TransformableInfo;
});



// this tell about the format of the log file and console output. 
// It combines timestamp, error stack, request context, and either JSON or a custom printf format based on the environment (production or development).
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  requestContextFormat(),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  requestContextFormat(),
  isProduction
    ? winston.format.json()
    : winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const serializedMeta = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
        return `${String(timestamp)} ${String(level)}: ${String(message)}${serializedMeta}`;
      }),
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  levels: winston.config.npm.levels,
  defaultMeta: {
    service: "streams-api",
    environment: env.NODE_ENV,
  },
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({ filename: path.join(logsDir, "application.log"), format: fileFormat }),
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      format: fileFormat,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "http.log"),
      level: "http",
      format: fileFormat,
    }),
  ],
  exitOnError: false,
});

export const flushLogs = async (): Promise<void> => {
  await Promise.all(
    logger.transports.map(
      (transport) =>
        new Promise<void>((resolve) => {
          if (typeof transport.close === "function") transport.close();
          resolve();
        }),
    ),
  );
};
