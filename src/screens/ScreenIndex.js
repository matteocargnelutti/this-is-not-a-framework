/**
 * @class ScreenIndex
 * @description Sample screen, index page.
 * @extends HTMLElement 
 */
class ScreenIndex extends HTMLElement {

  constructor() {
    super();
  }

  connectedCallback() {
    this.renderInnerHTML();
  }

  renderInnerHTML() {
    this.innerHTML = /*html*/`
      <h2>Index</h2>
      
      <p>
        Some very interesting homepage content.
      </p>

      <p>
        <a href="#!/inner" title="To inner screen">Go to inner screen</a>
      </p>
    `;
  }

}
customElements.define('screen-index', ScreenIndex);
