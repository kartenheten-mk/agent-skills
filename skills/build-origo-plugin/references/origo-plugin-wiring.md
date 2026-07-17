# Origo Plugin Wiring

Use this reference for the concrete source, build, and host wiring contract.

## Contents

- [1. Plugin Layout](#1-plugin-layout)
- [2. Plugin Build](#2-plugin-build)
- [3. Host Wiring](#3-host-wiring)
- [4. index.json Host Dependencies](#4-indexjson-host-dependencies)
- [5. Modular Factory](#5-modular-factory)
- [6. Native UI and Accessible Launchers](#6-native-ui-and-accessible-launchers)
- [7. Localization](#7-localization)

## 1. Plugin Layout

```text
plugins/
  plugin-name/
    src/
      index.js
      plugin-name.js
      localization.js
    scss/
      plugin-name.scss
      _content.scss
    loc/
      en_US.json
      sv_SE.json
    scripts/
      build-css.mjs
    .eslintrc.json
    package.json
    package-lock.json
    plugin-name.js
    plugin-name.min.js
    plugin-name.css
```

Files under `src/`, `scss/`, `loc/`, and `scripts/` are authored sources or build helpers. The three files named at the plugin root are generated artifacts. Only create `loc/` and localization code when the plugin has translatable UI text.

## 2. Plugin Build

Run from `plugins/plugin-name/`:

```shell
npm ci
npm run build
```

Inspect `package.json`, `package-lock.json`, and build outputs before running these commands. Continue only when every repository write remains inside `plugins/plugin-name/`; never substitute an Origo root install or build. Use `npm install` only when intentionally creating or updating a missing or stale lockfile, then review the lockfile change.

The template exposes:

- `npm run lint`: lint authored JavaScript and enforce the 500-line ceiling
- `npm run build:js`: create readable and minified single-file browser-global bundles
- `npm run build:css`: compile the SCSS entry and partials into compressed CSS
- `npm run build`: lint first, then build JavaScript and CSS

Webpack uses static imports, exposes the default export as the PascalCase browser global `PluginName`, disables split chunks and chunk loading, and emits no source maps. Replace `PluginName` with the plugin's PascalCase symbol when scaffolding. The build helper uses Sass Embedded's public `compile` API on `scss/plugin-name.scss`, whose `@use` statements collect the plugin's partials. Do not edit generated artifacts directly.

## 3. Host Wiring

Modify only the active root `<origo-root>/index.html`. Link the compiled plugin stylesheet after the Origo core stylesheet. Load the Origo bundle first, the plugin bundle second, and the inline bootstrap last.

```html
<link href="css/style.css" rel="stylesheet">
<link href="plugins/plugin-name/plugin-name.css" rel="stylesheet">

<script src="js/origo.js"></script>
<script src="plugins/plugin-name/plugin-name.js"></script>
<script type="text/javascript">
  const origo = Origo('index.json');

  origo.on('load', function (viewer) {
    const pluginName = PluginName({
      icon: '#ic_help_outline_24px',
      placement: ['screen', 'menu'],
      title: 'My Plugin'
    });

    viewer.addComponent(pluginName);
  });
</script>
```

Plugin JavaScript and CSS are not auto-wired by Origo. Pass only options supported by the specific plugin. Create a new plugin instance inside the handler so a replacement viewer receives its own component after Origo reloads. Do not create or modify a separate core bootstrap file. Use `plugin-name.min.js` instead when the deployment explicitly selects minified plugin assets.

## 4. index.json Host Dependencies

Modify only the active root `<origo-root>/index.json`; do not update generated, build, or example copies. Keep any built-in controls required by the plugin, but do not add the manually wired standalone plugin to the control list.

```json
{
  "controls": [
    {
      "name": "mapmenu"
    }
  ]
}
```

The starter defaults to `placement: ['screen', 'menu']`, so its default wiring requires `mapmenu`. Use `placement: ['screen']` when the plugin should expose only the on-map launcher; that variant does not require `mapmenu`. If menu placement is selected but `mapmenu` is absent, keep the screen launcher working and warn that the menu entry could not be added.

Adding the standalone plugin here would make Origo try to resolve it as a configured control before the viewer exists and would duplicate the load-event wiring.

## 5. Modular Factory

Keep `src/index.js` as a small entry module:

```javascript
import PluginName from './plugin-name.js';

export default PluginName;
```

Put the control factory in `src/plugin-name.js` and extract other responsibilities into sibling modules or subfolders before any file approaches 500 physical lines.

When the plugin creates a transient modal or similar child, add it to its owner and subscribe to its close event so `owner.removeComponent(child)` releases the closed component.

## 6. Native UI and Accessible Launchers

Support `screen` and `menu` placement values. Default to both. Render the screen launcher in `viewer.getMain().getMapTools()` with Origo's UI helpers:

```javascript
const { Button } = Origo.ui;

const launcher = Button({
  cls: 'o-plugin-name padding-small icon-smaller round light box-shadow',
  icon: '#ic_help_outline_24px',
  ariaLabel: localizedAriaLabel,
  tooltipText: localizedAriaLabel,
  tooltipPlacement: 'east'
});
```

Keep the plugin-specific `o-*` class as a selector hook, but use the native utility classes for radius, color, shadow, padding, and icon size. Do not duplicate those declarations in plugin SCSS. Apply this treatment to standalone icon controls, not text buttons or menu rows.

`mapMenu.MenuItem` owns its compact native classes and does not accept a separate `ariaLabel` option. Give it a localized `title`; Origo passes that title to the nested `Button`, whose accessible-label fallback uses it.

## 7. Localization

Keep locale data outside the JavaScript source directory and import every supported locale from an authored module:

```javascript
import enLocale from '../loc/en_US.json';
import svLocale from '../loc/sv_SE.json';

const registerLocalization = (localization) => {
  if (localization) {
    localization.addPluginToLocale('en-US', enLocale);
    localization.addPluginToLocale('sv-SE', svLocale);
  }
};
```

Webpack bundles the imported JSON into both JavaScript artifacts. Register each locale explicitly; Origo may otherwise serve its configured fallback locale instead of the fallback argument in plugin code. In the factory's `onAdd(evt)`, capture the viewer, resolve localization from `options.localization ?? viewer.getControlByName('localization')`, and then call `registerLocalization(localization)`. Read translations with `getStringByKeys(...)` while retaining fallback strings. This keeps optional injection available for tests and lets load-event wiring use the viewer's initialized localization control.
