// Flattens native CSS nesting so each view's stylesheet can be wrapped under a
// single scope selector (e.g. `.view-folders { ... }`) without class-name
// collisions between the three visualisations, and still build for all targets.
import nesting from "postcss-nesting";

export default {
  plugins: [nesting()],
};
