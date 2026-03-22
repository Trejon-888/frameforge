import puppeteer from 'puppeteer';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const svgPath = resolve('branding/cosmo.svg');
const svgContent = readFileSync(svgPath, 'utf8');
const outPath = resolve(process.argv[2] || 'branding/cosmo.png');
const size = parseInt(process.argv[3] || '400');

const browser = await puppeteer.launch();
const page = await browser.newPage();

await page.setViewport({ width: size, height: size, deviceScaleFactor: 2 });
await page.setContent(`
  <html>
  <body style="margin:0;padding:0;background:transparent;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
    <div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;">
      ${svgContent.replace('viewBox="0 0 440 560"', `viewBox="0 0 440 560" width="${Math.round(size*0.78)}" height="${size}"`)}
    </div>
  </body>
  </html>
`);

await page.screenshot({ path: outPath, omitBackground: true });
await browser.close();
console.log(`Saved: ${outPath}`);
