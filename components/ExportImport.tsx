import React from 'react';
import { Asset, Operator } from '../types';

interface ExportImportProps {
  assets: Asset[];
  operator: Operator;
  onImport: (data: { assets: Asset[]; operator: Operator }) => void;
}

const ExportImport: React.FC<ExportImportProps> = ({ assets, operator, onImport }) => {
  const handleExport = () => {
    const data = {
      assets,
      operator,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evidencia-revizii-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.assets || !Array.isArray(data.assets)) {
          alert('Neplatný formát súboru - chýbajú údaje o zariadeniach.');
          return;
        }
        
        if (window.confirm('Naozaj chcete importovať tieto dáta? Aktuálne dáta budú prepísané.')) {
          onImport({
            assets: data.assets,
            operator: data.operator || operator
          });
        }
      } catch (error) {
        console.error('Chyba pri importe:', error);
        alert('Nepodarilo sa načítať súbor. Skontrolujte, či je súbor v správnom formáte.');
      }
    };
    reader.readAsText(file);
    
    // Reset input aby sa dal ten istý súbor znova nahrať
    event.target.value = '';
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        title="Exportovať všetky dáta do JSON súboru"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export
      </button>
      
      <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Import
        <input
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </label>
    </div>
  );
};

export default ExportImport;
