/**
 * @class ScreenInner
 * @description Sample screen, inner page.
 * @extends HTMLElement 
 */
class ScreenInner extends HTMLElement {

  constructor() {
    super();
  }

  connectedCallback() {
    this.renderInnerHTML();
  }

  renderInnerHTML() {
    this.innerHTML = /*html*/`
      <h2>Inner</h2>

      <p>
        Some very interesting inner page content.
      </p>

      <p>
        <a href="#!/" title="Back to index">Back to index</a>
      </p>
    `;
  }

}
customElements.define('screen-inner', ScreenInner);
