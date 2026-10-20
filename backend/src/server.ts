import app from "./app";
import { env } from "./config/env";
import { disconnectPrisma } from "./lib/prisma";

const server = app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port} (${env.nodeEnv})`);
});

server.on("error", (err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}; shutting down`);

  server.close(async (closeErr) => {
    if (closeErr) {
      console.error("Error while closing HTTP server:", closeErr);
    }

    try {
      await disconnectPrisma();
    } catch (disconnectErr) {
      console.error("Error while disconnecting Prisma:", disconnectErr);
    }

    process.exit(closeErr ? 1 : 0);
  });
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
