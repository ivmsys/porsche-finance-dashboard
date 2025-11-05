const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function sanitizeName(name) {
  return String(name || '').replace(/[�]/g, '').trim();
}

function parseXlsxData() {
  const rootDir = path.join(__dirname, '..');
  const defaultPath = path.join(rootDir, 'Analisis_Financiero_Porsche_2022-2024.xlsx');
  // Si existe registro de último XLSX subido, úsalo
  const metaPath = path.join(__dirname, 'latest-xlsx.json');
  let xlsxPath = defaultPath;
  try {
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (meta && meta.path && fs.existsSync(meta.path)) {
        xlsxPath = meta.path;
      }
    }
  } catch (_) {
    // Silencio: si hay problema, caemos al default
  }

  if (!fs.existsSync(xlsxPath)) {
    return { sheets: [] };
  }

  const workbook = XLSX.readFile(xlsxPath);
  const sheets = workbook.SheetNames.map((name) => {
    const ws = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });

    const headers = rows.length > 0 ? rows[0].map((h) => String(h || '').trim()) : [];
    const body = rows.slice(1).map((r) => r.map((c) => String(c ?? '').trim()));

    return {
      name: sanitizeName(name),
      headers,
      rows: body,
    };
  });

  return { sheets };
}

module.exports = {
  parseXlsxData,
};