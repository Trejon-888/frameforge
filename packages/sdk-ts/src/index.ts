export { Scene, type SceneOptions } from "./scene.js";
export { Text, type TextOptions } from "./elements/text.js";
export { Shape, type ShapeOptions } from "./elements/shape.js";
export { Image, type ImageOptions } from "./elements/image.js";
export * as easing from "./easing.js";
export {
  fadeIn,
  fadeOut,
  slideIn,
  slideOut,
  scaleIn,
  scaleOut,
  rotateIn,
  rotateTo,
  stagger,
  type Direction,
  type AnimationPreset,
} from "./animations/index.js";
export { generateHTML } from "./codegen.js";
