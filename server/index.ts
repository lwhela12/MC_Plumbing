import { createServer } from "node:http";
import { createApp } from "./app.js";
const app = createApp();
const server = createServer(app);
if (process.env.NODE_ENV !== "production") {
  const { setupVite } = await import("./vite.js");
  await setupVite(app, server);
} else {
  const { serveStatic } = await import("./vite.js");
  serveStatic(app);
}
server.listen(Number(process.env.PORT || 5000), "127.0.0.1", () => console.log("MC Plumbing server ready"));
