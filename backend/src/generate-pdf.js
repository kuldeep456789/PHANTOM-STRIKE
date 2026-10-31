const puppeteer = require('puppeteer-core');
const path = require('path');

async function generatePdf() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const htmlPath = path.resolve(__dirname, '../../docs_export.html');
  const pdfPath = path.resolve(__dirname, '../../PHANTOM_STRIKE_DOCUMENTATION.pdf');

  console.log('Launching Edge from:', edgePath);
  const browser = await puppeteer.launch({
    executablePath: edgePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  console.log('Loading file:', htmlPath);
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

  console.log('Printing to PDF:', pdfPath);
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm'
    }
  });

  await browser.close();
  console.log('PDF Generation Complete!');
}

generatePdf().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});

