const assert = require("node:assert/strict");

const store = new Map();
globalThis.localStorage = {
  getItem(key) {
    return store.has(key) ? store.get(key) : null;
  },
  setItem(key, value) {
    store.set(key, value);
  },
  removeItem(key) {
    store.delete(key);
  },
};

const { storageKey, loadState, saveState, clearState } = require("../src/storage-utils.js");
const originalWarn = console.warn;

assert.equal(loadState(), null);

const state = {
  shipments: [{ id: "RM-1", customer: "Northstar Retail" }],
  disruptionEvents: [{ id: "EVT-001", status: "active" }],
  exceptionDecisions: { "EX-RM-1": { status: "approved" } },
  exceptionAssignments: { "EX-RM-1": "Maya Chen" },
};

assert.equal(saveState(state), true);
assert.equal(store.has(storageKey), true);
assert.deepEqual(loadState(), state);

assert.equal(clearState(), true);
assert.equal(loadState(), null);

store.set(storageKey, "{invalid json");
console.warn = () => {};
assert.equal(loadState(), null);
console.warn = originalWarn;

console.log("storage-utils tests passed");
