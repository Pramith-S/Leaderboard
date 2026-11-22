const fs = require('fs');
const path = require('path');
const sharp = require(path.join(__dirname, '../frontend/website/node_modules/sharp'));

// Square SVG centered with balanced margins
const SQUARE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-28.5 -240 1024 1024" width="1024" height="1024">
<rect width="441.733" height="197.803" rx="98.9017" transform="matrix(0.826736 -0.56259 -0.601492 -0.798879 119.527 406.536)" fill="#E93E32"/>
<path d="M196.782 344.903L192.271 338.911L393.936 201.679L398.447 207.671L402.959 213.662L201.293 350.895L196.782 344.903ZM398.447 207.671L393.936 201.679C432.245 175.61 440.706 124.468 412.835 87.4494L419.035 83.23L425.236 79.0106C458.09 122.647 448.116 182.932 402.959 213.662L398.447 207.671ZM419.035 83.23L412.835 87.4494C384.963 50.4313 331.313 41.5553 293.004 67.6243L288.493 61.6328L283.981 55.6412C329.139 24.9114 392.381 35.3743 425.236 79.0106L419.035 83.23ZM288.493 61.6328L293.004 67.6243L91.3383 204.857L86.8271 198.865L82.3159 192.874L283.981 55.6412L288.493 61.6328ZM86.8271 198.865L91.3383 204.857C53.0293 230.926 44.5682 282.068 72.4399 319.086L66.2393 323.306L60.0388 327.525C27.1842 283.889 37.158 223.603 82.3159 192.874L86.8271 198.865ZM66.2393 323.306L72.4399 319.086C100.312 356.104 153.962 364.98 192.271 338.911L196.782 344.903L201.293 350.895C156.135 381.624 92.8934 371.161 60.0388 327.525L66.2393 323.306Z" fill="black"/>
<rect width="442.194" height="197.811" rx="98.9056" transform="matrix(-0.826282 0.563257 -0.602158 -0.798377 966.373 294.921)" fill="#FBBB29"/>
<path d="M880.133 344.642L875.617 338.655L673.687 476.305L678.204 482.293L682.72 488.281L884.649 350.63L880.133 344.642ZM678.204 482.293L673.687 476.305C635.398 502.406 581.737 493.574 553.833 456.577L547.636 460.802L541.439 465.026C574.331 508.637 637.585 519.048 682.72 488.281L678.204 482.293ZM547.636 460.802L553.833 456.577C525.929 419.581 534.349 368.43 572.639 342.328L568.122 336.341L563.606 330.353C518.471 361.12 508.547 421.415 541.439 465.026L547.636 460.802ZM568.122 336.341L572.639 342.328L774.568 204.678L770.052 198.69L765.536 192.702L563.606 330.353L568.122 336.341ZM770.052 198.69L774.568 204.678C812.858 178.577 866.518 187.409 894.422 224.406L900.619 220.181L906.816 215.957C873.924 172.346 810.67 161.935 765.536 192.702L770.052 198.69ZM900.619 220.181L894.422 224.406C922.326 261.402 913.906 312.553 875.617 338.655L880.133 344.642L884.649 350.63C929.784 319.863 939.709 259.568 906.816 215.957L900.619 220.181Z" fill="black"/>
<rect width="442.212" height="197.811" rx="98.9056" transform="matrix(0.826282 0.563257 0.602158 -0.798377 0 294.921)" fill="#1D6FB7"/>
<path d="M86.2401 344.642L90.7563 338.655L292.7 476.315L288.184 482.303L283.668 488.291L81.7239 350.63L86.2401 344.642ZM288.184 482.303L292.7 476.315C330.99 502.416 384.65 493.584 412.554 456.587L418.751 460.812L424.949 465.036C392.056 508.647 328.803 519.058 283.668 488.291L288.184 482.303ZM418.751 460.812L412.554 456.587C440.458 419.591 432.039 368.44 393.749 342.338L398.265 336.351L402.781 330.363C447.916 361.13 457.841 421.425 424.949 465.036L418.751 460.812ZM398.265 336.351L393.749 342.338L191.805 204.678L196.321 198.69L200.838 192.702L402.781 330.363L398.265 336.351ZM196.321 198.69L191.805 204.678C153.515 178.577 99.8549 187.409 71.951 224.406L65.7539 220.181L59.5568 215.957C92.4491 172.346 155.703 161.935 200.838 192.702L196.321 198.69ZM65.7539 220.181L71.951 224.406C44.0472 261.402 52.4666 312.553 90.7563 338.655L86.2401 344.642L81.7239 350.63C36.589 319.863 26.6645 259.568 59.5568 215.957L65.7539 220.181Z" fill="black"/>
<rect width="441.733" height="197.803" rx="98.9017" transform="matrix(-0.826736 -0.56259 0.601492 -0.798879 848.022 406.536)" fill="#2CAA56"/>
<path d="M770.768 344.903L775.279 338.911L573.614 201.679L569.102 207.671L564.591 213.662L766.257 350.895L770.768 344.903ZM569.102 207.671L573.614 201.679C535.305 175.61 526.844 124.468 554.715 87.4494L548.515 83.23L542.314 79.0106C509.46 122.647 519.433 182.932 564.591 213.662L569.102 207.671ZM548.515 83.23L554.715 87.4494C582.587 50.4313 636.237 41.5553 674.546 67.6243L679.057 61.6328L683.568 55.6412C638.41 24.9114 575.169 35.3743 542.314 79.0106L548.515 83.23ZM679.057 61.6328L674.546 67.6243L876.212 204.857L880.723 198.865L885.234 192.874L683.568 55.6412L679.057 61.6328ZM880.723 198.865L876.212 204.857C914.521 230.926 922.982 282.068 895.11 319.086L901.31 323.306L907.511 327.525C940.366 283.889 930.392 223.603 885.234 192.874L880.723 198.865ZM901.31 323.306L895.11 319.086C867.238 356.104 813.588 364.98 775.279 338.911L770.768 344.903L766.257 350.895C811.415 381.624 874.656 371.161 907.511 327.525L901.31 323.306Z" fill="black"/>
</svg>`;

function buildIco(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // number of images

  const directoryEntries = [];
  let offset = 6 + 16 * count;

  for (const { width, height, buffer } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(buffer.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    directoryEntries.push(entry);
    offset += buffer.length;
  }

  return Buffer.concat([header, ...directoryEntries, ...images.map(img => img.buffer)]);
}

async function main() {
  const root = path.join(__dirname, '..');
  const appDir = path.join(root, 'frontend/website/app');
  const pubDir = path.join(root, 'frontend/website/public');

  // 1. Write the clean square SVG to app/icon.svg and public/icon.svg
  fs.writeFileSync(path.join(appDir, 'icon.svg'), SQUARE_SVG, 'utf8');
  fs.writeFileSync(path.join(pubDir, 'icon.svg'), SQUARE_SVG, 'utf8');
  console.log('Created app/icon.svg and public/icon.svg');

  // 2. Render PNGs for various icon sizes
  const svgBuffer = Buffer.from(SQUARE_SVG, 'utf8');
  const sizes = [16, 32, 48, 64, 180, 192, 256, 512];
  const pngs = {};

  for (const size of sizes) {
    pngs[size] = await sharp(svgBuffer)
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toBuffer();
    console.log(`Rendered ${size}x${size} PNG (${pngs[size].length} bytes)`);
  }

  // 3. Write apple-touch-icon and web app manifest icons
  fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), pngs[180]);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), pngs[180]);
  fs.writeFileSync(path.join(pubDir, 'icon-192.png'), pngs[192]);
  fs.writeFileSync(path.join(pubDir, 'icon-512.png'), pngs[512]);
  console.log('Saved apple-touch-icon.png, apple-icon.png, icon-192.png, icon-512.png');

  // 4. Build multi-resolution ICO file (16, 32, 48, 64, 256)
  const icoImages = [16, 32, 48, 64, 256].map(size => ({
    width: size,
    height: size,
    buffer: pngs[size],
  }));
  const icoBuffer = buildIco(icoImages);

  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(pubDir, 'favicon.ico'), icoBuffer);
  console.log(`Saved favicon.ico (${icoBuffer.length} bytes) to app/ and public/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
