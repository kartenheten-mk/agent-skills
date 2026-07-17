#!/usr/bin/env node

import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_DIR = resolve(SCRIPT_DIR, '../assets/plugin-template');
const TEXT_EXTENSIONS = new Set([
  '.cjs',
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.scss',
  '.txt',
  '.yaml',
  '.yml'
]);

const usage = `Usage:
  node scaffold-plugin.mjs --origo-root <path> --plugin-name <kebab-name> [--symbol <PascalCase>]

The command creates <origo-root>/plugins/<plugin-name> from the bundled template.
It refuses to overwrite an existing destination.`;

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--help' || token === '-h') {
      args.help = true;
      continue;
    }
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument: ${token}`);
    }
    const option = token.slice(2);
    if (!['origo-root', 'plugin-name', 'symbol'].includes(option)) {
      throw new Error(`Unknown option: ${token}`);
    }
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${token}`);
    }
    args[option] = value;
    index += 1;
  }
  return args;
}

function defaultSymbol(pluginName) {
  return pluginName
    .split('-')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
}

function isWithin(parent, child) {
  const pathFromParent = relative(parent, child);
  return pathFromParent === ''
    || (!pathFromParent.startsWith('..') && !isAbsolute(pathFromParent));
}

function assertDirectory(path, label) {
  const stats = lstatSync(path);
  if (stats.isSymbolicLink()) {
    throw new Error(`${label} must not be a symlink or junction: ${path}`);
  }
  if (!stats.isDirectory()) {
    throw new Error(`${label} is not a directory: ${path}`);
  }
}

function replaceTokens(value, pluginName, symbol) {
  return value
    .replaceAll('PluginName', symbol)
    .replaceAll('plugin-name', pluginName);
}

function customizeTree(directory, pluginName, symbol) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const sourcePath = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`The template must not contain symlinks: ${sourcePath}`);
    }
    if (entry.isDirectory()) {
      customizeTree(sourcePath, pluginName, symbol);
    } else if (entry.isFile() && TEXT_EXTENSIONS.has(extname(entry.name))) {
      const contents = readFileSync(sourcePath, 'utf8');
      writeFileSync(sourcePath, replaceTokens(contents, pluginName, symbol), 'utf8');
    }

    const targetName = replaceTokens(entry.name, pluginName, symbol);
    if (targetName !== entry.name) {
      renameSync(sourcePath, join(directory, targetName));
    }
  }
}

function scaffold({ origoRoot: rootArgument, pluginName, symbol: symbolArgument }) {
  if (!rootArgument || !pluginName) {
    throw new Error('Both --origo-root and --plugin-name are required.');
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pluginName) || pluginName.length > 64) {
    throw new Error('Plugin name must be at most 64 lowercase letters, digits, and single hyphens.');
  }

  const symbol = symbolArgument || defaultSymbol(pluginName);
  if (!/^[A-Z][A-Za-z0-9]*$/.test(symbol)) {
    throw new Error('The browser-global symbol must be a PascalCase JavaScript identifier; pass --symbol explicitly when needed.');
  }

  const rootInput = resolve(rootArgument);
  if (!existsSync(rootInput)) {
    throw new Error(`Origo root does not exist: ${rootInput}`);
  }
  assertDirectory(rootInput, 'Origo root');
  const origoRoot = realpathSync(rootInput);
  for (const requiredFile of ['index.html', 'index.json']) {
    if (!existsSync(join(origoRoot, requiredFile))) {
      throw new Error(`Origo root is missing ${requiredFile}: ${origoRoot}`);
    }
  }

  const pluginsRoot = join(origoRoot, 'plugins');
  if (existsSync(pluginsRoot)) {
    assertDirectory(pluginsRoot, 'Plugins directory');
    const canonicalPluginsRoot = realpathSync(pluginsRoot);
    if (!isWithin(origoRoot, canonicalPluginsRoot)) {
      throw new Error(`Plugins directory resolves outside the Origo root: ${pluginsRoot}`);
    }
  } else {
    mkdirSync(pluginsRoot);
  }

  const destination = resolve(pluginsRoot, pluginName);
  if (!isWithin(pluginsRoot, destination)) {
    throw new Error(`Plugin destination resolves outside the plugins directory: ${destination}`);
  }
  if (existsSync(destination)) {
    throw new Error(`Refusing to overwrite existing plugin: ${destination}`);
  }

  assertDirectory(TEMPLATE_DIR, 'Plugin template');
  const stagingDirectory = mkdtempSync(join(pluginsRoot, `.${pluginName}-scaffold-`));
  try {
    for (const entry of readdirSync(TEMPLATE_DIR, { withFileTypes: true })) {
      cpSync(join(TEMPLATE_DIR, entry.name), join(stagingDirectory, entry.name), {
        errorOnExist: true,
        force: false,
        recursive: entry.isDirectory()
      });
    }
    customizeTree(stagingDirectory, pluginName, symbol);
    renameSync(stagingDirectory, destination);
  } catch (error) {
    if (existsSync(stagingDirectory) && isWithin(pluginsRoot, stagingDirectory)) {
      rmSync(stagingDirectory, { force: true, recursive: true });
    }
    throw error;
  }

  return { destination, pluginName, symbol };
}

try {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage);
  } else {
    const result = scaffold({
      origoRoot: args['origo-root'],
      pluginName: args['plugin-name'],
      symbol: args.symbol
    });
    console.log(`Created ${result.pluginName} at ${result.destination} with global ${result.symbol}.`);
  }
} catch (error) {
  console.error(`Scaffold failed: ${error.message}`);
  console.error(usage);
  process.exitCode = 1;
}
