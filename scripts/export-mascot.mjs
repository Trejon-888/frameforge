import { readFileSync } from 'fs';
import { resolve, join } from 'path';
import { createRequire } from 'module';

// Use puppeteer from core's node_modules
const require = createRequire(import.meta.url);
const puppeteer = require('../packages/core/node_modules/puppeteer');

const svgContent = readFileSync(resolve('branding/cosmo.svg'), 'utf8');
const outPath = process.argv[2] || resolve('branding/cosmo.png');
const size = parseInt(process.argv[3] || '400');

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setViewport({ width: size, height: size, deviceScaleFactor: 2 });

await page.setContent(`<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:transparent;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
  ${svgContent.replace('<svg ', `<svg width="${Math.round(size * 0.78)}" height="${size}" `)}
</body>
</html>`);

await page.screenshot({ path: outPath, omitBackground: true });
await browser.close();
console.log(`✔ Saved: ${outPath}`);
