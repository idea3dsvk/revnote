import React, { useState } from 'react';
import { Asset, Inspection, Operator } from '../types';
import Card from './Card';
import Badge from './Badge';
import PlusIcon from './icons/PlusIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import NoSymbolIcon from './icons/NoSymbolIcon';
import TrashIcon from './icons/TrashIcon';
import { generateInspectionReport } from '../services/pdfGenerator';

interface AssetDetailProps {
  asset: Asset | null;
  onAddInspection: (assetId: string) => void;
  operator: Operator | null;
  onExcludeAsset: (assetId: string) => void;
  onRestoreAsset: (assetId: string) => void;
  canAddInspection?: boolean;
  canExcludeAsset?: boolean;
  canGeneratePDF?: boolean;
}

const AssetDetail: React.FC<AssetDetailProps> = ({ 
  asset, 
  onAddInspection, 
  operator, 
  onExcludeAsset,
  onRestoreAsset,
  canAddInspection = true,
  canExcludeAsset = true,
  canGeneratePDF = true
}) => {
  const [expandedInspectionId, setExpandedInspectionId] = useState<string | null>(null);

  if (!asset) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Vyberte náradie</h3>
            <p className="mt-1 text-sm text-gray-500">Zvoľte položku zo zoznamu vľavo pre zobrazenie detailov.</p>
        </div>
      </div>
    );
  }

  const handleToggleInspection = (inspectionId: string) => {
    setExpandedInspectionId(prevId => (prevId === inspectionId ? null : inspectionId));
  };

  const handleGenerateReport = () => {
    if (asset) {
      generateInspectionReport(asset, operator);
    }
  };

  const handleExclude = () => {
    if (asset && window.confirm(`Naozaj chcete vylúčiť zariadenie "${asset.name}" z evidencie?`)) {
      onExcludeAsset(asset.id);
    }
  };

  const handleRestore = () => {
    if (asset && window.confirm(`Naozaj chcete vrátiť zariadenie "${asset.name}" späť do evidencie?`)) {
      onRestoreAsset(asset.id);
    }
  };

  const sortedInspections = [...asset.inspections].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const isExcluded = !!asset.isExcluded;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {isExcluded && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md" role="alert">
          <div className="flex items-center">
            <NoSymbolIcon className="w-6 h-6 mr-3" />
            <div>
              <p className="font-bold">Zariadenie je vylúčené z evidencie</p>
              <p className="text-sm">Pre toto zariadenie nie je možné vykonávať ďalšie akcie.</p>
            </div>
          </div>
        </div>
      )}
      <Card>
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">{asset.name}</h2>
                <p className="text-md text-gray-600">{asset.type}</p>
            </div>
            <div className="flex flex-wrap gap-2">
                {canExcludeAsset && isExcluded && (
                    <button
                        onClick={handleRestore}
                        className="flex items-center bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Vrátiť do evidencie
                    </button>
                )}
                {canExcludeAsset && !isExcluded && (
                    <button
                        onClick={handleExclude}
                        className="flex items-center bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <TrashIcon className="w-5 h-5 mr-2" />
                        Vylúčiť
                    </button>
                )}
                {canGeneratePDF && asset.inspections.length > 0 && (
                     <button
                        onClick={handleGenerateReport}
                        disabled={isExcluded}
                        className="flex items-center bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <DocumentTextIcon className="w-5 h-5 mr-2" />
                        Revízna správa
                    </button>
                )}
                {canAddInspection && (
                     <button
                        onClick={() => onAddInspection(asset.id)}
                        disabled={isExcluded}
                        className="flex items-center bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-primary-300 disabled:cursor-not-allowed"
                        >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Nová revízia
                    </button>
                )}
            </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div><strong>Revízne číslo:</strong> {asset.revisionNumber}</div>
          <div><strong>Sériové číslo:</strong> {asset.serialNumber}</div>
          <div><strong>Lokalita:</strong> {asset.location}</div>
          <div><strong>Dátum obstarania:</strong> {new Date(asset.purchaseDate).toLocaleDateString('sk-SK')}</div>
          <div>
            <strong>Ďalšia revízia:</strong> 
            {asset.inspections.length === 0 
              ? <span className="text-blue-600 font-semibold">Plánovaná</span> 
              : new Date(asset.nextInspectionDate).toLocaleDateString('sk-SK')}
          </div>
          <div className="md:col-span-3"><strong>Spôsob používania:</strong> {asset.usageType}</div>
          <div className="md:col-span-3"><strong>Skupina používania:</strong> {asset.usageGroup}</div>
        </div>
        {asset.notes && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-600">Poznámka k zariadeniu:</h4>
            <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{asset.notes}</p>
          </div>
        )}
      </Card>
      
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">História revízií</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dátum</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revízny technik</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stav</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poznámky</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {sortedInspections.length > 0 ? sortedInspections.map((inspection: Inspection) => (
                    <React.Fragment key={inspection.id}>
                      <tr onClick={() => handleToggleInspection(inspection.id)} className="cursor-pointer hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(inspection.date).toLocaleDateString('sk-SK')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inspection.inspectorName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><Badge status={inspection.status} /></td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{inspection.notes}</td>
                      </tr>
                      {expandedInspectionId === inspection.id && (
                        <tr className="bg-primary-50">
                          <td colSpan={4} className="px-6 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                              <div className="col-span-full">
                                <h4 className="font-semibold text-gray-800">Detaily merania:</h4>
                              </div>
                              <div><strong className="text-gray-600">Merací prístroj:</strong> {inspection.measuringDevice}</div>
                              <div><strong className="text-gray-600">Odpor izolácie Riso:</strong> {inspection.insulationResistance} MΩ</div>
                              <div><strong className="text-gray-600">Odpor ochr. vodiča Rpe:</strong> {inspection.protectiveConductorResistance} Ω</div>
                              {inspection.protectiveConductorCurrent != null && <div><strong className="text-gray-600">Prúd ochr. vodičom:</strong> {inspection.protectiveConductorCurrent} mA</div>}
                              {inspection.touchCurrent != null && <div><strong className="text-gray-600">Dotykový prúd IF:</strong> {inspection.touchCurrent} mA</div>}
                              {inspection.leakageCurrent != null && <div><strong className="text-gray-600">Unikajúci prúd Iup:</strong> {inspection.leakageCurrent} mA</div>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                    )) : (
                        <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Žiadne revízie neboli vykonané.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};

export default AssetDetail;