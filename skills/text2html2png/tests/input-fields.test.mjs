import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateDataFields } from "../scripts/pipeline/input-fields.mjs";
import { renderDocument } from "../scripts/pipeline/render-document.mjs";
import { markupText } from "../scripts/document-syntax.mjs";

test("unknown relationships and misspelled nested fields are rejected before they can disappear", async () => {
  const data = JSON.parse(await readFile(new URL("../examples/service-architecture/en.json", import.meta.url), "utf8"));
  assert.throws(() => validateDataFields("architecture", { ...data, edges: [{ from: "A", to: "B" }] }), /data\.edges: unsupported/);
  data.layers[0].nodes[0].description = "A calls only B";
  await assert.rejects(renderDocument({ schemaVersion: 1, chart: "architecture", theme: "clean", data }), /data\.layers\[0\]\.nodes\[0\]\.description: unsupported/);
});

test("nested invalid types produce a field path instead of object strings or an opaque crash", () => {
  assert.throws(() => validateDataFields("architecture", { layers: [null] }), /data\.layers\[0\].*object/);
  assert.throws(() => validateDataFields("flowchart", { steps: [{ name: { text: "lost" } }] }), /data\.steps\[0\]\.name.*string/);
  assert.throws(() => validateDataFields("narrative", { sections: [{ kind: "callout", text: "Fact", rows: [] }] }), /data\.sections\[0\]\.rows: unsupported/);
});

test("a short narrative renders only supplied content without filler sections or a mandatory footer", async () => {
  const text = '<script>alert("example")</script> $100 A & B';
  const { html } = await renderDocument({ schemaVersion: 1, chart: "narrative", theme: "clean", data: {
    id: "literal-example", locale: "zh-CN", title: "原样保留", sections: [{ kind: "callout", title: "字面量", text }],
  } });
  assert.equal((html.match(/class="nar-section"/g) ?? []).length, 1);
  assert.equal((html.match(/class="footer"/g) ?? []).length, 0);
  assert.ok(markupText(html).includes(text));
  assert.doesNotMatch(html, /<script>|undefined|NaN/);
});

test("font copy includes generated labels and decoded entities, without styles or hidden templates", () => {
  assert.equal(markupText('<main>01 <p>12.5% A &amp; B</p><style>.hidden { content: "secret" }</style><template>hidden</template></main>'), "01 \n12.5% A & B");
});
