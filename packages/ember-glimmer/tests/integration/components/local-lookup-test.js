import { moduleFor, RenderingTest } from '../../utils/test-case';
import { ModuleBasedTestResolver } from 'internal-test-helpers';
import { Component } from '../../utils/helpers';
import { EMBER_MODULE_UNIFICATION } from 'ember/features';
import { helper, Helper } from 'ember-glimmer';

class LocalLookupTest extends RenderingTest {
  ['@test it can lookup a local template']() {
    this.registerComponent('x-outer/x-inner', { template: 'Nested template says: {{yield}}' });
    this.registerComponent('x-outer', { template: '{{#x-inner}}Hi!{{/x-inner}}' });

    this.render('{{x-outer}}');

    this.assertText('Nested template says: Hi!', 'Initial render works');

    this.runTask(() => this.rerender());

    this.assertText('Nested template says: Hi!', 'Re-render works');
  }

  ['@test tagless blockless component can lookup local template']() {
    this.registerComponent('x-outer/x-inner', { template: 'Nested template says: {{yield}}' });
    this.registerTemplate('components/x-outer', '{{#x-inner}}Hi!{{/x-inner}}');
    this.registerComponent('x-outer', {
      ComponentClass: Component.extend({ tagName: '' })
    });

    this.render('{{x-outer}}');

    this.assertText('Nested template says: Hi!', 'Re-render works');

    this.runTask(() => this.rerender());

    this.assertText('Nested template says: Hi!', 'Re-render works');
  }

  ['@test it can lookup a local component template']() {
    this.registerTemplate('components/x-outer/x-inner', 'Nested template says: {{yield}}');
    this.registerTemplate('components/x-outer', '{{#x-inner}}Hi!{{/x-inner}}');

    this.render('{{x-outer}}');

    this.assertText('Nested template says: Hi!', 'Initial render works');

    this.runTask(() => this.rerender());

    this.assertText('Nested template says: Hi!', 'Re-render works');
  }

  ['@test it can local lookup a dynamic component']() {
    this.registerComponent('foo-bar', { template: 'yall finished {{component child}}' });
    this.registerComponent('foo-bar/biz-baz', { template: 'or yall done?' });

    this.render('{{foo-bar child=child}}', { child: 'biz-baz' });

    this.assertText('yall finished or yall done?');

    this.runTask(() => this.rerender());

    this.assertText('yall finished or yall done?');
  }

  ['@test it can local lookup a dynamic component from a dynamic component']() {
    this.registerComponent('foo-bar', { template: 'yall finished {{component child}}' });
    this.registerComponent('foo-bar/biz-baz', { template: 'or yall done?' });

    this.render('{{component componentName child=child}}', { componentName: 'foo-bar', child: 'biz-baz' });

    this.assertText('yall finished or yall done?');

    this.runTask(() => this.rerender());

    this.assertText('yall finished or yall done?');
  }

  ['@test it can local lookup a dynamic component from a passed named argument']() {
    this.registerComponent('parent-foo', { template: `yall finished {{global-biz baz=(component 'local-bar')}}` });
    this.registerComponent('global-biz', { template: 'or {{component baz}}' });
    this.registerComponent('parent-foo/local-bar', { template: 'yall done?' });

    this.render('{{parent-foo}}');

    this.assertText('yall finished or yall done?');

    this.runTask(() => this.rerender());

    this.assertText('yall finished or yall done?');
  }

  ['@test it can local lookup a re-wrapped dynamic component from a passed named argument']() {
    this.registerComponent('parent-foo', { template: `yall finished {{global-x comp=(component 'local-bar')}}` });
    this.registerComponent('global-x', { template: `or {{global-y comp=(component comp phrase='done')}}` });
    this.registerComponent('global-y', { template: `{{component comp}}?` });
    this.registerComponent('parent-foo/local-bar', { template: 'yall {{phrase}}' });

    this.render('{{parent-foo}}');

    this.assertText('yall finished or yall done?');

    this.runTask(() => this.rerender());

    this.assertText('yall finished or yall done?');
  }

  ['@test it can nest local lookups of dynamic components from a passed named argument']() {
    this.registerComponent('parent-foo', { template: `yall finished {{global-x comp=(component 'local-bar')}}` });
    this.registerComponent('global-x', { template: `or {{global-y comp=(component comp phrase='done')}}` });
    this.registerComponent('global-y', { template: `{{component comp}}{{component 'local-bar'}}` });
    this.registerComponent('parent-foo/local-bar', { template: 'yall {{phrase}}' });
    this.registerComponent('global-y/local-bar', { template: `?` });

    this.render('{{parent-foo}}');

    this.assertText('yall finished or yall done?');

    this.runTask(() => this.rerender());

    this.assertText('yall finished or yall done?');
  }

  ['@test it can switch from local to global lookups of dynamic components from a passed named argument']() {
    this.registerComponent('parent-foo', { template: `yall finished {{global-x comp=(component bar)}}` });
    this.registerComponent('global-x', { template: `or yall {{component comp}}` });
    this.registerComponent('parent-foo/local-bar', { template: 'done?' });
    this.registerComponent('global-bar', { template: `ready?` });

    this.render('{{parent-foo bar=bar}}', { bar: 'local-bar' });

    this.assertText('yall finished or yall done?');

    this.runTask(() => this.context.set('bar', 'global-bar'));

    this.runTask(() => this.rerender());

    this.assertText('yall finished or yall ready?');
  }

