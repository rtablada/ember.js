import { templateFactory, PartialDefinitionImpl, EMPTY_BLOCKS, NONE, staticComponent, UNHANDLED, JitContext } from '@glimmer/opcode-compiler';
import { get, PROPERTY_DID_CHANGE, set, computed, alias, tagForObject, objectAt, tagForProperty, _getProp, CUSTOM_TAG_FOR } from '@ember/-internals/metal';
import { getOwner } from '@ember/-internals/owner';
import { TargetActionSupport, FrameworkObject, _contentFor, isArray, Object as Object$1 } from '@ember/-internals/runtime';
import { enumerableSymbol, symbol, guidFor, getDebugName, isObject, isProxy, HAS_NATIVE_SYMBOL, isEmberArray, HAS_NATIVE_PROXY, uuid, toString } from '@ember/-internals/utils';
import { ActionSupport, ChildViewsSupport, ClassNamesSupport, CoreView, getViewElement, ViewMixin, ViewStateSupport, TextSupport, isSimpleClick, clearElementView, clearViewElement, MUTABLE_CELL, addChildView, setElementView, setViewElement, constructStyleDeprecationMessage, ActionManager, getViewId } from '@ember/-internals/views';
import { assert, deprecate, warn, debugFreeze } from '@ember/debug';
import { DEBUG } from '@glimmer/env';
import { UPDATE_REFERENCED_VALUE, ComponentRootReference, RootReference, IterationItemReference, PropertyReference, HelperRootReference, ConstReference } from '@glimmer/reference';
import { normalizeProperty, EMPTY_ARGS, registerDestructor, PrimitiveReference, UNDEFINED_REFERENCE, dynamicAttribute, setScheduleDestroy, setScheduleDestroyed, SimpleDynamicAttribute, NULL_REFERENCE, curry, getDynamicVar, clientBuilder, destroy, DOMChanges, DOMTreeConstruction, inTransaction, JitRuntime, renderJitMain, rehydrationBuilder } from '@glimmer/runtime';
export { DOMChanges, DOMTreeConstruction, isSerializationFirstNode } from '@glimmer/runtime';
import { createTag, dirtyTag, CONSTANT_TAG, valueForTag, combine, consumeTag, createUpdatableTag, deprecateMutationsInAutotrackingTransaction, track, updateTag, validateTag, isConstTagged, isTracking, tagFor, setAutotrackingTransactionEnv, setPropertyDidChange, untrack, isConstTag, CURRENT_TAG, runInAutotrackingTransaction } from '@glimmer/validator';
import { hasDOM } from '@ember/-internals/browser-environment';
import { flaggedInstrument, _instrumentStart } from '@ember/instrumentation';
import { inject } from '@ember/service';
import { join, backburner, schedule, getCurrentRunLoop } from '@ember/runloop';
import { ENV } from '@ember/-internals/environment';
import { assign } from '@ember/polyfills';
import { unwrapTemplate, EMPTY_ARRAY, expect, Stack, dict, unwrapHandle } from '@glimmer/util';
import { EMBER_COMPONENT_IS_VISIBLE, PARTIALS, COMPONENT_MANAGER_STRING_LOOKUP } from '@ember/deprecated-features';
import { dasherize, loc } from '@ember/string';
import { privatize, getFactoryFor } from '@ember/-internals/container';
import { NodeDOMTreeConstruction, serializeBuilder } from '@glimmer/node';
export { NodeDOMTreeConstruction } from '@glimmer/node';
import { QueryParams, generateControllerFactory } from '@ember/-internals/routing';
import { isTemplateOnlyComponent } from '@ember/component/template-only';
import EmberError from '@ember/error';
import RSVP from 'rsvp';

function isTemplateFactory(template) {
  return typeof template === 'function';
}
let counters = {
  cacheHit: 0,
  cacheMiss: 0
};
function template(json) {
  let glimmerFactory = templateFactory(json);
  let cache = new WeakMap();
  const meta = glimmerFactory.meta;

  let factory = owner => {
    let result = cache.get(owner);

    if (result === undefined) {
      counters.cacheMiss++;
      result = glimmerFactory.create(Object.assign({
        owner
      }, meta));
      cache.set(owner, result);
    } else {
      counters.cacheHit++;
    }

    return result;
  };

  factory.__id = glimmerFactory.id;
  factory.__meta = meta;
  return factory;
}

var RootTemplate = template({
  "id": "s5o9bxSn",
  "block": "{\"symbols\":[],\"statements\":[[1,[30,[36,0],[[32,0]],null]]],\"hasEval\":false,\"upvars\":[\"component\"]}",
  "meta": {
    "moduleName": "packages/@ember/-internals/glimmer/lib/templates/root.hbs"
  }
});

const ARGS = enumerableSymbol('ARGS');
const HAS_BLOCK = enumerableSymbol('HAS_BLOCK');
const DIRTY_TAG = symbol('DIRTY_TAG');
const IS_DISPATCHING_ATTRS = symbol('IS_DISPATCHING_ATTRS');
const BOUNDS = symbol('BOUNDS');
/**
@module @ember/component
*/

/**
  A component is an isolated piece of UI, represented by a template and an
  optional class. When a component has a class, its template's `this` value
  is an instance of the component class.

  ## Template-only Components

  The simplest way to create a component is to create a template file in
  `app/templates/components`. For example, if you name a template
  `app/templates/components/person-profile.hbs`:

  ```app/templates/components/person-profile.hbs
  <h1>{{@person.name}}</h1>
  <img src={{@person.avatar}}>
  <p class='signature'>{{@person.signature}}</p>
  ```

  You will be able to use `<PersonProfile />` to invoke this component elsewhere
  in your application:

  ```app/templates/application.hbs
  <PersonProfile @person={{this.currentUser}} />
  ```

  Note that component names are capitalized here in order to distinguish them
  from regular HTML elements, but they are dasherized in the file system.

  While the angle bracket invocation form is generally preferred, it is also
  possible to invoke the same component with the `{{person-profile}}` syntax:

  ```app/templates/application.hbs
  {{person-profile person=this.currentUser}}
  ```

  Note that with this syntax, you use dashes in the component name and
  arguments are passed without the `@` sign.

  In both cases, Ember will render the content of the component template we
  created above. The end result will be something like this:

  ```html
  <h1>Tomster</h1>
  <img src="https://emberjs.com/tomster.jpg">
  <p class='signature'>Out of office this week</p>
  ```

  ## File System Nesting

  Components can be nested inside sub-folders for logical groupping. For
  example, if we placed our template in
  `app/templates/components/person/short-profile.hbs`, we can invoke it as
  `<Person::ShortProfile />`:

  ```app/templates/application.hbs
  <Person::ShortProfile @person={{this.currentUser}} />
  ```

  Or equivalently, `{{person/short-profile}}`:

  ```app/templates/application.hbs
  {{person/short-profile person=this.currentUser}}
  ```

  ## Yielding Contents

  You can use `yield` inside a template to include the **contents** of any block
  attached to the component. The block will be executed in its original context:

  ```handlebars
  <PersonProfile @person={{this.currentUser}}>
    <p>Admin mode</p>
    {{! Executed in the current context. }}
  </PersonProfile>
  ```

  or

  ```handlebars
  {{#person-profile person=this.currentUser}}
    <p>Admin mode</p>
    {{! Executed in the current context. }}
  {{/person-profile}}
  ```

  ```app/templates/components/person-profile.hbs
  <h1>{{@person.name}}</h1>
  {{yield}}
  ```

  ## Customizing Components With JavaScript

  If you want to customize the component in order to handle events, transform
  arguments or maintain internal state, you implement a subclass of `Component`.

  One example is to add computed properties to your component:

  ```app/components/person-profile.js
  import Component from '@ember/component';

  export default Component.extend({
    displayName: computed('person.title', 'person.firstName', 'person.lastName', function() {
      let { title, firstName, lastName } = this;

      if (title) {
        return `${title} ${lastName}`;
      } else {
        return `${firstName} ${lastName}`;
      }
    })
  });
  ```

  And then use it in the component's template:

  ```app/templates/components/person-profile.hbs
  <h1>{{this.displayName}}</h1>
  {{yield}}
  ```

  ## Customizing a Component's HTML Element in JavaScript

  ### HTML Tag

  The default HTML tag name used for a component's HTML representation is `div`.
  This can be customized by setting the `tagName` property.

  Consider the following component class:

  ```app/components/emphasized-paragraph.js
  import Component from '@ember/component';

  export default Component.extend({
    tagName: 'em'
  });
  ```

  When invoked, this component would produce output that looks something like
  this:

  ```html
  <em id="ember1" class="ember-view"></em>
  ```

  ### HTML `class` Attribute

  The HTML `class` attribute of a component's tag can be set by providing a
  `classNames` property that is set to an array of strings:

  ```app/components/my-widget.js
  import Component from '@ember/component';

  export default Component.extend({
    classNames: ['my-class', 'my-other-class']
  });
  ```

  Invoking this component will produce output that looks like this:

  ```html
  <div id="ember1" class="ember-view my-class my-other-class"></div>
  ```

  `class` attribute values can also be set by providing a `classNameBindings`
  property set to an array of properties names for the component. The return
  value of these properties will be added as part of the value for the
  components's `class` attribute. These properties can be computed properties:

  ```app/components/my-widget.js
  import Component from '@ember/component';
  import { computed } from '@ember/object';

  export default Component.extend({
    classNames: ['my-class', 'my-other-class'],
    classNameBindings: ['propertyA', 'propertyB'],

    propertyA: 'from-a',
    propertyB: computed(function() {
      if (someLogic) { return 'from-b'; }
    })
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view my-class my-other-class from-a from-b"></div>
  ```

  Note that `classNames` and `classNameBindings` is in addition to the `class`
  attribute passed with the angle bracket invocation syntax. Therefore, if this
  component was invoked like so:

  ```handlebars
  <MyWidget class="from-invocation" />
  ```

  The resulting HTML will look similar to this:

  ```html
  <div id="ember1" class="from-invocation ember-view my-class my-other-class from-a from-b"></div>
  ```

  If the value of a class name binding returns a boolean the property name
  itself will be used as the class name if the property is true. The class name
  will not be added if the value is `false` or `undefined`.

  ```app/components/my-widget.js
  import Component from '@ember/component';

  export default Component.extend({
    classNameBindings: ['hovered'],

    hovered: true
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view hovered"></div>
  ```

  ### Custom Class Names for Boolean Values

  When using boolean class name bindings you can supply a string value other
  than the property name for use as the `class` HTML attribute by appending the
  preferred value after a ":" character when defining the binding:

  ```app/components/my-widget.js
  import Component from '@ember/component';

  export default Component.extend({
    classNameBindings: ['awesome:so-very-cool'],

    awesome: true
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view so-very-cool"></div>
  ```

  Boolean value class name bindings whose property names are in a
  camelCase-style format will be converted to a dasherized format:

  ```app/components/my-widget.js
  import Component from '@ember/component';

  export default Component.extend({
    classNameBindings: ['isUrgent'],

    isUrgent: true
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view is-urgent"></div>
  ```

  Class name bindings can also refer to object values that are found by
  traversing a path relative to the component itself:

  ```app/components/my-widget.js
  import Component from '@ember/component';
  import EmberObject from '@ember/object';

  export default Component.extend({
    classNameBindings: ['messages.empty'],

    messages: EmberObject.create({
      empty: true
    })
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view empty"></div>
  ```

  If you want to add a class name for a property which evaluates to true and
  and a different class name if it evaluates to false, you can pass a binding
  like this:

  ```app/components/my-widget.js
  import Component from '@ember/component';

  export default Component.extend({
    classNameBindings: ['isEnabled:enabled:disabled'],
    isEnabled: true
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view enabled"></div>
  ```

  When isEnabled is `false`, the resulting HTML representation looks like this:

  ```html
  <div id="ember1" class="ember-view disabled"></div>
  ```

  This syntax offers the convenience to add a class if a property is `false`:

  ```app/components/my-widget.js
  import Component from '@ember/component';

  // Applies no class when isEnabled is true and class 'disabled' when isEnabled is false
  export default Component.extend({
    classNameBindings: ['isEnabled::disabled'],
    isEnabled: true
  });
  ```

  Invoking this component when the `isEnabled` property is true will produce
  HTML that looks like:

  ```html
  <div id="ember1" class="ember-view"></div>
  ```

  Invoking it when the `isEnabled` property on the component is `false` will
  produce HTML that looks like:

  ```html
  <div id="ember1" class="ember-view disabled"></div>
  ```

  Updates to the value of a class name binding will result in automatic update
  of the  HTML `class` attribute in the component's rendered HTML
  representation. If the value becomes `false` or `undefined` the class name
  will be removed.

  Both `classNames` and `classNameBindings` are concatenated properties. See
  [EmberObject](/ember/release/classes/EmberObject) documentation for more
  information about concatenated properties.

  ### Other HTML Attributes

  The HTML attribute section of a component's tag can be set by providing an
  `attributeBindings` property set to an array of property names on the component.
  The return value of these properties will be used as the value of the component's
  HTML associated attribute:

  ```app/components/my-anchor.js
  import Component from '@ember/component';

  export default Component.extend({
    tagName: 'a',
    attributeBindings: ['href'],

    href: 'http://google.com'
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <a id="ember1" class="ember-view" href="http://google.com"></a>
  ```

  One property can be mapped on to another by placing a ":" between
  the source property and the destination property:

  ```app/components/my-anchor.js
  import Component from '@ember/component';

  export default Component.extend({
    tagName: 'a',
    attributeBindings: ['url:href'],

    url: 'http://google.com'
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <a id="ember1" class="ember-view" href="http://google.com"></a>
  ```

  HTML attributes passed with angle bracket invocations will take precedence
  over those specified in `attributeBindings`. Therefore, if this component was
  invoked like so:

  ```handlebars
  <MyAnchor href="http://bing.com" @url="http://google.com" />
  ```

  The resulting HTML will looks like this:

  ```html
  <a id="ember1" class="ember-view" href="http://bing.com"></a>
  ```

  Note that the `href` attribute is ultimately set to `http://bing.com`,
  despite it having attribute binidng to the `url` property, which was
  set to `http://google.com`.

  Namespaced attributes (e.g. `xlink:href`) are supported, but have to be
  mapped, since `:` is not a valid character for properties in Javascript:

  ```app/components/my-use.js
  import Component from '@ember/component';

  export default Component.extend({
    tagName: 'use',
    attributeBindings: ['xlinkHref:xlink:href'],

    xlinkHref: '#triangle'
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <use xlink:href="#triangle"></use>
  ```

  If the value of a property monitored by `attributeBindings` is a boolean, the
  attribute will be present or absent depending on the value:

  ```app/components/my-text-input.js
  import Component from '@ember/component';

  export default Component.extend({
    tagName: 'input',
    attributeBindings: ['disabled'],

    disabled: false
  });
  ```

  Invoking this component will produce HTML that looks like:

  ```html
  <input id="ember1" class="ember-view" />
  ```

  `attributeBindings` can refer to computed properties:

  ```app/components/my-text-input.js
  import Component from '@ember/component';
  import { computed } from '@ember/object';

  export default Component.extend({
    tagName: 'input',
    attributeBindings: ['disabled'],

    disabled: computed(function() {
      if (someLogic) {
        return true;
      } else {
        return false;
      }
    })
  });
  ```

  To prevent setting an attribute altogether, use `null` or `undefined` as the
  value of the property used in `attributeBindings`:

  ```app/components/my-text-input.js
  import Component from '@ember/component';

  export default Component.extend({
    tagName: 'form',
    attributeBindings: ['novalidate'],
    novalidate: null
  });
  ```

  Updates to the property of an attribute binding will result in automatic
  update of the  HTML attribute in the component's HTML output.

  `attributeBindings` is a concatenated property. See
  [EmberObject](/ember/release/classes/EmberObject) documentation for more
  information about concatenated properties.

  ## Layouts

  The `layout` property can be used to dynamically specify a template associated
  with a component class, instead of relying on Ember to link together a
  component class and a template based on file names.

  In general, applications should not use this feature, but it's commonly used
  in addons for historical reasons.

  The `layout` property should be set to the default export of a template
  module, which is the name of a template file without the `.hbs` extension.

  ```app/templates/components/person-profile.hbs
  <h1>Person's Title</h1>
  <div class='details'>{{yield}}</div>
  ```

  ```app/components/person-profile.js
    import Component from '@ember/component';
    import layout from '../templates/components/person-profile';

    export default Component.extend({
      layout
    });
  ```

  If you invoke the component:

  ```handlebars
  <PersonProfile>
    <h2>Chief Basket Weaver</h2>
    <h3>Fisherman Industries</h3>
  </PersonProfile>
  ```

  or

  ```handlebars
  {{#person-profile}}
    <h2>Chief Basket Weaver</h2>
    <h3>Fisherman Industries</h3>
  {{/person-profile}}
  ```

  It will result in the following HTML output:

  ```html
  <h1>Person's Title</h1>
    <div class="details">
    <h2>Chief Basket Weaver</h2>
    <h3>Fisherman Industries</h3>
  </div>
  ```

  ## Handling Browser Events

  Components can respond to user-initiated events in one of three ways: passing
  actions with angle bracket invocation, adding event handler methods to the
  component's class, or adding actions to the component's template.

  ### Passing Actions With Angle Bracket Invocation

  For one-off events specific to particular instance of a component, it is possible
  to pass actions to the component's element using angle bracket invocation syntax.

  ```handlebars
  <MyWidget {{action 'firstWidgetClicked'}} />

  <MyWidget {{action 'secondWidgetClicked'}} />
  ```

  In this case, when the first component is clicked on, Ember will invoke the
  `firstWidgetClicked` action. When the second component is clicked on, Ember
  will invoke the `secondWidgetClicked` action instead.

  Besides `{{action}}`, it is also possible to pass any arbitrary element modifiers
  using the angle bracket invocation syntax.

  ### Event Handler Methods

  Components can also respond to user-initiated events by implementing a method
  that matches the event name. This approach is appropriate when the same event
  should be handled by all instances of the same component.

  An event object will be passed as the argument to the event handler method.

  ```app/components/my-widget.js
  import Component from '@ember/component';

  export default Component.extend({
    click(event) {
      // `event.target` is either the component's element or one of its children
      let tag = event.target.tagName.toLowerCase();
      console.log('clicked on a `<${tag}>` HTML element!');
    }
  });
  ```

  In this example, whenever the user clicked anywhere inside the component, it
  will log a message to the console.

  It is possible to handle event types other than `click` by implementing the
  following event handler methods. In addition, custom events can be registered
  by using `Application.customEvents`.

  Touch events:

  * `touchStart`
  * `touchMove`
  * `touchEnd`
  * `touchCancel`

  Keyboard events:

  * `keyDown`
  * `keyUp`
  * `keyPress`

  Mouse events:

  * `mouseDown`
  * `mouseUp`
  * `contextMenu`
  * `click`
  * `doubleClick`
  * `focusIn`
  * `focusOut`

  Form events:

  * `submit`
  * `change`
  * `focusIn`
  * `focusOut`
  * `input`

  Drag and drop events:

  * `dragStart`
  * `drag`
  * `dragEnter`
  * `dragLeave`
  * `dragOver`
  * `dragEnd`
  * `drop`

  ### `{{action}}` Helper

  Instead of handling all events of a particular type anywhere inside the
  component's element, you may instead want to limit it to a particular
  element in the component's template. In this case, it would be more
  convenient to implement an action instead.

  For example, you could implement the action `hello` for the `person-profile`
  component:

  ```app/components/person-profile.js
  import Component from '@ember/component';

  export default Component.extend({
    actions: {
      hello(name) {
        console.log("Hello", name);
      }
    }
  });
  ```

  And then use it in the component's template:

  ```app/templates/components/person-profile.hbs
  <h1>{{@person.name}}</h1>

  <button {{action 'hello' @person.name}}>
    Say Hello to {{@person.name}}
  </button>
  ```

  When the user clicks the button, Ember will invoke the `hello` action,
  passing in the current value of `@person.name` as an argument.

  See [Ember.Templates.helpers.action](/ember/release/classes/Ember.Templates.helpers/methods/action?anchor=action).

  @class Component
  @extends Ember.CoreView
  @uses Ember.TargetActionSupport
  @uses Ember.ClassNamesSupport
  @uses Ember.ActionSupport
  @uses Ember.ViewMixin
  @uses Ember.ViewStateSupport
  @public
*/

const Component = CoreView.extend(ChildViewsSupport, ViewStateSupport, ClassNamesSupport, TargetActionSupport, ActionSupport, ViewMixin, {
  isComponent: true,

  init() {
    this._super(...arguments);

    this[IS_DISPATCHING_ATTRS] = false;
    this[DIRTY_TAG] = createTag();
    this[BOUNDS] = null;

    if (DEBUG && this.renderer._destinedForDOM && this.tagName === '') {
      let eventNames = [];
      let eventDispatcher = getOwner(this).lookup('event_dispatcher:main');
      let events = eventDispatcher && eventDispatcher._finalEvents || {}; // tslint:disable-next-line:forin

      for (let key in events) {
        let methodName = events[key];

        if (typeof this[methodName] === 'function') {
          eventNames.push(methodName);
        }
      } // If in a tagless component, assert that no event handlers are defined


      assert( // tslint:disable-next-line:max-line-length
      `You can not define \`${eventNames}\` function(s) to handle DOM event in the \`${this}\` tagless component since it doesn't have any DOM element.`, !eventNames.length);
    }

    deprecate(`${this}: Using \`mouseEnter\` event handler methods in components has been deprecated.`, this.mouseEnter === undefined, {
      id: 'ember-views.event-dispatcher.mouseenter-leave-move',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x#toc_component-mouseenter-leave-move'
    });
    deprecate(`${this}: Using \`mouseLeave\` event handler methods in components has been deprecated.`, this.mouseLeave === undefined, {
      id: 'ember-views.event-dispatcher.mouseenter-leave-move',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x#toc_component-mouseenter-leave-move'
    });
    deprecate(`${this}: Using \`mouseMove\` event handler methods in components has been deprecated.`, this.mouseMove === undefined, {
      id: 'ember-views.event-dispatcher.mouseenter-leave-move',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x#toc_component-mouseenter-leave-move'
    });
  },

  rerender() {
    dirtyTag(this[DIRTY_TAG]);

    this._super();
  },

  [PROPERTY_DID_CHANGE](key, value) {
    if (this[IS_DISPATCHING_ATTRS]) {
      return;
    }

    let args = this[ARGS];
    let reference = args !== undefined ? args[key] : undefined;

    if (reference !== undefined && reference[UPDATE_REFERENCED_VALUE] !== undefined) {
      reference[UPDATE_REFERENCED_VALUE](arguments.length === 2 ? value : get(this, key));
    }
  },

  getAttr(key) {
    // TODO Intimate API should be deprecated
    return this.get(key);
  },

  /**
    Normally, Ember's component model is "write-only". The component takes a
    bunch of attributes that it got passed in, and uses them to render its
    template.
     One nice thing about this model is that if you try to set a value to the
    same thing as last time, Ember (through HTMLBars) will avoid doing any
    work on the DOM.
     This is not just a performance optimization. If an attribute has not
    changed, it is important not to clobber the element's "hidden state".
    For example, if you set an input's `value` to the same value as before,
    it will clobber selection state and cursor position. In other words,
    setting an attribute is not **always** idempotent.
     This method provides a way to read an element's attribute and also
    update the last value Ember knows about at the same time. This makes
    setting an attribute idempotent.
     In particular, what this means is that if you get an `<input>` element's
    `value` attribute and then re-render the template with the same value,
    it will avoid clobbering the cursor and selection position.
    Since most attribute sets are idempotent in the browser, you typically
    can get away with reading attributes using jQuery, but the most reliable
    way to do so is through this method.
    @method readDOMAttr
     @param {String} name the name of the attribute
    @return String
    @public
   */
  readDOMAttr(name) {
    // TODO revisit this
    let _element = getViewElement(this);

    assert(`Cannot call \`readDOMAttr\` on ${this} which does not have an element`, _element !== null);
    let element = _element;
    let isSVG = element.namespaceURI === "http://www.w3.org/2000/svg"
    /* SVG */
    ;
    let {
      type,
      normalized
    } = normalizeProperty(element, name);

    if (isSVG || type === 'attr') {
      return element.getAttribute(normalized);
    }

    return element[normalized];
  },

  /**
   The WAI-ARIA role of the control represented by this view. For example, a
   button may have a role of type 'button', or a pane may have a role of
   type 'alertdialog'. This property is used by assistive software to help
   visually challenged users navigate rich web applications.
    The full list of valid WAI-ARIA roles is available at:
   [https://www.w3.org/TR/wai-aria/#roles_categorization](https://www.w3.org/TR/wai-aria/#roles_categorization)
    @property ariaRole
   @type String
   @default null
   @public
   */

  /**
   Enables components to take a list of parameters as arguments.
   For example, a component that takes two parameters with the names
   `name` and `age`:
    ```app/components/my-component.js
   import Component from '@ember/component';
    let MyComponent = Component.extend();
    MyComponent.reopenClass({
     positionalParams: ['name', 'age']
   });
    export default MyComponent;
   ```
    It can then be invoked like this:
    ```hbs
   {{my-component "John" 38}}
   ```
    The parameters can be referred to just like named parameters:
    ```hbs
   Name: {{name}}, Age: {{age}}.
   ```
    Using a string instead of an array allows for an arbitrary number of
   parameters:
    ```app/components/my-component.js
   import Component from '@ember/component';
    let MyComponent = Component.extend();
    MyComponent.reopenClass({
     positionalParams: 'names'
   });
    export default MyComponent;
   ```
    It can then be invoked like this:
    ```hbs
   {{my-component "John" "Michael" "Scott"}}
   ```
   The parameters can then be referred to by enumerating over the list:
    ```hbs
   {{#each names as |name|}}{{name}}{{/each}}
   ```
    @static
   @public
   @property positionalParams
   @since 1.13.0
   */

  /**
   Called when the attributes passed into the component have been updated.
   Called both during the initial render of a container and during a rerender.
   Can be used in place of an observer; code placed here will be executed
   every time any attribute updates.
   @method didReceiveAttrs
   @public
   @since 1.13.0
   */
  didReceiveAttrs() {},

  /**
   Called when the attributes passed into the component have been updated.
   Called both during the initial render of a container and during a rerender.
   Can be used in place of an observer; code placed here will be executed
   every time any attribute updates.
   @event didReceiveAttrs
   @public
   @since 1.13.0
   */

  /**
   Called after a component has been rendered, both on initial render and
   in subsequent rerenders.
   @method didRender
   @public
   @since 1.13.0
   */
  didRender() {},

  /**
   Called after a component has been rendered, both on initial render and
   in subsequent rerenders.
   @event didRender
   @public
   @since 1.13.0
   */

  /**
   Called before a component has been rendered, both on initial render and
   in subsequent rerenders.
   @method willRender
   @public
   @since 1.13.0
   */
  willRender() {},

  /**
   Called before a component has been rendered, both on initial render and
   in subsequent rerenders.
   @event willRender
   @public
   @since 1.13.0
   */

  /**
   Called when the attributes passed into the component have been changed.
   Called only during a rerender, not during an initial render.
   @method didUpdateAttrs
   @public
   @since 1.13.0
   */
  didUpdateAttrs() {},

  /**
   Called when the attributes passed into the component have been changed.
   Called only during a rerender, not during an initial render.
   @event didUpdateAttrs
   @public
   @since 1.13.0
   */

  /**
   Called when the component is about to update and rerender itself.
   Called only during a rerender, not during an initial render.
   @method willUpdate
   @public
   @since 1.13.0
   */
  willUpdate() {},

  /**
   Called when the component is about to update and rerender itself.
   Called only during a rerender, not during an initial render.
   @event willUpdate
   @public
   @since 1.13.0
   */

  /**
   Called when the component has updated and rerendered itself.
   Called only during a rerender, not during an initial render.
   @method didUpdate
   @public
   @since 1.13.0
   */
  didUpdate() {}

});

Component.toString = () => '@ember/component';

Component.reopenClass({
  isComponentFactory: true,
  positionalParams: []
});

var layout = template({
  "id": "SWbqsLhV",
  "block": "{\"symbols\":[],\"statements\":[],\"hasEval\":false,\"upvars\":[]}",
  "meta": {
    "moduleName": "packages/@ember/-internals/glimmer/lib/templates/empty.hbs"
  }
});

/**
@module @ember/component
*/

/**
  The internal class used to create text inputs when the `{{input}}`
  helper is used with `type` of `checkbox`.

  See [Ember.Templates.helpers.input](/ember/release/classes/Ember.Templates.helpers/methods/input?anchor=input)  for usage details.

  ## Direct manipulation of `checked`

  The `checked` attribute of an `Checkbox` object should always be set
  through the Ember object or by interacting with its rendered element
  representation via the mouse, keyboard, or touch. Updating the value of the
  checkbox via jQuery will result in the checked value of the object and its
  element losing synchronization.

  ## Layout and LayoutName properties

  Because HTML `input` elements are self closing `layout` and `layoutName`
  properties will not be applied.

  @class Checkbox
  @extends Component
  @public
*/

