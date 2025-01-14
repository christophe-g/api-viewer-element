import { LitElement, html, TemplateResult } from 'lit';
import { property } from 'lit/decorators/property.js';
import { cache } from 'lit/directives/cache.js';
import { until } from 'lit/directives/until.js';
import { parse } from './lib/markdown.js';
import { ElementPromise } from './lib/types.js';
import { getElementData, setTemplates } from './lib/utils.js';
import { ApiViewerMixin, emptyDataWarning } from './api-viewer-mixin.js';
import './api-viewer-docs.js';
import './api-viewer-demo.js';

async function renderDocs(
  jsonFetched: ElementPromise,
  section: string,
  onSelect: (e: CustomEvent) => void,
  onToggle: (e: CustomEvent) => void,
  selected?: string,
  id?: number,
  exclude = ''
): Promise<TemplateResult> {
  const elements = await jsonFetched;

  if (!elements.length) {
    return emptyDataWarning;
  }

  const data = getElementData(elements, selected);

  return html`
    <header part="header">
      <div part="header-title">&lt;${data.name}&gt;</div>
      <nav>
        <input
          id="docs"
          type="radio"
          name="section-${id}"
          value="docs"
          ?checked=${section === 'docs'}
          @change=${onToggle}
          part="radio-button"
        />
        <label part="radio-label" for="docs">Docs</label>
        <input
          id="demo"
          type="radio"
          name="section-${id}"
          value="demo"
          ?checked=${section === 'demo'}
          @change=${onToggle}
          part="radio-button"
        />
        <label part="radio-label" for="demo">Demo</label>
        <label part="select-label">
          <select
            @change=${onSelect}
            .value=${selected || ''}
            ?hidden=${elements.length === 1}
            part="select"
          >
            ${elements.map(
              (tag) => html`<option value=${tag.name}>${tag.name}</option>`
            )}
          </select>
        </label>
      </nav>
    </header>
    ${cache(
      section === 'docs'
        ? html`
            <div ?hidden=${data.description === ''} part="docs-description">
              ${parse(data.description)}
            </div>
            <api-viewer-docs
              .name=${data.name}
              .props=${data.properties}
              .attrs=${data.attributes}
              .events=${data.events}
              .slots=${data.slots}
              .cssParts=${data.cssParts}
              .cssProps=${data.cssProperties}
            ></api-viewer-docs>
          `
        : html`
            <api-viewer-demo
              .tag=${data.name}
              .props=${data.properties}
              .slots=${data.slots}
              .events=${data.events}
              .cssProps=${data.cssProperties}
              .exclude=${exclude}
              .vid=${id}
            ></api-viewer-demo>
          `
    )}
  `;
}

let id = 0;

export class ApiViewerBase extends ApiViewerMixin(LitElement) {
  @property() section = 'docs';

  @property({ type: String, attribute: 'exclude-knobs' }) excludeKnobs?: string;

  protected _id?: number;

  constructor() {
    super();

    this._id = id++;
  }

  protected render(): TemplateResult {
    return html`
      ${until(
        renderDocs(
          this.jsonFetched,
          this.section,
          this._onSelect,
          this._onToggle,
          this.selected,
          this._id,
          this.excludeKnobs
        )
      )}
    `;
  }

  protected firstUpdated(): void {
    this.setTemplates();
  }

  public setTemplates(templates?: HTMLTemplateElement[]): void {
    setTemplates(
      this._id as number,
      templates || Array.from(this.querySelectorAll('template'))
    );
  }

  private _onSelect(e: Event): void {
    this.selected = (e.target as HTMLSelectElement).value;
  }

  private _onToggle(e: CustomEvent): void {
    this.section = (e.target as HTMLInputElement).value;
  }
}
