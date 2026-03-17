/**
 * Component Registry — Singleton
 *
 * Manages registration and lookup of component renderers.
 * Deduplicates CDN dependencies across component types.
 */

import { type ComponentRenderer, type ComponentDependency } from "./types.js";

class ComponentRegistry {
  private renderers = new Map<string, ComponentRenderer>();

  register(renderer: ComponentRenderer): void {
    this.renderers.set(renderer.type, renderer);
  }

  get(type: string): ComponentRenderer | undefined {
    return this.renderers.get(type);
  }

  list(): string[] {
    return [...this.renderers.keys()];
  }

  collectDependencies(types: string[]): ComponentDependency[] {
    const seen = new Set<string>();
    const deps: ComponentDependency[] = [];
    for (const type of types) {
      const renderer = this.renderers.get(type);
      if (!renderer) continue;
      for (const dep of renderer.dependencies) {
        if (!seen.has(dep.id)) {
          seen.add(dep.id);
          deps.push(dep);
        }
      }
    }
    return deps;
  }
}

export const registry = new ComponentRegistry();
