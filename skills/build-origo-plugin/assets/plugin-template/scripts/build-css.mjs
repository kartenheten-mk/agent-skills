import { writeFile } from 'node:fs/promises';
import { compile } from 'sass-embedded';

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error('Usage: node build-css.mjs <input.scss> <output.css>');
}

const result = compile(inputPath, {
  sourceMap: false,
  style: 'compressed'
});

await writeFile(outputPath, result.css, 'utf8');
