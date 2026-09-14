import express from "express";
import path from "node:path";
import { createApp } from "./server/app.js";
const app: express.Express = createApp();
app.use(express.static(path.join(process.cwd(), "public")));
app.get("*", (_req, res) => res.sendFile(path.join(process.cwd(), "public", "index.html")));
export default app;
