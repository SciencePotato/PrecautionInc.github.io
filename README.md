# Carousel resize lifecycle

Gallery images and resource cards replace their own namespaced event handlers
when recompiling after a resize. A card still flips once and navigation advances
once per click; unrelated handlers are not removed.

Run the actual-class regressions with controlled DOM/jQuery doubles:
`node --test tests/carousel-listeners.test.cjs`.
