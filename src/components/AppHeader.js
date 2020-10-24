/**
 * @class AppHeader
 * @description Sample header component.
 * @extends HTMLElement 
 */
class AppHeader extends HTMLElement {

  constructor() {
    super();

    //
    // Grab reference to global (app-level) state manager
    //
    this.appRoot = document.querySelector('app-root');
    this.appState = this.appRoot.state;

    // Trigger some specific re-rendering upon global state change
    this.appRoot.addEventListener('StateManagerUpdate', this.onAppRootStateUpdate.bind(this));
  }

  connectedCallback() {
    this.renderInnerHTML();
  }

  /**
   * Called upon global state update.
   * @param {Event} event - Event fired by StateManager
   */
  onAppRootStateUpdate(event) {
    // If data.navigation.currentScreen was updated, re-render
    if( event.detail.updatedProperty === 'currentScreen' && event.detail.updatedPropertyPath === 'data.navigation') {
      this.renderInnerHTML();
    }
  }

  /**
   * Generates and replace inner HTML content
   */
  renderInnerHTML() {
    let currentScreen = this.appState.data.navigation.currentScreen;

    this.innerHTML = /*html*/`
      <h1>!framework</h1>
      <p><strong>Current Screen:</strong> ${currentScreen}</p>
    `;
  }

}
customElements.define('app-header', AppHeader);
