export {
  interpolateProperty,
  resolveAtTime,
  resolveTree,
  element,
  ElementBuilder,
  stagger,
  type Keyframe,
  type PropertyTimeline,
  type AnimatedElement,
  type ResolvedProps,
} from "./engine.js";

export {
  createEasing,
  listEasings,
  type EasingFn,
} from "./easing.js";

export {
  validateComposition,
  getActiveScenesAtTime,
  getAllSoundCues,
  getElementsAtTime,
  type SceneComposition,
  type Scene,
  type SoundCue,
  type CaptionConfig,
  type ValidationError,
} from "./scene.js";

export {
  registerRenderer,
  getRenderer,
  listRenderers,
  renderElement,
  renderElements,
  type ElementRenderer,
} from "./renderer.js";

export {
  compileScene,
  compileSceneManifest,
} from "./compiler.js";