const Checkbox = Component.extend({
  layout,

  /**
    By default, this component will add the `ember-checkbox` class to the component's element.
       @property classNames
    @type Array | String
    @default ['ember-checkbox']
    @public
   */
  classNames: ['ember-checkbox'],
  tagName: 'input',

  /**
    By default this component will forward a number of arguments to attributes on the the
    component's element:
       * indeterminate
    * disabled
    * tabindex
    * name
    * autofocus
    * required
    * form
       When invoked with curly braces, this is the exhaustive list of HTML attributes you can
    customize (i.e. `{{input type="checkbox" disabled=true}}`).
       When invoked with angle bracket invocation, this list is irrelevant, because you can use HTML
    attribute syntax to customize the element (i.e.
    `<Input @type="checkbox" disabled data-custom="custom value" />`). However, `@type` and
    `@checked` must be passed as named arguments, not attributes.
       @property attributeBindings
    @type Array | String
    @default ['type', 'checked', 'indeterminate', 'disabled', 'tabindex', 'name', 'autofocus', 'required', 'form']
    @public
  */
  attributeBindings: ['type', 'checked', 'indeterminate', 'disabled', 'tabindex', 'name', 'autofocus', 'required', 'form'],

  /**
    Sets the `type` attribute of the `Checkbox`'s element
       @property disabled
    @default false
    @private
   */
  type: 'checkbox',

  /**
    Sets the `disabled` attribute of the `Checkbox`'s element
       @property disabled
    @default false
    @public
   */
  disabled: false,

  /**
    Corresponds to the `indeterminate` property of the `Checkbox`'s element
       @property disabled
    @default false
    @public
   */
  indeterminate: false,

  /**
    Whenever the checkbox is inserted into the DOM, perform initialization steps, which include
    setting the indeterminate property if needed.
       If this method is overridden, `super` must be called.
       @method
    @public
   */
  didInsertElement() {
    this._super(...arguments);

    this.element.indeterminate = Boolean(this.indeterminate);
  },

  /**
    Whenever the `change` event is fired on the checkbox, update its `checked` property to reflect
    whether the checkbox is checked.
       If this method is overridden, `super` must be called.
       @method
    @public
   */
  change() {
    set(this, 'checked', this.element.checked);
  }

});

if (DEBUG) {
  const UNSET = {};
  Checkbox.reopen({
    value: UNSET,

    didReceiveAttrs() {
      this._super();

      assert("`<Input @type='checkbox' @value={{...}} />` is not supported; " + "please use `<Input @type='checkbox' @checked={{...}} />` instead.", !(this.type === 'checkbox' && this.value !== UNSET));
    }

  });
}

Checkbox.toString = () => '@ember/component/checkbox';

/**
@module @ember/component
*/
const inputTypes = hasDOM ? Object.create(null) : null;

function canSetTypeOfInput(type) {
  // if running in outside of a browser always return
  // the original type
  if (!hasDOM) {
    return Boolean(type);
  }

  if (type in inputTypes) {
    return inputTypes[type];
  }

  let inputTypeTestElement = document.createElement('input');

  try {
    inputTypeTestElement.type = type;
  } catch (e) {// ignored
  }

  return inputTypes[type] = inputTypeTestElement.type === type;
}
/**
  The internal class used to create text inputs when the `Input` component is used with `type` of `text`.

  See [Ember.Templates.components.Input](/ember/release/classes/Ember.Templates.components/methods/Input?anchor=Input) for usage details.

  ## Layout and LayoutName properties

  Because HTML `input` elements are self closing `layout` and `layoutName`
  properties will not be applied.

  @class TextField
  @extends Component
  @uses Ember.TextSupport
  @public
*/


const TextField = Component.extend(TextSupport, {
  layout,

  /**
    By default, this component will add the `ember-text-field` class to the component's element.
       @property classNames
    @type Array | String
    @default ['ember-text-field']
    @public
   */
  classNames: ['ember-text-field'],
  tagName: 'input',

  /**
    By default this component will forward a number of arguments to attributes on the the
    component's element:
       * accept
    * autocomplete
    * autosave
    * dir
    * formaction
    * formenctype
    * formmethod
    * formnovalidate
    * formtarget
    * height
    * inputmode
    * lang
    * list
    * type
    * max
    * min
    * multiple
    * name
    * pattern
    * size
    * step
    * value
    * width
       When invoked with `{{input type="text"}}`, you can only customize these attributes. When invoked
    with `<Input @type="text" />`, you can just use HTML attributes directly.
       @property attributeBindings
    @type Array | String
    @default ['accept', 'autocomplete', 'autosave', 'dir', 'formaction', 'formenctype', 'formmethod', 'formnovalidate', 'formtarget', 'height', 'inputmode', 'lang', 'list', 'type', 'max', 'min', 'multiple', 'name', 'pattern', 'size', 'step', 'value', 'width']
    @public
  */
  attributeBindings: ['accept', 'autocomplete', 'autosave', 'dir', 'formaction', 'formenctype', 'formmethod', 'formnovalidate', 'formtarget', 'height', 'inputmode', 'lang', 'list', 'type', 'max', 'min', 'multiple', 'name', 'pattern', 'size', 'step', 'value', 'width'],

  /**
    As the user inputs text, this property is updated to reflect the `value` property of the HTML
    element.
       @property value
    @type String
    @default ""
    @public
  */
  value: '',

  /**
    The `type` attribute of the input element.
       @property type
    @type String
    @default "text"
    @public
  */
  type: computed({
    get() {
      return 'text';
    },

    set(_key, value) {
      let type = 'text';

      if (canSetTypeOfInput(value)) {
        type = value;
      }

      return type;
    }

  }),

  /**
    The `size` of the text field in characters.
       @property size
    @type String
    @default null
    @public
  */
  size: null,

  /**
    The `pattern` attribute of input element.
       @property pattern
    @type String
    @default null
    @public
  */
  pattern: null,

  /**
    The `min` attribute of input element used with `type="number"` or `type="range"`.
       @property min
    @type String
    @default null
    @since 1.4.0
    @public
  */
  min: null,

  /**
    The `max` attribute of input element used with `type="number"` or `type="range"`.
       @property max
    @type String
    @default null
    @since 1.4.0
    @public
  */
  max: null
});

TextField.toString = () => '@ember/component/text-field';

/**
@module @ember/component
*/
/**
  The `Textarea` component inserts a new instance of `<textarea>` tag into the template.

  The `@value` argument provides the content of the `<textarea>`.

  This template:

  ```handlebars
  <Textarea @value="A bunch of text" />
  ```

  Would result in the following HTML:

  ```html
  <textarea class="ember-text-area">
    A bunch of text
  </textarea>
  ```

  The `@value` argument is two-way bound. If the user types text into the textarea, the `@value`
  argument is updated. If the `@value` argument is updated, the text in the textarea is updated.

  In the following example, the `writtenWords` property on the component will be updated as the user
  types 'Lots of text' into the text area of their browser's window.

  ```app/components/word-editor.js
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  export default class WordEditorComponent extends Component {
    @tracked writtenWords = "Lots of text that IS bound";
  }
  ```

  ```handlebars
  <Textarea @value={{writtenWords}} />
  ```

  Would result in the following HTML:

  ```html
  <textarea class="ember-text-area">
    Lots of text that IS bound
  </textarea>
  ```

  If you wanted a one way binding, you could use the `<textarea>` element directly, and use the
  `value` DOM property and the `input` event.

  ### Actions

  The `Textarea` component takes a number of arguments with callbacks that are invoked in
  response to user events.

  * `enter`
  * `insert-newline`
  * `escape-press`
  * `focus-in`
  * `focus-out`
  * `key-press`

  These callbacks are passed to `Textarea` like this:

  ```handlebars
  <Textarea @value={{this.searchWord}} @enter={{this.query}} />
  ```

  ## Classic Invocation Syntax

  The `Textarea` component can also be invoked using curly braces, just like any other Ember
  component.

  For example, this is an invocation using angle-bracket notation:

  ```handlebars
  <Textarea @value={{this.searchWord}} @enter={{this.query}} />
  ```

  You could accomplish the same thing using classic invocation:

  ```handlebars
  {{textarea value=this.searchWord enter=this.query}}
  ```

  The main difference is that angle-bracket invocation supports any HTML attribute using HTML
  attribute syntax, because attributes and arguments have different syntax when using angle-bracket
  invocation. Curly brace invocation, on the other hand, only has a single syntax for arguments,
  and components must manually map attributes onto component arguments.

  When using classic invocation with `{{textarea}}`, only the following attributes are mapped onto
  arguments:

  * rows
  * cols
  * name
  * selectionEnd
  * selectionStart
  * autocomplete
  * wrap
  * lang
  * dir
  * value

  ## Classic `layout` and `layoutName` properties

  Because HTML `textarea` elements do not contain inner HTML the `layout` and
  `layoutName` properties will not be applied.

  @method Textarea
  @for Ember.Templates.components
  @see {TextArea}
  @public
*/

/**
  See Ember.Templates.components.Textarea.

  @method textarea
  @for Ember.Templates.helpers
  @see {Ember.Templates.components.textarea}
  @public
*/

/**
  The internal representation used for `Textarea` invocations.

  @class TextArea
  @extends Component
  @see {Ember.Templates.components.Textarea}
  @uses Ember.TextSupport
  @public
*/

const TextArea = Component.extend(TextSupport, {
  classNames: ['ember-text-area'],
  layout,
  tagName: 'textarea',
  attributeBindings: ['rows', 'cols', 'name', 'selectionEnd', 'selectionStart', 'autocomplete', 'wrap', 'lang', 'dir', 'value'],
  rows: null,
  cols: null
});

TextArea.toString = () => '@ember/component/text-area';

var layout$1 = template({
  "id": "uDKxl8ne",
  "block": "{\"symbols\":[\"&default\"],\"statements\":[[6,[37,0],[[27,[32,1]]],null,[[\"default\",\"else\"],[{\"statements\":[[18,1,null]],\"parameters\":[]},{\"statements\":[[1,[32,0,[\"linkTitle\"]]]],\"parameters\":[]}]]]],\"hasEval\":false,\"upvars\":[\"if\"]}",
  "meta": {
    "moduleName": "packages/@ember/-internals/glimmer/lib/templates/link-to.hbs"
  }
});

/**
@module ember
*/
/**
  The `LinkTo` component renders a link to the supplied `routeName` passing an optionally
  supplied model to the route as its `model` context of the route. The block for `LinkTo`
  becomes the contents of the rendered element:

  ```handlebars
  <LinkTo @route='photoGallery'>
    Great Hamster Photos
  </LinkTo>
  ```

  This will result in:

  ```html
  <a href="/hamster-photos">
    Great Hamster Photos
  </a>
  ```

  ### Disabling the `LinkTo` component

  The `LinkTo` component can be disabled by using the `disabled` argument. A disabled link
  doesn't result in a transition when activated, and adds the `disabled` class to the `<a>`
  element.

  (The class name to apply to the element can be overridden by using the `disabledClass`
  argument)

  ```handlebars
  <LinkTo @route='photoGallery' @disabled={{true}}>
    Great Hamster Photos
  </LinkTo>
  ```

  ### Handling `href`

  `<LinkTo>` will use your application's Router to fill the element's `href` property with a URL
  that matches the path to the supplied `routeName`.

  ### Handling current route

  The `LinkTo` component will apply a CSS class name of 'active' when the application's current
  route matches the supplied routeName. For example, if the application's current route is
  'photoGallery.recent', then the following invocation of `LinkTo`:

  ```handlebars
  <LinkTo @route='photoGallery.recent'>
    Great Hamster Photos
  </LinkTo>
  ```

  will result in

  ```html
  <a href="/hamster-photos/this-week" class="active">
    Great Hamster Photos
  </a>
  ```

  The CSS class used for active classes can be customized by passing an `activeClass` argument:

  ```handlebars
  <LinkTo @route='photoGallery.recent' @activeClass="current-url">
    Great Hamster Photos
  </LinkTo>
  ```

  ```html
  <a href="/hamster-photos/this-week" class="current-url">
    Great Hamster Photos
  </a>
  ```

  ### Keeping a link active for other routes

  If you need a link to be 'active' even when it doesn't match the current route, you can use the
  `current-when` argument.

  ```handlebars
  <LinkTo @route='photoGallery' @current-when='photos'>
    Photo Gallery
  </LinkTo>
  ```

  This may be helpful for keeping links active for:

  * non-nested routes that are logically related
  * some secondary menu approaches
  * 'top navigation' with 'sub navigation' scenarios

  A link will be active if `current-when` is `true` or the current
  route is the route this link would transition to.

  To match multiple routes 'space-separate' the routes:

  ```handlebars
  <LinkTo @route='gallery' @current-when='photos drawings paintings'>
    Art Gallery
  </LinkTo>
  ```

  ### Supplying a model

  An optional `model` argument can be used for routes whose
  paths contain dynamic segments. This argument will become
  the model context of the linked route:

  ```javascript
  Router.map(function() {
    this.route("photoGallery", {path: "hamster-photos/:photo_id"});
  });
  ```

  ```handlebars
  <LinkTo @route='photoGallery' @model={{this.aPhoto}}>
    {{aPhoto.title}}
  </LinkTo>
  ```

  ```html
  <a href="/hamster-photos/42">
    Tomster
  </a>
  ```

  ### Supplying multiple models

  For deep-linking to route paths that contain multiple
  dynamic segments, the `models` argument can be used.

  As the router transitions through the route path, each
  supplied model argument will become the context for the
  route with the dynamic segments:

  ```javascript
  Router.map(function() {
    this.route("photoGallery", { path: "hamster-photos/:photo_id" }, function() {
      this.route("comment", {path: "comments/:comment_id"});
    });
  });
  ```

  This argument will become the model context of the linked route:

  ```handlebars
  <LinkTo @route='photoGallery.comment' @models={{array this.aPhoto this.comment}}>
    {{comment.body}}
  </LinkTo>
  ```

  ```html
  <a href="/hamster-photos/42/comments/718">
    A+++ would snuggle again.
  </a>
  ```

  ### Supplying an explicit dynamic segment value

  If you don't have a model object available to pass to `LinkTo`,
  an optional string or integer argument can be passed for routes whose
  paths contain dynamic segments. This argument will become the value
  of the dynamic segment:

  ```javascript
  Router.map(function() {
    this.route("photoGallery", { path: "hamster-photos/:photo_id" });
  });
  ```

  ```handlebars
  <LinkTo @route='photoGallery' @model={{aPhotoId}}>
    {{this.aPhoto.title}}
  </LinkTo>
  ```

  ```html
  <a href="/hamster-photos/42">
    Tomster
  </a>
  ```

  When transitioning into the linked route, the `model` hook will
  be triggered with parameters including this passed identifier.

  ### Allowing Default Action

  By default the `<LinkTo>` component prevents the default browser action by calling
  `preventDefault()` to avoid reloading the browser page.

  If you need to trigger a full browser reload pass `@preventDefault={{false}}`:

  ```handlebars
  <LinkTo @route='photoGallery' @model={{this.aPhotoId}} @preventDefault={{false}}>
    {{this.aPhotoId.title}}
  </LinkTo>
  ```

  ### Supplying a `tagName`

  By default `<LinkTo>` renders an `<a>` element. This can be overridden for a single use of
  `<LinkTo>` by supplying a `tagName` argument:

  ```handlebars
  <LinkTo @route='photoGallery' @tagName='li'>
    Great Hamster Photos
  </LinkTo>
  ```

  This produces:

  ```html
  <li>
    Great Hamster Photos
  </li>
  ```

  In general, this is not recommended. Instead, you can use the `transition-to` helper together
  with a click event handler on the HTML tag of your choosing.

  @for Ember.Templates.components
  @method LinkTo
  @see {LinkComponent}
  @public
*/

/**
  @module @ember/routing
*/

/**
  See [Ember.Templates.components.LinkTo](/ember/release/classes/Ember.Templates.components/methods/input?anchor=LinkTo).

  @for Ember.Templates.helpers
  @method link-to
  @see {Ember.Templates.components.LinkTo}
  @public
**/

/**
  `LinkComponent` is the internal component invoked with `<LinkTo>` or `{{link-to}}`.

  @class LinkComponent
  @extends Component
  @see {Ember.Templates.components.LinkTo}
  @public
**/

const UNDEFINED = Object.freeze({
  toString() {
    return 'UNDEFINED';
  }

});
const EMPTY_QUERY_PARAMS = Object.freeze({});
const LinkComponent = Component.extend({
  layout: layout$1,
  tagName: 'a',

  /**
    @property route
    @public
  */
  route: UNDEFINED,

  /**
    @property model
    @public
  */
  model: UNDEFINED,

  /**
    @property models
    @public
  */
  models: UNDEFINED,

  /**
    @property query
    @public
  */
  query: UNDEFINED,

  /**
    Used to determine when this `LinkComponent` is active.
       @property current-when
    @public
  */
  'current-when': null,

  /**
    Sets the `title` attribute of the `LinkComponent`'s HTML element.
       @property title
    @default null
    @public
  **/
  title: null,

  /**
    Sets the `rel` attribute of the `LinkComponent`'s HTML element.
       @property rel
    @default null
    @public
  **/
  rel: null,

  /**
    Sets the `tabindex` attribute of the `LinkComponent`'s HTML element.
       @property tabindex
    @default null
    @public
  **/
  tabindex: null,

  /**
    Sets the `target` attribute of the `LinkComponent`'s HTML element.
       @since 1.8.0
    @property target
    @default null
    @public
  **/
  target: null,

  /**
    The CSS class to apply to `LinkComponent`'s element when its `active`
    property is `true`.
       @property activeClass
    @type String
    @default active
    @public
  **/
  activeClass: 'active',

  /**
    The CSS class to apply to `LinkComponent`'s element when its `loading`
    property is `true`.
       @property loadingClass
    @type String
    @default loading
    @private
  **/
  loadingClass: 'loading',

  /**
    The CSS class to apply to a `LinkComponent`'s element when its `disabled`
    property is `true`.
       @property disabledClass
    @type String
    @default disabled
    @private
  **/
  disabledClass: 'disabled',

  /**
    Determines whether the `LinkComponent` will trigger routing via
    the `replaceWith` routing strategy.
       @property replace
    @type Boolean
    @default false
    @public
  **/
  replace: false,

  /**
    By default this component will forward `href`, `title`, `rel`, `tabindex`, and `target`
    arguments to attributes on the component's element. When invoked with `{{link-to}}`, you can
    only customize these attributes. When invoked with `<LinkTo>`, you can just use HTML
    attributes directly.
       @property attributeBindings
    @type Array | String
    @default ['title', 'rel', 'tabindex', 'target']
    @public
  */
  attributeBindings: ['href', 'title', 'rel', 'tabindex', 'target'],

  /**
    By default this component will set classes on its element when any of the following arguments
    are truthy:
       * active
    * loading
    * disabled
       When these arguments are truthy, a class with the same name will be set on the element. When
    falsy, the associated class will not be on the element.
       @property classNameBindings
    @type Array
    @default ['active', 'loading', 'disabled', 'ember-transitioning-in', 'ember-transitioning-out']
    @public
  */
  classNameBindings: ['active', 'loading', 'disabled', 'transitioningIn', 'transitioningOut'],

  /**
    By default this component responds to the `click` event. When the component element is an
    `<a>` element, activating the link in another way, such as using the keyboard, triggers the
    click event.
       @property eventName
    @type String
    @default click
    @private
  */
  eventName: 'click',

  // this is doc'ed here so it shows up in the events
  // section of the API documentation, which is where
  // people will likely go looking for it.

  /**
    Triggers the `LinkComponent`'s routing behavior. If
    `eventName` is changed to a value other than `click`
    the routing behavior will trigger on that custom event
    instead.
       @event click
    @private
  */

  /**
    An overridable method called when `LinkComponent` objects are instantiated.
       Example:
       ```app/components/my-link.js
    import LinkComponent from '@ember/routing/link-component';
       export default LinkComponent.extend({
      init() {
        this._super(...arguments);
        console.log('Event is ' + this.get('eventName'));
      }
    });
    ```
       NOTE: If you do override `init` for a framework class like `Component`,
    be sure to call `this._super(...arguments)` in your
    `init` declaration! If you don't, Ember may not have an opportunity to
    do important setup work, and you'll see strange behavior in your
    application.
       @method init
    @private
  */
  init() {
    this._super(...arguments); // Map desired event name to invoke function


    let {
      eventName
    } = this;
    this.on(eventName, this, this._invoke);
  },

  _routing: inject('-routing'),
  _currentRoute: alias('_routing.currentRouteName'),
  _currentRouterState: alias('_routing.currentState'),
  _targetRouterState: alias('_routing.targetState'),
  _route: computed('route', '_currentRouterState', function computeLinkToComponentRoute() {
    let {
      route
    } = this;
    return route === UNDEFINED ? this._currentRoute : route;
  }),
  _models: computed('model', 'models', function computeLinkToComponentModels() {
    let {
      model,
      models
    } = this;
    assert('You cannot provide both the `@model` and `@models` arguments to the <LinkTo> component.', model === UNDEFINED || models === UNDEFINED);

    if (model !== UNDEFINED) {
      return [model];
    } else if (models !== UNDEFINED) {
      assert('The `@models` argument must be an array.', Array.isArray(models));
      return models;
    } else {
      return [];
    }
  }),
  _query: computed('query', function computeLinkToComponentQuery() {
    let {
      query
    } = this;

    if (query === UNDEFINED) {
      return EMPTY_QUERY_PARAMS;
    } else {
      return Object.assign({}, query);
    }
  }),

  /**
    Accessed as a classname binding to apply the component's `disabledClass`
    CSS `class` to the element when the link is disabled.
       When `true`, interactions with the element will not trigger route changes.
    @property disabled
    @private
  */
  disabled: computed({
    get(_key) {
      // always returns false for `get` because (due to the `set` just below)
      // the cached return value from the set will prevent this getter from _ever_
      // being called after a set has occurred
      return false;
    },

    set(_key, value) {
      this._isDisabled = value;
      return value ? this.disabledClass : false;
    }

  }),

  /**
    Accessed as a classname binding to apply the component's `activeClass`
    CSS `class` to the element when the link is active.
       This component is considered active when its `currentWhen` property is `true`
    or the application's current route is the route this component would trigger
    transitions into.
       The `currentWhen` property can match against multiple routes by separating
    route names using the ` ` (space) character.
       @property active
    @private
  */
  active: computed('activeClass', '_active', function computeLinkToComponentActiveClass() {
    return this._active ? this.activeClass : false;
  }),
  _active: computed('_currentRouterState', '_route', '_models', '_query', 'loading', 'current-when', function computeLinkToComponentActive() {
    let {
      _currentRouterState: state
    } = this;

    if (state) {
      return this._isActive(state);
    } else {
      return false;
    }
  }),
  willBeActive: computed('_currentRouterState', '_targetRouterState', '_route', '_models', '_query', 'loading', 'current-when', function computeLinkToComponentWillBeActive() {
    let {
      _currentRouterState: current,
      _targetRouterState: target
    } = this;

    if (current === target) {
      return;
    }

    return this._isActive(target);
  }),

  _isActive(routerState) {
    if (this.loading) {
      return false;
    }

    let currentWhen = this['current-when'];

    if (typeof currentWhen === 'boolean') {
      return currentWhen;
    }

    let isCurrentWhenSpecified = Boolean(currentWhen);

    if (isCurrentWhenSpecified) {
      currentWhen = currentWhen.split(' ');
    } else {
      currentWhen = [this._route];
    }

    let {
      _models: models,
      _query: query,
      _routing: routing
    } = this;

    for (let i = 0; i < currentWhen.length; i++) {
      if (routing.isActiveForRoute(models, query, currentWhen[i], routerState, isCurrentWhenSpecified)) {
        return true;
      }
    }

    return false;
  },

  transitioningIn: computed('_active', 'willBeActive', function computeLinkToComponentTransitioningIn() {
    if (this.willBeActive === true && !this._active) {
      return 'ember-transitioning-in';
    } else {
      return false;
    }
  }),
  transitioningOut: computed('_active', 'willBeActive', function computeLinkToComponentTransitioningOut() {
    if (this.willBeActive === false && this._active) {
      return 'ember-transitioning-out';
    } else {
      return false;
    }
  }),

  /**
    Event handler that invokes the link, activating the associated route.
       @method _invoke
    @param {Event} event
    @private
  */
  _invoke(event) {
    if (!isSimpleClick(event)) {
      return true;
    }

    let {
      bubbles,
      preventDefault
    } = this;
    let target = this.element.target;
    let isSelf = !target || target === '_self';

    if (preventDefault !== false && isSelf) {
      event.preventDefault();
    }

    if (bubbles === false) {
      event.stopPropagation();
    }

    if (this._isDisabled) {
      return false;
    }

    if (this.loading) {
      // tslint:disable-next-line:max-line-length
      warn('This link is in an inactive loading state because at least one of its models ' + 'currently has a null/undefined value, or the provided route name is invalid.', false, {
        id: 'ember-glimmer.link-to.inactive-loading-state'
      });
      return false;
    }

    if (!isSelf) {
      return false;
    }

    let {
      _route: routeName,
      _models: models,
      _query: queryParams,
      replace: shouldReplace
    } = this;
    let payload = {
      queryParams,
      routeName
    };
    flaggedInstrument('interaction.link-to', payload, this._generateTransition(payload, routeName, models, queryParams, shouldReplace));
    return false;
  },

  _generateTransition(payload, qualifiedRouteName, models, queryParams, shouldReplace) {
    let {
      _routing: routing
    } = this;
    return () => {
      payload.transition = routing.transitionTo(qualifiedRouteName, models, queryParams, shouldReplace);
    };
  },

  /**
    Sets the element's `href` attribute to the url for
    the `LinkComponent`'s targeted route.
       If the `LinkComponent`'s `tagName` is changed to a value other
    than `a`, this property will be ignored.
       @property href
    @private
  */
  href: computed('_currentRouterState', '_route', '_models', '_query', 'tagName', 'loading', 'loadingHref', function computeLinkToComponentHref() {
    if (this.tagName !== 'a') {
      return;
    }

    if (this.loading) {
      return this.loadingHref;
    }

    let {
      _route: route,
      _models: models,
      _query: query,
      _routing: routing
    } = this;

    if (DEBUG) {
      /*
       * Unfortunately, to get decent error messages, we need to do this.
       * In some future state we should be able to use a "feature flag"
       * which allows us to strip this without needing to call it twice.
       *
       * if (isDebugBuild()) {
       *   // Do the useful debug thing, probably including try/catch.
       * } else {
       *   // Do the performant thing.
       * }
       */
      try {
        return routing.generateURL(route, models, query);
      } catch (e) {
        // tslint:disable-next-line:max-line-length
        assert(`You attempted to generate a link for the "${this.route}" route, but did not ` + `pass the models required for generating its dynamic segments. ` + e.message);
      }
    } else {
      return routing.generateURL(route, models, query);
    }
  }),
  loading: computed('_route', '_modelsAreLoaded', 'loadingClass', function computeLinkToComponentLoading() {
    let {
      _route: route,
      _modelsAreLoaded: loaded
    } = this;

    if (!loaded || route === null || route === undefined) {
      return this.loadingClass;
    }
  }),
  _modelsAreLoaded: computed('_models', function computeLinkToComponentModelsAreLoaded() {
    let {
      _models: models
    } = this;

    for (let i = 0; i < models.length; i++) {
      let model = models[i];

      if (model === null || model === undefined) {
        return false;
      }
    }

    return true;
  }),

  /**
    The default href value to use while a link-to is loading.
    Only applies when tagName is 'a'
       @property loadingHref
    @type String
    @default #
    @private
  */
  loadingHref: '#',

  didReceiveAttrs() {
    let {
      disabledWhen
    } = this;

    if (disabledWhen !== undefined) {
      this.set('disabled', disabledWhen);
    }

    let {
      params
    } = this;

    if (!params || params.length === 0) {
      assert('You must provide at least one of the `@route`, `@model`, `@models` or `@query` argument to `<LinkTo>`.', !(this.route === UNDEFINED && this.model === UNDEFINED && this.models === UNDEFINED && this.query === UNDEFINED));
      let {
        _models: models
      } = this;

      if (models.length > 0) {
        let lastModel = models[models.length - 1];

        if (typeof lastModel === 'object' && lastModel !== null && lastModel.isQueryParams) {
          this.query = lastModel.values;
          models.pop();
        }
      }

      return;
    }

    params = params.slice(); // Process the positional arguments, in order.
    // 1. Inline link title comes first, if present.

    if (!this[HAS_BLOCK]) {
      this.set('linkTitle', params.shift());
    } // 2. The last argument is possibly the `query` object.


    let queryParams = params[params.length - 1];

    if (queryParams && queryParams.isQueryParams) {
      this.set('query', params.pop().values);
    } else {
      this.set('query', UNDEFINED);
    } // 3. If there is a `route`, it is now at index 0.


    if (params.length === 0) {
      this.set('route', UNDEFINED);
    } else {
      this.set('route', params.shift());
    } // 4. Any remaining indices (if any) are `models`.


    this.set('model', UNDEFINED);
    this.set('models', params);
  }

});

LinkComponent.toString = () => '@ember/routing/link-component';

LinkComponent.reopenClass({
  positionalParams: 'params'
});

/**
@module @ember/component
*/
const RECOMPUTE_TAG = symbol('RECOMPUTE_TAG');
function isHelperFactory(helper) {
  return typeof helper === 'object' && helper !== null && helper.class && helper.class.isHelperFactory;
}
function isClassHelper(helper) {
  return helper.destroy !== undefined;
}
/**
  Ember Helpers are functions that can compute values, and are used in templates.
  For example, this code calls a helper named `format-currency`:

  ```app/templates/application.hbs
  <Cost @cents={{230}} />
  ```

  ```app/components/cost.hbs
  <div>{{format-currency @cents currency="$"}}</div>
  ```

  Additionally a helper can be called as a nested helper.
  In this example, we show the formatted currency value if the `showMoney`
  named argument is truthy.

  ```handlebars
  {{if @showMoney (format-currency @cents currency="$")}}
  ```

  Helpers defined using a class must provide a `compute` function. For example:

  ```app/helpers/format-currency.js
  import Helper from '@ember/component/helper';

  export default class extends Helper {
    compute([cents], { currency }) {
      return `${currency}${cents * 0.01}`;
    }
  }
  ```

  Each time the input to a helper changes, the `compute` function will be
  called again.

  As instances, these helpers also have access to the container and will accept
  injected dependencies.

  Additionally, class helpers can call `recompute` to force a new computation.

  @class Helper
  @public
  @since 1.13.0
*/

