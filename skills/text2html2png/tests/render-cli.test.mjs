import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(skillDir, "scripts/render.mjs");
const input = path.join(skillDir, "examples/release-flow.diagram.json");

test("CLI renders HTML and refuses accidental overwrite", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "text2html2png-render-"));
  const html = path.join(dir, "release.html");
  const first = spawnSync(process.execPath, [cli, "--input", input, "--html", html, "--json"], { encoding: "utf8" });
  assert.equal(first.status, 0, first.stderr);
  assert.equal(JSON.parse(first.stdout).chart, "flowchart");
  assert.match(await readFile(html, "utf8"), /From scope freeze to release notes/);

  const second = spawnSync(process.execPath, [cli, "--input", input, "--html", html], { encoding: "utf8" });
  assert.notEqual(second.status, 0);
  assert.match(second.stderr, /already exists/);
});

test("CLI help works without Chrome", () => {
  const result = spawnSync(process.execPath, [cli, "--help"], { encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /diagram\.json/);
});

test("CLI rejects missing values and colliding paths before writing", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "diagram-paths-"));
  const source = path.join(dir, "source.json");
  const bytes = await readFile(input, "utf8");
  await writeFile(source, bytes);
  for (const flags of [
    ["--input", source, "--html", source, "--force"],
    ["--input", source, "--html", path.join(dir, "out.html"), "--png", path.join(dir, "out.html")],
    ["--input", "--html", "out.html"],
  ]) {
    const result = spawnSync(process.execPath, [cli, ...flags], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
  }
  assert.equal(await readFile(source, "utf8"), bytes);
});

test("existing PNG prevents partial HTML output", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "diagram-existing-"));
  const png = path.join(dir, "out.png");
  const html = path.join(dir, "out.html");
  await writeFile(png, "existing image");
  const result = spawnSync(process.execPath, [cli, "--input", input, "--html", html, "--png", png], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  await assert.rejects(stat(html), { code: "ENOENT" });
  assert.equal(await readFile(png, "utf8"), "existing image");
});
