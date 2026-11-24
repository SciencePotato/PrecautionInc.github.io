const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');

function loadNavigation() {
    const handlers = {};
    const attributes = { 'aria-expanded': 'false' };
    const classes = new Set();
    const button = {
        on: (event, handler) => { handlers[event] = handler; },
        attr: (name, value) => { attributes[name] = value; },
        css() {},
    };
    const menu = {
        toggleClass: (name) => classes.has(name) ? classes.delete(name) : classes.add(name),
        hasClass: (name) => classes.has(name),
    };
    const empty = { on() {}, scroll() { return this; }, css() {}, attr() {} };
    const window = {};
    const sandbox = {
        window,
        navigator: { userAgent: 'desktop-test' },
        $: (selector) => {
            if (selector === 'body > header > div:last-of-type img') return button;
            if (selector === 'body > header > section.mobile') return menu;
            return empty;
        },
    };
    vm.createContext(sandbox);
    vm.runInContext(readFileSync(join(__dirname, '..', 'lib', 'scripts', 'main.js'), 'utf8'), sandbox);
    return { handlers, attributes, classes };
}

test('Enter and Space toggle the mobile menu and prevent scrolling', () => {
    const { handlers, attributes, classes } = loadNavigation();
    assert.equal(typeof handlers.keydown, 'function');
    for (const key of ['Enter', ' ']) {
        let prevented = false;
        handlers.keydown({ key, preventDefault: () => { prevented = true; } });
        assert.equal(prevented, true);
        assert.equal(attributes['aria-expanded'], classes.has('clicked') ? 'true' : 'false');
    }
    assert.equal(classes.has('clicked'), false);
});

test('mouse clicks stay supported while other and repeated keys do not toggle', () => {
    const { handlers, attributes, classes } = loadNavigation();
    handlers.click();
    assert.equal(attributes['aria-expanded'], 'true');
    handlers.keydown({ key: 'Tab', preventDefault() { throw new Error('Unexpected prevention'); } });
    handlers.keydown({ key: 'Enter', repeat: true, preventDefault() {} });
    assert.equal(classes.has('clicked'), true);
    handlers.click();
    assert.equal(attributes['aria-expanded'], 'false');
});
