import { useRef } from 'react';
import { exportJSON, importJSON } from '../utils/importExport';
import { exportExcel } from '../utils/exportExcel';

export default function ImportExportBar({ projectData, onImport }) {
  const fileRef = useRef(null);

  function handleExport() {
    exportJSON(projectData, `argus-export-${new Date().toISOString().slice(0, 10)}.json`);
  }

  async function handleExcelExport() {
    try {
      await exportExcel(projectData, `argus-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      alert('Excel-Export fehlgeschlagen: ' + err.message);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = await importJSON(file);
      onImport(data);
    } catch (err) {
      alert('Import fehlgeschlagen: ' + err.message);
    }
    e.target.value = '';
  }

  return (
    <div className="import-export-bar">
      <button className="btn btn-secondary" onClick={handleExport}>
        ⬇ Export JSON
      </button>
      <button className="btn btn-secondary" onClick={handleExcelExport}>
        📊 Export Excel
      </button>
      <button className="btn btn-secondary" onClick={() => fileRef.current.click()}>
        ⬆ Import JSON
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
