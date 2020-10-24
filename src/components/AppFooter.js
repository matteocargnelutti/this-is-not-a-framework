/**
 * @class AppFooter
 * @description Sample footer component.
 * @extends HTMLElement 
 */
class AppFooter extends HTMLElement {

  constructor() {
    super();

    //
    // Grab reference to global (app-level) state manager
    //
    this.appRoot = document.querySelector('app-root');
    this.appState = this.appRoot.state;

    // Trigger some specific re-rendering upon global state change
    this.appRoot.addEventListener('StateManagerUpdate', this.onAppRootStateUpdate.bind(this));

    //
    // Local state
    //
    this.state = new StateManager(this, 'AppFooter', {
      screenChangesCount: -1
    });
    // Note for documentation purposes:
    // If we wanted to listen to changes in this StateManager instance, bound to `this`,
    // we would do the following:
    // this.addEventListener('StateManagerUpdate', this.doSomethingWhenLocalStateChanges.bind(this))

  }

  connectedCallback() {
    this.renderInnerHTML();
  }

  /**
   * Called upon AppRoot's state update.
   * Updates the screen changes counter.
   * @param {Event} event - Event fired by StateManager
   */
  onAppRootStateUpdate(event) {
    // If data.navigation.currentScreen was updated, increment clicks counter and re-render.
    if( event.detail.updatedProperty === 'currentScreen' && event.detail.updatedPropertyPath === 'data.navigation') {
      this.state.data.screenChangesCount = this.state.data.screenChangesCount + 1;
      this.renderInnerHTML();
    }
  }


  /**
   * Generates and replace inner HTML content
   */
  renderInnerHTML() {
    let screenChangesCount = this.state.data.screenChangesCount;

    this.innerHTML = /*html*/`
      <p>You changed screens ${screenChangesCount} times.</p>
    `;
  }

}
customElements.define('app-footer', AppFooter);
