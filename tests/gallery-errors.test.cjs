const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function gallery(fetch, createObjectURL) {
    const node = {
        attr() { return this; }, on() { return this; }, css() { return this; },
        empty() { return this; }, append() { return this; }, clone() { return this; },
        addClass() { return this; }, children() { return []; },
    };
    const sandbox = { window: { location: { origin: 'https://example.test' } },
        fetch, URL: { createObjectURL }, $: () => node };
    vm.createContext(sandbox);
    const source = fs.readFileSync(path.join(__dirname, '..', 'lib', 'scripts', 'gallery.js'), 'utf8');
    vm.runInContext(source.slice(0, source.indexOf('!async function')), sandbox);
    return vm.runInContext('({ ImageQuery, Carousel })', sandbox);
}

test('a missing image stays missing and never creates an object URL', async () => {
    let decoded = 0;
    let urls = 0;
    const { ImageQuery } = gallery(
        async () => ({ status: 404, blob: async () => { decoded++; return {}; } }),
        () => { urls++; return 'blob:invalid'; },
    );
    const image = new ImageQuery('missing.png');
    await assert.rejects(image.get());
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(image._status, ImageQuery.ENUM.FAILED.MISSING);
    assert.equal(decoded, 0);
    assert.equal(urls, 0);
});

test('the gallery remains usable when every image failed', async () => {
    const { Carousel } = gallery(async () => { throw new Error('offline'); }, () => {});
    const carousel = new Carousel();
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(carousel.ready, true);
    assert.doesNotThrow(() => carousel.goTo(1));
    assert.equal(carousel.focus, 0);
});

test('successful images still resolve and transport errors remain failures', async () => {
    const success = gallery(async () => ({ status: 200, blob: async () => ({}) }), () => 'blob:example');
    const image = new success.ImageQuery();
    assert.equal(await image.get(), image);
    assert.equal(image._status, success.ImageQuery.ENUM.DONE);
    const failed = gallery(async () => { throw new Error('offline'); }, () => {});
    const offline = new failed.ImageQuery();
    await assert.rejects(offline.get(), /offline/);
    assert.equal(offline._status, failed.ImageQuery.ENUM.FAILED.UNKNOWN);
});
