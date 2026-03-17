export { render, type RenderOptions } from "./renderer.js";
export {
  parseManifest,
  type SceneManifest,
  type CanvasConfig,
  type AudioTrack,
  type RenderConfig,
} from "./manifest.js";
export { TIME_VIRTUALIZATION_SCRIPT } from "./time-virtualization.js";
export { captureFrames, type FrameCaptureOptions } from "./frame-capture.js";
export { encodeVideo, compositeVideo, FFmpegPipeline, type FFmpegOptions, type CompositeOptions } from "./ffmpeg.js";
export { PAGE_API_SCRIPT } from "./page-api.js";
export { capturePreview, type PreviewOptions } from "./preview.js";
export {
  compose,
  parseComposition,
  TRANSITIONS,
  type Composition,
  type CompositionScene,
  type TransitionType,
  type ComposeOptions,
} from "./composition.js";
export {
  parseSRT,
  parseVTT,
  loadSubtitles,
  generateSubtitleOverlay,
  type SubtitleEntry,
  type SubtitleOverlayOptions,
} from "./subtitles.js";

// Video editing engine
export { editVideo, type EditOptions, type EditResult } from "./editor.js";
export { probeVideo, computeMatchedEncoding, getFormatDimensions, type VideoProbeResult } from "./video-probe.js";
export {
  groupWords,
  filterWords,
  parseWhisperXWords,
  generateCaptionOverlay,
  createWordCaptions,
  type WordTiming,
  type CaptionGroup,
  type CaptionPreset,
  type CaptionStyleConfig,
} from "./word-captions.js";
export {
  generateOverlayTimeline,
  generateOverlayHTML,
  type OverlayType,
  type OverlayElement,
  type TranscriptSegment,
  type OverlayGeneratorOptions,
} from "./overlay-generator.js";
export {
  getStylePreset,
  createCustomStyle,
  listPresets,
  STYLE_PRESETS,
  type EditStyle,
  type EditStyleColors,
  type EditStyleTypography,
  type EditStyleElements,
  type EditStyleAnimations,
} from "./edit-styles.js";

// Edit preview
export { generateEditPreview, type EditPreviewOptions } from "./preview-edit.js";

// Component system
export {
  type ComponentRenderer,
  type ComponentOutput,
  type ComponentContext,
  type ComponentTiming,
  type ComponentDependency,
} from "./components/types.js";
export { registry as componentRegistry } from "./components/registry.js";
export { assembleOverlayPage, type AssembleResult } from "./components/assembler.js";
