const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();
const PORT = 5000;

// Importa tus datos
const staticData = require('./static-data.json');
// ¡NUEVO! Importa los datos históricos
const historicalData = require('./historical-data.json'); 
// ¡NUEVO! Parser para XLSX
const { parseXlsxData } = require('./parse-xlsx');

app.use(cors());
app.use(express.json());

// Configuración de subida de archivos
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const isXlsx =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      (file.originalname || '').toLowerCase().endsWith('.xlsx');
    if (!isXlsx) return cb(new Error('Solo se permiten archivos .xlsx'));
    cb(null, true);
  }
});

// Endpoint para tus datos estáticos (los CSVs)
app.get('/api/static-data', (req, res) => {
  res.json(staticData);
});

// ¡NUEVO! Endpoint para los datos históricos
app.get('/api/historical-data', (req, res) => {
  res.json(historicalData);
});

// Endpoint para extraer las tablas del análisis desde XLSX
app.get('/api/analysis', (req, res) => {
  try {
    const xlsxData = parseXlsxData();
    // Siempre respondemos con el contenido del XLSX
    return res.json(xlsxData);
  } catch (error) {
    console.error('Error al parsear análisis:', error);
    res.status(500).json({ error: 'Error al parsear análisis' });
  }
});

// Endpoint para subir y fijar el XLSX activo
app.post('/api/upload-xlsx', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      const status = err.message && err.message.includes('límite') ? 413 : 400;
      return res.status(status).json({ error: err.message || 'Error al subir XLSX' });
    }
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se recibió archivo' });
      }
      const metaPath = path.join(__dirname, 'latest-xlsx.json');
      const latestInfo = {
        path: req.file.path,
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString()
      };
      fs.writeFileSync(metaPath, JSON.stringify(latestInfo, null, 2));
      // Limpieza de archivos antiguos en uploads
      try {
        const files = fs.readdirSync(uploadsDir);
        files.forEach((f) => {
          const fp = path.join(uploadsDir, f);
          if (fp !== latestInfo.path && !f.startsWith('.gitkeep')) {
            try { fs.unlinkSync(fp); } catch(_) {}
          }
        });
      } catch (_) {}

      const parsed = parseXlsxData();
      return res.json({ message: 'Archivo subido y establecido como fuente', latest: latestInfo, parsed });
    } catch (error) {
      console.error('Error en upload-xlsx:', error);
      return res.status(500).json({ error: 'Error al subir XLSX' });
    }
  });
});

// Reset al Excel por defecto
app.post('/api/reset-xlsx', (req, res) => {
  try {
    const metaPath = path.join(__dirname, 'latest-xlsx.json');
    if (fs.existsSync(metaPath)) {
      fs.unlinkSync(metaPath);
    }
    const parsed = parseXlsxData();
    return res.json({ message: 'Fuente restablecida al Excel por defecto', parsed });
  } catch (error) {
    console.error('Error en reset-xlsx:', error);
    return res.status(500).json({ error: 'Error al restablecer XLSX' });
  }
});

// Endpoint para los datos en VIVO
app.get('/api/live-data', async (req, res) => {
  try {
    const porscheStock = {
      price: 78.50, // Dato de Google Search
      currency: 'EUR'
    };
    const eurToMxnRate = 21.63; // Dato de Google Search

    res.json({
      stock: porscheStock,
      rate: eurToMxnRate
    });

  } catch (error) {
    res.status(500).json({ error: 'Error al obtener datos en vivo' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Metadata del último XLSX y resumen rápido
app.get('/api/latest-xlsx', (req, res) => {
  try {
    const metaPath = path.join(__dirname, 'latest-xlsx.json');
    let latest = null;
    if (fs.existsSync(metaPath)) {
      latest = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }
    const parsed = parseXlsxData();
    const summary = (parsed.sheets || []).map(s => ({
      name: s.name,
      rows: s.rows.length,
      cols: s.headers.length
    }));
    return res.json({ latest, summary });
  } catch (error) {
    console.error('Error en latest-xlsx:', error);
    return res.status(500).json({ error: 'Error al obtener metadata' });
  }
});