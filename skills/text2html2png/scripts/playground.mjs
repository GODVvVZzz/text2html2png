#!/usr/bin/env node
import http from "node:http";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "./render.mjs";
import { renderDocument } from "./pipeline/render-document.mjs";
import { writeFile } from "node:fs/promises";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number(process.env.PORT ?? 4318);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("PORT must be 1024–65535");
const examples = { flowchart: "release-flow", architecture: "service-architecture", dashboard: "support-snapshot", comparison: "plan-comparison", timeline: "library-roadmap", gantt: "launch-plan", "org-chart": "studio-org", funnel: "signup-funnel", narrative: "cafe-membership" };
let rendering = false;
const server = http.createServer(async (req, res) => {
  const reply = (status, type, body) => { res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); res.end(body); };
  try {
    if (req.headers.host !== `127.0.0.1:${port}`) return reply(403, "text/plain", "Use the printed localhost address.");
    if (req.method === "GET" && req.url === "/") return reply(200, "text/html; charset=utf-8", await readFile(path.join(root, "assets/playground.html")));
    const match = /^\/example\/([a-z-]+)$/.exec(req.url);
    if (req.method === "GET" && match && examples[match[1]]) {
      const data = JSON.parse(await readFile(path.join(root, "examples", examples[match[1]], "zh.json"), "utf8"));
      return reply(200, "application/json", JSON.stringify({ schemaVersion: 1, chart: match[1], theme: "clean", render: { width: 1040, scale: 2, padding: 24 }, data }));
    }
    if (req.method !== "POST" || !["/render", "/png"].includes(req.url)) return reply(404, "text/plain", "Not found");
    if (req.headers.origin !== `http://127.0.0.1:${port}` || !req.headers["content-type"]?.startsWith("application/json")) return reply(403, "text/plain", "Same-origin JSON requests required.");
    if (rendering) return reply(429, "text/plain", "A render is running. Try again shortly.");
    rendering = true;
    try {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 256000) return reply(413, "text/plain", "Diagram JSON exceeds 256 KB.");
      }
      const definition = JSON.parse(body);
      if (req.url === "/render") {
        const result = await renderDocument(definition);
        return reply(200, "text/html; charset=utf-8", result.html);
      }
      const dir = await mkdtemp(path.join(tmpdir(), "diagram-preview-"));
      try {
      await writeFile(path.join(dir, "input.json"), JSON.stringify(definition));
      await run(["--input", path.join(dir, "input.json"), "--html", path.join(dir, "output.html"), "--png", path.join(dir, "output.png")]);
      return reply(200, "image/png", await readFile(path.join(dir, "output.png")));
      } finally { await rm(dir, { recursive: true, force: true }); }
    } finally { rendering = false; }
  } catch (error) { reply(400, "text/plain; charset=utf-8", error.message); }
});
server.listen(port, "127.0.0.1", () => console.log(`Playground: http://127.0.0.1:${port}`));
