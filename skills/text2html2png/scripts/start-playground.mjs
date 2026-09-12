#!/usr/bin/env node
// Bootstrap uses only Node built-ins, so it also runs before npm install.
import process from "node:process";
import { setup } from "./setup.mjs";

try {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: npm start\nChecks/repairs the locked clean-theme runtime, then starts the local JSON playground. First use requires npm registry access and a local Chrome-family browser. Set PORT to choose a port.");
  } else {
    if (process.argv.length > 2) throw new Error("Use npm start without arguments, or --help.");
    const port = Number(process.env.PORT ?? 4318);
    if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("PORT must be 1024–65535.");
    const report = await setup({ theme: "clean", chrome: null });
    if (!report.ready) throw new Error(report.browserError || "Setup is incomplete. Run npm run doctor for details.");
    const { createPlaygroundServer } = await import("./playground.mjs");
    createPlaygroundServer()
      .on("error", error => { console.error(error.code === "EADDRINUSE" ? `Port ${port} is in use. Set PORT to another value and rerun npm start.` : error.message); process.exitCode = 1; })
      .listen(port, "127.0.0.1", () => console.log(`Playground: http://127.0.0.1:${port}\nLoad an example, edit its JSON and export HTML or an audited PNG. Press Ctrl+C to stop.`));
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
