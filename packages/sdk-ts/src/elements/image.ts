import type { SceneElement, Animation } from "../scene.js";
import type { EasingFunction } from "../easing.js";

export interface ImageOptions {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  opacity?: number;
  objectFit?: "cover" | "contain" | "fill" | "none";
  borderRadius?: number;
}

export class Image {
  private src: string;
  private options: Required<ImageOptions>;
  private _animations: Animation[] = [];

  constructor(src: string, options: ImageOptions = {}) {
    this.src = src;
    this.options = {
      width: options.width ?? 400,
      height: options.height ?? 300,
      x: options.x ?? 960,
      y: options.y ?? 540,
      opacity: options.opacity ?? 1,
      objectFit: options.objectFit ?? "cover",
      borderRadius: options.borderRadius ?? 0,
    };
  }

  animate(
    property: string,
    keyframes: Record<number, number | string>,
    easing?: EasingFunction
  ): this {
    this._animations.push({
      property,
      keyframes,
      easing,
      easingName: easing?.name,
    });
    return this;
  }

  toSceneElement(): SceneElement {
    return {
      type: "image",
      props: {
        src: this.src,
        ...this.options,
      },
      animations: this._animations,
    };
  }
}
