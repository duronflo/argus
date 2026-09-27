import { useRef } from 'react';
import { exportJSON, importJSON } from '../utils/importExport';
import { useProject } from '../state/ProjectContext';

export default function ImportExportBar({ onImport }) {
  const { data: projectData, model } = useProject();
  const fileRef = useRef(null);

  function handleExport() {
    exportJSON(projectData, `argus-export-${new Date().toISOString().slice(0, 10)}.json`);
  }

  async function handleExcelExport() {
    try {
      // exceljs is large – load it only when an export is requested.
      const { exportExcel } = await import('../utils/exportExcel');
      await exportExcel(projectData, model, `argus-export-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
