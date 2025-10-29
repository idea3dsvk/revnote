import React, { useState, useEffect } from 'react';
import { Asset, InspectionStatus } from '../types';
import Badge from './Badge';
import PlusIcon from './icons/PlusIcon';
import BuildingOfficeIcon from './icons/BuildingOfficeIcon';

interface AssetListProps {
  assets: Asset[];
  selectedAssetId: string | null;
  onSelectAsset: (id: string) => void;
  onAddAsset: () => void;
  onOpenOperatorModal: () => void;
  canAddAsset?: boolean;
  canEditOperator?: boolean;
}

const ITEMS_PER_PAGE = 6;

const getAssetStatus = (asset: Asset): InspectionStatus => {
    if (asset.isExcluded) {
        return InspectionStatus.EXCLUDED;
    }

    if (asset.inspections.length === 0) {
        return InspectionStatus.DUE;
    }

    // Find the latest inspection using a robust reduce method to avoid side-effects
    const latestInspection = asset.inspections.reduce((latest, current) => 
        new Date(current.date) > new Date(latest.date) ? current : latest
    );

    // If the latest inspection failed, the overall status is FAIL
    if (latestInspection.status === InspectionStatus.FAIL) {
        return InspectionStatus.FAIL;
    }

    // If the latest inspection passed, check if the next inspection is overdue
    const today = new Date();
    const nextDate = new Date(asset.nextInspectionDate);
    today.setHours(0, 0, 0, 0);
    nextDate.setHours(0, 0, 0, 0);

    if (nextDate < today) {
        return InspectionStatus.FAIL; // Overdue
    }

    // If the latest inspection passed and it's not overdue, the status is PASS
    return InspectionStatus.PASS;
};


const getDaysUntilNextInspection = (asset: Asset): { text: string; className: string } => {
    if (asset.isExcluded) {
        return { text: 'Vylúčené z evidencie', className: 'text-gray-500' };
    }
    
    const hasNoInspections = asset.inspections.length === 0;
    if (hasNoInspections) {
        return { text: 'Plánovaná', className: 'text-blue-600 font-semibold' };
    }

    // Find the latest inspection using a robust reduce method
    const latestInspection = asset.inspections.reduce((latest, current) => 
        new Date(current.date) > new Date(latest.date) ? current : latest
    );
    
    if (latestInspection.status === InspectionStatus.FAIL) {
        return { text: 'Nevyhovuje', className: 'text-red-600 font-semibold' };
    }

    const today = new Date();
    const nextDate = new Date(asset.nextInspectionDate);
    // Reset time to compare dates only
    today.setHours(0, 0, 0, 0);
    nextDate.setHours(0, 0, 0, 0);

    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return {
            text: `Po termíne o ${Math.abs(diffDays)} dní`,
            className: 'text-red-600 font-semibold'
        };
    }
    if (diffDays === 0) {
        return {
            text: 'Revízia je potrebná dnes',
            className: 'text-red-600 font-semibold'
        };
    }
    if (diffDays <= 30) {
        return {
            text: `Revízia o ${diffDays} dní`,
            className: 'text-yellow-600'
        };
    }
    return {
        text: `Revízia o ${diffDays} dní`,
        className: 'text-green-600'
    };
};


