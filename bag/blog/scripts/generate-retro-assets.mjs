import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const source = 'public/icon-512x512.png';

async function pixelIcon(size, sourcePixels) {
  return sharp(source)
    .resize(sourcePixels, sourcePixels, { fit: 'cover' })
    .resize(size, size, { kernel: 'nearest' })
    .png({ palette: true, colours: 64, dither: 1 })
    .toBuffer();
}

const [icon32, icon180, icon192, icon512, ogIcon] = await Promise.all([
  pixelIcon(32, 32),
  pixelIcon(180, 90),
  pixelIcon(192, 96),
  pixelIcon(512, 128),
  pixelIcon(104, 52),
]);
const faviconPng = await sharp(icon32).ensureAlpha().png({ palette: false }).toBuffer();

await Promise.all([
  sharp(icon32).toFile('src/app/icon.png'),
  sharp(icon180).toFile('src/app/apple-icon.png'),
  sharp(icon192).toFile('public/icon-192x192.png'),
  sharp(icon512).toFile('public/icon-512x512.png'),
]);

// ICO supports a PNG payload. Keeping the 32px source avoids a separate,
// visually inconsistent favicon artwork.
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
icoHeader.writeUInt8(32, 6);
icoHeader.writeUInt8(32, 7);
icoHeader.writeUInt8(0, 8);
icoHeader.writeUInt8(0, 9);
icoHeader.writeUInt16LE(1, 10);
icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(faviconPng.length, 14);
icoHeader.writeUInt32LE(22, 18);
await writeFile('src/app/favicon.ico', Buffer.concat([icoHeader, faviconPng]));

const ogDocument = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#c0c0c0"/>
  <rect x="24" y="24" width="1152" height="582" fill="#ffffff" stroke="#808080" stroke-width="2"/>
  <rect x="76" y="70" width="114" height="114" fill="#ffffff" stroke="#808080" stroke-width="2"/>
  <text x="220" y="126" fill="#000080" font-family="Osaka, 'Hiragino Kaku Gothic ProN', sans-serif" font-size="64" font-weight="700">ryota.onuma.dev</text>
  <text x="220" y="174" fill="#333333" font-family="Arial, Osaka, 'Hiragino Kaku Gothic ProN', sans-serif" font-size="27">Ryota Onumaのホームページ</text>
  <line x1="76" y1="230" x2="1124" y2="230" stroke="#808080" stroke-width="2"/>
  <line x1="76" y1="237" x2="1124" y2="237" stroke="#808080" stroke-width="2"/>
  <text x="76" y="330" fill="#000080" font-family="Osaka, 'Hiragino Kaku Gothic ProN', sans-serif" font-size="42" font-weight="700">ソフトウェアと読書の個人ページ</text>
  <text x="76" y="398" fill="#000000" font-family="Osaka, 'Hiragino Kaku Gothic ProN', sans-serif" font-size="29">技術ノート ｜ 雑記帳 ｜ 読書記録</text>
  <line x1="76" y1="482" x2="1124" y2="482" stroke="#808080" stroke-width="1"/>
  <text x="76" y="535" fill="#333333" font-family="'Courier New', monospace" font-size="24">https://ryota.onuma.dev/</text>
  <text x="1124" y="535" text-anchor="end" fill="#333333" font-family="Osaka, 'Hiragino Kaku Gothic ProN', sans-serif" font-size="22">作者の絵</text>
</svg>`;

await sharp(Buffer.from(ogDocument))
  .composite([{ input: ogIcon, left: 81, top: 75 }])
  .png({ palette: true, colours: 216, dither: 1 })
  .toFile('public/og.png');
