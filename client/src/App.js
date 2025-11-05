import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [staticData, setStaticData] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hook para cargar los datos cuando el componente se monta
  useEffect(() => {
    async function fetchData() {
      try {
        // Hacemos las dos llamadas a nuestro backend en paralelo
        const [staticRes, liveRes] = await Promise.all([
          fetch('http://localhost:5000/api/static-data'),
          fetch('http://localhost:5000/api/live-data')
        ]);

        const staticJson = await staticRes.json();
        const liveJson = await liveRes.json();

        setStaticData(staticJson);
        setLiveData(liveJson);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []); // El array vacío [] significa que esto se ejecuta solo una vez

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

  if (!staticData || !liveData) {
    return <div className="App"><h1>Error al cargar los datos.</h1></div>;
  }

  // Calculamos los valores en MXN
  const { rate } = liveData;
  const totalActivosMXN = staticData.balance_2024.total_activos * rate;
  const ingresosVentasMXN = staticData.resultados_2024.ingresos_ventas * rate;
  const utilidadNetaMXN = staticData.resultados_2024.utilidad_neta * rate;


  return (
    <div className="App">
      <h1>Análisis Financiero de Porsche AG</h1>

      <div className="card">
        <h2>Datos en Vivo</h2>
        <div className="metric">
          <span>Precio de Acción (P911)</span>
          <span>{formatCurrency(liveData.stock.price, 'EUR')}</span>
        </div>
        <div className="metric">
          <span>Tasa de Cambio (EUR a MXN)</span>
          <span>${liveData.rate.toFixed(4)} MXN</span>
        </div>
      </div>

      <div className="card">
        <h2>Análisis 2024 (Millones)</h2>
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

        <div className="metric">
          <span>Total Activos</span>
          <span>{formatCurrency(staticData.balance_2024.total_activos, 'EUR')}</span>
        </div>
         <div className="metric-mxn">
          (Aprox. {formatCurrency(totalActivosMXN, 'MXN')})
        </div>
      </div>
    </div>
  );
}

export default App;