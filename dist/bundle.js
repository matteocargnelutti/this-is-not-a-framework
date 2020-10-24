/**
 * @class AppRoot
 * @description App's main entry point and principal handler. Handles navigation and app-wide state management.
 * @extends HTMLElement 
 */
class AppRoot extends HTMLElement {

  constructor() {
    super();

    //
    // App-wide state definition.
    //
    this.state = new StateManager(this, 'AppRoot', {
      navigation: {
        defaultScreen: 'screen-index',
        currentScreen: 'screen-index',
        previousScreen: null
      }
    });

    //
    // Settings
    //
    this.enforceSingleton = true; 
    // ☝️ If true, will make sure that there is only 1 instance of `<app-root>` in this document


    //
    // Local binding enforcement
    //
    this.hashNavigationHandler = this.hashNavigationHandler.bind(this);
  }

  /**
   * Upon injection of <app-root> in the DOM:
   * - Render HTML
   * - Run navigation handler
   */
  connectedCallback() {
    // Enforce singleton pattern if needed
    if( this.enforceSingleton === true ) {
      let appRoots = document.querySelectorAll('app-root');
      
      for( let i = 1; i < appRoots.length; i++ ) {
        appRoots[i].remove();
      }
    }

    // Render on DOM injection
    this.renderInnerHTML();

    // Run navigation handler once
    this.hashNavigationHandler();

    // Bind hash change to navigation handler
    window.addEventListener('hashchange', this.hashNavigationHandler);
  }

  disconnectedCallback() {
    // Enforce removal of bindings to window and document.
    window.removeEventListener('hashchange', this.hashNavigationHandler);
  }

  /**
   * Generates and replace inner HTML content
   */
  renderInnerHTML() {
    this.innerHTML = /*html*/`
    <app-header></app-header>
    <main></main>
    <app-footer></app-footer>
    `;
  }

  /**
   * Basic hash URI-based navigation management.
   * - Example of valid hash for the `screen-inner` element: `#!/inner`
   * - Custom logic needs to be added for parameters handling.
   * 
   * About this URI format: https://www.w3.org/blog/2011/05/hash-uris/
   */
  hashNavigationHandler() {
    let hash = window.location.hash;

    // Extract screen name from URI:
    // - #!/inner = inner = screen-inner
    let screenName = hash.match(/\#\!\/([A-Za-z0-9_\-]+)/);
    
    // If a screen name is found in the hash, prepend `screen-` to it.
    if( screenName && screenName.length > 1 ) {
      screenName = `screen-${screenName[1]}`;
    }
    // If nothing found, redirect to default screen
    else {
      screenName = this.state.data.navigation.defaultScreen;
    }

    // Try to load said screen
    this.changeScreen(screenName);
  }

  /**
   * Tries to replace the content of `app-root > main` by the content of a screen component.
   * - Will update this.state.data.navigation on the fly as needed.
   * 
   * @param {String} newScreenName 
   */
  changeScreen(newScreenName) {
    //
    // Check that the element contains `screen-` and exists.
    //
    if( !newScreenName.includes('screen-') || !customElements.get(newScreenName) ) {
      throw new Error(`<${newScreenName}> is not a valid screen name or does not exist.`);
    }

    //
    // If exists: replace content of app-root > main with this screen
    //
    let newScreen = new (customElements.get(newScreenName));
    let main = this.querySelector('main');

    main.innerHTML = '';
    main.appendChild(newScreen);

    //
    // Update navigation state
    //
    this.state.data.navigation.previousScreen = this.state.data.navigation.currentScreen;
    this.state.data.navigation.currentScreen = newScreenName;
  }

}
// Delay declaration of <app-root> until DOM content is ready to prevent loading race conditions.
window.addEventListener('DOMContentLoaded', () => {
  customElements.define('app-root',  AppRoot);
});


/**
 * @class StateManager 
 * @description State Manager utility for custom HTML elements. Holds data, uses a proxy to fire events on update, allowing components to react to changes.
 * 
 * @property {HTMLElement} parent - Element using this state, or any object with a dispatchEvent method. State update events will be fired from this context.
 * @property {String} name - Name of this state manager instance. Used for identifying events.
 * @property {any} data - Current set of data held by the state manager (proxied).
 * @property {Boolean} updateEventBubbles - Determines if the event fired on update should bubble up. Defaults to true.
 * @property {Boolean} updateEventIsComposed - Determined if the event fired on update should be composed. Defaults to true.
 * 
 * @author Matteo Cargnelutti (@matteocargnelutti)
 */
class StateManager {
  /**
   * @param {HTMLElement} parent - Custom element using this state.
   * @param {String} name - Name of this state manager instance. Used for identifying events.
   * @param {any} data - Original data held by the state manager. 
   */
  constructor(parent, name, data) {
    // Parent must have "dispatchEvent" as a property
    if( !'dispatchEvent' in parent ) {
      throw new Error('`parent` must have a `dispatchEvent` method.');
    }

    // Keep track of parent element: events will be fired from there.
    this.parent = parent;

    // Keep track of nested property access path.
    this.propertyPath = 'data';

    // Settings and identification related properties
    this.name = String(name);
    this.updateEventBubbles = true;
    this.updateEventIsComposed = true;

    // Grab original state and proxy it so access / edits can be observed.
    this.__data = data;

    this.__dataHandler = {
      get: this.__read.bind(this), // Will be called on every property access on this.data
      set: this.__write.bind(this) // Will be called on every property edit on this.data
    };

    this.data = new Proxy(this.__data, this.__dataHandler);

  }


