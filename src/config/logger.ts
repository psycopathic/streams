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

const requestContextFormat = winston.format((info) => {
  const context = getRequestContext();
  if (context?.requestId && !info.requestId) info.requestId = context.requestId;
  if (context?.userId && !info.userId) info.userId = context.userId;
  return redact(info) as winston.Logform.TransformableInfo;
});

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
  isProduction ? winston.format.json() : winston.format.colorize(),
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
