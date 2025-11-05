const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Lee el archivo principal para mapear nombres de hojas -> rutas .htm
function parseWorkbookMapping(rootDir) {
  const mainHtmlPath = path.join(rootDir, 'Analisis_Financiero_Porsche_2022-2024.htm');
  if (!fs.existsSync(mainHtmlPath)) {
    return [];
  }
  const content = fs.readFileSync(mainHtmlPath, 'utf-8');
  const mappings = [];

  const regex = /<x:ExcelWorksheet>[\s\S]*?<x:Name>(.*?)<\/x:Name>[\s\S]*?<x:WorksheetSource\s+HRef="([^"]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const name = match[1].replace(/[�]/g, ''); // limpiar caracteres
    const href = match[2];
    mappings.push({ name, href });
  }
  return mappings;
}

// Extrae la primera tabla de un archivo .htm exportado por Excel
function parseSheetTable(filePath) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);

  const table = $('table').first();
  if (!table || table.length === 0) {
    return { headers: [], rows: [] };
  }

  const rows = [];
  let headers = [];

  table.find('tr').each((i, tr) => {
    const cells = [];
    $(tr)
      .find('th, td')
      .each((j, td) => {
        const text = $(td).text().trim().replace(/\s+/g, ' ');
        cells.push(text);
      });
    if (i === 0) {
      headers = cells;
    } else if (cells.length > 0) {
      rows.push(cells);
    }
  });

  return { headers, rows };
}

function parseAnalysisData() {
  const rootDir = path.join(__dirname, '..');
  const archDir = path.join(rootDir, 'Analisis_Financiero_Porsche_2022-2024_archivos');

  const mappings = parseWorkbookMapping(rootDir);
  const sheets = [];

  if (mappings.length === 0) {
    // Fallback: buscar archivos sheetXXX.htm en la carpeta
    const files = fs.existsSync(archDir) ? fs.readdirSync(archDir) : [];
    files
      .filter((f) => /^sheet\d+\.htm$/i.test(f))
      .forEach((file) => {
        const filePath = path.join(archDir, file);
        const { headers, rows } = parseSheetTable(filePath);
        sheets.push({ name: file.replace(/\.htm$/i, ''), headers, rows });
      });
  } else {
    // Usar el mapeo de nombres y rutas
    mappings.forEach(({ name, href }) => {
      const absPath = path.join(rootDir, href);
      if (fs.existsSync(absPath)) {
        const { headers, rows } = parseSheetTable(absPath);
        sheets.push({ name, headers, rows });
      }
    });
  }

  return { sheets };
}

module.exports = {
  parseAnalysisData,
};