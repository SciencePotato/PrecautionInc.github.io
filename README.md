# Precaution website

The gallery preserves a missing-image error and does not decode failed HTTP
responses into images. If no thumbnails load, navigation remains a safe no-op
instead of throwing.

Run the actual gallery-class regressions with controlled fetch/DOM stubs:

```sh
node --test tests/gallery-errors.test.cjs
```

No external requests or browser windows are opened by these tests.
