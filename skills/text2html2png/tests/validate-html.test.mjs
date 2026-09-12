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

test("ordinary technical prose, escaped code and comments are not executable syntax", () => {
  const html = safe.replace("Safe", `Release #1234; online=12; javascript: is a URL scheme; url(https://example.test)\n&lt;script&gt;alert(&quot;example&quot;)&lt;/script&gt; $100 A &amp; B\n<!-- onclick='x()' <script> url(file:///secret) -->`);
  assert.deepEqual(validateHtmlSource(html), []);
  assert.deepEqual(validateHtmlSource(safe.replace("</head>", `<style>.wrap::before{content:"online=12 #abcdef url(https://example.test)"}</style></head>`)), []);
});

test("actual unsafe resources remain blocked after HTML entity and CSS escape parsing", () => {
  for (const markup of [
    '<a href="jav&#x61;script:alert(1)">link</a>',
    '<svg><use xlink:href="https://example.test/icons.svg#x"/></svg>',
    '<img src="../private.png">',
    '<img src=&#x68;ttps://example.test/image.png>',
    '<div style="background: u\\72l(https://example.test/image.png)"></div>',
    '<style>@im\\70ort "https://example.test/style.css";</style>',
    '<style>.wrap{background:image-set("https://example.test/image.png" 1x)}</style>',
    '<img srcset="https://example.test/image.png 1x">',
    '<svg><set attributeName="href" to="javascript:alert(1)"/></svg>',
    '<template><img onerror="alert(1)"></template>',
  ]) {
    assert.ok(validateHtmlSource(safe.replace("Safe", markup)).length, markup);
  }
});

test("a restrictive policy must be a real head meta, with CSP first-directive semantics", () => {
  const without = safe.replace(/<meta[^>]+>/, "");
  for (const html of [
    without + '<!-- Content-Security-Policy default-src \'none\' -->',
    without.replace("Safe", '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'">'),
    safe.replace("default-src 'none'", "default-src *; default-src 'none'"),
  ]) assert.ok(validateHtmlSource(html).some(error => /Content-Security-Policy/.test(error)));
});
