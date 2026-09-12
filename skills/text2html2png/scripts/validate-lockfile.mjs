#!/usr/bin/env node
// This check uses only Node built-ins and must run before npm installation.
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

export function validatePublicLockfile(lock) {
  if (!lock?.packages || !Object.hasOwn(lock.packages, "")) throw new Error("A packages-based npm lockfile is required.");
  let count = 0;
  for (const [name, entry] of Object.entries(lock.packages)) {
    if (!name) continue;
    let url;
    try { url = new URL(entry.resolved); } catch {}
    if (!url || url.origin !== "https://registry.npmjs.org" || url.username || url.password || url.search || url.hash) {
      // Do not repeat a private endpoint or credential into public CI logs.
      throw new Error(`${name}: package tarballs must use the public HTTPS npm registry without credentials or query strings. Regenerate the lockfile with --registry=https://registry.npmjs.org.`);
    }
    if (!entry.version || !entry.integrity) throw new Error(`${name}: locked version and integrity are required.`);
    count++;
  }
  return count;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    const file = process.argv[2] ?? fileURLToPath(new URL("../package-lock.json", import.meta.url));
    const count = validatePublicLockfile(JSON.parse(await readFile(file, "utf8")));
    console.log(`Public dependency sources verified: ${count} locked packages.`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
