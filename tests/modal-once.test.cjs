const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");

function harness() {
    const buttons = [];
    const timers = [];
    function $(selector) {
        const events = new Map();
        const node = {
            addClass() { return this; },
            append() { return this; },
            html() { return this; },
            text() { return this; },
            fadeOut() { return this; },
            on(event, callback) {
                events.set(event, callback);
                return this;
            },
            one(event, callback) {
                events.set(event, (...args) => {
                    events.delete(event);
                    callback(...args);
                });
                return this;
            },
            click() {
                events.get("click")?.({ preventDefault() {} });
            }
        };
        if (selector === "<span>") buttons.push(node);
        return node;
    }
    return { $, buttons, timers, document: { body: {} }, setTimeout: fn => timers.push(fn) };
}

test("Microsoft start schedules one simulation even during modal fadeout", () => {
    const ctx = harness();
    const source = fs.readFileSync(path.join(__dirname, "../microsoft-scam/lib/scripts/main.js"), "utf8");
    vm.runInNewContext(source, ctx);
    ctx.buttons[0].click();
    ctx.buttons[0].click();
    assert.equal(ctx.timers.length, 1);
});

test("Nigerian simulation start callback runs once before the overlay has faded", () => {
    const ctx = harness();
    let starts = 0;
    ctx.startSimulation = () => starts++;
    const source = fs.readFileSync(path.join(__dirname, "../nigerian-prince-scam/lib/scripts/main.js"), "utf8");
    vm.runInNewContext(source.slice(source.indexOf("const makeModal =")), ctx);
    ctx.buttons[0].click();
    ctx.buttons[0].click();
    assert.equal(starts, 1);
});
