/**
 * Component System Initialization
 *
 * Imports and registers all built-in component renderers.
 * Must be imported (side effect) before using the assembler.
 */

import { registry } from "./registry.js";
import { kineticTitleRenderer } from "./renderers/kinetic-title.js";
import { animatedLowerThirdRenderer } from "./renderers/animated-lower-third.js";
import { numberCounterRenderer } from "./renderers/number-counter.js";
import { glassCalloutRenderer } from "./renderers/glass-callout.js";
import { particleBurstRenderer } from "./renderers/particle-burst.js";
import { progressBarRenderer } from "./renderers/progress-bar.js";
import { ctaRevealRenderer } from "./renderers/cta-reveal.js";
import { chapterWipeRenderer } from "./renderers/chapter-wipe.js";

registry.register(kineticTitleRenderer);
registry.register(animatedLowerThirdRenderer);
registry.register(numberCounterRenderer);
registry.register(glassCalloutRenderer);
registry.register(particleBurstRenderer);
registry.register(progressBarRenderer);
registry.register(ctaRevealRenderer);
registry.register(chapterWipeRenderer);