let Helper = FrameworkObject.extend({
  init() {
    this._super(...arguments);

    this[RECOMPUTE_TAG] = createTag();
  },

  /**
    On a class-based helper, it may be useful to force a recomputation of that
    helpers value. This is akin to `rerender` on a component.
       For example, this component will rerender when the `currentUser` on a
    session service changes:
       ```app/helpers/current-user-email.js
    import Helper from '@ember/component/helper'
    import { inject as service } from '@ember/service'
    import { observer } from '@ember/object'
       export default Helper.extend({
      session: service(),
         onNewUser: observer('session.currentUser', function() {
        this.recompute();
      }),
         compute() {
        return this.get('session.currentUser.email');
      }
    });
    ```
       @method recompute
    @public
    @since 1.13.0
  */
  recompute() {
    join(() => dirtyTag(this[RECOMPUTE_TAG]));
  }

});
Helper.isHelperFactory = true;

class Wrapper {
  constructor(compute) {
    this.compute = compute;
    this.isHelperFactory = true;
  }

  create() {
    // needs new instance or will leak containers
    return {
      compute: this.compute
    };
  }

}
/**
  In many cases it is not necessary to use the full `Helper` class.
  The `helper` method create pure-function helpers without instances.
  For example:

  ```app/helpers/format-currency.js
  import { helper } from '@ember/component/helper';

  export default helper(function([cents], {currency}) {
    return `${currency}${cents * 0.01}`;
  });
  ```

  @static
  @param {Function} helper The helper function
  @method helper
  @for @ember/component/helper
  @public
  @since 1.13.0
*/


function helper(helperFn) {
  return new Wrapper(helperFn);
}

/**
@module @ember/template
*/
class SafeString {
  constructor(string) {
    this.string = string;
  }

  toString() {
    return `${this.string}`;
  }

