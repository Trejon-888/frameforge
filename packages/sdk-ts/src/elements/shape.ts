import type { SceneElement, Animation } from "../scene.js";
import type { EasingFunction } from "../easing.js";

export interface ShapeOptions {
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  borderRadius?: number;
  x?: number;
  y?: number;
  opacity?: number;
}

export class Shape {
  private shapeType: "rect" | "circle" | "ellipse";
  private options: Required<ShapeOptions>;
  private _animations: Animation[] = [];

  constructor(
    shapeType: "rect" | "circle" | "ellipse",
    options: ShapeOptions = {}
  ) {
    this.shapeType = shapeType;
    this.options = {
      width: options.width ?? 100,
      height: options.height ?? 100,
      fill: options.fill ?? "#ffffff",
      stroke: options.stroke ?? "none",
      strokeWidth: options.strokeWidth ?? 0,
      borderRadius: options.borderRadius ?? 0,
      x: options.x ?? 960,
      y: options.y ?? 540,
      opacity: options.opacity ?? 1,
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
      type: "shape",
      props: {
        shapeType: this.shapeType,
        ...this.options,
      },
      animations: this._animations,
    };
  }
}
