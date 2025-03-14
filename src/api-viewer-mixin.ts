import { LitElement, html } from 'lit';
import { property } from 'lit/decorators/property.js';
import { ElementInfo, ElementPromise, ElementSetInfo } from './lib/types.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Constructor<T = unknown> = new (...args: any[]) => T;

export interface ApiViewerInterface {
  src?: string;

  elements?: ElementInfo[];

  selected?: string;

  jsonFetched: ElementPromise;
}

export async function fetchJson(src: string): ElementPromise {
  let result: ElementInfo[] = [];
  try {
    const file = await fetch(src);
    const json = (await file.json()) as ElementSetInfo;
    if (Array.isArray(json.tags) && json.tags.length) {
      result = json.tags;
    } else {
      console.error(`No element definitions found at ${src}`);
    }
  } catch (e) {
    console.error(e);
  }
  return result;
}

export const emptyDataWarning = html`
  <div part="warning">No custom elements found in the JSON file.</div>
`;

export const ApiViewerMixin = <T extends Constructor<LitElement>>(
  base: T
): T & Constructor<ApiViewerInterface> => {
  class ApiViewer extends base {
    @property() src?: string;

    @property({ attribute: false })
    elements?: ElementInfo[];

    @property() selected?: string;

    jsonFetched: ElementPromise = Promise.resolve([]);

    private lastSrc?: string;

    willUpdate(): void {
      const { src } = this;

      if (Array.isArray(this.elements)) {
        this.lastSrc = undefined;
        this.jsonFetched = Promise.resolve(this.elements);
      } else if (src && this.lastSrc !== src) {
        this.lastSrc = src;
        this.jsonFetched = fetchJson(src);
      }
    }
  }

  return ApiViewer;
};
