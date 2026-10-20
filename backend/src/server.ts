import app from "./app";
import { env } from "./config/env";

const server = app.listen(env.port, () => {
  console.log(`Server listening on port ${env.port} (${env.nodeEnv})`);
});

server.on("error", (err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
