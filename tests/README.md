# Simulation modal regression

The Microsoft and Nigerian-email simulation start buttons execute their callbacks
once, including repeated clicks while the modal is fading out.

Run from the repository root:

```sh
node --test tests/modal-once.test.cjs
```

The checks execute the actual modal code with DOM/event/timer doubles; they do not
perform real navigation or validate browser animation.
