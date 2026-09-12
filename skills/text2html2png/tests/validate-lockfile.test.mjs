import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validatePublicLockfile } from "../scripts/validate-lockfile.mjs";

const lock = resolved => ({ packages: { "": {}, "node_modules/example": { version: "1.0.0", integrity: "sha512-example", resolved } } });

test("public locked dependencies work without loading the runtime", () => {
  assert.equal(validatePublicLockfile(lock("https://registry.npmjs.org/example/-/example-1.0.0.tgz")), 1);
});

test("private mirrors and ambiguous URLs fail without exposing their values", () => {
  for (const value of ["https://mirror.example.test/example.tgz", "https://registry.npmjs.org.example.test/example.tgz", "http://registry.npmjs.org/example.tgz", "https://user:secret@registry.npmjs.org/example.tgz", "https://registry.npmjs.org/example.tgz?auth=secret", "file:example.tgz", undefined]) {
    assert.throws(() => validatePublicLockfile(lock(value)), error => {
      assert.match(error.message, /public HTTPS npm registry/);
      if (value) assert.ok(!error.message.includes(value));
      return true;
    });
  }
});

test("the shippable lockfile contains only public sources and pinned integrity", async () => {
  const current = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8"));
  assert.ok(validatePublicLockfile(current) > 0);
  const invalid = lock("https://registry.npmjs.org/example/-/example-1.0.0.tgz");
  delete invalid.packages["node_modules/example"].integrity;
  assert.throws(() => validatePublicLockfile(invalid), /integrity/);
});
