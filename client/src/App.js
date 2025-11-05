import React, { useState, useEffect } from 'react';
import './App.css';
import Header from './components/Header';
import ScrollReveal from './components/ScrollReveal';
// ¡NUEVO! Importa el componente de gráfica
import HistoricalChart from './components/HistoricalChart';
import XlsxUploader from './components/XlsxUploader';
import staticDataJson from './data/static-data.json';
import historicalDataJson from './data/historical-data.json';
import liveDataJson from './data/live-data.json';

function App() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const [staticData, setStaticData] = useState(null);
  const [liveData, setLiveData] = useState(null);
  // ¡NUEVO! Estado para los datos históricos
  const [historicalData, setHistoricalData] = useState(null);
  // ¡NUEVO! Estado para las tablas del análisis exportado
  const [analysisData, setAnalysisData] = useState(null);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  
  const [loading, setLoading] = useState(true);

  // Hook para cargar los datos
  useEffect(() => {
    // Carga estática sin backend
    try {
      setStaticData(staticDataJson);
      setLiveData(liveDataJson);
      setHistoricalData(historicalDataJson);
      // Sin backend: la fuente de análisis se carga al subir XLSX
      setAnalysisData(null);
    } catch (error) {
      console.error('Error al cargar datos estáticos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para formatear los números
  const formatCurrency = (number, currency) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(number);
  };

  if (loading) {
    return <div className="App"><h1>Cargando análisis de Porsche...</h1></div>;
  }

  // Si falla alguna carga, muestra un error
  if (!staticData || !liveData || !historicalData || !analysisData) {
    return <div className="App"><h1>Error al cargar los datos.</h1></div>;
  }

  // --- ¡NUEVO! Preparamos los datos para la gráfica ---
  // Podemos crear múltiples gráficas, empecemos con Ingresos y Utilidad
  const profitAndRevenueChartData = {
    labels: historicalData.labels, // ['2022', '2023', '2024']
    datasets: [
      {
        label: 'Ingresos por Ventas',
        data: historicalData.revenue,
        borderColor: 'rgb(215, 0, 21)', // Rojo Porsche
        backgroundColor: 'rgba(215, 0, 21, 0.5)',
        tension: 0.1 // Hace la línea ligeramente curva
      },
      {
        label: 'Utilidad Neta',
        data: historicalData.netIncome,
        borderColor: 'rgb(53, 53, 53)', // Gris Oscuro
        backgroundColor: 'rgba(53, 53, 53, 0.5)',
        tension: 0.1
      },
    ],
  };
  
  // Datos para una segunda gráfica (ej. Activos vs Capital)
   const assetsVsEquityChartData = {
    labels: historicalData.labels,
    datasets: [
      {
        label: 'Total Activos',
        data: historicalData.totalAssets,
        borderColor: 'rgb(0, 98, 133)', // Azul
        backgroundColor: 'rgba(0, 98, 133, 0.5)',
      },
      {
        label: 'Capital',
        data: historicalData.equity,
        borderColor: 'rgb(0, 178, 124)', // Verde
        backgroundColor: 'rgba(0, 178, 124, 0.5)',
      },
    ],
  };

  // Calculamos los valores en MXN
  const { rate } = liveData;
  const ingresosVentasMXN = staticData.resultados_2024.ingresos_ventas * rate;
  const utilidadNetaMXN = staticData.resultados_2024.utilidad_neta * rate;


  return (
    <div className="App">
      <Header theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
      <h1>Análisis Financiero de Porsche AG</h1>

      <ScrollReveal>
      <div className="card">
        <h2>Datos en Vivo</h2>
        {/* ... (el código de Datos en Vivo sigue igual) ... */}
         <div className="metric">
          <span>Precio de Acción (P911)</span>
          <span>{formatCurrency(liveData.stock.price, 'EUR')}</span>
        </div>
        <div className="metric">
          <span>Tasa de Cambio (EUR a MXN)</span>
          <span>${liveData.rate.toFixed(4)} MXN</span>
        </div>
      </div>
      </ScrollReveal>

      {/* --- ¡NUEVA SECCIÓN DE GRÁFICAS! --- */}

      <ScrollReveal>
      <div className="card">
        <h2>Rentabilidad (2022-2024)</h2>
        <HistoricalChart chartData={profitAndRevenueChartData} />
      </div>
      </ScrollReveal>

      <ScrollReveal>
      <div className="card">
        <h2>Balance (2022-2024)</h2>
        <HistoricalChart chartData={assetsVsEquityChartData} />
      </div>
      </ScrollReveal>

      {/* --- ¡NUEVA SECCIÓN: Tablas del análisis (Excel) con subida --- */}
      <ScrollReveal>
      <div className="card">
        <h2>Tablas del Análisis (Fuente Excel)</h2>
        <XlsxUploader onParsed={(data) => setAnalysisData(data)} />

        {analysisData && analysisData.sheets && analysisData.sheets.length > 0 ? (
          <>
            <div className="tabs">
              {analysisData.sheets.map((sheet, idx) => (
                <button
                  key={sheet.name + idx}
                  className={`tab ${activeSheetIndex === idx ? 'active' : ''}`}
                  onClick={() => setActiveSheetIndex(idx)}
                >
                  {sheet.name}
                </button>
              ))}
            </div>

            <div className="table-container fade-in">
              {(() => {
                const sheet = analysisData.sheets[activeSheetIndex];
                if (!sheet) return null;
                const { headers, rows } = sheet;
                return (
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i}>{h || ''}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 100).map((r, i) => (
                        <tr key={i}>
                          {r.map((c, j) => (
                            <td key={j}>{c}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </>
        ) : (
          <p style={{ opacity: 0.8 }}>Sube un archivo .xlsx para visualizar las hojas del análisis.</p>
        )}
      </div>
      </ScrollReveal>

      {/* --- Sección de 2024 (convertida) --- */}

      <ScrollReveal>
      <div className="card">
        <h2>Resumen 2024 (Millones)</h2>
        <p>Valores convertidos a pesos con la tasa de cambio actual.</p>

        <div className="metric">
          <span>Ingresos por Ventas</span>
          <span>{formatCurrency(staticData.resultados_2024.ingresos_ventas, 'EUR')}</span>
        </div>
        <div className="metric-mxn">
          (Aprox. {formatCurrency(ingresosVentasMXN, 'MXN')})
        </div>

        <div className="metric">
          <span>Utilidad Neta</span>
          <span>{formatCurrency(staticData.resultados_2024.utilidad_neta, 'EUR')}</span>
        </div>
        <div className="metric-mxn">
          (Aprox. {formatCurrency(utilidadNetaMXN, 'MXN')})
        </div>
      </div>
      </ScrollReveal>
    </div>
  );
}

export default App;