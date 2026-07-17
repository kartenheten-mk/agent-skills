---
name: build-origo-plugin
description: >-
  Build, scaffold, create, wire, or update modular Origo plugins while keeping Origo core read-only except for the active root index.json and index.html. Use when Codex needs to create an Origo control-style plugin with JavaScript sources under src, SCSS sources under scss, plugin-local lint and build commands, browser-global JavaScript and CSS artifacts, load-event host registration, index.json dependency configuration, stylesheet wiring, or localized UI text.
---

# Build Origo Plugin

## Overview

Build standalone Origo control factories under `plugins/<plugin-name>/`. Keep authored code modular, build deployable assets before host wiring, and treat Origo core as read-only except for the two exact host-wiring files allowed below.

## Filesystem Safety Contract

Establish the active Origo root before any side effect. Resolve each source, destination, working directory, and generated output to a canonical path before writing or running a side-effectful command.

Allow repository writes only to:

- `<origo-root>/plugins/**`
- the exact file `<origo-root>/index.json`
- the exact file `<origo-root>/index.html`

Treat every other path under Origo core as read-only, including `src/`, `scss/`, `css/`, `tasks/`, `build/`, `dist/`, root package files, and same-named index files in nested directories. Apply this boundary to create, edit, delete, rename, move, copy, install, build, lint, format, test, code generation, archive, and subprocess operations.

Do not use `..`, symlinks, junctions, or alternate paths to escape the allowlist. Before running a plugin-local command, inspect its scripts and configuration and confirm that its working directory and repository outputs stay within the target plugin. Never run Origo root installs, builds, formatters, `copy-plugins`, or other root tasks that can write outside the allowlist.

Read-only inspection of Origo core is allowed. If completing a request requires any other Origo-core write, stop without making that write and report that the skill's filesystem boundary prevents it. Do not widen the boundary for convenience.

## Resource Routing

Load only the references needed for the request:

- Read [references/origo-plugin-rules.md](references/origo-plugin-rules.md) before creating a plugin or changing its JavaScript, SCSS, UI, dependencies, or build behavior.
- Read [references/origo-plugin-wiring.md](references/origo-plugin-wiring.md) before changing plugin layout, localization registration, generated artifacts, `index.html`, or `index.json`.
- Read both for a new plugin. For a narrow update, read only the applicable reference.

Use [assets/plugin-template/](assets/plugin-template/) only for new plugins and use [scripts/scaffold-plugin.mjs](scripts/scaffold-plugin.mjs) to copy it safely.

## Default Workflow

1. Establish the host and scope.
   Inspect Origo core read-only. Confirm that the active root `index.html` loads `js/origo.js` and calls `Origo('index.json')`. Do not select nested build or example copies as writable targets. Check `git check-ignore` and `git status` instead of assuming whether `plugins/` is ignored or tracked.

2. Create or update the plugin safely.
   If `plugins/<plugin-name>/` does not exist, run `node <skill-directory>/scripts/scaffold-plugin.mjs --origo-root <origo-root> --plugin-name <plugin-name>`. Pass `--symbol <PascalCase>` when the name cannot produce a valid browser-global identifier. The script copies the complete template, including dotfiles, and refuses existing destinations. If the plugin already exists, do not copy or merge the template; inspect its current sources and configuration, then make only the requested changes in place.

3. Implement the requested behavior.
   Follow the applicable source and design rules. Preserve focused modules, Origo runtime-global integration, native UI treatment, accessible names, and guarded host-control lookups. Keep localization only when the plugin has user-facing text; register every supported locale explicitly.

4. Build locally.
   Follow the plugin build contract. Inspect scripts, the lockfile, and all output paths before running `npm ci` and `npm run build` from the plugin directory. Use `npm install` only to intentionally create or update a lockfile. Never hand-edit generated artifacts.

5. Wire only when required.
   Follow the host wiring reference. Modify only the active root `index.html` and, when a required built-in control is missing, the active root `index.json`. Never add the manually wired standalone plugin to the JSON control list.

6. Validate the requested scope.
   Run the plugin build after verifying its outputs, confirm the expected browser globals and CSS exist, and inspect the final diff for writes outside the allowlist. Never run Origo root build or copy tasks. When editing this skill, also run `quick_validate.py` from the installed `skill-creator` skill against `skills/build-origo-plugin`.
