const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('recompiling the carousel does not accumulate image drag listeners', () => {
    function node() {
        return {
            events: [],
            css() { return this; }, empty() { return this; },
            append() { return this; }, clone() { return node(); },
            children() { return []; },
            on(event, handler) { this.events.push({ event, handler }); return this; },
            off(event) { this.events = this.events.filter(entry => entry.event !== event); return this; },
        };
    }
    const sandbox = vm.createContext({ window: { innerWidth: 900 }, $: value =>
        typeof value === 'object' ? value : node() });
    const source = fs.readFileSync(path.join(__dirname, '../lib/scripts/gallery.js'), 'utf8')
        .split('!async function')[0];
    vm.runInContext(source + '\nglobalThis.Carousel = Carousel;', sandbox);
    const carousel = Object.create(sandbox.Carousel.prototype);
    const image = node();
    carousel.images = [image];
    carousel.focus = 0;
    carousel.buttons = { back: node(), front: node() };
    carousel._node = { slider: node(), controls: node() };
    for (let i = 0; i < 20; i++) carousel.compile();
    const handlers = image.events.filter(entry => entry.event.split('.')[0] === 'dragstart');
    assert.equal(handlers.length, 1);
    let prevented = 0;
    handlers[0].handler({ preventDefault() { prevented++; } });
    assert.equal(prevented, 1);
});

test('resource cards flip once and navigation advances once after repeated resize compilation', () => {
    function node() {
        return {
            events: [], clicked: false,
            css() { return this; }, empty() { return this; }, append() { return this; },
            children() { return []; }, html() { return this; },
            toggleClass() { this.clicked = !this.clicked; return this; },
            on(event, handler) { this.events.push({ event, handler }); return this; },
            off(event) { this.events = this.events.filter(entry => entry.event !== event); return this; },
            click() {
                for (const entry of this.events.filter(entry => entry.event.split('.')[0] === 'click'))
                    entry.handler({ preventDefault() {} });
            },
        };
    }
    const sandbox = vm.createContext({ window: { innerWidth: 900 }, $: value => value });
    const source = fs.readFileSync(path.join(__dirname, '../resources/lib/scripts/res.js'), 'utf8')
        .replace(/^\(async \(\) => \{\s*/, '').split('await (async () => {')[0];
    vm.runInContext(source + '\nglobalThis.Carousel = Carousel;', sandbox);
    const carousel = Object.create(sandbox.Carousel.prototype);
    carousel.cards = [node(), node(), node()];
    carousel.focus = 0;
    carousel.buttons = { back: node(), front: node(), text: node() };
    carousel._node = { slider: node(), controls: node() };
    for (let i = 0; i < 20; i++) carousel.compile();
    carousel.cards[0].click();
    assert.equal(carousel.cards[0].clicked, true);
    carousel.buttons.back.click();
    assert.equal(carousel.focus, 2);
});
