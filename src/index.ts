import http from "node:http";
import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { flushLogs, logger } from "./config/logger.js";

const server = http.createServer(app);
let isShuttingDown = false;

const start = async (): Promise<void> => {
  await connectDatabase();
  server.listen(env.PORT, () => {
    logger.info("Server started", { port: env.PORT, environment: env.NODE_ENV });
  });
};

const shutdown = (signal: NodeJS.Signals): void => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info("Graceful shutdown started", { signal });

  server.close((error?: Error) => {
    void (async () => {
      if (error) logger.error("HTTP server shutdown failed", { error: { name: error.name, message: error.message, stack: error.stack } });

      try {
        await disconnectDatabase();
        logger.info("Graceful shutdown completed", { signal });
        await flushLogs();
        process.exit(error ? 1 : 0);
      } catch (shutdownError) {
        logger.error("Graceful shutdown failed", { error: shutdownError });
        process.exit(1);
      }
    })();
  });

  setTimeout(() => {
    logger.error("Graceful shutdown timed out", { signal });
    process.exit(1);
  }, 10000).unref();
};

process.on("SIGTERM", (signal) => shutdown(signal));
process.on("SIGINT", (signal) => shutdown(signal));
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: { name: error.name, message: error.message, stack: error.stack } });
  shutdown("SIGTERM");
});
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { reason });
  shutdown("SIGTERM");
});

void start().catch((error: unknown) => {
  logger.error("Server startup failed", { error });
  process.exit(1);
});
