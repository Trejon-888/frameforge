import type { SceneElement, Animation } from "../scene.js";
import type { EasingFunction } from "../easing.js";

export interface TextOptions {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
  x?: number;
  y?: number;
  opacity?: number;
  textAlign?: "left" | "center" | "right";
}

export class Text {
  private content: string;
  private options: Required<TextOptions>;
  private _animations: Animation[] = [];

  constructor(content: string, options: TextOptions = {}) {
    this.content = content;
    this.options = {
      fontSize: options.fontSize ?? 48,
      fontFamily: options.fontFamily ?? "system-ui, sans-serif",
      fontWeight: options.fontWeight ?? "normal",
      color: options.color ?? "#ffffff",
      x: options.x ?? 960,
      y: options.y ?? 540,
      opacity: options.opacity ?? 1,
      textAlign: options.textAlign ?? "center",
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
      type: "text",
      props: {
        content: this.content,
        ...this.options,
      },
      animations: this._animations,
    };
  }
}
