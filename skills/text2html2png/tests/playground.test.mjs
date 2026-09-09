import assert from "node:assert/strict";
import { once } from "node:events";
import http from "node:http";
import test from "node:test";
import puppeteer from "puppeteer-core";
import { createPlaygroundServer } from "../scripts/playground.mjs";
import { findChrome } from "../scripts/screenshot.mjs";
import { browserIsUsable } from "./helpers/browser.mjs";

async function localServer(context) {
  const server = createPlaygroundServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(() => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

test("playground serves the architecture example and preserves local request boundaries", async context => {
  const base = await localServer(context);
  const response = await fetch(`${base}/example/architecture`);
  assert.equal(response.status, 200);
  const definition = await response.json();
  assert.equal(definition.schemaVersion, 1);
  assert.equal(definition.theme, "clean");
  assert.equal(definition.chart, "architecture");
  assert.equal(definition.data.id, "order-event-architecture");
  assert.equal((await fetch(`${base}/example/missing`)).status, 404);
  // Node fetch can replace a supplied Host header; use HTTP directly to
  // exercise the server's host validation with the intended wire request.
  const wrongHostStatus = await new Promise((resolve, reject) => {
    const request = http.get(base, { headers: { Host: "other.example" } }, response => {
      response.resume();
      resolve(response.statusCode);
    });
    request.on("error", reject);
  });
  assert.equal(wrongHostStatus, 403);
  assert.equal((await fetch(`${base}/render`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(definition),
  })).status, 403);
});

test("playground keeps JSON, themes, downloads, and pending requests in sync", async context => {
  const availability = await browserIsUsable();
  if (!availability.usable) return context.skip(availability.reason);
  const base = await localServer(context);
  const browser = await puppeteer.launch({ executablePath: await findChrome(), headless: true, args: ["--no-first-run"] });
  context.after(() => browser.close());
  const page = await browser.newPage();
  const requests = [], dialogs = [];
  page.on("request", request => requests.push(request.url()));
  page.on("dialog", async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  const ready = () => page.waitForFunction(() => !document.getElementById("render").disabled && !document.getElementById("html").disabled);
  const input = () => page.$eval("#input", element => element.value);
  const edit = async update => page.$eval("#input", (element, fields) => {
    const definition = JSON.parse(element.value);
    Object.assign(definition, fields);
    element.value = JSON.stringify(definition, null, 2);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  }, update);

  await page.goto(base);
  await ready();
  assert.equal(await page.$eval("#example", element => element.value), "architecture");
  assert.equal(await page.$eval("#theme", element => element.value), "clean");
  assert.equal(JSON.parse(await input()).data.id, "order-event-architecture");
  assert.match(await page.$eval("#preview", element => element.srcdoc), /订单事件架构/);
  assert.equal(requests.some(url => url.endsWith("/png")), false, "initial preview must not export PNG");

  await page.click("#load");
  await ready();
  assert.equal(dialogs.length, 0, "reloading untouched input does not ask for confirmation");

  await edit({ theme: "warm" });
  assert.equal(await page.$eval("#theme", element => element.value), "warm", "editing JSON synchronizes the style selector");
  assert.equal(await page.$eval("#html", element => element.disabled), true);
  assert.equal(await page.$eval("#preview", element => element.srcdoc), "", "edited input invalidates the old preview");
  const unsaved = await input();
  await page.click("#load");
  await page.waitForFunction(() => !document.getElementById("load").disabled);
  assert.equal(dialogs.length, 1);
  assert.equal(await input(), unsaved, "cancelling a reload preserves edits");

  await page.evaluate(() => {
    window.downloads = [];
    HTMLAnchorElement.prototype.click = async function () {
      window.downloads.push({ name: this.download, text: await (await fetch(this.href)).text() });
    };
  });
  await page.click("#json");
  await page.waitForFunction(() => window.downloads.length === 1);
  const downloaded = await page.evaluate(() => window.downloads[0]);
  assert.equal(downloaded.name, "diagram.json");
  assert.deepEqual(JSON.parse(downloaded.text), JSON.parse(unsaved), "download includes the full renderer envelope and data");
  await page.select("#example", "flowchart");
  await page.click("#load");
  await ready();
  assert.equal(dialogs.length, 1, "downloaded JSON can be replaced without another confirmation");
  assert.equal(await page.$eval("#theme", element => element.value), "clean", "loading an example resets the selector to its JSON theme");
  assert.equal(JSON.parse(await input()).chart, "flowchart");

  await page.select("#theme", "editorial");
  await ready();
  assert.equal(JSON.parse(await input()).theme, "editorial", "selector changes update the JSON before rendering");

  await page.click("#json");
  await page.waitForFunction(() => !document.getElementById("load").disabled);
  const beforeFailure = await input();
  let pendingRender;
  await page.setRequestInterception(true);
  page.on("request", request => {
    if (request.url() === `${base}/example/dashboard`) {
      void request.respond({ status: 503, contentType: "text/plain", body: "Example unavailable for this test" });
    } else if (request.url() === `${base}/render`) pendingRender = request;
    else void request.continue();
  });
  await page.select("#example", "dashboard");
  await page.click("#load");
  await page.waitForFunction(() => document.getElementById("status").textContent.includes("Example unavailable"));
  assert.equal(await input(), beforeFailure, "failed example GET does not replace the editor with an error response");

  await page.click("#render");
  await page.waitForFunction(() => document.getElementById("input").disabled);
  assert.equal(await page.$$eval("button, select, textarea", controls => controls.every(control => control.disabled)), true);
  assert.equal(await page.$eval("#preview", element => element.srcdoc), "", "pending preview cannot expose old HTML");
  // The disabled editor and selectors prevent the definition from changing
  // between a render request and its eventual HTML response.
  assert.ok(pendingRender);
  await pendingRender.continue();
  await ready();
  assert.equal(await page.$eval("#input", element => element.disabled), false);
  assert.equal(requests.some(url => url.endsWith("/png")), false, "editing and downloading JSON remain PNG opt-in");
});
