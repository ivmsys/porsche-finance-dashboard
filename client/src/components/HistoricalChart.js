import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// ¡MUY IMPORTANTE! Registra los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Opciones básicas para la gráfica
export const options = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 800,
    easing: 'easeOutQuart'
  },
  plugins: {
    legend: {
      position: 'top',
      labels: { color: '#e6e6e6' }
    },
    title: {
      display: true,
      text: 'Evolución Histórica (Millones EUR)',
      font: {
        size: 16
      },
      color: '#e6e6e6'
    },
  },
  scales: {
    y: {
      grid: { color: 'rgba(255,255,255,0.08)' },
      ticks: {
        color: '#cccccc',
        // Formatear el eje Y para que se vea mejor
        callback: function(value) {
          return value / 1000 + 'k'; // Muestra 40000 como 40k
        }
      }
    },
    x: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#cccccc' }
    }
  }
};

function HistoricalChart({ chartData }) {
  // Damos un alto fijo al contenedor para que la gráfica se vea bien
  return (
    <div style={{ height: '350px' }}>
      <Line options={options} data={chartData} />
    </div>
  );
}

export default HistoricalChart;