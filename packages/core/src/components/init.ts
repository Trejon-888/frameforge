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

// Concept Illustration renderers — Cinema v8
import { crmCalendarRenderer } from "./renderers/cinema/crm-calendar.js";
import { socialFeedRenderer } from "./renderers/cinema/social-feed.js";
import { aiWorkflowRenderer } from "./renderers/cinema/ai-workflow.js";
import { statCounterRenderer } from "./renderers/cinema/stat-counter.js";
import { pipelineBoardRenderer } from "./renderers/cinema/pipeline-board.js";
import { inboxSendRenderer } from "./renderers/cinema/inbox-send.js";
import { dashboardRenderer } from "./renderers/cinema/dashboard.js";
import { codeTerminalRenderer } from "./renderers/cinema/code-terminal.js";

registry.register(kineticTitleRenderer);
registry.register(animatedLowerThirdRenderer);
registry.register(numberCounterRenderer);
registry.register(glassCalloutRenderer);
registry.register(particleBurstRenderer);
registry.register(progressBarRenderer);
registry.register(ctaRevealRenderer);
registry.register(chapterWipeRenderer);

registry.register(crmCalendarRenderer);
registry.register(socialFeedRenderer);
registry.register(aiWorkflowRenderer);
registry.register(statCounterRenderer);
registry.register(pipelineBoardRenderer);
registry.register(inboxSendRenderer);
registry.register(dashboardRenderer);
registry.register(codeTerminalRenderer);
