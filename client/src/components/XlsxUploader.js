import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
const API = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// Convierte un Workbook de XLSX a la estructura { sheets: [{name, headers, rows}] }
function workbookToSheets(workbook) {
  const sheets = workbook.SheetNames.map((name) => {
    const ws = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
    const headers = rows.length > 0 ? rows[0].map((h) => String(h || '').trim()) : [];
    const body = rows.slice(1).map((r) => r.map((c) => String(c ?? '').trim()));
    return { name: String(name || '').trim(), headers, rows: body };
  });
  return { sheets };
}

function XlsxUploader({ onParsed }) {
  const inputRef = useRef(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [serverStatus, setServerStatus] = useState('');
  const [summary, setSummary] = useState([]);

  const handleFile = async (file) => {
    setError('');
    if (!file) return;
    const MAX_SIZE_MB = 10;
    const isXlsx = (file.name || '').toLowerCase().endsWith('.xlsx');
    if (!isXlsx) {
      setError('Formato no válido. Solo .xlsx');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Archivo demasiado grande (> ${MAX_SIZE_MB}MB)`);
      return;
    }
    setFileName(file.name);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      const data = workbookToSheets(wb);
      onParsed && onParsed(data);
    } catch (e) {
      console.error('Error leyendo XLSX:', e);
      setError('No se pudo leer el archivo XLSX.');
    }
  };

  return (
    <div className="uploader">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <button className="upload-btn" onClick={() => inputRef.current?.click()}>
        Subir Excel (.xlsx)
      </button>
      {fileName && <span className="file-name">{fileName}</span>}
      {error && <div className="error-text">{error}</div>}
      {fileName && (
        <button
          className="upload-btn"
          onClick={async () => {
            if (!inputRef.current?.files?.[0]) return;
            setUploading(true);
            setServerStatus('');
            try {
              const form = new FormData();
              form.append('file', inputRef.current.files[0]);
              const res = await fetch(`${API}/api/upload-xlsx`, {
                method: 'POST',
                body: form,
              });
              const json = await res.json();
              if (!res.ok) throw new Error(json.error || 'Error al subir');
              setServerStatus('Guardado en el servidor');
              // Refresca desde el servidor para alinear datos
              const fresh = await fetch(`${API}/api/analysis`).then(r => r.json());
              const meta = await fetch(`${API}/api/latest-xlsx`).then(r => r.json());
              onParsed && onParsed(fresh);
              setSummary(meta.summary || []);
            } catch (e) {
              console.error(e);
              setServerStatus('Error al guardar en el servidor');
            } finally {
              setUploading(false);
            }
          }}
          disabled={uploading}
        >
          {uploading ? 'Guardando...' : 'Guardar en servidor'}
        </button>
      )}
      {serverStatus && <span className="file-name">{serverStatus}</span>}
      <button
        className="upload-btn"
        onClick={async () => {
          try {
            const res = await fetch(`${API}/api/reset-xlsx`, { method: 'POST' });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Error al restablecer');
            const fresh = await fetch(`${API}/api/analysis`).then(r => r.json());
            onParsed && onParsed(fresh);
            setServerStatus('Fuente restablecida al Excel por defecto');
          } catch (e) {
            console.error(e);
            setServerStatus('Error al restablecer fuente');
          }
        }}
      >
        Restablecer Excel del servidor
      </button>
      {summary && summary.length > 0 && (
        <div className="sheet-summary">
          {summary.map((s, i) => (
            <div key={s.name + i} className="chip">
              <span className="chip-title">{s.name}</span>
              <span className="chip-meta">{s.rows} filas · {s.cols} columnas</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default XlsxUploader;