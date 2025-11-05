const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000; // Elige un puerto para tu backend

// Importa tus datos estáticos
const staticData = require('./static-data.json');

app.use(cors()); // Permite que React (en puerto 3000) hable con este servidor

// --- Endpoint para tus datos estáticos (los CSVs) ---
app.get('/api/static-data', (req, res) => {
  res.json(staticData);
});

// --- Endpoint para los datos en VIVO ---
// En un proyecto real, llamarías a tus APIs aquí usando axios.
// Por ahora, simulamos la llamada con los datos que Google me da.
app.get('/api/live-data', async (req, res) => {
  try {
    // 1. Aquí harías la llamada a la API de acciones
    // const stockResponse = await axios.get('https://api-de-bolsa.com/P911');
    const porscheStock = {
      price: 78.50, // Dato de Google Search
      currency: 'EUR'
    };

    // 2. Aquí harías la llamada a la API de divisas
    // const currencyResponse = await axios.get('https://api-de-divisas.com/EUR-MXN');
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