  toHTML() {
    return this.toString();
  }

}
const escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;',
  '=': '&#x3D;'
};
const possible = /[&<>"'`=]/;
const badChars = /[&<>"'`=]/g;

function escapeChar(chr) {
  return escape[chr];
}

function escapeExpression(string) {
  if (typeof string !== 'string') {
    // don't escape SafeStrings, since they're already safe
    if (string && string.toHTML) {
      return string.toHTML();
    } else if (string === null || string === undefined) {
      return '';
    } else if (!string) {
      return String(string);
    } // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.


    string = String(string);
  }

  if (!possible.test(string)) {
    return string;
  }

  return string.replace(badChars, escapeChar);
}
/**
  Mark a string as safe for unescaped output with Ember templates. If you
  return HTML from a helper, use this function to
  ensure Ember's rendering layer does not escape the HTML.

  ```javascript
  import { htmlSafe } from '@ember/template';

  htmlSafe('<div>someString</div>')
  ```

  @method htmlSafe
  @for @ember/template
  @static
  @return {SafeString} A string that will not be HTML escaped by Handlebars.
  @public
*/

function htmlSafe(str) {
  if (str === null || str === undefined) {
    str = '';
  } else if (typeof str !== 'string') {
    str = String(str);
  }

  return new SafeString(str);
}
/**
  Detects if a string was decorated using `htmlSafe`.

  ```javascript
  import { htmlSafe, isHTMLSafe } from '@ember/template';

  var plainString = 'plain string',
      safeString = htmlSafe('<div>someValue</div>');

  isHTMLSafe(plainString); // false
  isHTMLSafe(safeString);  // true
  ```

  @method isHTMLSafe
  @for @ember/template
  @static
  @return {Boolean} `true` if the string was decorated with `htmlSafe`, `false` otherwise.
  @public
*/

function isHTMLSafe(str) {
  return str !== null && typeof str === 'object' && typeof str.toHTML === 'function';
}

function isStaticComponentManager(_manager, capabilities) {
  return !capabilities.dynamicLayout;
}

class CompileTimeResolver {
  constructor(resolver) {
    this.resolver = resolver;
  }

  lookupHelper(name, referrer) {
    return this.resolver.lookupHelper(name, referrer);
  }

  lookupModifier(name, referrer) {
    return this.resolver.lookupModifier(name, referrer);
  }

  lookupComponent(name, referrer) {
    let definitionHandle = this.resolver.lookupComponentHandle(name, referrer);

    if (definitionHandle === null) {
      return null;
    }

    const {
      manager,
      state
    } = this.resolver.resolve(definitionHandle);
    const capabilities = manager.getCapabilities(state);

    if (!isStaticComponentManager(manager, capabilities)) {
      return {
        handle: definitionHandle,
        capabilities,
        compilable: null
      };
    }

    return {
      handle: definitionHandle,
      capabilities,
      compilable: manager.getJitStaticLayout(state, this.resolver)
    };
  }

  lookupPartial(name, referrer) {
    return this.resolver.lookupPartial(name, referrer);
  }

  resolve(handle) {
    return this.resolver.resolve(handle);
  }

}

// implements the ComponentManager interface as defined in glimmer:
// tslint:disable-next-line:max-line-length
// https://github.com/glimmerjs/glimmer-vm/blob/v0.24.0-beta.4/packages/%40glimmer/runtime/lib/component/interfaces.ts#L21
class AbstractManager {
  prepareArgs(_state, _args) {
    return null;
  }

  didCreateElement(_component, _element, _operations) {// noop
  }

  didRenderLayout(_component, _bounds) {// noop
  }

  didCreate(_bucket) {// noop
  }

  update(_bucket, _dynamicScope) {// noop
  }

  didUpdateLayout(_bucket, _bounds) {// noop
  }

  didUpdate(_bucket) {// noop
  }

}

function instrumentationPayload(def) {
  return {
    object: `${def.name}:${def.outlet}`
  };
}

const CAPABILITIES = {
  dynamicLayout: false,
  dynamicTag: false,
  prepareArgs: false,
  createArgs: ENV._DEBUG_RENDER_TREE,
  attributeHook: false,
  elementHook: false,
  createCaller: false,
  dynamicScope: true,
  updateHook: ENV._DEBUG_RENDER_TREE,
  createInstance: true,
  wrapped: false,
  willDestroy: false
};

class OutletComponentManager extends AbstractManager {
  create(environment, definition, args, dynamicScope) {
    let parentStateRef = dynamicScope.outletState;
    let currentStateRef = definition.ref;
    dynamicScope.outletState = currentStateRef;
    let state = {
      self: new ComponentRootReference(definition.controller, environment),
      environment,
      finalize: _instrumentStart('render.outlet', instrumentationPayload, definition)
    };

    if (ENV._DEBUG_RENDER_TREE) {
      state.outlet = {
        name: definition.outlet
      };
      environment.extra.debugRenderTree.create(state.outlet, {
        type: 'outlet',
        name: state.outlet.name,
        args: EMPTY_ARGS,
        instance: undefined,
        template: undefined
      });
      let parentState = parentStateRef.value();
      let parentOwner = parentState && parentState.render && parentState.render.owner;
      let currentOwner = currentStateRef.value().render.owner;

      if (parentOwner && parentOwner !== currentOwner) {
        let engine = currentOwner;
        assert('invalid engine: missing mountPoint', typeof currentOwner.mountPoint === 'string');
        assert('invalid engine: missing routable', currentOwner.routable === true);
        let mountPoint = engine.mountPoint;
        state.engine = {
          mountPoint
        };
        environment.extra.debugRenderTree.create(state.engine, {
          type: 'engine',
          name: mountPoint,
          args: EMPTY_ARGS,
          instance: engine,
          template: undefined
        });
      }

      environment.extra.debugRenderTree.create(state, {
        type: 'route-template',
        name: definition.name,
        args: args.capture(),
        instance: definition.controller,
        template: definition.template
      });
      registerDestructor(state, () => {
        state.environment.extra.debugRenderTree.willDestroy(state);

        if (state.engine) {
          state.environment.extra.debugRenderTree.willDestroy(state.engine);
        }

        state.environment.extra.debugRenderTree.willDestroy(state.outlet);
      });
    }

    return state;
  }

  getJitStaticLayout({
    template
  }, _resolver) {
    // The router has already resolved the template
    return unwrapTemplate(template).asLayout();
  }

  getCapabilities() {
    return CAPABILITIES;
  }

  getSelf({
    self
  }) {
    return self;
  }

  getTag() {
    if (ENV._DEBUG_RENDER_TREE) {
      // returning a const tag skips the update hook (VM BUG?)
      return createTag();
    } else {
      // an outlet has no hooks
      return CONSTANT_TAG;
    }
  }

  didRenderLayout(state, bounds) {
    state.finalize();

    if (ENV._DEBUG_RENDER_TREE) {
      state.environment.extra.debugRenderTree.didRender(state, bounds);

      if (state.engine) {
        state.environment.extra.debugRenderTree.didRender(state.engine, bounds);
      }

      state.environment.extra.debugRenderTree.didRender(state.outlet, bounds);
    }
  }

  update(state) {
    if (ENV._DEBUG_RENDER_TREE) {
      state.environment.extra.debugRenderTree.update(state.outlet);

      if (state.engine) {
        state.environment.extra.debugRenderTree.update(state.engine);
      }

      state.environment.extra.debugRenderTree.update(state);
    }
  }

  didUpdateLayout(state, bounds) {
    if (ENV._DEBUG_RENDER_TREE) {
      state.environment.extra.debugRenderTree.didRender(state, bounds);

      if (state.engine) {
        state.environment.extra.debugRenderTree.didRender(state.engine, bounds);
      }

      state.environment.extra.debugRenderTree.didRender(state.outlet, bounds);
    }
  }

  getDestroyable(state) {
    if (ENV._DEBUG_RENDER_TREE) {
      return state;
    } else {
      return null;
    }
  }

}

const OUTLET_MANAGER = new OutletComponentManager();
class OutletComponentDefinition {
  constructor(state, manager = OUTLET_MANAGER) {
    this.state = state;
    this.manager = manager;
  }

}
function createRootOutlet(outletView) {
  if (ENV._APPLICATION_TEMPLATE_WRAPPER) {
    const WRAPPED_CAPABILITIES = assign({}, CAPABILITIES, {
      dynamicTag: true,
      elementHook: true,
      wrapped: true
    });
    const WrappedOutletComponentManager = class extends OutletComponentManager {
      getTagName(_component) {
        return 'div';
      }

      getJitStaticLayout({
        template
      }) {
        // The router has already resolved the template
        return unwrapTemplate(template).asWrappedLayout();
      }

      getCapabilities() {
        return WRAPPED_CAPABILITIES;
      }

      didCreateElement(component, element, _operations) {
        // to add GUID id and class
        element.setAttribute('class', 'ember-view');
        element.setAttribute('id', guidFor(component));
      }

    };
    const WRAPPED_OUTLET_MANAGER = new WrappedOutletComponentManager();
    return new OutletComponentDefinition(outletView.state, WRAPPED_OUTLET_MANAGER);
  } else {
    return new OutletComponentDefinition(outletView.state);
  }
}

function NOOP() {}
/**
  @module ember
*/

/**
  Represents the internal state of the component.

  @class ComponentStateBucket
  @private
*/


class ComponentStateBucket {
  constructor(environment, component, args, finalizer, hasWrappedElement) {
    this.environment = environment;
    this.component = component;
    this.args = args;
    this.finalizer = finalizer;
    this.hasWrappedElement = hasWrappedElement;
    this.classRef = null;
    this.classRef = null;
    this.argsRevision = args === null ? 0 : valueForTag(args.tag);
    this.rootRef = new ComponentRootReference(component, environment);
    registerDestructor(this, () => this.willDestroy(), true);
    registerDestructor(this, () => this.component.destroy());
  }

  willDestroy() {
    let {
      component,
      environment
    } = this;

    if (environment.isInteractive) {
      component.trigger('willDestroyElement');
      component.trigger('willClearRender');
      let element = getViewElement(component);

      if (element) {
        clearElementView(element);
        clearViewElement(component);
      }
    }

    component.renderer.unregister(component);
  }

  finalize() {
    let {
      finalizer
    } = this;
    finalizer();
    this.finalizer = NOOP;
  }

}

class EmberHelperRootReference extends RootReference {
  constructor(helper$$1, args, env) {
    super(env);
    this.args = args;
    this.computeRevision = null;
    this.computeTag = null;

    this.fn = args => {
      let {
        positional,
        named
      } = args;
      let positionalValue = positional.value();
      let namedValue = named.value();
      let ret;

      if (DEBUG) {
        debugFreeze(positionalValue);
        debugFreeze(namedValue);
        deprecateMutationsInAutotrackingTransaction(() => {
          ret = helper$$1.compute(positionalValue, namedValue);
        });
      } else {
        ret = helper$$1.compute(positionalValue, namedValue);
      }

      if (helper$$1[RECOMPUTE_TAG]) {
        consumeTag(helper$$1[RECOMPUTE_TAG]);
      }

      return ret;
    };

    if (DEBUG) {
      let name = isClassHelper(helper$$1) ? getDebugName(helper$$1) : getDebugName(helper$$1.compute);
      env.setTemplatePathDebugContext(this, `(result of a \`${name}\` helper)`, null);
      this.didSetupDebugContext = true;
    }

    let valueTag = this.valueTag = createUpdatableTag();
    this.tag = combine([args.tag, valueTag]);
  }

  compute() {
    this.computeTag = track(() => {
      this.computeValue = this.fn(this.args);
    }, DEBUG && this.env.getTemplatePathDebugContext(this));
  }

  value() {
    let {
      tag,
      computeRevision
    } = this;

    if (computeRevision === null || !validateTag(tag, computeRevision)) {
      this.compute();
      updateTag(this.valueTag, this.computeTag);
      this.computeRevision = valueForTag(tag);
    }

    return this.computeValue;
  }

}
class UnboundRootReference extends RootReference {
  constructor(inner, env, parent, key) {
    super(env);
    this.inner = inner;
    this.env = env;

    if (DEBUG) {
      env.setTemplatePathDebugContext(this, key || 'this', parent || null);
    }
  }

  value() {
    return this.inner;
  }

  get(key) {
    let value = this.value();

    if (isObject(value)) {
      // root of interop with ember objects
      return new UnboundPropertyReference(value[key], this.env, this, key);
    } else {
      return PrimitiveReference.create(value);
    }
  }

}
class UnboundPropertyReference extends UnboundRootReference {}
function referenceFromParts(root, parts) {
  let reference = root;

  for (let i = 0; i < parts.length; i++) {
    reference = reference.get(parts[i]);
  }

  return reference;
}

function referenceForKey(rootRef, key) {
  return rootRef.get(key);
}

function referenceForParts(rootRef, parts) {
  let isAttrs = parts[0] === 'attrs'; // TODO deprecate this

  if (isAttrs) {
    parts.shift();

    if (parts.length === 1) {
      return referenceForKey(rootRef, parts[0]);
    }
  }

  return referenceFromParts(rootRef, parts);
}

const AttributeBinding = {
  parse(microsyntax) {
    let colonIndex = microsyntax.indexOf(':');

    if (colonIndex === -1) {
      assert('You cannot use class as an attributeBinding, use classNameBindings instead.', microsyntax !== 'class');
      return [microsyntax, microsyntax, true];
    } else {
      let prop = microsyntax.substring(0, colonIndex);
      let attribute = microsyntax.substring(colonIndex + 1);
      assert('You cannot use class as an attributeBinding, use classNameBindings instead.', attribute !== 'class');
      return [prop, attribute, false];
    }
  },

  install(component, rootRef, parsed, operations, env) {
    let [prop, attribute, isSimple] = parsed;

    if (attribute === 'id') {
      let elementId = get(component, prop);

      if (elementId === undefined || elementId === null) {
        elementId = component.elementId;
      }

      elementId = PrimitiveReference.create(elementId);
      operations.setAttribute('id', elementId, true, null); // operations.addStaticAttribute(element, 'id', elementId);

      return;
    }

    let isPath = prop.indexOf('.') > -1;
    let reference = isPath ? referenceForParts(rootRef, prop.split('.')) : referenceForKey(rootRef, prop);
    assert(`Illegal attributeBinding: '${prop}' is not a valid attribute name.`, !(isSimple && isPath));

    if (EMBER_COMPONENT_IS_VISIBLE && attribute === 'style' && StyleBindingReference !== undefined) {
      reference = new StyleBindingReference(rootRef, reference, referenceForKey(rootRef, 'isVisible'), env);
    }

    operations.setAttribute(attribute, reference, false, null); // operations.addDynamicAttribute(element, attribute, reference, false);
  }

};
const DISPLAY_NONE = 'display: none;';
const SAFE_DISPLAY_NONE = htmlSafe(DISPLAY_NONE);
let StyleBindingReference;
let installIsVisibleBinding;

if (EMBER_COMPONENT_IS_VISIBLE) {
  StyleBindingReference = class {
    constructor(parent, inner, isVisible, env) {
      this.inner = inner;
      this.isVisible = isVisible;
      this.env = env;
      this.tag = combine([inner.tag, isVisible.tag]);

      if (DEBUG) {
        env.setTemplatePathDebugContext(this, 'style', parent);
      }
    }

    value() {
      let value = this.inner.value();
      let isVisible = this.isVisible.value();

      if (isVisible !== undefined) {
        deprecate(`The \`isVisible\` property on classic component classes is deprecated. Was accessed ${this.env.getTemplatePathDebugContext(this).replace(/^W/, 'w')}`, false, {
          id: 'ember-component.is-visible',
          until: '4.0.0',
          url: 'https://deprecations.emberjs.com/v3.x#toc_ember-component-is-visible'
        });
      }

      if (isVisible !== false) {
        return value;
      } else if (!value) {
        return SAFE_DISPLAY_NONE;
      } else {
        let style = value + ' ' + DISPLAY_NONE;
        return isHTMLSafe(value) ? htmlSafe(style) : style;
      }
    }

    get() {
      return UNDEFINED_REFERENCE;
    }

  };

  installIsVisibleBinding = (rootRef, operations, environment) => {
    operations.setAttribute('style', new StyleBindingReference(rootRef, UNDEFINED_REFERENCE, rootRef.get('isVisible'), environment), false, null);
  };
}

const ClassNameBinding = {
  install(_element, rootRef, microsyntax, operations) {
    let [prop, truthy, falsy] = microsyntax.split(':');
    let isStatic = prop === '';

    if (isStatic) {
      operations.setAttribute('class', PrimitiveReference.create(truthy), true, null);
    } else {
      let isPath = prop.indexOf('.') > -1;
      let parts = isPath ? prop.split('.') : [];
      let value = isPath ? referenceForParts(rootRef, parts) : referenceForKey(rootRef, prop);
      let ref;

      if (truthy === undefined) {
        ref = new SimpleClassNameBindingReference(value, isPath ? parts[parts.length - 1] : prop);
      } else {
        ref = new ColonClassNameBindingReference(value, truthy, falsy);
      }

      operations.setAttribute('class', ref, false, null);
    }
  }

};
class SimpleClassNameBindingReference {
  constructor(inner, path) {
    this.inner = inner;
    this.path = path;
    this.tag = inner.tag;
    this.dasherizedPath = null;
  }

  value() {
    let value = this.inner.value();

    if (value === true) {
      let {
        path,
        dasherizedPath
      } = this;
      return dasherizedPath || (this.dasherizedPath = dasherize(path));
    } else if (value || value === 0) {
      return String(value);
    } else {
      return null;
    }
  }

}

class ColonClassNameBindingReference {
  constructor(inner, truthy = null, falsy = null) {
    this.inner = inner;
    this.truthy = truthy;
    this.falsy = falsy;
    this.tag = inner.tag;
  }

  value() {
    let {
      inner,
      truthy,
      falsy
    } = this;
    return inner.value() ? truthy : falsy;
  }

}

/**
@module ember
*/
/**
  The `mut` helper lets you __clearly specify__ that a child `Component` can update the
  (mutable) value passed to it, which will __change the value of the parent component__.

  To specify that a parameter is mutable, when invoking the child `Component`:

  ```handlebars
  <MyChild @childClickCount={{fn (mut totalClicks)}} />
  ```

   or

  ```handlebars
  {{my-child childClickCount=(mut totalClicks)}}
  ```

  The child `Component` can then modify the parent's value just by modifying its own
  property:

  ```javascript
  // my-child.js
  export default Component.extend({
    click() {
      this.incrementProperty('childClickCount');
    }
  });
  ```

  Note that for curly components (`{{my-component}}`) the bindings are already mutable,
  making the `mut` unnecessary.

  Additionally, the `mut` helper can be combined with the `fn` helper to
  mutate a value. For example:

  ```handlebars
  <MyChild @childClickCount={{this.totalClicks}} @click-count-change={{fn (mut totalClicks))}} />
  ```

  or

  ```handlebars
  {{my-child childClickCount=totalClicks click-count-change=(fn (mut totalClicks))}}
  ```

  The child `Component` would invoke the function with the new click value:

  ```javascript
  // my-child.js
  export default Component.extend({
    click() {
      this.get('click-count-change')(this.get('childClickCount') + 1);
    }
  });
  ```

  The `mut` helper changes the `totalClicks` value to what was provided as the `fn` argument.

  The `mut` helper, when used with `fn`, will return a function that
  sets the value passed to `mut` to its first argument. As an example, we can create a
  button that increments a value passing the value directly to the `fn`:

  ```handlebars
  {{! inc helper is not provided by Ember }}
  <button onclick={{fn (mut count) (inc count)}}>
    Increment count
  </button>
  ```

  @method mut
  @param {Object} [attr] the "two-way" attribute that can be modified.
  @for Ember.Templates.helpers
  @public
*/

const INVOKE = symbol('INVOKE');
const SOURCE = symbol('SOURCE');

class MutReference extends RootReference {
  constructor(inner, env) {
    super(env);
    this.inner = inner;
    this.tag = inner.tag;
    this[SOURCE] = inner;
  }

  value() {
    return this.inner.value();
  }

  get(key) {
    return this.inner.get(key);
  }

  [UPDATE_REFERENCED_VALUE](value) {
    return this.inner[UPDATE_REFERENCED_VALUE](value);
  }

  [INVOKE](value) {
    return this.inner[UPDATE_REFERENCED_VALUE](value);
  }

}

function unMut(ref) {
  return ref[SOURCE] || ref;
}
function mut (args, vm) {
  let rawRef = args.positional.at(0);

  if (typeof rawRef[INVOKE] === 'function') {
    return rawRef;
  } // TODO: Improve this error message. This covers at least two distinct
  // cases:
  //
  // 1. (mut "not a path") – passing a literal, result from a helper
  //    invocation, etc
  //
  // 2. (mut receivedValue) – passing a value received from the caller
  //    that was originally derived from a literal, result from a helper
  //    invocation, etc
  //
  // This message is alright for the first case, but could be quite
  // confusing for the second case.


  assert('You can only pass a path to mut', rawRef[UPDATE_REFERENCED_VALUE] !== undefined);
  return new MutReference(rawRef, vm.env);
}

/**
@module ember
*/
const ACTION = symbol('ACTION');
/**
  The `{{action}}` helper provides a way to pass triggers for behavior (usually
  just a function) between components, and into components from controllers.

  ### Passing functions with the action helper

  There are three contexts an action helper can be used in. The first two
  contexts to discuss are attribute context, and Handlebars value context.

  ```handlebars
  {{! An example of attribute context }}
  <div onclick={{action "save"}}></div>
  {{! Examples of Handlebars value context }}
  {{input on-input=(action "save")}}
  {{yield (action "refreshData") andAnotherParam}}
  ```

  In these contexts,
  the helper is called a "closure action" helper. Its behavior is simple:
  If passed a function name, read that function off the `actions` property
  of the current context. Once that function is read, or immediately if a function was
  passed, create a closure over that function and any arguments.
  The resulting value of an action helper used this way is simply a function.

  For example, in the attribute context:

  ```handlebars
  {{! An example of attribute context }}
  <div onclick={{action "save"}}></div>
  ```

  The resulting template render logic would be:

  ```js
  var div = document.createElement('div');
  var actionFunction = (function(context){
    return function() {
      return context.actions.save.apply(context, arguments);
    };
  })(context);
  div.onclick = actionFunction;
  ```

  Thus when the div is clicked, the action on that context is called.
  Because the `actionFunction` is just a function, closure actions can be
  passed between components and still execute in the correct context.

  Here is an example action handler on a component:

  ```app/components/my-component.js
  import Component from '@glimmer/component';
  import { action } from '@ember/object';

  export default class extends Component {
    @action
    save() {
      this.model.save();
    }
  }
  ```

  Actions are always looked up on the `actions` property of the current context.
  This avoids collisions in the naming of common actions, such as `destroy`.
  Two options can be passed to the `action` helper when it is used in this way.

  * `target=someProperty` will look to `someProperty` instead of the current
    context for the `actions` hash. This can be useful when targeting a
    service for actions.
  * `value="target.value"` will read the path `target.value` off the first
    argument to the action when it is called and rewrite the first argument
    to be that value. This is useful when attaching actions to event listeners.

  ### Invoking an action

  Closure actions curry both their scope and any arguments. When invoked, any
  additional arguments are added to the already curried list.
  Actions should be invoked using the [sendAction](/ember/release/classes/Component/methods/sendAction?anchor=sendAction)
  method. The first argument to `sendAction` is the action to be called, and
  additional arguments are passed to the action function. This has interesting
  properties combined with currying of arguments. For example:

  ```app/components/update-name.js
  import Component from '@glimmer/component';
  import { action } from '@ember/object';

  export default class extends Component {
    @action
    setName(model, name) {
      model.set('name', name);
    }
  }
  ```

  ```app/components/update-name.hbs
  {{input on-input=(action (action 'setName' @model) value="target.value")}}
  ```

  The first argument (`@model`) was curried over, and the run-time argument (`event`)
  becomes a second argument. Action calls can be nested this way because each simply
  returns a function. Any function can be passed to the `{{action}}` helper, including
  other actions.

  Actions invoked with `sendAction` have the same currying behavior as demonstrated
  with `on-input` above. For example:

  ```app/components/my-input.js
  import Component from '@glimmer/component';
  import { action } from '@ember/object';

  export default class extends Component {
    @action
    setName(model, name) {
      model.set('name', name);
    }
  }
  ```

  ```handlebars
  <MyInput @submit={{action 'setName' @model}} />
  ```

  or

  ```handlebars
  {{my-input submit=(action 'setName' @model)}}
  ```

  ```app/components/my-component.js
  import Component from '@ember/component';

  export default Component.extend({
    click() {
      // Note that model is not passed, it was curried in the template
      this.sendAction('submit', 'bob');
    }
  });
  ```

  ### Attaching actions to DOM elements

  The third context of the `{{action}}` helper can be called "element space".
  For example:

  ```handlebars
  {{! An example of element space }}
  <div {{action "save"}}></div>
  ```

  Used this way, the `{{action}}` helper provides a useful shortcut for
  registering an HTML element in a template for a single DOM event and
  forwarding that interaction to the template's context (controller or component).
  If the context of a template is a controller, actions used this way will
  bubble to routes when the controller does not implement the specified action.
  Once an action hits a route, it will bubble through the route hierarchy.

  ### Event Propagation

  `{{action}}` helpers called in element space can control event bubbling. Note
  that the closure style actions cannot.

  Events triggered through the action helper will automatically have
  `.preventDefault()` called on them. You do not need to do so in your event
  handlers. If you need to allow event propagation (to handle file inputs for
  example) you can supply the `preventDefault=false` option to the `{{action}}` helper:

  ```handlebars
  <div {{action "sayHello" preventDefault=false}}>
    <input type="file" />
    <input type="checkbox" />
  </div>
  ```

  To disable bubbling, pass `bubbles=false` to the helper:

  ```handlebars
  <button {{action 'edit' post bubbles=false}}>Edit</button>
  ```

  To disable bubbling with closure style actions you must create your own
  wrapper helper that makes use of `event.stopPropagation()`:

  ```handlebars
  <div onclick={{disable-bubbling (action "sayHello")}}>Hello</div>
  ```

  ```app/helpers/disable-bubbling.js
  import { helper } from '@ember/component/helper';

  export function disableBubbling([action]) {
    return function(event) {
      event.stopPropagation();
      return action(event);
    };
  }
  export default helper(disableBubbling);
  ```

  If you need the default handler to trigger you should either register your
  own event handler, or use event methods on your view class. See
  ["Responding to Browser Events"](/ember/release/classes/Component)
  in the documentation for `Component` for more information.

  ### Specifying DOM event type

  `{{action}}` helpers called in element space can specify an event type.
  By default the `{{action}}` helper registers for DOM `click` events. You can
  supply an `on` option to the helper to specify a different DOM event name:

  ```handlebars
  <div {{action "anActionName" on="doubleClick"}}>
    click me
  </div>
  ```

  See ["Event Names"](/ember/release/classes/Component) for a list of
  acceptable DOM event names.

  ### Specifying whitelisted modifier keys

  `{{action}}` helpers called in element space can specify modifier keys.
  By default the `{{action}}` helper will ignore click events with pressed modifier
  keys. You can supply an `allowedKeys` option to specify which keys should not be ignored.

  ```handlebars
  <div {{action "anActionName" allowedKeys="alt"}}>
    click me
  </div>
  ```

  This way the action will fire when clicking with the alt key pressed down.
  Alternatively, supply "any" to the `allowedKeys` option to accept any combination of modifier keys.

  ```handlebars
  <div {{action "anActionName" allowedKeys="any"}}>
    click me with any key pressed
  </div>
  ```

  ### Specifying a Target

  A `target` option can be provided to the helper to change
  which object will receive the method call. This option must be a path
  to an object, accessible in the current context:

  ```app/templates/application.hbs
  <div {{action "anActionName" target=someService}}>
    click me
  </div>
  ```

  ```app/controllers/application.js
  import Controller from '@ember/controller';
  import { inject as service } from '@ember/service';

  export default class extends Controller {
    @service someService;
  }
  ```

  @method action
  @for Ember.Templates.helpers
  @public
*/

function action (args, vm) {
  let {
    named,
    positional
  } = args;
  let capturedArgs = positional.capture(); // The first two argument slots are reserved.
  // pos[0] is the context (or `this`)
  // pos[1] is the action name or function
  // Anything else is an action argument.

  let [context, action, ...restArgs] = capturedArgs.references; // TODO: Is there a better way of doing this?

  let debugKey = action.propertyKey;
  let target = named.has('target') ? named.get('target') : context;
  let processArgs = makeArgsProcessor(named.has('value') && named.get('value'), restArgs);
  let fn;

  if (typeof action[INVOKE] === 'function') {
    fn = makeClosureAction(action, action, action[INVOKE], processArgs, debugKey);
  } else if (isConstTagged(target) && isConstTagged(action)) {
    fn = makeClosureAction(context.value(), target.value(), action.value(), processArgs, debugKey);
  } else {
    fn = makeDynamicClosureAction(context.value(), target, action, processArgs, debugKey);
  }

  fn[ACTION] = true;
  return new UnboundRootReference(fn, vm.env);
}

function NOOP$1(args) {
  return args;
}

function makeArgsProcessor(valuePathRef, actionArgsRef) {
  let mergeArgs;

  if (actionArgsRef.length > 0) {
    mergeArgs = args => {
      return actionArgsRef.map(ref => ref.value()).concat(args);
    };
  }

  let readValue;

  if (valuePathRef) {
    readValue = args => {
      let valuePath = valuePathRef.value();

      if (valuePath && args.length > 0) {
        args[0] = get(args[0], valuePath);
      }

      return args;
    };
  }

  if (mergeArgs && readValue) {
    return args => {
      return readValue(mergeArgs(args));
    };
  } else {
    return mergeArgs || readValue || NOOP$1;
  }
}

function makeDynamicClosureAction(context, targetRef, actionRef, processArgs, debugKey) {
  // We don't allow undefined/null values, so this creates a throw-away action to trigger the assertions
  if (DEBUG) {
    makeClosureAction(context, targetRef.value(), actionRef.value(), processArgs, debugKey);
  }

  return (...args) => {
    return makeClosureAction(context, targetRef.value(), actionRef.value(), processArgs, debugKey)(...args);
  };
}

function makeClosureAction(context, target, action, processArgs, debugKey) {
  let self;
  let fn;
  assert(`Action passed is null or undefined in (action) from ${target}.`, action !== undefined && action !== null);

  if (typeof action[INVOKE] === 'function') {
    self = action;
    fn = action[INVOKE];
  } else {
    let typeofAction = typeof action;

    if (typeofAction === 'string') {
      self = target;
      fn = target.actions && target.actions[action];
      assert(`An action named '${action}' was not found in ${target}`, fn);
    } else if (typeofAction === 'function') {
      self = context;
      fn = action;
    } else {
      // tslint:disable-next-line:max-line-length
      assert(`An action could not be made for \`${debugKey || action}\` in ${target}. Please confirm that you are using either a quoted action name (i.e. \`(action '${debugKey || 'myAction'}')\`) or a function available in ${target}.`, false);
    }
  }

  return (...args) => {
    let payload = {
      target: self,
      args,
      label: '@glimmer/closure-action'
    };
    return flaggedInstrument('interaction.ember-action', payload, () => {
      return join(self, fn, ...processArgs(args));
    });
  };
}

// inputs needed by CurlyComponents (attrs and props, with mutable
// cells, etc).

function processComponentArgs(namedArgs) {
  let keys = namedArgs.names;
  let attrs = namedArgs.value();
  let props = Object.create(null);
  let args = Object.create(null);
  props[ARGS] = args;

  for (let i = 0; i < keys.length; i++) {
    let name = keys[i];
    let ref = namedArgs.get(name);
    let value = attrs[name];

    if (typeof value === 'function' && value[ACTION]) {
      attrs[name] = value;
    } else if (ref[UPDATE_REFERENCED_VALUE]) {
      attrs[name] = new MutableCell(ref, value);
    }

    args[name] = ref;
    props[name] = value;
  }

  props.attrs = attrs;
  return props;
}
const REF = symbol('REF');

class MutableCell {
  constructor(ref, value) {
    this[MUTABLE_CELL] = true;
    this[REF] = ref;
    this.value = value;
  }

  update(val) {
    this[REF][UPDATE_REFERENCED_VALUE](val);
  }

}

var __rest = undefined && undefined.__rest || function (s, e) {
  var t = {};

  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];

  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};

function aliasIdToElementId(args, props) {
  if (args.named.has('id')) {
    // tslint:disable-next-line:max-line-length
    assert(`You cannot invoke a component with both 'id' and 'elementId' at the same time.`, !args.named.has('elementId'));
    props.elementId = props.id;
  }
} // We must traverse the attributeBindings in reverse keeping track of
// what has already been applied. This is essentially refining the concatenated
// properties applying right to left.


function applyAttributeBindings(attributeBindings, component, rootRef, operations, environment) {
  let seen = [];
  let i = attributeBindings.length - 1;

  while (i !== -1) {
    let binding = attributeBindings[i];
    let parsed = AttributeBinding.parse(binding);
    let attribute = parsed[1];

    if (seen.indexOf(attribute) === -1) {
      seen.push(attribute);
      AttributeBinding.install(component, rootRef, parsed, operations, environment);
    }

    i--;
  }

  if (seen.indexOf('id') === -1) {
    let id$$1 = component.elementId ? component.elementId : guidFor(component);
    operations.setAttribute('id', PrimitiveReference.create(id$$1), false, null);
  }

  if (EMBER_COMPONENT_IS_VISIBLE && installIsVisibleBinding !== undefined && seen.indexOf('style') === -1) {
    installIsVisibleBinding(rootRef, operations, environment);
  }
}

const DEFAULT_LAYOUT = privatize`template:components/-default`;
const EMPTY_POSITIONAL_ARGS = [];
debugFreeze(EMPTY_POSITIONAL_ARGS);
class CurlyComponentManager extends AbstractManager {
  templateFor(component) {
    let {
      layout,
      layoutName
    } = component;
    let owner = getOwner(component);
    let factory;

    if (layout === undefined) {
      if (layoutName !== undefined) {
        let _factory = owner.lookup(`template:${layoutName}`);

        assert(`Layout \`${layoutName}\` not found!`, _factory !== undefined);
        factory = _factory;
      } else {
        factory = owner.lookup(DEFAULT_LAYOUT);
      }
    } else if (isTemplateFactory(layout)) {
      factory = layout;
    } else {
      // we were provided an instance already
      return layout;
    }

    return factory(owner);
  }

  getJitStaticLayout(state, _resolver) {
    return unwrapTemplate(state.template).asLayout();
  }

  getJitDynamicLayout(bucket) {
    let component = bucket.component;
    let template$$1 = this.templateFor(component);

    if (ENV._DEBUG_RENDER_TREE) {
      bucket.environment.extra.debugRenderTree.setTemplate(bucket, template$$1);
    }

    return template$$1;
  }

  getTagName(state) {
    let {
      component,
      hasWrappedElement
    } = state;

    if (!hasWrappedElement) {
      return null;
    }

    return component && component.tagName || 'div';
  }

  getCapabilities(state) {
    return state.capabilities;
  }

  prepareArgs(state, args) {
    if (args.named.has('__ARGS__')) {
      let _a = args.named.capture().map,
          {
        __ARGS__
      } = _a,
          rest = __rest(_a, ["__ARGS__"]);

      let prepared = {
        positional: EMPTY_POSITIONAL_ARGS,
        named: Object.assign({}, rest, __ARGS__.value())
      };
      return prepared;
    }

    const {
      positionalParams
    } = state.ComponentClass.class; // early exits

    if (positionalParams === undefined || positionalParams === null || args.positional.length === 0) {
      return null;
    }

    let named;

    if (typeof positionalParams === 'string') {
      assert(`You cannot specify positional parameters and the hash argument \`${positionalParams}\`.`, !args.named.has(positionalParams));
      named = {
        [positionalParams]: args.positional.capture()
      };
      assign(named, args.named.capture().map);
    } else if (Array.isArray(positionalParams) && positionalParams.length > 0) {
      const count = Math.min(positionalParams.length, args.positional.length);
      named = {};
      assign(named, args.named.capture().map);

      for (let i = 0; i < count; i++) {
        const name = positionalParams[i];
        assert(`You cannot specify both a positional param (at position ${i}) and the hash argument \`${name}\`.`, !args.named.has(name));
        named[name] = args.positional.at(i);
      }
    } else {
      return null;
    }

    return {
      positional: EMPTY_ARRAY,
      named
    };
  }
  /*
   * This hook is responsible for actually instantiating the component instance.
   * It also is where we perform additional bookkeeping to support legacy
   * features like exposed by view mixins like ChildViewSupport, ActionSupport,
   * etc.
   */


  create(environment, state, args, dynamicScope, callerSelfRef, hasBlock) {
    // Get the nearest concrete component instance from the scope. "Virtual"
    // components will be skipped.
    let parentView = dynamicScope.view; // Get the Ember.Component subclass to instantiate for this component.

    let factory = state.ComponentClass; // Capture the arguments, which tells Glimmer to give us our own, stable
    // copy of the Arguments object that is safe to hold on to between renders.

    let capturedArgs = args.named.capture();
    let props = processComponentArgs(capturedArgs); // Alias `id` argument to `elementId` property on the component instance.

    aliasIdToElementId(args, props); // Set component instance's parentView property to point to nearest concrete
    // component.

    props.parentView = parentView; // Set whether this component was invoked with a block
    // (`{{#my-component}}{{/my-component}}`) or without one
    // (`{{my-component}}`).

    props[HAS_BLOCK] = hasBlock; // Save the current `this` context of the template as the component's
    // `_target`, so bubbled actions are routed to the right place.

    props._target = callerSelfRef.value(); // static layout asserts CurriedDefinition

    if (state.template) {
      props.layout = state.template;
    } // caller:
    // <FaIcon @name="bug" />
    //
    // callee:
    // <i class="fa-{{@name}}"></i>
    // Now that we've built up all of the properties to set on the component instance,
    // actually create it.


    let component = factory.create(props);

    let finalizer = _instrumentStart('render.component', initialRenderInstrumentDetails, component); // We become the new parentView for downstream components, so save our
    // component off on the dynamic scope.


    dynamicScope.view = component; // Unless we're the root component, we need to add ourselves to our parent
    // component's childViews array.

    if (parentView !== null && parentView !== undefined) {
      addChildView(parentView, component);
    }

    component.trigger('didReceiveAttrs');
    let hasWrappedElement = component.tagName !== ''; // We usually do this in the `didCreateElement`, but that hook doesn't fire for tagless components

    if (!hasWrappedElement) {
      if (environment.isInteractive) {
        component.trigger('willRender');
      }

      component._transitionTo('hasElement');

      if (environment.isInteractive) {
        component.trigger('willInsertElement');
      }
    } // Track additional lifecycle metadata about this component in a state bucket.
    // Essentially we're saving off all the state we'll need in the future.


    let bucket = new ComponentStateBucket(environment, component, capturedArgs, finalizer, hasWrappedElement);

    if (args.named.has('class')) {
      bucket.classRef = args.named.get('class');
    }

    if (DEBUG) {
      processComponentInitializationAssertions(component, props);
    }

    if (environment.isInteractive && hasWrappedElement) {
      component.trigger('willRender');
    }

    if (ENV._DEBUG_RENDER_TREE) {
      environment.extra.debugRenderTree.create(bucket, {
        type: 'component',
        name: state.name,
        args: args.capture(),
        instance: component,
        template: state.template
      });
      registerDestructor(bucket, () => {
        environment.extra.debugRenderTree.willDestroy(bucket);
      });
    }

    return bucket;
  }

  getSelf({
    rootRef
  }) {
    return rootRef;
  }

  didCreateElement({
    component,
    classRef,
    environment,
    rootRef
  }, element, operations) {
    setViewElement(component, element);
    setElementView(element, component);
    let {
      attributeBindings,
      classNames,
      classNameBindings
    } = component;

    if (attributeBindings && attributeBindings.length) {
      applyAttributeBindings(attributeBindings, component, rootRef, operations, environment);
    } else {
      let id$$1 = component.elementId ? component.elementId : guidFor(component);
      operations.setAttribute('id', PrimitiveReference.create(id$$1), false, null);

      if (EMBER_COMPONENT_IS_VISIBLE) {
        installIsVisibleBinding(rootRef, operations, environment);
      }
    }

    if (classRef) {
      const ref = new SimpleClassNameBindingReference(classRef, classRef['propertyKey']);
      operations.setAttribute('class', ref, false, null);
    }

    if (classNames && classNames.length) {
      classNames.forEach(name => {
        operations.setAttribute('class', PrimitiveReference.create(name), false, null);
      });
    }

    if (classNameBindings && classNameBindings.length) {
      classNameBindings.forEach(binding => {
        ClassNameBinding.install(element, rootRef, binding, operations);
      });
    }

    operations.setAttribute('class', PrimitiveReference.create('ember-view'), false, null);

    if ('ariaRole' in component) {
      operations.setAttribute('role', referenceForKey(rootRef, 'ariaRole'), false, null);
    }

    component._transitionTo('hasElement');

    if (environment.isInteractive) {
      component.trigger('willInsertElement');
    }
  }

  didRenderLayout(bucket, bounds) {
    bucket.component[BOUNDS] = bounds;
    bucket.finalize();

    if (ENV._DEBUG_RENDER_TREE) {
      bucket.environment.extra.debugRenderTree.didRender(bucket, bounds);
    }
  }

  getTag({
    args,
    component
  }) {
    return args ? combine([args.tag, component[DIRTY_TAG]]) : component[DIRTY_TAG];
  }

  didCreate({
    component,
    environment
  }) {
    if (environment.isInteractive) {
      component._transitionTo('inDOM');

      component.trigger('didInsertElement');
      component.trigger('didRender');
    }
  }

  update(bucket) {
    let {
      component,
      args,
      argsRevision,
      environment
    } = bucket;

    if (ENV._DEBUG_RENDER_TREE) {
      environment.extra.debugRenderTree.update(bucket);
    }

    bucket.finalizer = _instrumentStart('render.component', rerenderInstrumentDetails, component);

    if (args && !validateTag(args.tag, argsRevision)) {
      let props = processComponentArgs(args);
      bucket.argsRevision = valueForTag(args.tag);
      component[IS_DISPATCHING_ATTRS] = true;
      component.setProperties(props);
      component[IS_DISPATCHING_ATTRS] = false;
      component.trigger('didUpdateAttrs');
      component.trigger('didReceiveAttrs');
    }

    if (environment.isInteractive) {
      component.trigger('willUpdate');
      component.trigger('willRender');
    }
  }

  didUpdateLayout(bucket, bounds) {
    bucket.finalize();

    if (ENV._DEBUG_RENDER_TREE) {
      bucket.environment.extra.debugRenderTree.didRender(bucket, bounds);
    }
  }

  didUpdate({
    component,
    environment
  }) {
    if (environment.isInteractive) {
      component.trigger('didUpdate');
      component.trigger('didRender');
    }
  }

  getDestroyable(bucket) {
    return bucket;
  }

}
function processComponentInitializationAssertions(component, props) {
  assert(`classNameBindings must be non-empty strings: ${component}`, (() => {
    let {
      classNameBindings
    } = component;

    for (let i = 0; i < classNameBindings.length; i++) {
      let binding = classNameBindings[i];

      if (typeof binding !== 'string' || binding.length === 0) {
        return false;
      }
    }

    return true;
  })());
  assert(`classNameBindings must not have spaces in them: ${component}`, (() => {
    let {
      classNameBindings
    } = component;

    for (let i = 0; i < classNameBindings.length; i++) {
      let binding = classNameBindings[i];

      if (binding.split(' ').length > 1) {
        return false;
      }
    }

    return true;
  })());
  assert(`You cannot use \`classNameBindings\` on a tag-less component: ${component}`, component.tagName !== '' || !component.classNameBindings || component.classNameBindings.length === 0);
  assert(`You cannot use \`elementId\` on a tag-less component: ${component}`, component.tagName !== '' || props.id === component.elementId || !component.elementId && component.elementId !== '');
  assert(`You cannot use \`attributeBindings\` on a tag-less component: ${component}`, component.tagName !== '' || !component.attributeBindings || component.attributeBindings.length === 0);
}
function initialRenderInstrumentDetails(component) {
  return component.instrumentDetails({
    initialRender: true
  });
}
function rerenderInstrumentDetails(component) {
  return component.instrumentDetails({
    initialRender: false
  });
}
const CURLY_CAPABILITIES = {
  dynamicLayout: true,
  dynamicTag: true,
  prepareArgs: true,
  createArgs: true,
  attributeHook: true,
  elementHook: true,
  createCaller: true,
  dynamicScope: true,
  updateHook: true,
  createInstance: true,
  wrapped: true,
  willDestroy: true
};
const CURLY_COMPONENT_MANAGER = new CurlyComponentManager();
class CurlyComponentDefinition {
  constructor(name, ComponentClass, template$$1, args) {
    this.name = name;
    this.ComponentClass = ComponentClass;
    this.template = template$$1;
    this.args = args;
    this.manager = CURLY_COMPONENT_MANAGER;
    this.state = {
      name,
      ComponentClass,
      template: template$$1,
      capabilities: CURLY_CAPABILITIES
    };
  }

}

class RootComponentManager extends CurlyComponentManager {
  constructor(component) {
    super();
    this.component = component;
  }

  getJitStaticLayout(_state) {
    const template = this.templateFor(this.component);
    return unwrapTemplate(template).asWrappedLayout();
  }

  create(environment, state, _args, dynamicScope) {
    let component = this.component;

    let finalizer = _instrumentStart('render.component', initialRenderInstrumentDetails, component);

    dynamicScope.view = component;
    let hasWrappedElement = component.tagName !== ''; // We usually do this in the `didCreateElement`, but that hook doesn't fire for tagless components

    if (!hasWrappedElement) {
      if (environment.isInteractive) {
        component.trigger('willRender');
      }

      component._transitionTo('hasElement');

      if (environment.isInteractive) {
        component.trigger('willInsertElement');
      }
    }

    if (DEBUG) {
      processComponentInitializationAssertions(component, {});
    }

    let bucket = new ComponentStateBucket(environment, component, null, finalizer, hasWrappedElement);

    if (ENV._DEBUG_RENDER_TREE) {
      environment.extra.debugRenderTree.create(bucket, {
        type: 'component',
        name: state.name,
        args: EMPTY_ARGS,
        instance: component,
        template: state.template
      });
    }

    return bucket;
  }

} // ROOT is the top-level template it has nothing but one yield.
// it is supposed to have a dummy element


const ROOT_CAPABILITIES = {
  dynamicLayout: false,
  dynamicTag: true,
  prepareArgs: false,
  createArgs: false,
  attributeHook: true,
  elementHook: true,
  createCaller: true,
  dynamicScope: true,
  updateHook: true,
  createInstance: true,
  wrapped: true,
  willDestroy: false
};
class RootComponentDefinition {
  constructor(component) {
    this.component = component;
    let manager = new RootComponentManager(component);
    this.manager = manager;
    let factory = getFactoryFor(component);
    this.state = {
      name: factory.fullName.slice(10),
      capabilities: ROOT_CAPABILITIES,
      ComponentClass: factory
    };
  }

  getTag({
    component
  }) {
    return component[DIRTY_TAG];
  }

}

/* globals module, URL */
let nodeURL;
let parsingNode;
function installProtocolForURL(environment) {
  let protocol;

  if (hasDOM) {
    protocol = browserProtocolForURL.call(environment, 'foobar:baz');
  } // Test to see if our DOM implementation parses
  // and normalizes URLs.


  if (protocol === 'foobar:') {
    // Swap in the method that doesn't do this test now that
    // we know it works.
    environment.protocolForURL = browserProtocolForURL;
  } else if (typeof URL === 'object') {
    // URL globally provided, likely from FastBoot's sandbox
    nodeURL = URL;
    environment.protocolForURL = nodeProtocolForURL;
  } else if (typeof module !== 'undefined' && typeof module.require === 'function') {
    // Otherwise, we need to fall back to our own URL parsing.
    // Global `require` is shadowed by Ember's loader so we have to use the fully
    // qualified `module.require`.
    // tslint:disable-next-line:no-require-imports
    nodeURL = module.require('url');
    environment.protocolForURL = nodeProtocolForURL;
  } else {
    throw new Error('Could not find valid URL parsing mechanism for URL Sanitization');
  }
}

function browserProtocolForURL(url) {
  if (!parsingNode) {
    parsingNode = document.createElement('a');
  }

  parsingNode.href = url;
  return parsingNode.protocol;
}

function nodeProtocolForURL(url) {
  let protocol = null;

  if (typeof url === 'string') {
    protocol = nodeURL.parse(url).protocol;
  }

  return protocol === null ? ':' : protocol;
}

let GUID = 0;

function isPathNode(node) {
  return node.type === 'root' || node.type === 'argument' || node.type === 'property' || node.type === 'iterator';
}

class Ref {
  constructor(value) {
    this.id = GUID++;
    this.value = value;
  }

  get() {
    return this.value;
  }

  release() {
    assert('BUG: double release?', this.value !== null);
    this.value = null;
  }

  toString() {
    let label = `Ref ${this.id}`;

    if (this.value === null) {
      return `${label} (released)`;
    } else {
      try {
        return `${label}: ${this.value}`;
      } catch (_a) {
        return label;
      }
    }
  }

}

const _repeat = String.prototype.repeat || function (count) {
  return new Array(count + 1).join(this);
};

function repeatString(str, count) {
  return _repeat.call(str, count);
}

class DebugRenderTree {
  constructor() {
    this.stack = new Stack();
    this.refs = new WeakMap();
    this.roots = new Set();
    this.nodes = new WeakMap();
    this.pathNodes = new WeakMap();
  }

  begin() {
    this.reset();
  }

  create(state, node) {
    let internalNode = Object.assign({}, node, {
      bounds: null,
      refs: new Set(),
      paths: new Set()
    });
    this.nodes.set(state, internalNode);
    this.appendChild(internalNode, state);
    this.enter(state);
  }

  update(state) {
    this.enter(state);
  } // for dynamic layouts


  setTemplate(state, template) {
    this.nodeFor(state).template = template;
  }

  didRender(state, bounds) {
    assert(`BUG: expecting ${this.stack.current}, got ${state}`, this.stack.current === state);
    this.nodeFor(state).bounds = bounds;
    this.exit();
  }

  willDestroy(state) {
    expect(this.refs.get(state), 'BUG: missing ref').release();
  }

  commit() {
    this.reset();
  }

  capture() {
    return this.captureRefs(this.roots);
  }

  createPath(pathRef, name, type, parentRef) {
    assert('BUG: Attempted to register a path that had already been registered', !this.pathNodes.has(pathRef));
    let {
      current
    } = this.stack;

    if (current === null) {
      // Not currently in a rendering context, don't register the node
      return;
    }

    let currentNode = expect(this.nodes.get(current), 'BUG: Attempted to create a path, but there is no current render node');
    let parent;

    if (parentRef === null) {
      parent = currentNode;
    } else {
      let {
        named
      } = currentNode.args;
      let refIndex = named.references.indexOf(parentRef);

      if (refIndex !== -1) {
        parent = {
          parent: currentNode,
          type: 'argument',
          name: `@${named.names[refIndex]}`,
          paths: new Set()
        };
      } else if (this.pathNodes.has(parentRef)) {
        parent = this.pathNodes.get(parentRef);
      } else {
        // Some RootReferences get created before a component context has been
        // setup (root, curly). This is mainly because the debugRenderTree is
        // tied to the manager hooks, and not built into the VM directly. In
        // these cases, we setup the path lazily when the first property is
        // accessed.
        this.createPath(parentRef, 'this', 'root', null);
        parent = this.pathNodes.get(parentRef);
      }
    }

    let pathNode = {
      name,
      type,
      parent,
      paths: new Set()
    };
    parent.paths.add(pathNode);
    this.pathNodes.set(pathRef, pathNode);
  }

  logRenderStackForPath(pathRef) {
    let node = expect(this.pathNodes.get(pathRef), 'BUG: Attempted to create a log for a path reference, but no node exist for that reference');
    let pathParts = [];

    while (node !== undefined && isPathNode(node)) {
      if (node.type === 'iterator') {
        // Iterator items are a combination of their own name (the key of the item) and
        // their parent, the iterable itself.
        let part = `${node.parent.name}[${node.name}]`;
        pathParts.push(part);
        node = node.parent;
      } else {
        pathParts.unshift(node.name);
      }

      node = node.parent;
    }

    let messageParts = [pathParts.join('.')];

    while (node !== undefined) {
      if (node.type === 'outlet' || node.name === '-top-level') {
        node = node.parent;
        continue;
      }

      messageParts.unshift(node.name);
      node = node.parent;
    }

    return messageParts.map((part, index) => `${repeatString(' ', index * 2)}${part}`).join('\n');
  }

  reset() {
    if (this.stack.size !== 0) {
      // We probably encountered an error during the rendering loop. This will
      // likely trigger undefined behavior and memory leaks as the error left
      // things in an inconsistent state. It is recommended that the user
      // refresh the page.
      // TODO: We could warn here? But this happens all the time in our tests?
      while (!this.stack.isEmpty()) {
        this.stack.pop();
      }
    }
  }

  enter(state) {
    this.stack.push(state);
  }

  exit() {
    assert('BUG: unbalanced pop', this.stack.size !== 0);
    this.stack.pop();
  }

  nodeFor(state) {
    return expect(this.nodes.get(state), 'BUG: missing node');
  }

  appendChild(node, state) {
    assert('BUG: child already appended', !this.refs.has(state));
    let parent = this.stack.current;
    let ref = new Ref(state);
    this.refs.set(state, ref);

    if (parent) {
      let parentNode = this.nodeFor(parent);
      parentNode.refs.add(ref);
      node.parent = parentNode;
    } else {
      this.roots.add(ref);
    }
  }

  captureRefs(refs) {
    let captured = [];
    refs.forEach(ref => {
      let state = ref.get();

      if (state) {
        captured.push(this.captureNode(`render-node:${ref.id}`, state));
      } else {
        refs.delete(ref);
      }
    });
    return captured;
  }

  captureNode(id, state) {
    let node = this.nodeFor(state);
    let {
      type,
      name,
      args,
      instance,
      refs
    } = node;
    let template = this.captureTemplate(node);
    let bounds = this.captureBounds(node);
    let children = this.captureRefs(refs);
    return {
      id,
      type,
      name,
      args: args.value(),
      instance,
      template,
      bounds,
      children
    };
  }

  captureTemplate({
    template
  }) {
    return template && unwrapTemplate(template).referrer.moduleName || null;
  }

  captureBounds(node) {
    let bounds = expect(node.bounds, 'BUG: missing bounds');
    let parentElement = bounds.parentElement();
    let firstNode = bounds.firstNode();
    let lastNode = bounds.lastNode();
    return {
      parentElement,
      firstNode,
      lastNode
    };
  }

}

/**
@module ember
*/
/**
  The `{{#each}}` helper loops over elements in a collection. It is an extension
  of the base Handlebars `{{#each}}` helper.

  The default behavior of `{{#each}}` is to yield its inner block once for every
  item in an array passing the item as the first block parameter.

  Assuming the `@developers` argument contains this array:

  ```javascript
  [{ name: 'Yehuda' },{ name: 'Tom' }, { name: 'Paul' }];
  ```

  ```handlebars
  <ul>
    {{#each @developers as |person|}}
      <li>Hello, {{person.name}}!</li>
    {{/each}}
  </ul>
  ```

  The same rules apply to arrays of primitives.

  ```javascript
  ['Yehuda', 'Tom', 'Paul']
  ```

  ```handlebars
  <ul>
    {{#each @developerNames as |name|}}
      <li>Hello, {{name}}!</li>
    {{/each}}
  </ul>
  ```

  During iteration, the index of each item in the array is provided as a second block
  parameter.

  ```handlebars
  <ul>
    {{#each @developers as |person index|}}
      <li>Hello, {{person.name}}! You're number {{index}} in line</li>
    {{/each}}
  </ul>
  ```

  ### Specifying Keys

  In order to improve rendering speed, Ember will try to reuse the DOM elements
  where possible. Specifically, if the same item is present in the array both
  before and after the change, its DOM output will be reused.

  The `key` option is used to tell Ember how to determine if the items in the
  array being iterated over with `{{#each}}` has changed between renders. By
  default the item's object identity is used.

  This is usually sufficient, so in most cases, the `key` option is simply not
  needed. However, in some rare cases, the objects' identities may change even
  though they represent the same underlying data.

  For example:

  ```javascript
  people.map(person => {
    return { ...person, type: 'developer' };
  });
  ```

  In this case, each time the `people` array is `map`-ed over, it will produce
  an new array with completely different objects between renders. In these cases,
  you can help Ember determine how these objects related to each other with the
  `key` option:

  ```handlebars
  <ul>
    {{#each @developers key="name" as |person|}}
      <li>Hello, {{person.name}}!</li>
    {{/each}}
  </ul>
  ```

  By doing so, Ember will use the value of the property specified (`person.name`
  in the example) to find a "match" from the previous render. That is, if Ember
  has previously seen an object from the `@developers` array with a matching
  name, its DOM elements will be re-used.

  There are two special values for `key`:

    * `@index` - The index of the item in the array.
    * `@identity` - The item in the array itself.

  ### {{else}} condition

  `{{#each}}` can have a matching `{{else}}`. The contents of this block will render
  if the collection is empty.

  ```handlebars
  <ul>
    {{#each @developers as |person|}}
      <li>{{person.name}} is available!</li>
    {{else}}
      <li>Sorry, nobody is available for this task.</li>
    {{/each}}
  </ul>
  ```

  @method each
  @for Ember.Templates.helpers
  @public
 */

/**
  The `{{each-in}}` helper loops over properties on an object.

  For example, given this component definition:

  ```app/components/developer-details.js
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  export default class extends Component {
    @tracked developer = {
      "name": "Shelly Sails",
      "age": 42
    };
  }
  ```

  This template would display all properties on the `developer`
  object in a list:

  ```app/components/developer-details.hbs
  <ul>
    {{#each-in this.developer as |key value|}}
      <li>{{key}}: {{value}}</li>
    {{/each-in}}
  </ul>
  ```

  Outputting their name and age.

  @method each-in
  @for Ember.Templates.helpers
  @public
  @since 2.1.0
*/

class EachInReference {
  constructor(inner) {
    this.inner = inner;
    this.valueTag = createUpdatableTag();
    this.tag = combine([inner.tag, this.valueTag]);
  }

  value() {
    let iterable = this.inner.value();
    let tag = tagForObject(iterable);

    if (isProxy(iterable)) {
      // this is because the each-in doesn't actually get(proxy, 'key') but bypasses it
      // and the proxy's tag is lazy updated on access
      iterable = _contentFor(iterable);
    }

    updateTag(this.valueTag, tag);
    return new EachInWrapper(iterable);
  }

  get(key) {
    return this.inner.get(key);
  }

}

class EachInWrapper {
  constructor(inner) {
    this.inner = inner;
  }

}
function eachIn (args) {
  return new EachInReference(args.positional.at(0));
}

function toIterator(iterable) {
  if (iterable instanceof EachInWrapper) {
    return toEachInIterator(iterable.inner);
  } else {
    return toEachIterator(iterable);
  }
}

function toEachInIterator(iterable) {
  if (!isIndexable(iterable)) {
    return null;
  }

  if (Array.isArray(iterable) || isEmberArray(iterable)) {
    return ObjectIterator.fromIndexable(iterable);
  } else if (HAS_NATIVE_SYMBOL && isNativeIterable(iterable)) {
    return MapLikeNativeIterator.from(iterable);
  } else if (hasForEach(iterable)) {
    return ObjectIterator.fromForEachable(iterable);
  } else {
    return ObjectIterator.fromIndexable(iterable);
  }
}

function toEachIterator(iterable) {
  if (!isObject(iterable)) {
    return null;
  }

  if (Array.isArray(iterable)) {
    return ArrayIterator.from(iterable);
  } else if (isEmberArray(iterable)) {
    return EmberArrayIterator.from(iterable);
  } else if (HAS_NATIVE_SYMBOL && isNativeIterable(iterable)) {
    return ArrayLikeNativeIterator.from(iterable);
  } else if (hasForEach(iterable)) {
    return ArrayIterator.fromForEachable(iterable);
  } else {
    return null;
  }
}

class BoundedIterator {
  constructor(length) {
    this.length = length;
    this.position = 0;
  }

  isEmpty() {
    return false;
  }

  memoFor(position) {
    return position;
  }

  next() {
    let {
      length,
      position
    } = this;

    if (position >= length) {
      return null;
    }

    let value = this.valueFor(position);
    let memo = this.memoFor(position);
    this.position++;
    return {
      value,
      memo
    };
  }

}

class ArrayIterator extends BoundedIterator {
  constructor(array) {
    super(array.length);
    this.array = array;
  }

  static from(iterable) {
    return iterable.length > 0 ? new this(iterable) : null;
  }

  static fromForEachable(object) {
    let array = [];
    object.forEach(item => array.push(item));
    return this.from(array);
  }

  valueFor(position) {
    return this.array[position];
  }

}

class EmberArrayIterator extends BoundedIterator {
  constructor(array) {
    super(array.length);
    this.array = array;
  }

  static from(iterable) {
    return iterable.length > 0 ? new this(iterable) : null;
  }

  valueFor(position) {
    return objectAt(this.array, position);
  }

}

class ObjectIterator extends BoundedIterator {
  constructor(keys, values) {
    super(values.length);
    this.keys = keys;
    this.values = values;
  }

  static fromIndexable(obj) {
    let keys = Object.keys(obj);
    let {
      length
    } = keys;

    if (length === 0) {
      return null;
    } else {
      let values = [];

      for (let i = 0; i < length; i++) {
        let value;
        let key = keys[i];
        value = obj[key]; // Add the tag of the returned value if it is an array, since arrays
        // should always cause updates if they are consumed and then changed

        if (isTracking()) {
          consumeTag(tagFor(obj, key));

          if (Array.isArray(value)) {
            consumeTag(tagFor(value, '[]'));
          }
        }

        values.push(value);
      }

      return new this(keys, values);
    }
  }

  static fromForEachable(obj) {
    let keys = [];
    let values = [];
    let length = 0;
    let isMapLike = false; // Not using an arrow function here so we can get an accurate `arguments`

    obj.forEach(function (value, key) {
      isMapLike = isMapLike || arguments.length >= 2;

      if (isMapLike) {
        keys.push(key);
      }

      values.push(value);
      length++;
    });

    if (length === 0) {
      return null;
    } else if (isMapLike) {
      return new this(keys, values);
    } else {
      return new ArrayIterator(values);
    }
  }

  valueFor(position) {
    return this.values[position];
  }

  memoFor(position) {
    return this.keys[position];
  }

}

class NativeIterator {
  constructor(iterable, result) {
    this.iterable = iterable;
    this.result = result;
    this.position = 0;
  }

  static from(iterable) {
    let iterator = iterable[Symbol.iterator]();
    let result = iterator.next();
    let {
      done
    } = result;

    if (done) {
      return null;
    } else {
      return new this(iterator, result);
    }
  }

  isEmpty() {
    return false;
  }

  next() {
    let {
      iterable,
      result,
      position
    } = this;

    if (result.done) {
      return null;
    }

    let value = this.valueFor(result, position);
    let memo = this.memoFor(result, position);
    this.position++;
    this.result = iterable.next();
    return {
      value,
      memo
    };
  }

}

class ArrayLikeNativeIterator extends NativeIterator {
  valueFor(result) {
    return result.value;
  }

  memoFor(_result, position) {
    return position;
  }

}

class MapLikeNativeIterator extends NativeIterator {
  valueFor(result) {
    return result.value[1];
  }

  memoFor(result) {
    return result.value[0];
  }

}

function hasForEach(value) {
  return typeof value['forEach'] === 'function';
}

function isNativeIterable(value) {
  return typeof value[Symbol.iterator] === 'function';
}

function isIndexable(value) {
  return value !== null && (typeof value === 'object' || typeof value === 'function');
}

function toBool(predicate) {
  if (isProxy(predicate)) {
    consumeTag(tagForProperty(predicate, 'content'));
    return Boolean(get(predicate, 'isTruthy'));
  } else if (isArray(predicate)) {
    consumeTag(tagForProperty(predicate, '[]'));
    return predicate.length !== 0;
  } else {
    return Boolean(predicate);
  }
}

// Setup global environment
// Autotracking

setPropertyDidChange(() => backburner.ensureInstance());

if (DEBUG) {
  setAutotrackingTransactionEnv({
    assert(message) {
      assert(message, false);
    },

    deprecate(message) {
      deprecate(message, false, {
        id: 'autotracking.mutation-after-consumption',
        until: '4.0.0'
      });
    },

    debugMessage(obj, keyName) {
      let dirtyString = keyName ? `\`${keyName}\` on \`${getDebugName(obj)}\`` : `\`${getDebugName(obj)}\``;
      return `You attempted to update ${dirtyString}, but it had already been used previously in the same computation.  Attempting to update a value after using it in a computation can cause logical errors, infinite revalidation bugs, and performance issues, and is not supported.`;
    }

  });
} // Destruction


setScheduleDestroy((destroyable, destructor) => {
  schedule('actions', null, destructor, destroyable);
});
setScheduleDestroyed(finalizeDestructor => {
  schedule('destroy', null, finalizeDestructor);
});
class EmberEnvironmentExtra {
  constructor(owner) {
    this.owner = owner;

    if (ENV._DEBUG_RENDER_TREE) {
      this._debugRenderTree = new DebugRenderTree();
    }
  }

  get debugRenderTree() {
    if (ENV._DEBUG_RENDER_TREE) {
      return this._debugRenderTree;
    } else {
      throw new Error("Can't access debug render tree outside of the inspector (_DEBUG_RENDER_TREE flag is disabled)");
    }
  }

  begin() {
    if (ENV._DEBUG_RENDER_TREE) {
      this.debugRenderTree.begin();
    }
  }

  commit() {
    if (ENV._DEBUG_RENDER_TREE) {
      this.debugRenderTree.commit();
    }
  }

}
class EmberEnvironmentDelegate {
  constructor(owner, isInteractive) {
    this.toBool = toBool;
    this.toIterator = toIterator;
    this.getProp = _getProp;
    this.getPath = get;
    this.setPath = set;
    this.extra = new EmberEnvironmentExtra(owner);
    this.isInteractive = isInteractive;
    installProtocolForURL(this);
  } // this gets clobbered by installPlatformSpecificProtocolForURL
  // it really should just delegate to a platform specific injection


  protocolForURL(s) {
    return s;
  }

  getTemplatePathDebugContext(pathRef) {
    let stack = this.extra.debugRenderTree.logRenderStackForPath(pathRef);
    return `While rendering:\n\n${stack}`;
  }

  setTemplatePathDebugContext(pathRef, desc, parentRef) {
    let type = 'root';

    if (pathRef instanceof IterationItemReference) {
      type = 'iterator';
    } else if (pathRef instanceof PropertyReference) {
      type = 'property';
    }

    this.extra.debugRenderTree.createPath(pathRef, desc, type, parentRef);
  }

  onTransactionBegin() {
    this.extra.begin();
  }

  onTransactionCommit() {
    this.extra.commit();
  }

}

if (DEBUG) {
  class StyleAttributeManager extends SimpleDynamicAttribute {
    set(dom, value, env) {
      warn(constructStyleDeprecationMessage(value), (() => {
        if (value === null || value === undefined || isHTMLSafe(value)) {
          return true;
        }

        return false;
      })(), {
        id: 'ember-htmlbars.style-xss-warning'
      });
      super.set(dom, value, env);
    }

    update(value, env) {
      warn(constructStyleDeprecationMessage(value), (() => {
        if (value === null || value === undefined || isHTMLSafe(value)) {
          return true;
        }

        return false;
      })(), {
        id: 'ember-htmlbars.style-xss-warning'
      });
      super.update(value, env);
    }

  }

  EmberEnvironmentDelegate.prototype.attributeFor = function (element, attribute, isTrusting, namespace) {
    if (attribute === 'style' && !isTrusting) {
      return new StyleAttributeManager({
        element,
        name: attribute,
        namespace
      });
    }

    return dynamicAttribute(element, attribute, namespace);
  };
}

const CAPABILITIES$1 = {
  dynamicLayout: false,
  dynamicTag: false,
  prepareArgs: false,
  createArgs: true,
  attributeHook: false,
  elementHook: false,
  createCaller: false,
  dynamicScope: true,
  updateHook: true,
  createInstance: true,
  wrapped: false,
  willDestroy: false
};
function capabilities(managerAPI, options = {}) {
  assert('Invalid component manager compatibility specified', managerAPI === '3.4' || managerAPI === '3.13');
  let updateHook = true;

  {
    updateHook = managerAPI === '3.13' ? Boolean(options.updateHook) : true;
  }

  return {
    asyncLifeCycleCallbacks: Boolean(options.asyncLifecycleCallbacks),
    destructor: Boolean(options.destructor),
    updateHook
  };
}
function hasAsyncLifeCycleCallbacks(delegate) {
  return delegate.capabilities.asyncLifeCycleCallbacks;
}
function hasUpdateHook(delegate) {
  return delegate.capabilities.updateHook;
}
function hasAsyncUpdateHook(delegate) {
  return hasAsyncLifeCycleCallbacks(delegate) && hasUpdateHook(delegate);
}
function hasDestructors(delegate) {
  return delegate.capabilities.destructor;
}
/**
  The CustomComponentManager allows addons to provide custom component
  implementations that integrate seamlessly into Ember. This is accomplished
  through a delegate, registered with the custom component manager, which
  implements a set of hooks that determine component behavior.

  To create a custom component manager, instantiate a new CustomComponentManager
  class and pass the delegate as the first argument:

  ```js
  let manager = new CustomComponentManager({
    // ...delegate implementation...
  });
  ```

  ## Delegate Hooks

  Throughout the lifecycle of a component, the component manager will invoke
  delegate hooks that are responsible for surfacing those lifecycle changes to
  the end developer.

  * `create()` - invoked when a new instance of a component should be created
  * `update()` - invoked when the arguments passed to a component change
  * `getContext()` - returns the object that should be
*/

class CustomComponentManager extends AbstractManager {
  create(env, definition, args) {
    const {
      delegate
    } = definition;
    const capturedArgs = args.capture();
    const namedArgs = capturedArgs.named;
    let value;
    let namedArgsProxy = {};

    {
      let getTag = key => {
        return namedArgs.get(key).tag;
      };

      if (HAS_NATIVE_PROXY) {
        let handler = {
          get(_target, prop) {
            if (namedArgs.has(prop)) {
              let ref = namedArgs.get(prop);
              consumeTag(ref.tag);
              return ref.value();
            } else if (prop === CUSTOM_TAG_FOR) {
              return getTag;
            }
          },

          has(_target, prop) {
            return namedArgs.has(prop);
          },

          ownKeys(_target) {
            return namedArgs.names;
          },

          getOwnPropertyDescriptor(_target, prop) {
            assert('args proxies do not have real property descriptors, so you should never need to call getOwnPropertyDescriptor yourself. This code exists for enumerability, such as in for-in loops and Object.keys()', namedArgs.has(prop));
            return {
              enumerable: true,
              configurable: true
            };
          }

        };

        if (DEBUG) {
          handler.set = function (_target, prop) {
            assert(`You attempted to set ${definition.ComponentClass.class}#${String(prop)} on a components arguments. Component arguments are immutable and cannot be updated directly, they always represent the values that are passed to your component. If you want to set default values, you should use a getter instead`);
            return false;
          };
        }

        namedArgsProxy = new Proxy(namedArgsProxy, handler);
      } else {
        Object.defineProperty(namedArgsProxy, CUSTOM_TAG_FOR, {
          configurable: false,
          enumerable: false,
          value: getTag
        });
        namedArgs.names.forEach(name => {
          Object.defineProperty(namedArgsProxy, name, {
            enumerable: true,
            configurable: true,

            get() {
              let ref = namedArgs.get(name);
              consumeTag(ref.tag);
              return ref.value();
            }

          });
        });
      }

      value = {
        named: namedArgsProxy,
        positional: capturedArgs.positional.value()
      };
    }

    const component = delegate.createComponent(definition.ComponentClass.class, value);
    let bucket = new CustomComponentState(delegate, component, capturedArgs, env, namedArgsProxy);

    if (ENV._DEBUG_RENDER_TREE) {
      env.extra.debugRenderTree.create(bucket, {
        type: 'component',
        name: definition.name,
        args: args.capture(),
        instance: component,
        template: definition.template
      });
      registerDestructor(bucket, () => {
        env.extra.debugRenderTree.willDestroy(bucket);
      });
    }

    return bucket;
  }

  update(bucket) {
    if (ENV._DEBUG_RENDER_TREE) {
      bucket.env.extra.debugRenderTree.update(bucket);
    }

    let {
      delegate,
      component,
      args,
      namedArgsProxy
    } = bucket;
    let value;

    {
      value = {
        named: namedArgsProxy,
        positional: args.positional.value()
      };
    }

    if (hasUpdateHook(delegate)) {
      delegate.updateComponent(component, value);
    }
  }

  didCreate({
    delegate,
    component
  }) {
    if (hasAsyncLifeCycleCallbacks(delegate)) {
      delegate.didCreateComponent(component);
    }
  }

  didUpdate({
    delegate,
    component
  }) {
    if (hasAsyncUpdateHook(delegate)) {
      delegate.didUpdateComponent(component);
    }
  }

  getContext({
    delegate,
    component
  }) {
    delegate.getContext(component);
  }

  getSelf({
    env,
    delegate,
    component
  }) {
    return new ComponentRootReference(delegate.getContext(component), env);
  }

  getDestroyable(bucket) {
    return bucket;
  }

  getCapabilities({
    delegate
  }) {
    return Object.assign({}, CAPABILITIES$1, {
      updateHook: ENV._DEBUG_RENDER_TREE || delegate.capabilities.updateHook
    });
  }

  getTag({
    args
  }) {
    if (isConstTagged(args)) {
      // returning a const tag skips the update hook (VM BUG?)
      return createTag();
    } else {
      return args.tag;
    }
  }

  didRenderLayout(bucket, bounds) {
    if (ENV._DEBUG_RENDER_TREE) {
      bucket.env.extra.debugRenderTree.didRender(bucket, bounds);
    }
  }

  didUpdateLayout(bucket, bounds) {
    if (ENV._DEBUG_RENDER_TREE) {
      bucket.env.extra.debugRenderTree.didRender(bucket, bounds);
    }
  }

  getJitStaticLayout(state) {
    return unwrapTemplate(state.template).asLayout();
  }

}
const CUSTOM_COMPONENT_MANAGER = new CustomComponentManager();
/**
 * Stores internal state about a component instance after it's been created.
 */

class CustomComponentState {
  constructor(delegate, component, args, env, namedArgsProxy) {
    this.delegate = delegate;
    this.component = component;
    this.args = args;
    this.env = env;
    this.namedArgsProxy = namedArgsProxy;

    if (hasDestructors(delegate)) {
      registerDestructor(this, () => delegate.destroyComponent(component));
    }
  }

}
class CustomManagerDefinition {
  constructor(name, ComponentClass, delegate, template) {
    this.name = name;
    this.ComponentClass = ComponentClass;
    this.delegate = delegate;
    this.template = template;
    this.manager = CUSTOM_COMPONENT_MANAGER;
    this.state = {
      name,
      ComponentClass,
      template,
      delegate
    };
  }

}

class InternalComponentDefinition {
  constructor(manager, ComponentClass, layout) {
    this.manager = manager;
    this.state = {
      ComponentClass,
      layout
    };
  }

}
class InternalManager extends AbstractManager {
  constructor(owner) {
    super();
    this.owner = owner;
  }

  getJitStaticLayout({
    layout: template
  }) {
    return unwrapTemplate(template).asLayout();
  }

}

const CAPABILITIES$2 = {
  dynamicLayout: false,
  dynamicTag: false,
  prepareArgs: false,
  createArgs: ENV._DEBUG_RENDER_TREE,
  attributeHook: false,
  elementHook: false,
  createCaller: false,
  dynamicScope: false,
  updateHook: ENV._DEBUG_RENDER_TREE,
  createInstance: true,
  wrapped: false,
  willDestroy: false
};
class TemplateOnlyComponentManager extends AbstractManager {
  getJitStaticLayout({
    template
  }) {
    return unwrapTemplate(template).asLayout();
  }

  getCapabilities() {
    return CAPABILITIES$2;
  }

  create(environment, {
    name,
    template
  }, args) {
    if (ENV._DEBUG_RENDER_TREE) {
      let bucket = {
        environment
      };
      environment.extra.debugRenderTree.create(bucket, {
        type: 'component',
        name: name,
        args: args.capture(),
        instance: null,
        template
      });
      registerDestructor(bucket, () => {
        bucket.environment.extra.debugRenderTree.willDestroy(bucket);
      });
      return bucket;
    } else {
      return null;
    }
  }

  getSelf() {
    return NULL_REFERENCE;
  }

  getTag() {
    if (ENV._DEBUG_RENDER_TREE) {
      // returning a const tag skips the update hook (VM BUG?)
      return createTag();
    } else {
      // an outlet has no hooks
      return CONSTANT_TAG;
    }
  }

  getDestroyable(bucket) {
    if (ENV._DEBUG_RENDER_TREE) {
      return bucket;
    } else {
      return null;
    }
  }

  didRenderLayout(bucket, bounds) {
    if (ENV._DEBUG_RENDER_TREE) {
      bucket.environment.extra.debugRenderTree.didRender(bucket, bounds);
    }
  }

  update(bucket) {
    if (ENV._DEBUG_RENDER_TREE) {
      bucket.environment.extra.debugRenderTree.update(bucket);
    }
  }

  didUpdateLayout(bucket, bounds) {
    if (ENV._DEBUG_RENDER_TREE) {
      bucket.environment.extra.debugRenderTree.didRender(bucket, bounds);
    }
  }

}
const MANAGER = new TemplateOnlyComponentManager();
class TemplateOnlyComponentDefinition {
  constructor(name, template) {
    this.name = name;
    this.template = template;
    this.manager = MANAGER;
  }

  get state() {
    return this;
  }

}

let helper$1;

if (DEBUG) {
  class ComponentAssertionReference {
    constructor(component, message) {
      this.component = component;
      this.message = message;
      this.tag = component.tag;
    }

    value() {
      let value = this.component.value();
      assert(this.message, typeof value !== 'string');
      return value;
    }

    get(property) {
      return this.component.get(property);
    }

  }

  helper$1 = args => new ComponentAssertionReference(args.positional.at(0), args.positional.at(1).value());
} else {
  helper$1 = args => args.positional.at(0);
}

var componentAssertionHelper = helper$1;

let helper$2;

if (DEBUG) {
  class InElementNullCheckReference {
    constructor(inner) {
      this.inner = inner;
      this.tag = inner.tag;
    }

    value() {
      let value = this.inner.value();
      assert('You cannot pass a null or undefined destination element to in-element', value !== null && value !== undefined);
      return value;
    }

    get(key) {
      return this.inner.get(key);
    }

  }

  helper$2 = args => new InElementNullCheckReference(args.positional.at(0));
} else {
  helper$2 = args => args.positional.at(0);
}

var inElementNullCheckHelper = helper$2;

function inputTypeHelper({
  positional
}) {
  let type = positional.at(0).value();

  if (type === 'checkbox') {
    return '-checkbox';
  }

  return '-text-field';
}

function inputTypeHelper$1 (args, vm) {
  return new HelperRootReference(inputTypeHelper, args.capture(), vm.env);
}

function normalizeClass({
  positional
}) {
  let classNameParts = positional.at(0).value().split('.');
  let className = classNameParts[classNameParts.length - 1];
  let value = positional.at(1).value();

  if (value === true) {
    return dasherize(className);
  } else if (!value && value !== 0) {
    return '';
  } else {
    return String(value);
  }
}

function normalizeClassHelper (args, vm) {
  return new HelperRootReference(normalizeClass, args.capture(), vm.env);
}

/**
@module ember
*/
/**
  This reference is used to get the `[]` tag of iterables, so we can trigger
  updates to `{{each}}` when it changes. It is put into place by a template
  transform at build time, similar to the (-each-in) helper
*/

class TrackArrayReference {
  constructor(inner) {
    this.inner = inner;
    this.valueTag = createUpdatableTag();
    this.tag = combine([inner.tag, this.valueTag]);
  }

  value() {
    let iterable = this.inner.value();
    let tag = isObject(iterable) ? tagForProperty(iterable, '[]') : CONSTANT_TAG;
    updateTag(this.valueTag, tag);
    return iterable;
  }

  get(key) {
    return this.inner.get(key);
  }

}

function trackArray(args) {
  return new TrackArrayReference(args.positional.at(0));
}

/**
@module ember
*/

/**
   Use the `{{array}}` helper to create an array to pass as an option to your
   components.

   ```handlebars
   <MyComponent @people={{array
     'Tom Dade'
     'Yehuda Katz'
     this.myOtherPerson}}
   />
   ```
    or
   ```handlebars
   {{my-component people=(array
     'Tom Dade'
     'Yehuda Katz'
     this.myOtherPerson)
   }}
   ```

   Would result in an object such as:

   ```js
   ['Tom Date', 'Yehuda Katz', this.get('myOtherPerson')]
   ```

   Where the 3rd item in the array is bound to updates of the `myOtherPerson` property.

   @method array
   @for Ember.Templates.helpers
   @param {Array} options
   @return {Array} Array
   @since 3.8.0
   @public
 */
function array (args) {
  return args.positional.capture();
}

const isEmpty = value => {
  return value === null || value === undefined || typeof value.toString !== 'function';
};

const normalizeTextValue = value => {
  if (isEmpty(value)) {
    return '';
  }

  return String(value);
};
/**
@module ember
*/

/**
  Concatenates the given arguments into a string.

  Example:

  ```handlebars
  {{some-component name=(concat firstName " " lastName)}}

  {{! would pass name="<first name value> <last name value>" to the component}}
  ```

  or for angle bracket invocation, you actually don't need concat at all.

  ```handlebars
  <SomeComponent @name="{{firstName}} {{lastName}}" />
  ```

  @public
  @method concat
  @for Ember.Templates.helpers
  @since 1.13.0
*/


function concat({
  positional
}) {
  return positional.value().map(normalizeTextValue).join('');
}

function concat$1 (args, vm) {
  return new HelperRootReference(concat, args.capture(), vm.env);
}

function buildUntouchableThis(source) {
  let context = null;

  if (DEBUG && HAS_NATIVE_PROXY) {
    let assertOnProperty = property => {
      assert(`You accessed \`this.${String(property)}\` from a function passed to the ${source}, but the function itself was not bound to a valid \`this\` context. Consider updating to usage of \`@action\`.`);
    };

    context = new Proxy({}, {
      get(_target, property) {
        assertOnProperty(property);
      },

      set(_target, property) {
        assertOnProperty(property);
        return false;
      },

      has(_target, property) {
        assertOnProperty(property);
        return false;
      }

    });
  }

  return context;
}

const context = buildUntouchableThis('`fn` helper');
/**
@module ember
*/

/**
  The `fn` helper allows you to ensure a function that you are passing off
  to another component, helper, or modifier has access to arguments that are
  available in the template.

  For example, if you have an `each` helper looping over a number of items, you
  may need to pass a function that expects to receive the item as an argument
  to a component invoked within the loop. Here's how you could use the `fn`
  helper to pass both the function and its arguments together:

    ```app/templates/components/items-listing.hbs
  {{#each @items as |item|}}
    <DisplayItem @item=item @select={{fn this.handleSelected item}} />
  {{/each}}
  ```

  ```app/components/items-list.js
  import Component from '@glimmer/component';
  import { action } from '@ember/object';

  export default class ItemsList extends Component {
    @action
    handleSelected(item) {
      // ...snip...
    }
  }
  ```

  In this case the `display-item` component will receive a normal function
  that it can invoke. When it invokes the function, the `handleSelected`
  function will receive the `item` and any arguments passed, thanks to the
  `fn` helper.

  Let's take look at what that means in a couple circumstances:

  - When invoked as `this.args.select()` the `handleSelected` function will
    receive the `item` from the loop as its first and only argument.
  - When invoked as `this.args.select('foo')` the `handleSelected` function
    will receive the `item` from the loop as its first argument and the
    string `'foo'` as its second argument.

  In the example above, we used `@action` to ensure that `handleSelected` is
  properly bound to the `items-list`, but let's explore what happens if we
  left out `@action`:

  ```app/components/items-list.js
  import Component from '@glimmer/component';

  export default class ItemsList extends Component {
    handleSelected(item) {
      // ...snip...
    }
  }
  ```

  In this example, when `handleSelected` is invoked inside the `display-item`
  component, it will **not** have access to the component instance. In other
  words, it will have no `this` context, so please make sure your functions
  are bound (via `@action` or other means) before passing into `fn`!

  See also [partial application](https://en.wikipedia.org/wiki/Partial_application).

  @method fn
  @for Ember.Templates.helpers
  @public
  @since 3.11.0
*/

function fn({
  positional
}, env) {
  let callbackRef = positional.at(0);
  assert(`You must pass a function as the \`fn\` helpers first argument.`, callbackRef !== undefined);

  if (DEBUG && typeof callbackRef[INVOKE] !== 'function') {
    let callback = callbackRef.value();
    let debugContext;

    try {
      debugContext = env.getTemplatePathDebugContext(callbackRef);
    } catch (e) {
      debugContext = '';
    }

    assert(`You must pass a function as the \`fn\` helpers first argument, you passed ${callback === null ? 'null' : typeof callback}. ${debugContext}`, typeof callback === 'function');
  }

  return (...invocationArgs) => {
    let [fn, ...args] = positional.value();

    if (typeof callbackRef[INVOKE] === 'function') {
      // references with the INVOKE symbol expect the function behind
      // the symbol to be bound to the reference
      return callbackRef[INVOKE](...args, ...invocationArgs);
    } else {
      return fn.call(context, ...args, ...invocationArgs);
    }
  };
}

function fn$1 (args, vm) {
  let callback = fn;

  if (DEBUG) {
    callback = args => {
      return fn(args, vm.env);
    };
  }

  return new HelperRootReference(callback, args.capture(), vm.env);
}

/**
@module ember
*/

/**
  Dynamically look up a property on an object. The second argument to `{{get}}`
  should have a string value, although it can be bound.

  For example, these two usages are equivalent:

  ```app/components/developer-detail.js
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  export default class extends Component {
    @tracked developer = {
      name: "Sandi Metz",
      language: "Ruby"
    }
  }
  ```

  ```handlebars
  {{this.developer.name}}
  {{get this.developer "name"}}
  ```

  If there were several facts about a person, the `{{get}}` helper can dynamically
  pick one:

  ```app/templates/application.hbs
  <DeveloperDetail @factName="language" />
  ```

  ```handlebars
  {{get this.developer @factName}}
  ```

  For a more complex example, this template would allow the user to switch
  between showing the user's height and weight with a click:

  ```app/components/developer-detail.js
  import Component from '@glimmer/component';
  import { tracked } from '@glimmer/tracking';

  export default class extends Component {
    @tracked developer = {
      name: "Sandi Metz",
      language: "Ruby"
    }

    @tracked currentFact = 'name'

    @action
    showFact(fact) {
      this.currentFact = fact;
    }
  }
  ```

  ```app/components/developer-detail.js
  {{get this.developer this.currentFact}}

  <button {{on 'click' (fn this.showFact "name")}}>Show name</button>
  <button {{on 'click' (fn this.showFact "language")}}>Show language</button>
  ```

  The `{{get}}` helper can also respect mutable values itself. For example:

  ```app/components/developer-detail.js
  <Input @value={{mut (get this.person this.currentFact)}} />

  <button {{on 'click' (fn this.showFact "name")}}>Show name</button>
  <button {{on 'click' (fn this.showFact "language")}}>Show language</button>
  ```

  Would allow the user to swap what fact is being displayed, and also edit
  that fact via a two-way mutable binding.

  @public
  @method get
  @for Ember.Templates.helpers
  @since 2.1.0
 */

function get$1 (args, vm) {
  let sourceReference = args.positional.at(0);
  let pathReference = args.positional.at(1);

  if (isConstTagged(pathReference)) {
    // Since the path is constant, we can create a normal chain of property
    // references. The source reference will update like normal, and all of the
    // child references will update accordingly.
    let path = pathReference.value();

    if (path === undefined || path === null || path === '') {
      return NULL_REFERENCE;
    } else if (typeof path === 'string' && path.indexOf('.') > -1) {
      return referenceFromParts(sourceReference, path.split('.'));
    } else {
      return sourceReference.get(String(path));
    }
  } else {
    return new GetHelperRootReference(args.capture(), vm.env);
  }
}

function get$2({
  positional
}) {
  let source = positional.at(0).value();

  if (isObject(source)) {
    let path = positional.at(1).value();
    return get(source, String(path));
  }
}

class GetHelperRootReference extends HelperRootReference {
  constructor(args, env) {
    super(get$2, args, env);
    this.sourceReference = args.positional.at(0);
    this.pathReference = args.positional.at(1);
  }

  [UPDATE_REFERENCED_VALUE](value) {
    let source = this.sourceReference.value();

    if (isObject(source)) {
      let path = String(this.pathReference.value());
      set(source, path, value);
    }
  }

}

/**
@module ember
*/

/**
   Use the `{{hash}}` helper to create a hash to pass as an option to your
   components. This is specially useful for contextual components where you can
   just yield a hash:

   ```handlebars
   {{yield (hash
      name='Sarah'
      title=office
   )}}
   ```

   Would result in an object such as:

   ```js
   { name: 'Sarah', title: this.get('office') }
   ```

   Where the `title` is bound to updates of the `office` property.

   Note that the hash is an empty object with no prototype chain, therefore
   common methods like `toString` are not available in the resulting hash.
   If you need to use such a method, you can use the `call` or `apply`
   approach:

   ```js
   function toString(obj) {
     return Object.prototype.toString.apply(obj);
   }
   ```

   @method hash
   @for Ember.Templates.helpers
   @param {Object} options
   @return {Object} Hash
   @since 2.3.0
   @public
 */
function hash (args) {
  return args.named.capture();
}

/**
@module ember
*/

function ifHelper({
  positional
}) {
  assert('The inline form of the `if` helper expects two or three arguments, e.g. `{{if trialExpired "Expired" expiryDate}}`.', positional.length === 3 || positional.length === 2);
  let condition = positional.at(0);
  let truthyValue = positional.at(1);
  let falsyValue = positional.at(2);

  if (toBool(condition.value()) === true) {
    return truthyValue.value();
  } else {
    return falsyValue !== undefined ? falsyValue.value() : undefined;
  }
}

function unless({
  positional
}) {
  assert('The inline form of the `unless` helper expects two or three arguments, e.g. `{{unless isFirstLogin "Welcome back!"}}`.', positional.length === 3 || positional.length === 2);
  let condition = positional.at(0);
  let truthyValue = positional.at(2);
  let falsyValue = positional.at(1);

  if (toBool(condition.value()) === true) {
    return truthyValue !== undefined ? truthyValue.value() : undefined;
  } else {
    return falsyValue.value();
  }
}
/**
  The `if` helper allows you to conditionally render one of two branches,
  depending on the "truthiness" of a property.
  For example the following values are all falsey: `false`, `undefined`, `null`, `""`, `0`, `NaN` or an empty array.

  This helper has two forms, block and inline.

  ## Block form

  You can use the block form of `if` to conditionally render a section of the template.

  To use it, pass the conditional value to the `if` helper,
  using the block form to wrap the section of template you want to conditionally render.
  Like so:

  ```app/templates/application.hbs
  <Weather />
  ```

  ```app/components/weather.hbs
  {{! will not render because greeting is undefined}}
  {{#if @isRaining}}
    Yes, grab an umbrella!
  {{/if}}
  ```

  You can also define what to show if the property is falsey by using
  the `else` helper.

  ```app/components/weather.hbs
  {{#if @isRaining}}
    Yes, grab an umbrella!
  {{else}}
    No, it's lovely outside!
  {{/if}}
  ```

  You are also able to combine `else` and `if` helpers to create more complex
  conditional logic.

  For the following template:

   ```app/components/weather.hbs
  {{#if @isRaining}}
    Yes, grab an umbrella!
  {{else if @isCold}}
    Grab a coat, it's chilly!
  {{else}}
    No, it's lovely outside!
  {{/if}}
  ```

  If you call it by saying `isCold` is true:

  ```app/templates/application.hbs
  <Weather @isCold={{true}} />
  ```

  Then `Grab a coat, it's chilly!` will be rendered.

  ## Inline form

  The inline `if` helper conditionally renders a single property or string.

  In this form, the `if` helper receives three arguments, the conditional value,
  the value to render when truthy, and the value to render when falsey.

  For example, if `useLongGreeting` is truthy, the following:

  ```app/templates/application.hbs
  <Greeting @useLongGreeting={{true}} />
  ```

  ```app/components/greeting.hbs
  {{if @useLongGreeting "Hello" "Hi"}} Alex
  ```

  Will render:

  ```html
  Hello Alex
  ```

  One detail to keep in mind is that both branches of the `if` helper will be evaluated,
  so if you have `{{if condition "foo" (expensive-operation "bar")`,
  `expensive-operation` will always calculate.

  @method if
  @for Ember.Templates.helpers
  @public
*/


function inlineIf(args, vm) {
  return new HelperRootReference(ifHelper, args.capture(), vm.env);
}
/**
  The `unless` helper is the inverse of the `if` helper. It displays if a value
  is falsey ("not true" or "is false"). Example values that will display with
  `unless`: `false`, `undefined`, `null`, `""`, `0`, `NaN` or an empty array.

  ## Inline form

  The inline `unless` helper conditionally renders a single property or string.
  This helper acts like a ternary operator. If the first property is falsy,
  the second argument will be displayed, otherwise, the third argument will be
  displayed

  For example, if you pass a falsey `useLongGreeting` to the `Greeting` component:

  ```app/templates/application.hbs
  <Greeting @useLongGreeting={{false}} />
  ```

  ```app/components/greeting.hbs
  {{unless @useLongGreeting "Hi" "Hello"}} Ben
  ```

  Then it will display:

  ```html
  Hi Ben
  ```

  ## Block form

  Like the `if` helper, the `unless` helper also has a block form.

  The following will not render anything:

  ```app/templates/application.hbs
  <Greeting />
  ```

  ```app/components/greeting.hbs
  {{#unless @greeting}}
    No greeting was found. Why not set one?
  {{/unless}}
  ```

  You can also use an `else` helper with the `unless` block. The
  `else` will display if the value is truthy.

  If you have the following component:

  ```app/components/logged-in.hbs
  {{#unless @userData}}
    Please login.
  {{else}}
    Welcome back!
  {{/unless}}
  ```

  Calling it with a truthy `userData`:

  ```app/templates/application.hbs
  <LoggedIn @userData={{hash username="Zoey"}} />
  ```

  Will render:

  ```html
  Welcome back!
  ```

  and calling it with a falsey `userData`:

  ```app/templates/application.hbs
  <LoggedIn @userData={{false}} />
  ```

  Will render:

  ```html
  Please login.
  ```

  @method unless
  @for Ember.Templates.helpers
  @public
*/

function inlineUnless(args, vm) {
  return new HelperRootReference(unless, args.capture(), vm.env);
}

/**
@module ember
*/

/**
  `log` allows you to output the value of variables in the current rendering
  context. `log` also accepts primitive types such as strings or numbers.

  ```handlebars
  {{log "myVariable:" myVariable }}
  ```

  @method log
  @for Ember.Templates.helpers
  @param {Array} params
  @public
*/

function log({
  positional
}) {
  /* eslint-disable no-console */
  console.log(...positional.value());
  /* eslint-enable no-console */
}

function log$1 (args, vm) {
  return new HelperRootReference(log, args.capture(), vm.env);
}

/**
@module ember
*/
/**
  This is a helper to be used in conjunction with the link-to helper.
  It will supply url query parameters to the target route.

  @example In this example we are setting the `direction` query param to the value `"asc"`

  ```app/templates/application.hbs
  <LinkTo
    @route="posts"
    {{query-params direction="asc"}}
  >
    Sort
  </LinkTo>
  ```

  @method query-params
  @for Ember.Templates.helpers
  @param {Object} hash takes a hash of query parameters
  @return {Object} A `QueryParams` object for `{{link-to}}`
  @public
*/

function queryParams({
  positional,
  named
}) {
  // tslint:disable-next-line:max-line-length
  assert("The `query-params` helper only accepts hash parameters, e.g. (query-params queryParamPropertyName='foo') as opposed to just (query-params 'foo')", positional.value().length === 0);
  return new QueryParams(assign({}, named.value()));
}

function queryParams$1 (args, vm) {
  return new HelperRootReference(queryParams, args.capture(), vm.env);
}

/**
  The `readonly` helper let's you specify that a binding is one-way only,
  instead of two-way.
  When you pass a `readonly` binding from an outer context (e.g. parent component),
  to to an inner context (e.g. child component), you are saying that changing that
  property in the inner context does not change the value in the outer context.

  To specify that a binding is read-only, when invoking the child `Component`:

  ```app/components/my-parent.js
  export default Component.extend({
    totalClicks: 3
  });
  ```

  ```app/templates/components/my-parent.hbs
  {{log totalClicks}} // -> 3
  <MyChild @childClickCount={{readonly totalClicks}} />
  ```
  ```
  {{my-child childClickCount=(readonly totalClicks)}}
  ```

  Now, when you update `childClickCount`:

  ```app/components/my-child.js
  export default Component.extend({
    click() {
      this.incrementProperty('childClickCount');
    }
  });
  ```

  The value updates in the child component, but not the parent component:

  ```app/templates/components/my-child.hbs
  {{log childClickCount}} //-> 4
  ```

  ```app/templates/components/my-parent.hbs
  {{log totalClicks}} //-> 3
  <MyChild @childClickCount={{readonly totalClicks}} />
  ```
  or
  ```app/templates/components/my-parent.hbs
  {{log totalClicks}} //-> 3
  {{my-child childClickCount=(readonly totalClicks)}}
  ```

  ### Objects and Arrays

  When passing a property that is a complex object (e.g. object, array) instead of a primitive object (e.g. number, string),
  only the reference to the object is protected using the readonly helper.
  This means that you can change properties of the object both on the parent component, as well as the child component.
  The `readonly` binding behaves similar to the `const` keyword in JavaScript.

  Let's look at an example:

  First let's set up the parent component:

  ```app/components/my-parent.js
  import Component from '@ember/component';

  export default Component.extend({
    clicks: null,

    init() {
      this._super(...arguments);
      this.set('clicks', { total: 3 });
    }
  });
  ```

  ```app/templates/components/my-parent.hbs
  {{log clicks.total}} //-> 3
  <MyChild @childClicks={{readonly clicks}} />
  ```
  ```app/templates/components/my-parent.hbs
  {{log clicks.total}} //-> 3
  {{my-child childClicks=(readonly clicks)}}
  ```

  Now, if you update the `total` property of `childClicks`:

  ```app/components/my-child.js
  import Component from '@ember/component';

  export default Component.extend({
    click() {
      this.get('clicks').incrementProperty('total');
    }
  });
  ```

  You will see the following happen:

  ```app/templates/components/my-parent.hbs
  {{log clicks.total}} //-> 4
  <MyChild @childClicks={{readonly clicks}} />
  ```
  or
  ```app/templates/components/my-parent.hbs
  {{log clicks.total}} //-> 4
  {{my-child childClicks=(readonly clicks)}}
  ```

  ```app/templates/components/my-child.hbs
  {{log childClicks.total}} //-> 4
  ```

  @method readonly
  @param {Object} [attr] the read-only attribute.
  @for Ember.Templates.helpers
  @private
*/

class ReadonlyReference extends RootReference {
  constructor(inner, env) {
    super(env);
    this.inner = inner;
    this.tag = inner.tag;
  }

  get [INVOKE]() {
    return this.inner[INVOKE];
  }

  value() {
    return this.inner.value();
  }

  get(key) {
    return this.inner.get(key);
  }

}

function readonly (args, vm) {
  let ref = unMut(args.positional.at(0));
  return new ReadonlyReference(ref, vm.env);
}

/**
@module ember
*/
/**
  The `{{unbound}}` helper disconnects the one-way binding of a property,
  essentially freezing its value at the moment of rendering. For example,
  in this example the display of the variable `name` will not change even
  if it is set with a new value:

  ```handlebars
  {{unbound this.name}}
  ```

  Like any helper, the `unbound` helper can accept a nested helper expression.
  This allows for custom helpers to be rendered unbound:

  ```handlebars
  {{unbound (some-custom-helper)}}
  {{unbound (capitalize this.name)}}
  {{! You can use any helper, including unbound, in a nested expression }}
  {{capitalize (unbound this.name)}}
  ```

  The `unbound` helper only accepts a single argument, and it return an
  unbound value.

  @method unbound
  @for Ember.Templates.helpers
  @public
*/

function unbound (args, vm) {
  assert('unbound helper cannot be called with multiple params or hash params', args.positional.length === 1 && args.named.length === 0);
  return new UnboundRootReference(args.positional.at(0).value(), vm.env);
}

const MODIFIERS = ['alt', 'shift', 'meta', 'ctrl'];
const POINTER_EVENT_TYPE_REGEX = /^click|mouse|touch/;

function isAllowedEvent(event, allowedKeys) {
  if (allowedKeys === null || allowedKeys === undefined) {
    if (POINTER_EVENT_TYPE_REGEX.test(event.type)) {
      return isSimpleClick(event);
    } else {
      allowedKeys = '';
    }
  }

  if (allowedKeys.indexOf('any') >= 0) {
    return true;
  }

  for (let i = 0; i < MODIFIERS.length; i++) {
    if (event[MODIFIERS[i] + 'Key'] && allowedKeys.indexOf(MODIFIERS[i]) === -1) {
      return false;
    }
  }

  return true;
}

let ActionHelper = {
  // registeredActions is re-exported for compatibility with older plugins
  // that were using this undocumented API.
  registeredActions: ActionManager.registeredActions,

  registerAction(actionState) {
    let {
      actionId
    } = actionState;
    ActionManager.registeredActions[actionId] = actionState;
    return actionId;
  },

  unregisterAction(actionState) {
    let {
      actionId
    } = actionState;
    delete ActionManager.registeredActions[actionId];
  }

};
class ActionState {
  constructor(element, actionId, actionName, actionArgs, namedArgs, positionalArgs, implicitTarget, dom, tag) {
    this.element = element;
    this.actionId = actionId;
    this.actionName = actionName;
    this.actionArgs = actionArgs;
    this.namedArgs = namedArgs;
    this.positional = positionalArgs;
    this.implicitTarget = implicitTarget;
    this.dom = dom;
    this.eventName = this.getEventName();
    this.tag = tag;
    registerDestructor(this, () => ActionHelper.unregisterAction(this));
  }

  getEventName() {
    return this.namedArgs.get('on').value() || 'click';
  }

  getActionArgs() {
    let result = new Array(this.actionArgs.length);

    for (let i = 0; i < this.actionArgs.length; i++) {
      result[i] = this.actionArgs[i].value();
    }

    return result;
  }

  getTarget() {
    let {
      implicitTarget,
      namedArgs
    } = this;
    let target;

    if (namedArgs.has('target')) {
      target = namedArgs.get('target').value();
    } else {
      target = implicitTarget.value();
    }

    return target;
  }

  handler(event) {
    let {
      actionName,
      namedArgs
    } = this;
    let bubbles = namedArgs.get('bubbles');
    let preventDefault = namedArgs.get('preventDefault');
    let allowedKeys = namedArgs.get('allowedKeys');
    let target = this.getTarget();
    let shouldBubble = bubbles.value() !== false;

    if (!isAllowedEvent(event, allowedKeys.value())) {
      return true;
    }

    if (preventDefault.value() !== false) {
      event.preventDefault();
    }

    if (!shouldBubble) {
      event.stopPropagation();
    }

    join(() => {
      let args = this.getActionArgs();
      let payload = {
        args,
        target,
        name: null
      };

      if (typeof actionName[INVOKE] === 'function') {
        flaggedInstrument('interaction.ember-action', payload, () => {
          actionName[INVOKE].apply(actionName, args);
        });
        return;
      }

      if (typeof actionName === 'function') {
        flaggedInstrument('interaction.ember-action', payload, () => {
          actionName.apply(target, args);
        });
        return;
      }

      payload.name = actionName;

      if (target.send) {
        flaggedInstrument('interaction.ember-action', payload, () => {
          target.send.apply(target, [actionName, ...args]);
        });
      } else {
        assert(`The action '${actionName}' did not exist on ${target}`, typeof target[actionName] === 'function');
        flaggedInstrument('interaction.ember-action', payload, () => {
          target[actionName].apply(target, args);
        });
      }
    });
    return shouldBubble;
  }

} // implements ModifierManager<Action>

class ActionModifierManager {
  create(element, _state, args, _dynamicScope, dom) {
    let {
      named,
      positional,
      tag
    } = args.capture();
    let implicitTarget;
    let actionName;
    let actionNameRef;

    if (positional.length > 1) {
      implicitTarget = positional.at(0);
      actionNameRef = positional.at(1);

      if (actionNameRef[INVOKE]) {
        actionName = actionNameRef;
      } else {
        let actionLabel = actionNameRef.propertyKey;
        actionName = actionNameRef.value();
        assert('You specified a quoteless path, `' + actionLabel + '`, to the ' + '{{action}} helper which did not resolve to an action name (a ' + 'string). Perhaps you meant to use a quoted actionName? (e.g. ' + '{{action "' + actionLabel + '"}}).', typeof actionName === 'string' || typeof actionName === 'function');
      }
    }

    let actionArgs = []; // The first two arguments are (1) `this` and (2) the action name.
    // Everything else is a param.

    for (let i = 2; i < positional.length; i++) {
      actionArgs.push(positional.at(i));
    }

    let actionId = uuid();
    let actionState = new ActionState(element, actionId, actionName, actionArgs, named, positional, implicitTarget, dom, tag);
    deprecate(`Using the \`{{action}}\` modifier with \`${actionState.eventName}\` events has been deprecated.`, actionState.eventName !== 'mouseEnter' && actionState.eventName !== 'mouseLeave' && actionState.eventName !== 'mouseMove', {
      id: 'ember-views.event-dispatcher.mouseenter-leave-move',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x#toc_action-mouseenter-leave-move'
    });
    return actionState;
  }

  install(actionState) {
    let {
      dom,
      element,
      actionId
    } = actionState;
    ActionHelper.registerAction(actionState);
    dom.setAttribute(element, 'data-ember-action', '');
    dom.setAttribute(element, `data-ember-action-${actionId}`, actionId);
  }

  update(actionState) {
    let {
      positional
    } = actionState;
    let actionNameRef = positional.at(1);

    if (!actionNameRef[INVOKE]) {
      actionState.actionName = actionNameRef.value();
    }

    actionState.eventName = actionState.getEventName();
  }

  getTag(actionState) {
    return actionState.tag;
  }

  getDestroyable(actionState) {
    return actionState;
  }

}

let debugRenderMessage;

if (DEBUG) {
  debugRenderMessage = renderingStack => {
    return `While rendering:\n----------------\n${renderingStack.replace(/^/gm, '  ')}`;
  };
}

var debugRenderMessage$1 = debugRenderMessage;

function capabilities$1(managerAPI, optionalFeatures = {}) {
  assert('Invalid modifier manager compatibility specified', managerAPI === '3.13');
  return {
    disableAutoTracking: Boolean(optionalFeatures.disableAutoTracking)
  };
}
class CustomModifierDefinition {
  constructor(name, ModifierClass, delegate, isInteractive) {
    this.name = name;
    this.ModifierClass = ModifierClass;
    this.delegate = delegate;
    this.state = {
      ModifierClass,
      name,
      delegate
    };
    this.manager = isInteractive ? CUSTOM_INTERACTIVE_MODIFIER_MANAGER : CUSTOM_NON_INTERACTIVE_MODIFIER_MANAGER;
  }

}
class CustomModifierState {
  constructor(element, delegate, modifier, args) {
    this.element = element;
    this.delegate = delegate;
    this.modifier = modifier;
    this.args = args;
    this.tag = createUpdatableTag();
    registerDestructor(this, () => delegate.destroyModifier(modifier, args.value()));
  }

}
/**
  The CustomModifierManager allows addons to provide custom modifier
  implementations that integrate seamlessly into Ember. This is accomplished
  through a delegate, registered with the custom modifier manager, which
  implements a set of hooks that determine modifier behavior.
  To create a custom modifier manager, instantiate a new CustomModifierManager
  class and pass the delegate as the first argument:

  ```js
  let manager = new CustomModifierManager({
    // ...delegate implementation...
  });
  ```

  ## Delegate Hooks

  Throughout the lifecycle of a modifier, the modifier manager will invoke
  delegate hooks that are responsible for surfacing those lifecycle changes to
  the end developer.
  * `createModifier()` - invoked when a new instance of a modifier should be created
  * `installModifier()` - invoked when the modifier is installed on the element
  * `updateModifier()` - invoked when the arguments passed to a modifier change
  * `destroyModifier()` - invoked when the modifier is about to be destroyed
*/

class InteractiveCustomModifierManager {
  create(element, definition, args) {
    let {
      delegate,
      ModifierClass
    } = definition;
    const capturedArgs = args.capture();
    let instance = definition.delegate.createModifier(ModifierClass, capturedArgs.value());
    return new CustomModifierState(element, delegate, instance, capturedArgs);
  }

  getTag({
    args,
    tag
  }) {
    return combine([tag, args.tag]);
  }

  install(state) {
    let {
      element,
      args,
      delegate,
      modifier,
      tag
    } = state;
    assert('Custom modifier managers must define their capabilities using the capabilities() helper function', typeof delegate.capabilities === 'object' && delegate.capabilities !== null);
    let {
      capabilities
    } = delegate;

    if (capabilities.disableAutoTracking === true) {
      untrack(() => delegate.installModifier(modifier, element, args.value()));
    } else {
      let combinedTrackingTag = track(() => delegate.installModifier(modifier, element, args.value()), DEBUG && debugRenderMessage$1(`(instance of a \`${getDebugName(modifier)}\` modifier)`));
      updateTag(tag, combinedTrackingTag);
    }
  }

  update(state) {
    let {
      args,
      delegate,
      modifier,
      tag
    } = state;
    let {
      capabilities
    } = delegate;

    if (capabilities.disableAutoTracking === true) {
      untrack(() => delegate.updateModifier(modifier, args.value()));
    } else {
      let combinedTrackingTag = track(() => delegate.updateModifier(modifier, args.value()), DEBUG && debugRenderMessage$1(`(instance of a \`${getDebugName(modifier)}\` modifier)`));
      updateTag(tag, combinedTrackingTag);
    }
  }

  getDestroyable(state) {
    return state;
  }

}

class NonInteractiveCustomModifierManager {
  create() {
    return null;
  }

  getTag() {
    return CONSTANT_TAG;
  }

  install() {}

  update() {}

  getDestroyable() {
    return null;
  }

}

const CUSTOM_INTERACTIVE_MODIFIER_MANAGER = new InteractiveCustomModifierManager();
const CUSTOM_NON_INTERACTIVE_MODIFIER_MANAGER = new NonInteractiveCustomModifierManager();

const untouchableContext = buildUntouchableThis('`on` modifier');
/**
@module ember
*/

/*
  Internet Explorer 11 does not support `once` and also does not support
  passing `eventOptions`. In some situations it then throws a weird script
  error, like:

  ```
  Could not complete the operation due to error 80020101
  ```

  This flag determines, whether `{ once: true }` and thus also event options in
  general are supported.
*/

const SUPPORTS_EVENT_OPTIONS = (() => {
  try {
    const div = document.createElement('div');
    let counter = 0;
    div.addEventListener('click', () => counter++, {
      once: true
    });
    let event;

    if (typeof Event === 'function') {
      event = new Event('click');
    } else {
      event = document.createEvent('Event');
      event.initEvent('click', true, true);
    }

    div.dispatchEvent(event);
    div.dispatchEvent(event);
    return counter === 1;
  } catch (error) {
    return false;
  }
})();

class OnModifierState {
  constructor(owner, element, args) {
    this.shouldUpdate = true;
    this.owner = owner;
    this.element = element;
    this.args = args;
    this.tag = args.tag;
  }

  updateFromArgs() {
    let {
      args
    } = this;
    let {
      once,
      passive,
      capture
    } = args.named.value();

    if (once !== this.once) {
      this.once = once;
      this.shouldUpdate = true;
    }

    if (passive !== this.passive) {
      this.passive = passive;
      this.shouldUpdate = true;
    }

    if (capture !== this.capture) {
      this.capture = capture;
      this.shouldUpdate = true;
    }

    let options;

    if (once || passive || capture) {
      options = this.options = {
        once,
        passive,
        capture
      };
    } else {
      this.options = undefined;
    }

    assert('You must pass a valid DOM event name as the first argument to the `on` modifier', args.positional.at(0) !== undefined && typeof args.positional.at(0).value() === 'string');
    let eventName = args.positional.at(0).value();

    if (eventName !== this.eventName) {
      this.eventName = eventName;
      this.shouldUpdate = true;
    }

    let userProvidedCallbackReference = args.positional.at(1);

    if (DEBUG) {
      assert(`You must pass a function as the second argument to the \`on\` modifier.`, args.positional.at(1) !== undefined); // hardcoding `renderer:-dom` here because we guard for `this.isInteractive` before instantiating OnModifierState, it can never be created when the renderer is `renderer:-inert`

      let renderer = expect(this.owner.lookup('renderer:-dom'), `BUG: owner is missing renderer:-dom`);
      let stack = renderer.debugRenderTree.logRenderStackForPath(userProvidedCallbackReference);
      let value = userProvidedCallbackReference.value();
      assert(`You must pass a function as the second argument to the \`on\` modifier, you passed ${value === null ? 'null' : typeof value}. While rendering:\n\n${stack}`, typeof value === 'function');
    }

    let userProvidedCallback = userProvidedCallbackReference.value();

    if (userProvidedCallback !== this.userProvidedCallback) {
      this.userProvidedCallback = userProvidedCallback;
      this.shouldUpdate = true;
    }

    assert(`You can only pass two positional arguments (event name and callback) to the \`on\` modifier, but you provided ${args.positional.length}. Consider using the \`fn\` helper to provide additional arguments to the \`on\` callback.`, args.positional.length === 2);
    let needsCustomCallback = SUPPORTS_EVENT_OPTIONS === false && once ||
    /* needs manual once implementation */
    DEBUG && passive
    /* needs passive enforcement */
    ;

    if (this.shouldUpdate) {
      if (needsCustomCallback) {
        let callback = this.callback = function (event) {
          if (DEBUG && passive) {
            event.preventDefault = () => {
              assert(`You marked this listener as 'passive', meaning that you must not call 'event.preventDefault()': \n\n${userProvidedCallback}`);
            };
          }

          if (!SUPPORTS_EVENT_OPTIONS && once) {
            removeEventListener(this, eventName, callback, options);
          }

          return userProvidedCallback.call(untouchableContext, event);
        };
      } else if (DEBUG) {
        // prevent the callback from being bound to the element
        this.callback = userProvidedCallback.bind(untouchableContext);
      } else {
        this.callback = userProvidedCallback;
      }
    }
  }

}
let adds = 0;
let removes = 0;

function removeEventListener(element, eventName, callback, options) {
  removes++;

  if (SUPPORTS_EVENT_OPTIONS) {
    // when options are supported, use them across the board
    element.removeEventListener(eventName, callback, options);
  } else if (options !== undefined && options.capture) {
    // used only in the following case:
    //
    // `{ once: true | false, passive: true | false, capture: true }
    //
    // `once` is handled via a custom callback that removes after first
    // invocation so we only care about capture here as a boolean
    element.removeEventListener(eventName, callback, true);
  } else {
    // used only in the following cases:
    //
    // * where there is no options
    // * `{ once: true | false, passive: true | false, capture: false }
    element.removeEventListener(eventName, callback);
  }
}

function addEventListener(element, eventName, callback, options) {
  adds++;

  if (SUPPORTS_EVENT_OPTIONS) {
    // when options are supported, use them across the board
    element.addEventListener(eventName, callback, options);
  } else if (options !== undefined && options.capture) {
    // used only in the following case:
    //
    // `{ once: true | false, passive: true | false, capture: true }
    //
    // `once` is handled via a custom callback that removes after first
    // invocation so we only care about capture here as a boolean
    element.addEventListener(eventName, callback, true);
  } else {
    // used only in the following cases:
    //
    // * where there is no options
    // * `{ once: true | false, passive: true | false, capture: false }
    element.addEventListener(eventName, callback);
  }
}
/**
  The `{{on}}` modifier lets you easily add event listeners (it uses
  [EventTarget.addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener)
  internally).

  For example, if you'd like to run a function on your component when a `<button>`
  in the components template is clicked you might do something like:

  ```app/components/like-post.hbs
  <button {{on 'click' this.saveLike}}>Like this post!</button>
  ```

  ```app/components/like-post.js
  import Component from '@glimmer/component';
  import { action } from '@ember/object';

  export default class LikePostComponent extends Component {
    @action
    saveLike() {
      // someone likes your post!
      // better send a request off to your server...
    }
  }
  ```

  ### Arguments

  `{{on}}` accepts two positional arguments, and a few named arguments.

  The positional arguments are:

  - `event` -- the name to use when calling `addEventListener`
  - `callback` -- the function to be passed to `addEventListener`

  The named arguments are:

  - capture -- a `true` value indicates that events of this type will be dispatched
    to the registered listener before being dispatched to any EventTarget beneath it
    in the DOM tree.
  - once -- indicates that the listener should be invoked at most once after being
    added. If true, the listener would be automatically removed when invoked.
  - passive -- if `true`, indicates that the function specified by listener will never
    call preventDefault(). If a passive listener does call preventDefault(), the user
    agent will do nothing other than generate a console warning. See
    [Improving scrolling performance with passive listeners](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners)
    to learn more.

  The callback function passed to `{{on}}` will receive any arguments that are passed
  to the event handler. Most commonly this would be the `event` itself.

  If you would like to pass additional arguments to the function you should use
  the `{{fn}}` helper.

  For example, in our example case above if you'd like to pass in the post that
  was being liked when the button is clicked you could do something like:

  ```app/components/like-post.hbs
  <button {{on 'click' (fn this.saveLike @post)}}>Like this post!</button>
  ```

  In this case, the `saveLike` function will receive two arguments: the click event
  and the value of `@post`.

  ### Function Context

  In the example above, we used `@action` to ensure that `likePost` is
  properly bound to the `items-list`, but let's explore what happens if we
  left out `@action`:

  ```app/components/like-post.js
  import Component from '@glimmer/component';

  export default class LikePostComponent extends Component {
    saveLike() {
      // ...snip...
    }
  }
  ```

  In this example, when the button is clicked `saveLike` will be invoked,
  it will **not** have access to the component instance. In other
  words, it will have no `this` context, so please make sure your functions
  are bound (via `@action` or other means) before passing into `on`!

  @method on
  @for Ember.Templates.helpers
  @public
  @since 3.11.0
*/


class OnModifierManager {
  constructor(owner, isInteractive) {
    this.SUPPORTS_EVENT_OPTIONS = SUPPORTS_EVENT_OPTIONS;
    this.isInteractive = isInteractive;
    this.owner = owner;
  }

  get counters() {
    return {
      adds,
      removes
    };
  }

  create(element, _state, args) {
    if (!this.isInteractive) {
      return null;
    }

    const capturedArgs = args.capture();
    return new OnModifierState(this.owner, element, capturedArgs);
  }

  getTag(state) {
    if (state === null) {
      return CONSTANT_TAG;
    }

    return state.tag;
  }

  install(state) {
    if (state === null) {
      return;
    }

    state.updateFromArgs();
    let {
      element,
      eventName,
      callback,
      options
    } = state;
    addEventListener(element, eventName, callback, options);
    registerDestructor(state, () => removeEventListener(element, eventName, callback, options));
    state.shouldUpdate = false;
  }

  update(state) {
    if (state === null) {
      return;
    } // stash prior state for el.removeEventListener


    let {
      element,
      eventName,
      callback,
      options
    } = state;
    state.updateFromArgs();

    if (!state.shouldUpdate) {
      return;
    } // use prior state values for removal


    removeEventListener(element, eventName, callback, options); // read updated values from the state object

    addEventListener(state.element, state.eventName, state.callback, state.options);
    state.shouldUpdate = false;
  }

  getDestroyable(state) {
    return state;
  }

}

const CAPABILITIES$3 = {
  dynamicLayout: true,
  dynamicTag: false,
  prepareArgs: false,
  createArgs: true,
  attributeHook: false,
  elementHook: false,
  createCaller: true,
  dynamicScope: true,
  updateHook: true,
  createInstance: true,
  wrapped: false,
  willDestroy: false
}; // TODO
// This "disables" the "@model" feature by making the arg untypable syntatically
// Delete this when EMBER_ROUTING_MODEL_ARG has shipped

const MODEL_ARG_NAME = 'model';

class MountManager extends AbstractManager {
  getJitDynamicLayout(state, _) {
    let templateFactory$$1 = state.engine.lookup('template:application');
    let template = templateFactory$$1(state.engine);

    if (ENV._DEBUG_RENDER_TREE) {
      state.environment.extra.debugRenderTree.setTemplate(state.controller, template);
    }

    return template;
  }

  getCapabilities() {
    return CAPABILITIES$3;
  }

  create(environment, {
    name
  }, args) {
    // TODO
    // mount is a runtime helper, this shouldn't use dynamic layout
    // we should resolve the engine app template in the helper
    // it also should use the owner that looked up the mount helper.
    let engine = environment.extra.owner.buildChildEngineInstance(name);
    engine.boot();
    let applicationFactory = engine.factoryFor(`controller:application`);
    let controllerFactory = applicationFactory || generateControllerFactory(engine, 'application');
    let controller;
    let self;
    let bucket;
    let modelRef;

    if (args.named.has(MODEL_ARG_NAME)) {
      modelRef = args.named.get(MODEL_ARG_NAME);
    }

    if (modelRef === undefined) {
      controller = controllerFactory.create();
      self = new ComponentRootReference(controller, environment);
      bucket = {
        engine,
        controller,
        self,
        environment
      };
    } else {
      let model = modelRef.value();
      controller = controllerFactory.create({
        model
      });
      self = new ComponentRootReference(controller, environment);
      bucket = {
        engine,
        controller,
        self,
        modelRef,
        environment
      };
    }

    if (ENV._DEBUG_RENDER_TREE) {
      environment.extra.debugRenderTree.create(bucket, {
        type: 'engine',
        name,
        args: args.capture(),
        instance: engine,
        template: undefined
      });
      environment.extra.debugRenderTree.create(controller, {
        type: 'route-template',
        name: 'application',
        args: args.capture(),
        instance: controller,
        // set in getDynamicLayout
        template: undefined
      });
      registerDestructor(engine, () => {
        environment.extra.debugRenderTree.willDestroy(controller);
        environment.extra.debugRenderTree.willDestroy(bucket);
      });
    }

    return bucket;
  }

  getSelf({
    self
  }) {
    return self;
  }

  getTag(state) {
    let tag = CONSTANT_TAG;

    if (state.modelRef) {
      tag = state.modelRef.tag;
    }

    if (ENV._DEBUG_RENDER_TREE && isConstTag(tag)) {
      tag = createTag();
    }

    return tag;
  }

  getDestroyable(bucket) {
    return bucket.engine;
  }

  didRenderLayout(bucket, bounds) {
    if (ENV._DEBUG_RENDER_TREE) {
      bucket.environment.extra.debugRenderTree.didRender(bucket.controller, bounds);
      bucket.environment.extra.debugRenderTree.didRender(bucket, bounds);
    }
  }

  update(bucket) {
    let {
      controller,
      environment,
      modelRef
    } = bucket;

    if (modelRef !== undefined) {
      controller.set('model', modelRef.value());
    }

    if (ENV._DEBUG_RENDER_TREE) {
      environment.extra.debugRenderTree.update(bucket);
      environment.extra.debugRenderTree.update(bucket.controller);
    }
  }

  didUpdateLayout(bucket, bounds) {
    if (ENV._DEBUG_RENDER_TREE) {
      bucket.environment.extra.debugRenderTree.didRender(bucket.controller, bounds);
      bucket.environment.extra.debugRenderTree.didRender(bucket, bounds);
    }
  }

}

const MOUNT_MANAGER = new MountManager();
class MountDefinition {
  constructor(name) {
    this.manager = MOUNT_MANAGER;
    this.state = {
      name
    };
  }

}

/**
@module ember
*/
function mountHelper(args, vm) {
  let env = vm.env;
  let nameRef = args.positional.at(0);
  let captured = null;
  assert('You can only pass a single positional argument to the {{mount}} helper, e.g. {{mount "chat-engine"}}.', args.positional.length === 1);

  if (DEBUG && args.named) {
    let keys = args.named.names;
    let extra = keys.filter(k => k !== 'model');
    assert('You can only pass a `model` argument to the {{mount}} helper, ' + 'e.g. {{mount "profile-engine" model=this.profile}}. ' + `You passed ${extra.join(',')}.`, extra.length === 0);
  } // TODO: the functionality to create a proper CapturedArgument should be
  // exported by glimmer, or that it should provide an overload for `curry`
  // that takes `PreparedArguments`


  if (args.named.has('model')) {
    assert('[BUG] this should already be checked by the macro', args.named.length === 1);
    let named = args.named.capture();
    let {
      tag
    } = named; // TODO delete me after EMBER_ROUTING_MODEL_ARG has shipped

    if (DEBUG && MODEL_ARG_NAME !== 'model') {
      assert('[BUG] named._map is not null', named['_map'] === null);
      named.names = [MODEL_ARG_NAME];
    }

    captured = {
      tag,
      positional: EMPTY_ARGS.positional,
      named,
      length: 1,

      value() {
        return {
          named: this.named.value(),
          positional: this.positional.value()
        };
      }

    };
  }

  return new DynamicEngineReference(nameRef, env, captured);
}
/**
  The `{{mount}}` helper lets you embed a routeless engine in a template.
  Mounting an engine will cause an instance to be booted and its `application`
  template to be rendered.

  For example, the following template mounts the `ember-chat` engine:

  ```handlebars
  {{! application.hbs }}
  {{mount "ember-chat"}}
  ```

  Additionally, you can also pass in a `model` argument that will be
  set as the engines model. This can be an existing object:

  ```
  <div>
    {{mount 'admin' model=userSettings}}
  </div>
  ```

  Or an inline `hash`, and you can even pass components:

  ```
  <div>
    <h1>Application template!</h1>
    {{mount 'admin' model=(hash
        title='Secret Admin'
        signInButton=(component 'sign-in-button')
    )}}
  </div>
  ```

  @method mount
  @param {String} name Name of the engine to mount.
  @param {Object} [model] Object that will be set as
                          the model of the engine.
  @for Ember.Templates.helpers
  @public
*/

class DynamicEngineReference {
  constructor(nameRef, env, args) {
    this.nameRef = nameRef;
    this.env = env;
    this.args = args;
    this._lastName = null;
    this._lastDef = null;
    this.tag = nameRef.tag;
  }

  value() {
    let {
      env,
      nameRef,
      args
    } = this;
    let name = nameRef.value();

    if (typeof name === 'string') {
      if (this._lastName === name) {
        return this._lastDef;
      }

      assert(`You used \`{{mount '${name}'}}\`, but the engine '${name}' can not be found.`, env.extra.owner.hasRegistration(`engine:${name}`));

      if (!env.extra.owner.hasRegistration(`engine:${name}`)) {
        return null;
      }

      this._lastName = name;
      this._lastDef = curry(new MountDefinition(name), args);
      return this._lastDef;
    } else {
      assert(`Invalid engine name '${name}' specified, engine name must be either a string, null or undefined.`, name === null || name === undefined);
      this._lastDef = null;
      this._lastName = null;
      return null;
    }
  }

  get() {
    return UNDEFINED_REFERENCE;
  }

}

/**
 * Represents the root outlet.
 */

class RootOutletReference {
  constructor(outletState) {
    this.outletState = outletState;
    this.tag = createTag();
  }

  get(key) {
    return new PathReference(this, key);
  }

  value() {
    return this.outletState;
  }

  update(state) {
    this.outletState.outlets.main = state;
    dirtyTag(this.tag);
  }

}
/**
 * Represents the connected outlet.
 */

class OutletReference {
  constructor(parentStateRef, outletNameRef) {
    this.parentStateRef = parentStateRef;
    this.outletNameRef = outletNameRef;
    this.tag = combine([parentStateRef.tag, outletNameRef.tag]);
  }

  value() {
    let outletState = this.parentStateRef.value();
    let outlets = outletState === undefined ? undefined : outletState.outlets;
    return outlets === undefined ? undefined : outlets[this.outletNameRef.value()];
  }

  get(key) {
    return new PathReference(this, key);
  }

}
/**
 * Outlet state is dirtied from root.
 * This just using the parent tag for dirtiness.
 */

class PathReference {
  constructor(parent, key) {
    this.parent = parent;
    this.key = key;
    this.tag = parent.tag;
  }

  get(key) {
    return new PathReference(this, key);
  }

  value() {
    let parent = this.parent.value();
    return parent && parent[this.key];
  }

}

/**
  The `{{outlet}}` helper lets you specify where a child route will render in
  your template. An important use of the `{{outlet}}` helper is in your
  application's `application.hbs` file:

  ```app/templates/application.hbs
  <MyHeader />

  <div class="my-dynamic-content">
    <!-- this content will change based on the current route, which depends on the current URL -->
    {{outlet}}
  </div>

  <MyFooter />
  ```

  You may also specify a name for the `{{outlet}}`, which is useful when using more than one
  `{{outlet}}` in a template:

  ```app/templates/application.hbs
  {{outlet "menu"}}
  {{outlet "sidebar"}}
  {{outlet "main"}}
  ```

  Your routes can then render into a specific one of these `outlet`s by specifying the `outlet`
  attribute in your `renderTemplate` function:

  ```app/routes/menu.js
  import Route from '@ember/routing/route';

  export default class MenuRoute extends Route {
    renderTemplate() {
      this.render({ outlet: 'menu' });
    }
  }
  ```

  See the [routing guide](https://guides.emberjs.com/release/routing/rendering-a-template/) for more
  information on how your `route` interacts with the `{{outlet}}` helper.
  Note: Your content __will not render__ if there isn't an `{{outlet}}` for it.

  @method outlet
  @param {String} [name]
  @for Ember.Templates.helpers
  @public
*/

function outletHelper(args, vm) {
  let scope = vm.dynamicScope();
  let nameRef;

  if (args.positional.length === 0) {
    nameRef = new ConstReference('main');
  } else {
    nameRef = args.positional.at(0);
  }

  return new OutletComponentReference(new OutletReference(scope.outletState, nameRef), vm.env);
}

class OutletModelReference extends RootReference {
  constructor(parent, env) {
    super(env);
    this.parent = parent;
    this.tag = parent.tag;
  }

  value() {
    let state = this.parent.value();

    if (state === undefined) {
      return undefined;
    }

    let {
      render
    } = state;

    if (render === undefined) {
      return undefined;
    }

    return render.model;
  }

}

if (DEBUG) {
  OutletModelReference.prototype['debugLogName'] = '@model';
}

class OutletComponentReference {
  constructor(outletRef, env) {
    this.outletRef = outletRef;
    this.env = env;
    this.definition = null;
    this.lastState = null; // The router always dirties the root state.

    this.tag = outletRef.tag;
  }

  value() {
    let state = stateFor(this.outletRef);

    if (validate(state, this.lastState)) {
      return this.definition;
    }

    this.lastState = state;
    let definition = null;

    if (state !== null) {
      let args = makeArgs(this.outletRef, this.env);
      definition = curry(new OutletComponentDefinition(state), args);
    }

    return this.definition = definition;
  }

  get(_key) {
    return UNDEFINED_REFERENCE;
  }

}

function makeArgs(outletRef, env) {
  let tag = outletRef.tag;
  let modelRef = new OutletModelReference(outletRef, env);
  let map = dict();
  map.model = modelRef; // TODO: the functionailty to create a proper CapturedArgument should be
  // exported by glimmer, or that it should provide an overload for `curry`
  // that takes `PreparedArguments`

  return {
    tag,
    positional: EMPTY_ARGS.positional,
    named: {
      tag,
      map,
      names: ['model'],
      references: [modelRef],
      length: 1,

      has(key) {
        return key === 'model';
      },

      get(key) {
        return key === 'model' ? modelRef : UNDEFINED_REFERENCE;
      },

      value() {
        let model = modelRef.value();
        return {
          model
        };
      }

    },
    length: 1,

    value() {
      return {
        named: this.named.value(),
        positional: this.positional.value()
      };
    }

  };
}

function stateFor(ref) {
  let outlet = ref.value();
  if (outlet === undefined) return null;
  let render = outlet.render;
  if (render === undefined) return null;
  let template$$1 = render.template;
  if (template$$1 === undefined) return null; // this guard can be removed once @ember/test-helpers@1.6.0 has "aged out"
  // and is no longer considered supported

  if (isTemplateFactory(template$$1)) {
    template$$1 = template$$1(render.owner);
  }

  return {
    ref,
    name: render.name,
    outlet: render.outlet,
    template: template$$1,
    controller: render.controller,
    model: render.model
  };
}

function validate(state, lastState) {
  if (state === null) {
    return lastState === null;
  }

  if (lastState === null) {
    return false;
  }

  return state.template === lastState.template && state.controller === lastState.controller;
}

const TEMPLATES = new WeakMap();
const getPrototypeOf = Object.getPrototypeOf;
function setComponentTemplate(factory, obj) {
  assert(`Cannot call \`setComponentTemplate\` on \`${toString(obj)}\``, obj !== null && (typeof obj === 'object' || typeof obj === 'function'));
  assert(`Cannot call \`setComponentTemplate\` multiple times on the same class (\`${obj}\`)`, !TEMPLATES.has(obj));
  TEMPLATES.set(obj, factory);
  return obj;
}
function getComponentTemplate(obj) {
  let pointer = obj;

  while (pointer !== undefined && pointer !== null) {
    let template = TEMPLATES.get(pointer);

    if (template !== undefined) {
      return template;
    }

    pointer = getPrototypeOf(pointer);
  }

  return null;
}

const MANAGERS = new WeakMap();
const getPrototypeOf$1 = Object.getPrototypeOf;
function setManager(wrapper, obj) {
  MANAGERS.set(obj, wrapper);
  return obj;
}
function getManager(obj) {
  let pointer = obj;

  while (pointer !== undefined && pointer !== null) {
    let manager = MANAGERS.get(pointer);

    if (manager !== undefined) {
      return manager;
    }

    pointer = getPrototypeOf$1(pointer);
  }

  return null;
}

function setModifierManager(factory, obj) {
  return setManager({
    factory,
    internal: false,
    type: 'modifier'
  }, obj);
}
function getModifierManager(obj) {
  let wrapper = getManager(obj);

  if (wrapper && !wrapper.internal && wrapper.type === 'modifier') {
    return wrapper.factory;
  } else {
    return undefined;
  }
}

function instrumentationPayload$1(name) {
  return {
    object: `component:${name}`
  };
}

function makeOptions(moduleName, namespace) {
  return {
    source: moduleName !== undefined ? `template:${moduleName}` : undefined,
    namespace
  };
}

function componentFor(name, owner, options) {
  let fullName = `component:${name}`;
  return owner.factoryFor(fullName, options) || null;
}

function layoutFor(name, owner, options) {
  let templateFullName = `template:components/${name}`;
  return owner.lookup(templateFullName, options) || null;
}

function lookupComponentPair(owner, name, options) {
  let component = componentFor(name, owner, options);

  {
    if (component !== null && component.class !== undefined) {
      let layout = getComponentTemplate(component.class);

      if (layout !== null) {
        return {
          component,
          layout
        };
      }
    }
  }

  let layout = layoutFor(name, owner, options);

  if (component === null && layout === null) {
    return null;
  } else {
    return {
      component,
      layout
    };
  }
}

function lookupComponent(owner, name, options) {
  if (options.source || options.namespace) {

    let pair = lookupComponentPair(owner, name, options);

    if (pair !== null) {
      return pair;
    }
  }

  return lookupComponentPair(owner, name);
}

let lookupPartial;
let templateFor;
let parseUnderscoredName;

if (PARTIALS) {
  lookupPartial = function (templateName, owner) {
    deprecate(`The use of \`{{partial}}\` is deprecated, please refactor the "${templateName}" partial to a component`, false, {
      id: 'ember-views.partial',
      until: '4.0.0',
      url: 'https://deprecations.emberjs.com/v3.x#toc_ember-views-partial'
    });

    if (templateName === null) {
      return;
    }

    let template = templateFor(owner, parseUnderscoredName(templateName), templateName);
    assert(`Unable to find partial with name "${templateName}"`, Boolean(template));
    return template;
  };

  templateFor = function (owner, underscored, name) {
    if (PARTIALS) {
      if (!name) {
        return;
      }

      assert(`templateNames are not allowed to contain periods: ${name}`, name.indexOf('.') === -1);

      if (!owner) {
        throw new EmberError('Container was not found when looking up a views template. ' + 'This is most likely due to manually instantiating an Ember.View. ' + 'See: http://git.io/EKPpnA');
      }

      return owner.lookup(`template:${underscored}`) || owner.lookup(`template:${name}`);
    }
  };

  parseUnderscoredName = function (templateName) {
    let nameParts = templateName.split('/');
    let lastPart = nameParts[nameParts.length - 1];
    nameParts[nameParts.length - 1] = `_${lastPart}`;
    return nameParts.join('/');
  };
}

const BUILTINS_HELPERS = {
  if: inlineIf,
  action,
  array,
  concat: concat$1,
  fn: fn$1,
  get: get$1,
  hash,
  log: log$1,
  mut,
  'query-params': queryParams$1,
  readonly,
  unbound,
  unless: inlineUnless,
  '-hash': hash,
  '-each-in': eachIn,
  '-input-type': inputTypeHelper$1,
  '-normalize-class': normalizeClassHelper,
  '-track-array': trackArray,
  '-get-dynamic-var': getDynamicVar,
  '-mount': mountHelper,
  '-outlet': outletHelper,
  '-assert-implicit-component-helper-argument': componentAssertionHelper,
  '-in-el-null': inElementNullCheckHelper
};
class RuntimeResolver {
  constructor(owner, isInteractive) {
    this.handles = [undefined];
    this.objToHandle = new WeakMap();
    this.builtInHelpers = BUILTINS_HELPERS;
    this.componentDefinitionCache = new Map();
    this.componentDefinitionCount = 0;
    this.helperDefinitionCount = 0;
    this.isInteractive = isInteractive;
    this.builtInModifiers = {
      action: {
        manager: new ActionModifierManager(),
        state: null
      },
      on: {
        manager: new OnModifierManager(owner, isInteractive),
        state: null
      }
    };
  }
  /***  IRuntimeResolver ***/

  /**
   * public componentDefHandleCount = 0;
   * Called while executing Append Op.PushDynamicComponentManager if string
   */


  lookupComponent(name, meta) {
    let handle = this.lookupComponentHandle(name, meta);

    if (handle === null) {
      assert(`Could not find component named "${name}" (no component or template with that name was found)`);
      return null;
    }

    return this.resolve(handle);
  }

  lookupComponentHandle(name, meta) {
    let nextHandle = this.handles.length;
    let handle = this.handle(this._lookupComponentDefinition(name, meta));
    assert('Could not find component `<TextArea />` (did you mean `<Textarea />`?)', !(name === 'text-area' && handle === null));

    if (nextHandle === handle) {
      this.componentDefinitionCount++;
    }

    return handle;
  }
  /**
   * Called by RuntimeConstants to lookup unresolved handles.
   */


  resolve(handle) {
    return this.handles[handle];
  } // End IRuntimeResolver

  /**
   * Called by CompileTimeLookup compiling Unknown or Helper OpCode
   */


  lookupHelper(name, meta) {
    let nextHandle = this.handles.length;

    let helper$$1 = this._lookupHelper(name, meta);

    if (helper$$1 !== null) {
      let handle = this.handle(helper$$1);

      if (nextHandle === handle) {
        this.helperDefinitionCount++;
      }

      return handle;
    }

    return null;
  }
  /**
   * Called by CompileTimeLookup compiling the
   */


  lookupModifier(name, meta) {
    return this.handle(this._lookupModifier(name, meta));
  }
  /**
   * Called by CompileTimeLookup to lookup partial
   */


  lookupPartial(name, meta) {
    if (PARTIALS) {
      let partial = this._lookupPartial(name, meta);

      return this.handle(partial);
    } else {
      return null;
    }
  } // TODO: This isn't necessary in all embedding environments, we should likely
  // make it optional within Glimmer-VM


  compilable() {} // end CompileTimeLookup
  // needed for lazy compile time lookup


  handle(obj) {
    if (obj === undefined || obj === null) {
      return null;
    }

    let handle = this.objToHandle.get(obj);

    if (handle === undefined) {
      handle = this.handles.push(obj) - 1;
      this.objToHandle.set(obj, handle);
    }

    return handle;
  }

  _lookupHelper(_name, meta) {
    assert(`You attempted to overwrite the built-in helper "${_name}" which is not allowed. Please rename the helper.`, !(this.builtInHelpers[_name] && meta.owner.hasRegistration(`helper:${_name}`)));
    const helper$$1 = this.builtInHelpers[_name];

    if (helper$$1 !== undefined) {
      return helper$$1;
    }

    const {
      moduleName
    } = meta;
    let owner = meta.owner;
    let name = _name;
    let namespace = undefined;

    const options = makeOptions(moduleName, namespace);
    const factory = owner.factoryFor(`helper:${name}`, options) || owner.factoryFor(`helper:${name}`);

    if (!isHelperFactory(factory)) {
      return null;
    }

    return (args, vm) => {
      const helper$$1 = factory.create();

      if (isClassHelper(helper$$1)) {
        let helperDestroyable = {}; // Do this so that `destroy` gets called correctly

        registerDestructor(helperDestroyable, () => helper$$1.destroy(), true);
        vm.associateDestroyable(helperDestroyable);
      } else if (DEBUG) {
        // Bind to null in case someone accidentally passed an unbound function
        // in, and attempts use `this` on it.
        //
        // TODO: Update buildUntouchableThis to be flexible enough to provide a
        // nice error message here.
        helper$$1.compute = helper$$1.compute.bind(null);
      }

      return new EmberHelperRootReference(helper$$1, args.capture(), vm.env);
    };
  }

  _lookupPartial(name, meta) {
    let owner = meta.owner;
    let templateFactory$$1 = lookupPartial(name, owner);
    let template = templateFactory$$1(owner);
    return new PartialDefinitionImpl(name, template);
  }

  _lookupModifier(name, meta) {
    let builtin = this.builtInModifiers[name];

    if (builtin === undefined) {
      let owner = meta.owner;
      let modifier = owner.factoryFor(`modifier:${name}`);

      if (modifier !== undefined) {
        let managerFactory = getModifierManager(modifier.class);
        let manager = managerFactory(owner);
        return new CustomModifierDefinition(name, modifier, manager, this.isInteractive);
      }
    }

    return builtin;
  }

  _parseNameForNamespace(_name) {
    let name = _name;
    let namespace = undefined;

    let namespaceDelimiterOffset = _name.indexOf('::');

    if (namespaceDelimiterOffset !== -1) {
      name = _name.slice(namespaceDelimiterOffset + 2);
      namespace = _name.slice(0, namespaceDelimiterOffset);
    }

    return {
      name,
      namespace
    };
  }

  _lookupComponentDefinition(_name, meta) {
    let name = _name;
    let namespace = undefined;
    let owner = meta.owner;
    let {
      moduleName
    } = meta;

    let pair = lookupComponent(owner, name, makeOptions(moduleName, namespace));

    if (pair === null) {
      return null;
    }

    let layout;
    let key;

    if (pair.component === null) {
      key = layout = pair.layout(owner);
    } else {
      key = pair.component;
    }

    let cachedComponentDefinition = this.componentDefinitionCache.get(key);

    if (cachedComponentDefinition !== undefined) {
      return cachedComponentDefinition;
    }

    if (layout === undefined && pair.layout !== null) {
      layout = pair.layout(owner);
    }

    let finalizer = _instrumentStart('render.getComponentDefinition', instrumentationPayload$1, name);

    let definition = null;

    if (pair.component === null) {
      if (ENV._TEMPLATE_ONLY_GLIMMER_COMPONENTS) {
        definition = new TemplateOnlyComponentDefinition(name, layout);
      }
    } else if (true
    /* EMBER_GLIMMER_SET_COMPONENT_TEMPLATE */
    && isTemplateOnlyComponent(pair.component.class)) {
      definition = new TemplateOnlyComponentDefinition(name, layout);
    }

    if (pair.component !== null) {
      assert(`missing component class ${name}`, pair.component.class !== undefined);
      let ComponentClass = pair.component.class;
      let wrapper = getManager(ComponentClass);

      if (wrapper !== null && wrapper.type === 'component') {
        let {
          factory
        } = wrapper;

        if (wrapper.internal) {
          assert(`missing layout for internal component ${name}`, pair.layout !== null);
          definition = new InternalComponentDefinition(factory(owner), ComponentClass, layout);
        } else {
          definition = new CustomManagerDefinition(name, pair.component, factory(owner), layout !== undefined ? layout : owner.lookup(privatize`template:components/-default`)(owner));
        }
      }
    }

    if (definition === null) {
      definition = new CurlyComponentDefinition(name, pair.component || owner.factoryFor(privatize`component:-default`), layout);
    }

    finalizer();
    this.componentDefinitionCache.set(key, definition);
    return definition;
  }

}

function hashToArgs(hash) {
  if (hash === null) return null;
  let names = hash[0].map(key => `@${key}`);
  return [names, hash[1]];
}

const experimentalMacros = []; // This is a private API to allow for experimental macros
// to be created in user space. Registering a macro should
// should be done in an initializer.

function registerMacros(macro) {
  experimentalMacros.push(macro);
}

function refineInlineSyntax(name, params, hash, context) {
  let component = context.resolver.lookupComponent(name, context.meta.referrer);

  if (component !== null) {
    return staticComponent(component, [params === null ? [] : params, hashToArgs(hash), EMPTY_BLOCKS]);
  }

  return UNHANDLED;
}

function refineBlockSyntax(name, params, hash, blocks, context) {
  let handle = context.resolver.lookupComponent(name, context.meta.referrer);

  if (handle !== null) {
    return staticComponent(handle, [params, hashToArgs(hash), blocks]);
  }

  assert(`A component or helper named "${name}" could not be found`, context.meta.referrer.owner.hasRegistration(`helper:${name}`));
  assert(`Helpers may not be used in the block form, for example {{#${name}}}{{/${name}}}. Please use a component, or alternatively use the helper in combination with a built-in Ember helper, for example {{#if (${name})}}{{/if}}.`, !(() => {
    const resolver = context.resolver['inner']['resolver'];
    const {
      moduleName,
      owner
    } = context.meta.referrer;

    if (name === 'component' || resolver['builtInHelpers'][name]) {
      return true;
    }

    let options = {
      source: `template:${moduleName}`
    };
    return owner.hasRegistration(`helper:${name}`, options) || owner.hasRegistration(`helper:${name}`);
  })());
  return NONE;
}

function populateMacros(macros) {
  let {
    inlines,
    blocks
  } = macros;
  inlines.addMissing(refineInlineSyntax);
  blocks.addMissing(refineBlockSyntax);

  for (let i = 0; i < experimentalMacros.length; i++) {
    let macro = experimentalMacros[i];
    macro(blocks, inlines);
  }

  return {
    blocks,
    inlines
  };
}

class DynamicScope {
  constructor(view, outletState) {
    this.view = view;
    this.outletState = outletState;
  }

  child() {
    return new DynamicScope(this.view, this.outletState);
  }

  get(key) {
    // tslint:disable-next-line:max-line-length
    assert(`Using \`-get-dynamic-scope\` is only supported for \`outletState\` (you used \`${key}\`).`, key === 'outletState');
    return this.outletState;
  }

  set(key, value) {
    // tslint:disable-next-line:max-line-length
    assert(`Using \`-with-dynamic-scope\` is only supported for \`outletState\` (you used \`${key}\`).`, key === 'outletState');
    this.outletState = value;
    return value;
  }

}

class RootState {
  constructor(root, runtime, context, template, self, parentElement, dynamicScope, builder) {
    this.root = root;
    this.runtime = runtime;
    assert(`You cannot render \`${self.value()}\` without a template.`, template !== undefined);
    this.id = getViewId(root);
    this.result = undefined;
    this.destroyed = false;

    this.render = () => {
      let layout = unwrapTemplate(template).asLayout();
      let handle = layout.compile(context);
      let iterator = renderJitMain(runtime, context, self, builder(runtime.env, {
        element: parentElement,
        nextSibling: null
      }), unwrapHandle(handle), dynamicScope);
      let iteratorResult;

      do {
        iteratorResult = iterator.next();
      } while (!iteratorResult.done);

      let result = this.result = iteratorResult.value; // override .render function after initial render

      this.render = () => result.rerender({
        alwaysRevalidate: false
      });
    };
  }

  isFor(possibleRoot) {
    return this.root === possibleRoot;
  }

  destroy() {
    let {
      result,
      runtime: {
        env
      }
    } = this;
    this.destroyed = true;
    this.runtime = undefined;
    this.root = null;
    this.result = undefined;
    this.render = undefined;

    if (result !== undefined) {
      /*
       Handles these scenarios:
              * When roots are removed during standard rendering process, a transaction exists already
         `.begin()` / `.commit()` are not needed.
       * When roots are being destroyed manually (`component.append(); component.destroy() case), no
         transaction exists already.
       * When roots are being destroyed during `Renderer#destroy`, no transaction exists
              */
      inTransaction(env, () => destroy(result));
    }
  }

}

const renderers = [];
function _resetRenderers() {
  renderers.length = 0;
}

function register(renderer) {
  assert('Cannot register the same renderer twice', renderers.indexOf(renderer) === -1);
  renderers.push(renderer);
}

function deregister(renderer) {
  let index = renderers.indexOf(renderer);
  assert('Cannot deregister unknown unregistered renderer', index !== -1);
  renderers.splice(index, 1);
}

function loopBegin() {
  for (let i = 0; i < renderers.length; i++) {
    renderers[i]._scheduleRevalidate();
  }
}

function K() {
  /* noop */
}

let renderSettledDeferred = null;
/*
  Returns a promise which will resolve when rendering has settled. Settled in
  this context is defined as when all of the tags in use are "current" (e.g.
  `renderers.every(r => r._isValid())`). When this is checked at the _end_ of
  the run loop, this essentially guarantees that all rendering is completed.

  @method renderSettled
  @returns {Promise<void>} a promise which fulfills when rendering has settled
*/

function renderSettled() {
  if (renderSettledDeferred === null) {
    renderSettledDeferred = RSVP.defer(); // if there is no current runloop, the promise created above will not have
    // a chance to resolve (because its resolved in backburner's "end" event)

    if (!getCurrentRunLoop()) {
      // ensure a runloop has been kicked off
      backburner.schedule('actions', null, K);
    }
  }

  return renderSettledDeferred.promise;
}

function resolveRenderPromise() {
  if (renderSettledDeferred !== null) {
    let resolve = renderSettledDeferred.resolve;
    renderSettledDeferred = null;
    backburner.join(null, resolve);
  }
}

let loops = 0;

function loopEnd() {
  for (let i = 0; i < renderers.length; i++) {
    if (!renderers[i]._isValid()) {
      if (loops > ENV._RERENDER_LOOP_LIMIT) {
        loops = 0; // TODO: do something better

        renderers[i].destroy();
        throw new Error('infinite rendering invalidation detected');
      }

      loops++;
      return backburner.join(null, K);
    }
  }

  loops = 0;
  resolveRenderPromise();
}

backburner.on('begin', loopBegin);
backburner.on('end', loopEnd);
class Renderer {
  constructor(owner, document, env, rootTemplate, viewRegistry, destinedForDOM = false, builder = clientBuilder) {
    this._inRenderTransaction = false;
    this._lastRevision = -1;
    this._destroyed = false;
    this._rootTemplate = rootTemplate(owner);
    this._viewRegistry = viewRegistry;
    this._destinedForDOM = destinedForDOM;
    this._roots = [];
    this._removedRoots = [];
    this._builder = builder; // resolver is exposed for tests

    let runtimeResolver = this._runtimeResolver = new RuntimeResolver(owner, env.isInteractive);
    let compileTimeResolver = new CompileTimeResolver(runtimeResolver);
    let context = this._context = JitContext(compileTimeResolver);
    populateMacros(context.macros);
    let runtimeEnvironmentDelegate = new EmberEnvironmentDelegate(owner, env.isInteractive);
    this._runtime = JitRuntime({
      appendOperations: env.hasDOM ? new DOMTreeConstruction(document) : new NodeDOMTreeConstruction(document),
      updateOperations: new DOMChanges(document)
    }, runtimeEnvironmentDelegate, context, runtimeResolver);
  }

  get debugRenderTree() {
    return this._runtime.env.extra.debugRenderTree;
  } // renderer HOOKS


  appendOutletView(view, target) {
    let definition = createRootOutlet(view);

    this._appendDefinition(view, curry(definition), target);
  }

  appendTo(view, target) {
    let definition = new RootComponentDefinition(view);

    this._appendDefinition(view, curry(definition), target);
  }

  _appendDefinition(root, definition, target) {
    let self = new UnboundRootReference(definition, this._runtime.env);
    let dynamicScope = new DynamicScope(null, UNDEFINED_REFERENCE);
    let rootState = new RootState(root, this._runtime, this._context, this._rootTemplate, self, target, dynamicScope, this._builder);

    this._renderRoot(rootState);
  }

  rerender() {
    this._scheduleRevalidate();
  }

  register(view) {
    let id = getViewId(view);
    assert('Attempted to register a view with an id already in use: ' + id, !this._viewRegistry[id]);
    this._viewRegistry[id] = view;
  }

  unregister(view) {
    delete this._viewRegistry[getViewId(view)];
  }

  remove(view) {
    view._transitionTo('destroying');

    this.cleanupRootFor(view);

    if (this._destinedForDOM) {
      view.trigger('didDestroyElement');
    }
  }

  cleanupRootFor(view) {
    // no need to cleanup roots if we have already been destroyed
    if (this._destroyed) {
      return;
    }

    let roots = this._roots; // traverse in reverse so we can remove items
    // without mucking up the index

    let i = this._roots.length;

    while (i--) {
      let root = roots[i];

      if (root.isFor(view)) {
        root.destroy();
        roots.splice(i, 1);
      }
    }
  }

  destroy() {
    if (this._destroyed) {
      return;
    }

    this._destroyed = true;

    this._clearAllRoots();
  }

  getBounds(view) {
    let bounds = view[BOUNDS];
    assert('object passed to getBounds must have the BOUNDS symbol as a property', Boolean(bounds));
    let parentElement = bounds.parentElement();
    let firstNode = bounds.firstNode();
    let lastNode = bounds.lastNode();
    return {
      parentElement,
      firstNode,
      lastNode
    };
  }

  createElement(tagName) {
    return this._runtime.env.getAppendOperations().createElement(tagName);
  }

  _renderRoot(root) {
    let {
      _roots: roots
    } = this;
    roots.push(root);

    if (roots.length === 1) {
      register(this);
    }

    this._renderRootsTransaction();
  }

  _renderRoots() {
    let {
      _roots: roots,
      _runtime: runtime,
      _removedRoots: removedRoots
    } = this;
    let initialRootsLength;

    do {
      initialRootsLength = roots.length;
      inTransaction(runtime.env, () => {
        // ensure that for the first iteration of the loop
        // each root is processed
        for (let i = 0; i < roots.length; i++) {
          let root = roots[i];

          if (root.destroyed) {
            // add to the list of roots to be removed
            // they will be removed from `this._roots` later
            removedRoots.push(root); // skip over roots that have been marked as destroyed

            continue;
          } // when processing non-initial reflush loops,
          // do not process more roots than needed


          if (i >= initialRootsLength) {
            continue;
          }

          if (DEBUG) {
            // run in an autotracking transaction to prevent backflow errors.
            // we use `bind` here to avoid creating a closure (and requiring a
            // hoisted variable).
            runInAutotrackingTransaction(root.render.bind(root));
          } else {
            root.render();
          }
        }

        this._lastRevision = valueForTag(CURRENT_TAG);
      });
    } while (roots.length > initialRootsLength); // remove any roots that were destroyed during this transaction


    while (removedRoots.length) {
      let root = removedRoots.pop();
      let rootIndex = roots.indexOf(root);
      roots.splice(rootIndex, 1);
    }

    if (this._roots.length === 0) {
      deregister(this);
    }
  }

  _renderRootsTransaction() {
    if (this._inRenderTransaction) {
      // currently rendering roots, a new root was added and will
      // be processed by the existing _renderRoots invocation
      return;
    } // used to prevent calling _renderRoots again (see above)
    // while we are actively rendering roots


    this._inRenderTransaction = true;
    let completedWithoutError = false;

    try {
      this._renderRoots();

      completedWithoutError = true;
    } finally {
      if (!completedWithoutError) {
        this._lastRevision = valueForTag(CURRENT_TAG);
      }

      this._inRenderTransaction = false;
    }
  }

  _clearAllRoots() {
    let roots = this._roots;

    for (let i = 0; i < roots.length; i++) {
      let root = roots[i];
      root.destroy();
    }

    this._removedRoots.length = 0;
    this._roots = []; // if roots were present before destroying
    // deregister this renderer instance

    if (roots.length) {
      deregister(this);
    }
  }

  _scheduleRevalidate() {
    backburner.scheduleOnce('render', this, this._revalidate);
  }

  _isValid() {
    return this._destroyed || this._roots.length === 0 || validateTag(CURRENT_TAG, this._lastRevision);
  }

  _revalidate() {
    if (this._isValid()) {
      return;
    }

    this._renderRootsTransaction();
  }

}
class InertRenderer extends Renderer {
  static create(props) {
    let {
      document,
      env,
      rootTemplate,
      _viewRegistry,
      builder
    } = props;
    return new this(getOwner(props), document, env, rootTemplate, _viewRegistry, false, builder);
  }

  getElement(_view) {
    throw new Error('Accessing `this.element` is not allowed in non-interactive environments (such as FastBoot).');
  }

}
class InteractiveRenderer extends Renderer {
  static create(props) {
    let {
      document,
      env,
      rootTemplate,
      _viewRegistry,
      builder
    } = props;
    return new this(getOwner(props), document, env, rootTemplate, _viewRegistry, true, builder);
  }

  getElement(view) {
    return getViewElement(view);
  }

}

let TEMPLATES$1 = {};
function setTemplates(templates) {
  TEMPLATES$1 = templates;
}
function getTemplates() {
  return TEMPLATES$1;
}
function getTemplate(name) {
  if (Object.prototype.hasOwnProperty.call(TEMPLATES$1, name)) {
    return TEMPLATES$1[name];
  }
}
function hasTemplate(name) {
  return Object.prototype.hasOwnProperty.call(TEMPLATES$1, name);
}
function setTemplate(name, template) {
  return TEMPLATES$1[name] = template;
}

const CAPABILITIES$4 = {
  dynamicLayout: false,
  dynamicTag: false,
  prepareArgs: true,
  createArgs: true,
  attributeHook: false,
  elementHook: false,
  createCaller: true,
  dynamicScope: false,
  updateHook: true,
  createInstance: true,
  wrapped: false,
  willDestroy: false
};
const EMPTY_POSITIONAL_ARGS$1 = [];
debugFreeze(EMPTY_POSITIONAL_ARGS$1);
class InputComponentManager extends InternalManager {
  getCapabilities() {
    return CAPABILITIES$4;
  }

  prepareArgs(_state, args) {
    assert('The `<Input />` component does not take any positional arguments', args.positional.length === 0);
    let __ARGS__ = args.named.capture().map;
    return {
      positional: EMPTY_POSITIONAL_ARGS$1,
      named: {
        __ARGS__: new ConstReference(__ARGS__),
        type: args.named.get('type')
      }
    };
  }

  create(env, {
    ComponentClass,
    layout
  }, args, _dynamicScope, caller) {
    assert('caller must be const', isConstTagged(caller));
    let type = args.named.get('type');
    let instance = ComponentClass.create({
      caller: caller.value(),
      type: type.value()
    });
    let state = {
      env,
      type,
      instance
    };

    if (ENV._DEBUG_RENDER_TREE) {
      env.extra.debugRenderTree.create(state, {
        type: 'component',
        name: 'input',
        args: args.capture(),
        instance,
        template: layout
      });
      registerDestructor(instance, () => env.extra.debugRenderTree.willDestroy(state));
    }

    return state;
  }

  getSelf({
    env,
    instance
  }) {
    return new ComponentRootReference(instance, env);
  }

  getTag() {
    if (ENV._DEBUG_RENDER_TREE) {
      // returning a const tag skips the update hook (VM BUG?)
      return createTag();
    } else {
      // an outlet has no hooks
      return CONSTANT_TAG;
    }
  }

  didRenderLayout(state, bounds) {
    if (ENV._DEBUG_RENDER_TREE) {
      state.env.extra.debugRenderTree.didRender(state, bounds);
    }
  }

  update(state) {
    set(state.instance, 'type', state.type.value());

    if (ENV._DEBUG_RENDER_TREE) {
      state.env.extra.debugRenderTree.update(state);
    }
  }

  didUpdateLayout(state, bounds) {
    if (ENV._DEBUG_RENDER_TREE) {
      state.env.extra.debugRenderTree.didRender(state, bounds);
    }
  }

  getDestroyable(state) {
    return state.instance;
  }

}
const InputComponentManagerFactory = owner => {
  return new InputComponentManager(owner);
};

/**
@module @ember/component
*/
/**
  See [Ember.Templates.components.Input](/ember/release/classes/Ember.Templates.components/methods/Input?anchor=Input).

  @method input
  @for Ember.Templates.helpers
  @param {Hash} options
  @public
  */

/**
  The `Input` component lets you create an HTML `<input>` element.

  ```handlebars
  <Input @value="987" />
  ```

  creates an `<input>` element with `type="text"` and value set to 987.

  ### Text field

  If no `type` argument is specified, a default of type 'text' is used.

  ```handlebars
  Search:
  <Input @value={{this.searchWord}} />
  ```

  In this example, the initial value in the `<input>` will be set to the value of
  `this.searchWord`. If the user changes the text, the value of `this.searchWord` will also be
  updated.

  ### Actions

  The `Input` component takes a number of arguments with callbacks that are invoked in response to
  user events.

  * `enter`
  * `insert-newline`
  * `escape-press`
  * `focus-in`
  * `focus-out`
  * `key-down`
  * `key-press`
  * `key-up`

  These callbacks are passed to `Input` like this:

  ```handlebars
  <Input @value={{this.searchWord}} @enter={{this.query}} />
  ```

  ### `<input>` HTML Attributes to Avoid

  In most cases, if you want to pass an attribute to the underlying HTML `<input>` element, you
  can pass the attribute directly, just like any other Ember component.

  ```handlebars
  <Input @type="text" size="10" />
  ```

  In this example, the `size` attribute will be applied to the underlying `<input>` element in the
  outputted HTML.

  However, there are a few attributes where you **must** use the `@` version.

  * `@type`: This argument is used to control which Ember component is used under the hood
  * `@value`: The `@value` argument installs a two-way binding onto the element. If you wanted a
    one-way binding, use `<input>` with the `value` property and the `input` event instead.
  * `@checked` (for checkboxes): like `@value`, the `@checked` argument installs a two-way binding
    onto the element. If you wanted a one-way binding, use `<input type="checkbox">` with
    `checked` and the `input` event instead.

  ### Extending `TextField`

  Internally, `<Input @type="text" />` creates an instance of `TextField`, passing arguments from
  the helper to `TextField`'s `create` method. Subclassing `TextField` is supported but not
  recommended.

  See [TextField](/ember/release/classes/TextField)

  ### Checkbox

  To create an `<input type="checkbox">`:

  ```handlebars
  Emberize Everything:
  <Input @type="checkbox" @checked={{this.isEmberized}} name="isEmberized" />
  ```

  This will bind the checked state of this checkbox to the value of `isEmberized` -- if either one
  changes, it will be reflected in the other.

  ### Extending `Checkbox`

  Internally, `<Input @type="checkbox" />` creates an instance of `Checkbox`. Subclassing
  `TextField` is supported but not recommended.

  See [Checkbox](/ember/release/classes/Checkbox)

  @method Input
  @for Ember.Templates.components
  @see {TextField}
  @see {Checkbox}
  @param {Hash} options
  @public
*/

const Input = Object$1.extend({
  isCheckbox: computed('type', function () {
    return this.type === 'checkbox';
  })
});
setManager({
  factory: InputComponentManagerFactory,
  internal: true,
  type: 'component'
}, Input);

Input.toString = () => '@ember/component/input';

/**
@module ember
*/
/**
  Calls [String.loc](/ember/release/classes/String/methods/loc?anchor=loc) with the
  provided string. This is a convenient way to localize text within a template.
  For example:

  ```javascript
  Ember.STRINGS = {
    '_welcome_': 'Bonjour'
  };
  ```

  ```handlebars
  <div class='message'>
    {{loc '_welcome_'}}
  </div>
  ```

  ```html
  <div class='message'>
    Bonjour
  </div>
  ```

  See [String.loc](/ember/release/classes/String/methods/loc?anchor=loc) for how to
  set up localized string references.

  @method loc
  @for Ember.Templates.helpers
  @param {String} str The string to format.
  @see {String#loc}
  @public
*/

var loc$1 = helper(function (params) {
  return loc.apply(null, params
  /* let the other side handle errors */
  );
});

var ComponentTemplate = template({
  "id": "RLf1peEf",
  "block": "{\"symbols\":[\"&default\"],\"statements\":[[18,1,null]],\"hasEval\":false,\"upvars\":[]}",
  "meta": {
    "moduleName": "packages/@ember/-internals/glimmer/lib/templates/component.hbs"
  }
});

var InputTemplate = template({
  "id": "ExnzE3OS",
  "block": "{\"symbols\":[\"Checkbox\",\"TextField\",\"@__ARGS__\",\"&attrs\"],\"statements\":[[6,[37,2],[[30,[36,1],[\"-checkbox\"],null],[30,[36,1],[\"-text-field\"],null]],null,[[\"default\"],[{\"statements\":[[6,[37,0],[[32,0,[\"isCheckbox\"]]],null,[[\"default\",\"else\"],[{\"statements\":[[8,[32,1],[[17,4]],[[\"@target\",\"@__ARGS__\"],[[32,0,[\"caller\"]],[32,3]]],null]],\"parameters\":[]},{\"statements\":[[8,[32,2],[[17,4]],[[\"@target\",\"@__ARGS__\"],[[32,0,[\"caller\"]],[32,3]]],null]],\"parameters\":[]}]]]],\"parameters\":[1,2]}]]]],\"hasEval\":false,\"upvars\":[\"if\",\"component\",\"let\"]}",
  "meta": {
    "moduleName": "packages/@ember/-internals/glimmer/lib/templates/input.hbs"
  }
});

var OutletTemplate = template({
  "id": "vA+C0Wde",
  "block": "{\"symbols\":[],\"statements\":[[1,[30,[36,1],[[30,[36,0],null,null]],null]]],\"hasEval\":false,\"upvars\":[\"-outlet\",\"component\"]}",
  "meta": {
    "moduleName": "packages/@ember/-internals/glimmer/lib/templates/outlet.hbs"
  }
});

const TOP_LEVEL_NAME = '-top-level';
const TOP_LEVEL_OUTLET = 'main';
class OutletView {
  constructor(_environment, renderer, owner, template) {
    this._environment = _environment;
    this.renderer = renderer;
    this.owner = owner;
    this.template = template;
    let ref = this.ref = new RootOutletReference({
      outlets: {
        main: undefined
      },
      render: {
        owner: owner,
        into: undefined,
        outlet: TOP_LEVEL_OUTLET,
        name: TOP_LEVEL_NAME,
        controller: undefined,
        model: undefined,
        template
      }
    });
    this.state = {
      ref,
      name: TOP_LEVEL_NAME,
      outlet: TOP_LEVEL_OUTLET,
      template,
      controller: undefined,
      model: undefined
    };
  }

  static extend(injections) {
    return class extends OutletView {
      static create(options) {
        if (options) {
          return super.create(assign({}, injections, options));
        } else {
          return super.create(injections);
        }
      }

    };
  }

  static reopenClass(injections) {
    assign(this, injections);
  }

  static create(options) {
    let {
      _environment,
      renderer,
      template: templateFactory$$1
    } = options;
    let owner = getOwner(options);
    let template = templateFactory$$1(owner);
    return new OutletView(_environment, renderer, owner, template);
  }

  appendTo(selector) {
    let target;

    if (this._environment.hasDOM) {
      target = typeof selector === 'string' ? document.querySelector(selector) : selector;
    } else {
      target = selector;
    }

    schedule('render', this.renderer, 'appendOutletView', this, target);
  }

  rerender() {
    /**/
  }

  setOutletState(state) {
    this.ref.update(state);
  }

  destroy() {
    /**/
  }

}

function setupApplicationRegistry(registry) {
  registry.injection('renderer', 'env', '-environment:main'); // because we are using injections we can't use instantiate false
  // we need to use bind() to copy the function so factory for
  // association won't leak

  registry.register('service:-dom-builder', {
    create({
      bootOptions
    }) {
      let {
        _renderMode
      } = bootOptions;

      switch (_renderMode) {
        case 'serialize':
          return serializeBuilder.bind(null);

        case 'rehydrate':
          return rehydrationBuilder.bind(null);

        default:
          return clientBuilder.bind(null);
      }
    }

  });
  registry.injection('service:-dom-builder', 'bootOptions', '-environment:main');
  registry.injection('renderer', 'builder', 'service:-dom-builder');
  registry.register(privatize`template:-root`, RootTemplate);
  registry.injection('renderer', 'rootTemplate', privatize`template:-root`);
  registry.register('renderer:-dom', InteractiveRenderer);
  registry.register('renderer:-inert', InertRenderer);
  registry.injection('renderer', 'document', 'service:-document');
}
function setupEngineRegistry(registry) {
  registry.optionsForType('template', {
    instantiate: false
  });
  registry.register('view:-outlet', OutletView);
  registry.register('template:-outlet', OutletTemplate);
  registry.injection('view:-outlet', 'template', 'template:-outlet');
  registry.register(privatize`template:components/-default`, ComponentTemplate);
  registry.optionsForType('helper', {
    instantiate: false
  });
  registry.register('helper:loc', loc$1);
  registry.register('component:-text-field', TextField);
  registry.register('component:-checkbox', Checkbox);
  registry.register('component:link-to', LinkComponent);
  registry.register('component:input', Input);
  registry.register('template:components/input', InputTemplate);
  registry.register('component:textarea', TextArea);

  if (!ENV._TEMPLATE_ONLY_GLIMMER_COMPONENTS) {
    registry.register(privatize`component:-default`, Component);
  }
}

function setComponentManager(stringOrFunction, obj) {
  let factory;

  if (COMPONENT_MANAGER_STRING_LOOKUP && typeof stringOrFunction === 'string') {
    deprecate('Passing the name of the component manager to "setupComponentManager" is deprecated. Please pass a function that produces an instance of the manager.', false, {
      id: 'deprecate-string-based-component-manager',
      until: '4.0.0',
      url: 'https://emberjs.com/deprecations/v3.x/#toc_component-manager-string-lookup'
    });

    factory = function (owner) {
      return owner.lookup(`component-manager:${stringOrFunction}`);
    };
  } else {
    factory = stringOrFunction;
  }

  return setManager({
    factory,
    internal: false,
    type: 'component'
  }, obj);
}
function getComponentManager(obj) {
  let wrapper = getManager(obj);

  if (wrapper && !wrapper.internal && wrapper.type === 'component') {
    return wrapper.factory;
  } else {
    return undefined;
  }
}

/**
  [Glimmer](https://github.com/tildeio/glimmer) is a templating engine used by Ember.js that is compatible with a subset of the [Handlebars](http://handlebarsjs.com/) syntax.

  ### Showing a property

  Templates manage the flow of an application's UI, and display state (through
  the DOM) to a user. For example, given a component with the property "name",
  that component's template can use the name in several ways:

  ```app/components/person-profile.js
  import Component from '@ember/component';

  export default Component.extend({
    name: 'Jill'
  });
  ```

  ```app/components/person-profile.hbs
  {{this.name}}
  <div>{{this.name}}</div>
  <span data-name={{this.name}}></span>
  ```

  Any time the "name" property on the component changes, the DOM will be
  updated.

  Properties can be chained as well:

  ```handlebars
  {{@aUserModel.name}}
  <div>{{@listOfUsers.firstObject.name}}</div>
  ```

  ### Using Ember helpers

  When content is passed in mustaches `{{}}`, Ember will first try to find a helper
  or component with that name. For example, the `if` helper:

  ```app/components/person-profile.hbs
  {{if this.name "I have a name" "I have no name"}}
  <span data-has-name={{if this.name true}}></span>
  ```

  The returned value is placed where the `{{}}` is called. The above style is
  called "inline". A second style of helper usage is called "block". For example:

  ```handlebars
  {{#if this.name}}
    I have a name
  {{else}}
    I have no name
  {{/if}}
  ```

  The block form of helpers allows you to control how the UI is created based
  on the values of properties.
  A third form of helper is called "nested". For example here the concat
  helper will add " Doe" to a displayed name if the person has no last name:

  ```handlebars
  <span data-name={{concat this.firstName (
    if this.lastName (concat " " this.lastName) "Doe"
  )}}></span>
  ```

  Ember's built-in helpers are described under the [Ember.Templates.helpers](/ember/release/classes/Ember.Templates.helpers)
  namespace. Documentation on creating custom helpers can be found under
  [helper](/ember/release/functions/@ember%2Fcomponent%2Fhelper/helper) (or
  under [Helper](/ember/release/classes/Helper) if a helper requires access to
  dependency injection).

  ### Invoking a Component

  Ember components represent state to the UI of an application. Further
  reading on components can be found under [Component](/ember/release/classes/Component).

  @module @ember/component
  @main @ember/component
  @public
 */

export { RootTemplate, template, counters as templateCacheCounters, Checkbox, TextField, TextArea, LinkComponent, Component, Helper, helper, SafeString, escapeExpression, htmlSafe, isHTMLSafe, Renderer, InertRenderer, InteractiveRenderer, _resetRenderers, renderSettled, getTemplate, setTemplate, hasTemplate, getTemplates, setTemplates, setupEngineRegistry, setupApplicationRegistry, registerMacros as _registerMacros, experimentalMacros as _experimentalMacros, AbstractManager as AbstractComponentManager, INVOKE, OutletView, capabilities, setComponentManager, getComponentManager, setModifierManager, getModifierManager, capabilities$1 as modifierCapabilities, setComponentTemplate, getComponentTemplate };