  ['@test it can lookup a local helper']() {
    this.registerHelper('x-outer/x-helper', () => {
      return 'Who dis?';
    });
    this.registerComponent('x-outer', { template: 'Who dat? {{x-helper}}' });

    this.render('{{x-outer}}');

    this.assertText('Who dat? Who dis?', 'Initial render works');

    this.runTask(() => this.rerender());

    this.assertText('Who dat? Who dis?', 'Re-render works');
  }

  ['@test it overrides global helper lookup']() {
    this.registerHelper('x-outer/x-helper', () => {
      return 'Who dis?';
    });

    this.registerHelper('x-helper', () => {
      return 'I dunno';
    });

    this.registerComponent('x-outer', { template: 'Who dat? {{x-helper}}' });

    this.render('{{x-outer}} {{x-helper}}');

    this.assertText('Who dat? Who dis? I dunno', 'Initial render works');

    this.runTask(() => this.rerender());

    this.assertText('Who dat? Who dis? I dunno', 'Re-render works');
  }

  ['@test lookup without match issues standard assertion (with local helper name)']() {
    this.registerComponent('x-outer', { template: '{{#x-inner}}Hi!{{/x-inner}}' });

    expectAssertion(() => {
      this.render('{{x-outer}}');
    }, /A component or helper named "x-inner" could not be found/);
  }

  ['@test overrides global lookup']() {
    this.registerComponent('x-outer', { template: '{{#x-inner}}Hi!{{/x-inner}}' });
    this.registerComponent('x-outer/x-inner', { template: 'Nested template says (from local): {{yield}}' });
    this.registerComponent('x-inner', { template: 'Nested template says (from global): {{yield}}' });

    this.render('{{#x-inner}}Hi!{{/x-inner}} {{x-outer}} {{#x-outer/x-inner}}Hi!{{/x-outer/x-inner}}');

    this.assertText('Nested template says (from global): Hi! Nested template says (from local): Hi! Nested template says (from local): Hi!');

    this.runTask(() => this.rerender());

    this.assertText('Nested template says (from global): Hi! Nested template says (from local): Hi! Nested template says (from local): Hi!');
  }
}

// first run these tests with expandLocalLookup

function buildResolver() {
  let resolver = {
    resolve() { },
    expandLocalLookup(fullName, sourceFullName) {
      let [sourceType, sourceName ] = sourceFullName.split(':');
      let [type, name ] = fullName.split(':');

      if (type !== 'template' && sourceType === 'template' && sourceName.slice(0, 11) === 'components/') {
        sourceName = sourceName.slice(11);
      }

      if (type === 'template' && sourceType === 'template' && name.slice(0, 11) === 'components/') {
        name = name.slice(11);
      }


      let result = `${type}:${sourceName}/${name}`;

      return result;
    }
  };

  return resolver;
}

moduleFor('Components test: local lookup with expandLocalLookup feature', class extends LocalLookupTest {
  getResolver() {
    return buildResolver();
  }
});

if (EMBER_MODULE_UNIFICATION) {
  class LocalLookupTestResolver extends ModuleBasedTestResolver {
    resolve(specifier, referrer) {
      let fullSpecifier = specifier;

      if (referrer) {
        let namespace = referrer.split('template:components/')[1];
        if (specifier.indexOf('template:components/') !== -1) {
            let name = specifier.split('template:components/')[1];
            fullSpecifier = `template:components/${namespace}/${name}`;
        } else if (specifier.indexOf(':') !== -1) {
          let [type, name] = specifier.split(':');
          fullSpecifier = `${type}:${namespace}/${name}`;
        }
      }

      return super.resolve(fullSpecifier);
    }
  }

  /*
   * This sub-classing changes `registerXXX` methods to use the resolver.
   * Required for testing the module unification-friendly `resolve` call
   * with a `referrer` argument.
   *
   * In theory all these tests can be ported to use the resolver instead of
   * the registry.
   */
  moduleFor('Components test: local lookup with resolution referrer', class extends LocalLookupTest {
    get resolver() {
      return this.owner.__registry__.fallback.resolver;
    }

    getResolver() {
      return new LocalLookupTestResolver();
    }

    registerComponent(name, { ComponentClass = Component, template = null }) {
      let { resolver } = this;

      if (ComponentClass) {
        resolver.add(`component:${name}`, ComponentClass);
      }

      if (typeof template === 'string') {
        resolver.add(`template:components/${name}`, this.compile(template, {
          moduleName: `components/${name}`
        }));
      }
    }

    registerTemplate(name, template) {
      let { resolver } = this;
      if (typeof template === 'string') {
        resolver.add(`template:${name}`, this.compile(template, {
          moduleName: name
        }));
      } else {
        throw new Error(`Registered template "${name}" must be a string`);
      }
    }

    registerHelper(name, funcOrClassBody) {
      let { resolver } = this;
      let type = typeof funcOrClassBody;

      if (type === 'function') {
        resolver.add(`helper:${name}`, helper(funcOrClassBody));
      } else if (type === 'object' && type !== null) {
        resolver.add(`helper:${name}`, Helper.extend(funcOrClassBody));
      } else {
        throw new Error(`Cannot register ${funcOrClassBody} as a helper`);
      }
    }
  });
}
