# Precaution website

The mobile navigation control supports mouse clicks and keyboard Enter or Space.
Its expanded state is exposed to assistive technology.

Run the navigation event regressions with Node.js:

```sh
node --test tests/mobile-menu.test.cjs
```

These tests exercise the actual script with controlled jQuery event/state stubs.
They do not replace a browser layout or screen-reader acceptance check.
