import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  getDiagnosticsLogs,
  installDiagnosticsCapture,
  serializeLogArgument,
} from "../src/components/support/center/diagnostics-capture.js";

const originalConsole = { error: console.error, warn: console.warn };

const dispatch = (type, fields) => globalThis.window.dispatchEvent(Object.assign(new Event(type), fields));

describe("serializeLogArgument", () => {
  it("keeps primitives and writes null and undefined as text", () => {
    assert.equal(serializeLogArgument("text"), "text");
    assert.equal(serializeLogArgument(7), 7);
    assert.equal(serializeLogArgument(null), "null");
    assert.equal(serializeLogArgument(undefined), "undefined");
  });

  it("keeps the name, message and first stack lines of an error", () => {
    const error = new TypeError("boom");
    error.stack = ["TypeError: boom", "at a", "at b", "at c", "at d", "at e"].join("\n");

    assert.deepEqual(serializeLogArgument(error), {
      type: "TypeError",
      message: "boom",
      stack: "TypeError: boom | at a | at b | at c",
    });
  });

  it("keeps the request and the response of an axios error", () => {
    const axiosError = Object.assign(new Error("Request failed"), {
      isAxiosError: true,
      config: { method: "post", url: "/support/case", data: '{"title":"x"}' },
      response: { status: 500, data: { message: "down" } },
    });

    assert.deepEqual(serializeLogArgument(axiosError), {
      type: "AxiosError",
      message: "Request failed",
      method: "POST",
      url: "/support/case",
      payload: { title: "x" },
      status: 500,
      response: { message: "down" },
    });
  });

  it("keeps the raw request body when it is not JSON", () => {
    const axiosError = { isAxiosError: true, message: "m", config: { url: "/u", data: "not json" } };

    assert.equal(serializeLogArgument(axiosError).payload, "not json");
  });

  it("copies an object and writes down one it cannot copy", () => {
    assert.deepEqual(serializeLogArgument({ a: 1, nested: { b: [2] } }), { a: 1, nested: { b: [2] } });

    const circular = {};
    circular.self = circular;
    assert.equal(serializeLogArgument(circular), "[object Object]");
  });

  it("never throws", () => {
    const hostile = new Proxy({}, { get: () => { throw new Error("no"); } });

    assert.equal(serializeLogArgument(hostile), "[unserializable]");
  });
});

describe("installDiagnosticsCapture", () => {
  before(() => {
    // Nothing is captured until a support center mounts: importing the module changed nothing.
    assert.equal(console.error, originalConsole.error);
    assert.equal(getDiagnosticsLogs().length, 0);
  });

  after(() => {
    console.error = originalConsole.error;
    console.warn = originalConsole.warn;
  });

  it("does nothing outside a browser", () => {
    assert.equal(typeof window, "undefined");

    installDiagnosticsCapture();

    assert.equal(console.error, originalConsole.error);
    assert.equal(console.warn, originalConsole.warn);
  });

  it("captures console errors, warnings, uncaught errors and rejections, and installs only once", () => {
    globalThis.window = new EventTarget();
    const forwarded = [];
    console.error = (...args) => forwarded.push(["error", ...args]);
    console.warn = (...args) => forwarded.push(["warn", ...args]);

    installDiagnosticsCapture();
    installDiagnosticsCapture();

    console.error("failed", { code: 7 });
    console.warn("careful");
    dispatch("error", { message: "boom", filename: "app.js", lineno: 3, colno: 9, error: new Error("boom") });
    dispatch("unhandledrejection", { reason: new Error("nope") });

    const logs = getDiagnosticsLogs();
    assert.deepEqual(
      logs.map((entry) => entry.level),
      ["error", "warn", "error", "error"],
      "a second install must not wrap the console twice",
    );
    assert.deepEqual(logs[0].args, ["failed", { code: 7 }]);
    assert.deepEqual(logs[1].args, ["careful"]);
    assert.equal(logs[2].args[0].type, "UncaughtError");
    assert.equal(logs[2].args[0].source, "app.js");
    assert.equal(logs[3].args[0].message, "nope");
    assert.ok(logs.every((entry) => !Number.isNaN(Date.parse(entry.timestamp))));
    assert.deepEqual(forwarded, [["error", "failed", { code: 7 }], ["warn", "careful"]], "the original console still gets every call");
  });

  it("keeps the last fifty entries", () => {
    for (let index = 0; index < 60; index += 1) {
      console.warn(`entry ${index}`);
    }

    const logs = getDiagnosticsLogs();
    assert.equal(logs.length, 50);
    assert.deepEqual(logs.at(-1).args, ["entry 59"]);
    assert.deepEqual(logs[0].args, ["entry 10"]);
  });
});
