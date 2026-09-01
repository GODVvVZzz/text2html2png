import assert from "node:assert/strict";
import test from "node:test";
import { validateHtmlSource } from "../scripts/validate-html.mjs";

const safe = `<!doctype html>
<html><head>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'">
</head><body><main class="wrap">Safe</main></body></html>`;

test("accepts offline script-free HTML", () => {
  assert.deepEqual(validateHtmlSource(safe), []);
});

test("rejects scripts and event handlers", () => {
  const errors = validateHtmlSource(`${safe}<script>alert(1)</script><div onclick="x()">x</div>`);
  assert.ok(errors.some((error) => error.includes("<script>")));
  assert.ok(errors.some((error) => error.includes("event-handler")));
});

test("rejects remote resources by default", () => {
  const html = safe.replace("</head>", '<link rel="stylesheet" href="https://example.com/a.css"></head>');
  assert.ok(validateHtmlSource(html).some((error) => error.includes("Remote")));
  assert.deepEqual(validateHtmlSource(html, { allowNetwork: true }), []);
});

test("rejects references to arbitrary local files", () => {
  const html = safe.replace("</head>", '<style>.x{background:url("file:///etc/passwd")}</style></head>');
  assert.ok(validateHtmlSource(html).some((error) => error.includes("Local file")));
  assert.ok(validateHtmlSource(html, { allowNetwork: true }).some((error) => error.includes("Local file")));
});