  /**
   * Proxied object getter.
   * Called by this.data's proxy to access properties. Recursive.
   * 
   * @param {any} object - Proxied object (this.state)
   * @param {String} property - The name of the property to access.
   * @returns {any} - Either the value we are looking for, or a new Proxy if said value is an array or object.
   * 
   * Notes:
   * The recursive creation of Proxies is needed here as nested fields are not covered by the proxy, 
   * we would therefore not be able to call this.__stateUpdateHandler() on nested fields edits.
   * Inspired by Chris Ferdinandi's article on nested arrays and proxies: 
   * - https://gomakethings.com/how-to-detect-changes-to-nested-arrays-and-objects-inside-a-proxy/
   */
  __read(object, property) {
    let value = object[property];

    // If we are at root level of this.__data, reset the nested property access tracker.
    if( this.__data.hasOwnProperty(property) ) {
      this.propertyPath = `data`;
    }

    // If the current value is an array or an object, return a new proxy for it, with the same handler.
    if( ['[object Object]', '[object Array]'].includes(Object.prototype.toString.call(value)) ) {
      this.propertyPath += `.${property}`; // We are headed into some nested object / array, update nested property access tracker.
      return new Proxy(value, this.__dataHandler);
    }

    // Otherwise, simply return the value.
    return value;
  }

  /**
   * Proxied object setter.
   * Called by this.data's proxy to edit properties.
   * 
   * @param {any} object - Proxied object (this.state)
   * @param {String} property - The name of the property to access
   * @param {any} newValue - The value to replace the property with.
   * @fires StateManagerUpdate - Upon state update. `event.detail` contains what was updated, and copies of new/past state.
   * @returns {Boolean}
   * 
   * Notes:
   * StateManagerUpdate is fired from this.parent, likely an HTMLElement.
   * 
   * Structure of the StateManagerUpdate.detail: 
   * - stateManagerName: string
   * - updatedProperty: string
   * - newValue: any
   * - previousState: any, likely object
   * - newState: any, likely object
   */
  __write(object, property, newValue) {

    // Keep a copy of the soon-to-be previous state
    let previousState = this.__deepCopy(this.__data);

    // Update wanted property in state
    object[property] = newValue;

    // Create a copy of the new state
    let newState = this.__deepCopy(this.__data);

    // Fire an event so the rest of the app can be informed and observe changes in state.
    // Provides a copy of both the previous and new state.
    const event = new CustomEvent('StateManagerUpdate', {
      bubbles: this.updateEventBubbles,
      composed: this.updateEventIsComposed,
      detail: {
        'stateManagerName': this.name,
        'updatedProperty': property,
        'updatedPropertyPath': this.propertyPath,
        'newValue': newValue,
        'previousState': previousState,
        'newState': newState
      }
    });

    this.parent.dispatchEvent(event);

    // Reset nested property access tracker
    this.propertyPath = 'data';

    return true;
  }

  /**
   * Deep copy helper for state duplication.
   * Recursive.
   * 
   * Inspired from: 
   * - https://medium.com/javascript-in-plain-english/how-to-deep-copy-objects-and-arrays-in-javascript-7c911359b089
   * 
   * @param {Any} toCopy
   * @return {Object} 
   */
  __deepCopy(toCopy) {
    let toCopyType = Object.prototype.toString.call(toCopy);

    // Return self if immutable
    if( !['[object Object]', '[object Array]', '[object Null]'].includes(toCopyType) ) {
      return toCopy;
    }

    // Otherwise, crawl down and copy
    let copy = {};

    if( toCopyType === '[object Array]') {
      copy = [];
    }

    for( let key in toCopy ) {
      copy[key] = this.__deepCopy(toCopy[key]);
    }

    return copy;
  }

}

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