const AssetList: React.FC<AssetListProps> = ({ 
    assets, 
    selectedAssetId, 
    onSelectAsset, 
    onAddAsset, 
    onOpenOperatorModal,
    canAddAsset = true,
    canEditOperator = true
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | InspectionStatus>('all');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredAssets = assets
        .filter(asset => {
            if (statusFilter === 'all') {
                return true;
            }
            return getAssetStatus(asset) === statusFilter;
        })
        .filter(asset =>
            asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.revisionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    // Pagination logic
    const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
    const paginatedAssets = filteredAssets.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );
    
    const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

    const filterButtons = [
        { label: 'Všetky', value: 'all', color: 'primary' },
        { label: 'Vyhovuje', value: InspectionStatus.PASS, color: 'green' },
        { label: 'Nevyhovuje', value: InspectionStatus.FAIL, color: 'red' },
        { label: 'Plánovaná', value: InspectionStatus.DUE, color: 'yellow' },
        { label: 'Vylúčené', value: InspectionStatus.EXCLUDED, color: 'gray' },
    ];

    const getButtonClasses = (value: 'all' | InspectionStatus, color: string) => {
        const base = "px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
        const isActive = statusFilter === value;
        if (isActive) {
            switch (color) {
                case 'primary': return `${base} bg-primary-600 text-white ring-primary-500`;
                case 'green': return `${base} bg-green-600 text-white ring-green-500`;
                case 'red': return `${base} bg-red-600 text-white ring-red-500`;
                case 'yellow': return `${base} bg-yellow-500 text-white ring-yellow-400`;
                case 'gray': return `${base} bg-gray-600 text-white ring-gray-500`;
                default: return `${base} bg-primary-600 text-white ring-primary-500`;
            }
        } else {
            return `${base} bg-gray-200 text-gray-700 hover:bg-gray-300 ring-primary-500`;
        }
    };
    
    return (
        <div className="bg-white h-full flex flex-col shadow-lg rounded-lg">
            {/* --- HEADER --- */}
            <div className="p-4 border-b">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Zoznam náradia a spotrebičov</h2>
                    {canEditOperator && (
                        <button
                            onClick={onOpenOperatorModal}
                            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200"
                            title="Upraviť údaje o prevádzkovateľovi"
                        >
                            <BuildingOfficeIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {filterButtons.map(btn => (
                        <button
                            key={btn.value}
                            onClick={() => setStatusFilter(btn.value as 'all' | InspectionStatus)}
                            className={getButtonClasses(btn.value as 'all' | InspectionStatus, btn.color)}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
                <div className="mt-4 relative">
                    <input
                        type="text"
                        placeholder="Hľadať podľa názvu, rev. č. alebo sér. č...."
                        className="w-full pl-8 pr-4 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                </div>
            </div>

            {/* --- SCROLLABLE LIST --- */}
            <div className="flex-grow overflow-y-auto">
                {paginatedAssets.length > 0 ? (
                     <ul className="divide-y divide-gray-200">
                        {paginatedAssets.map(asset => {
                            const daysInfo = getDaysUntilNextInspection(asset);
                            const assetStatus = getAssetStatus(asset);
                            return (
                                <li 
                                  key={asset.id} 
                                  onClick={() => onSelectAsset(asset.id)}
                                  className={`p-4 flex justify-between items-start hover:bg-primary-50 transition-colors duration-200 cursor-pointer ${selectedAssetId === asset.id ? 'bg-primary-100' : ''}`}
                                >
                                    <div className="flex-grow">
                                        <p className="font-semibold text-gray-900">{asset.name}</p>
                                        <p className="text-sm text-gray-500">Rev. č.: {asset.revisionNumber}</p>
                                        <p className={`text-sm ${daysInfo.className}`}>{daysInfo.text}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 flex flex-col items-end gap-2 pl-4">
                                         <Badge status={assetStatus} />
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-center text-gray-500 p-8">Nenašli sa žiadne položky pre zvolený filter.</p>
                )}
            </div>

            {/* --- FOOTER --- */}
            <div className="p-4 border-t space-y-4">
                 {canAddAsset && (
                     <button 
                        onClick={onAddAsset}
                        className="w-full flex items-center justify-center bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Pridať nové náradie
                    </button>
                 )}
                {totalPages > 1 && (
                    <div className="flex justify-between items-center text-sm text-gray-600">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border rounded-md bg-white hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Predchádzajúca
                        </button>
                        <span>
                            Strana {currentPage} z {totalPages}
                        </span>
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border rounded-md bg-white hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Nasledujúca
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AssetList;