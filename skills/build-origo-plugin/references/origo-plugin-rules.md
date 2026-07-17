# Origo Plugin Rules

Use this reference as the repo-specific ruleset for Origo plugin work.

## Repo Conventions

- Put standalone plugins under the top-level `plugins/` folder.
- Keep plugin-authored runtime JavaScript under `plugins/<plugin-name>/src/`; keep deterministic build helpers under `plugins/<plugin-name>/scripts/`.
- Keep plugin-authored SCSS under `plugins/<plugin-name>/scss/`.
- Emit deployable JavaScript and CSS at the plugin root.
- Use standalone plugins and Origo runtime helpers; do not change core source or add core runtime packages.
- Treat `plugins/` as repo-local app code. Check `git check-ignore -v plugins/<plugin-name>` and `git status --short` in the active checkout; never assume that plugin files are ignored or tracked.

## JavaScript Rules

- Use ECMAScript modules and default-export the control factory through `src/index.js`.
- Follow Airbnb JavaScript style plus the plugin template's targeted Origo overrides.
- Keep each authored `.js` file at or below 500 physical lines, including comments and blank lines.
- Enforce the limit with ESLint's `max-lines` rule and make `npm run build` run lint first.
- Split modules by responsibility well before the ceiling. Do not use generated bundles to bypass the rule.
- Use static imports so Webpack can emit one file per bundle variant.
- Add a short reason for any unavoidable ESLint suppression.

## SCSS Rules

- Store every authored SCSS file in `scss/`.
- Use one `scss/<plugin-name>.scss` entry and compose focused partials with `@use`.
- Prefix selectors with `o-` and isolate plugin styles from the host app.
- Generate only `<plugin-name>.css`; do not add a separate minified CSS file.
- Prefer SVG icons and existing Origo sprite conventions when icons are needed.
- Do not recreate Origo's native button radius, light background, shadow, or icon sizing in plugin SCSS.

## Plugin Design Rules

- Return an Origo `Component` with a stable `name`.
- Accept `options`, including an optional injected `localization` override.
- Capture `viewer` from `onAdd(evt)` via `evt.target`.
- Resolve localization from the viewer's `localization` control inside `onAdd(evt)` when no override is injected.
- Use `viewer.getControlByName(...)` for host-control integration.
- Guard required controls and fail clearly when absent.
- Remove transient child components from their owner when they close or finish.
- Keep behavior modular and removable.

## Runtime Helpers

Prefer these globals before adding dependencies:

- `Origo.ui`
- `Origo.ol`
- `Origo.Utils`

Do not import from Origo repository paths such as `src/ui` inside a standalone plugin.

## Plugin-Local Build Contract

The template locks Webpack, Webpack CLI, Sass Embedded, ESLint, Airbnb config, and the import plugin as development dependencies. Keep `package-lock.json` with the plugin, use `npm ci` for reproducible installs, and expose:

- `npm run lint`
- `npm run build:js`
- `npm run build:css`
- `npm run build`

The build must create exactly one readable browser-global bundle, one minified browser-global bundle, and one compressed CSS file at the plugin root. Expose the authored default export through the plugin's PascalCase global factory name. Disable source maps, split chunks, and chunk loading.

Before running a plugin command, inspect its package scripts and build configuration. Set the working directory to the plugin and run it only when every repository output resolves inside that plugin. Do not run Origo root installs, builds, `copy-plugins`, formatters, or other root tasks, and do not modify Origo's root package scripts.

## Browser and UI Expectations

- Build standalone icon controls with `Origo.ui.Button` and an Origo SVG sprite reference.
- Give each standalone icon button a plugin-specific `o-*` hook plus `padding-small icon-smaller round light box-shadow` in `cls`.
- Set an explicit, meaningful, localized `ariaLabel` with a fallback. A tooltip may repeat the label but does not replace it.
- Let text buttons use the native treatment appropriate to their content. Let `mapMenu.MenuItem` own its compact menu styling; pass a localized `title`, which supplies its nested button's accessible name.
- Support the browsers targeted by Origo, keep plugins responsive, and favor progressive enhancement without breaking critical behavior.
