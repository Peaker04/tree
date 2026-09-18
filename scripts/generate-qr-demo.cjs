const fs = require('node:fs');
const path = require('node:path');
const QRCode = require('qrcode');

const trees = [
  { id: 'TRE-0824', name: 'Cay Xa Cu Co Thu #01', qrCode: 'NOVYX-TRE-0824' },
  { id: 'TRE-1142', name: 'Cay Bang Lang Tim #04', qrCode: 'NOVYX-TRE-1142' },
];

const outputDir = path.resolve(__dirname, '..', 'dist', 'qr-demo');

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const manifest = [];

  for (const tree of trees) {
    const fileName = `${tree.id}.svg`;
    const filePath = path.join(outputDir, fileName);
    const svg = await QRCode.toString(tree.qrCode, {
      type: 'svg',
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 512,
      color: {
        dark: '#153d2b',
        light: '#ffffff',
      },
    });

    fs.writeFileSync(filePath, svg, 'utf8');
    manifest.push({ ...tree, file: fileName });
  }

  const html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>NOVYX QR Demo Payloads</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 32px; color: #153d2b; }
      .grid { display: grid; grid-template-columns: repeat(2, minmax(260px, 1fr)); gap: 24px; }
      .card { border: 1px solid #c8e8cd; border-radius: 16px; padding: 20px; break-inside: avoid; }
      img { width: 220px; height: 220px; display: block; margin-bottom: 16px; }
      h2 { margin: 0 0 6px; font-size: 18px; }
      code { font-size: 16px; font-weight: 700; }
      @media print { body { margin: 12mm; } .card { page-break-inside: avoid; } }
    </style>
  </head>
  <body>
    <h1>NOVYX GreenOps - QR Demo Payloads</h1>
    <div class="grid">
      ${manifest
        .map(
          (item) => `<section class="card">
        <img src="./${item.file}" alt="${item.qrCode}" />
        <h2>${item.id}</h2>
        <p>${item.name}</p>
        <code>${item.qrCode}</code>
      </section>`,
        )
        .join('\n')}
    </div>
  </body>
</html>
`;

  fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf8');
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log(`Generated ${manifest.length} QR demo payloads in ${outputDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
