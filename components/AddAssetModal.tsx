import React, { useState, useEffect } from 'react';
import { Asset, UsageType, UsageGroup } from '../types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (data: Omit<Asset, 'id' | 'inspections' | 'nextInspectionDate'>) => void;
  assets: Asset[];
}

const AddAssetModal: React.FC<AddAssetModalProps> = ({ isOpen, onClose, onAddAsset, assets }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [location, setLocation] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [revisionNumber, setRevisionNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [usageType, setUsageType] = useState<UsageType>(UsageType.HEAVY_DUTY);
  const [usageGroup, setUsageGroup] = useState<UsageGroup>(UsageGroup.C);
  const [serialNumberError, setSerialNumberError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear().toString().slice(-2);
      
      const monthYearSuffix = `${month}${year}`;
      const assetsInCurrentMonth = assets.filter(asset => 
        asset.revisionNumber.endsWith(monthYearSuffix)
      );
      const nextIdInMonth = (assetsInCurrentMonth.length + 1).toString().padStart(2, '0');
      
      setRevisionNumber(`${nextIdInMonth}${monthYearSuffix}`);

      // Reset form fields
      setName('');
      setType('');
      setLocation('');
      setSerialNumber('');
      setPurchaseDate('');
      setNotes('');
      setUsageType(UsageType.HEAVY_DUTY);
      setUsageGroup(UsageGroup.C);
      setSerialNumberError(''); // Reset validation error
    }
  }, [isOpen, assets]);

  // Validate serial number for duplicates
  useEffect(() => {
    if (serialNumber && assets.some(asset => asset.serialNumber.trim().toLowerCase() === serialNumber.trim().toLowerCase())) {
      setSerialNumberError('Toto sériové číslo už existuje v databáze.');
    } else {
      setSerialNumberError('');
    }
  }, [serialNumber, assets]);


  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (serialNumberError) return; // Prevent submission if there's an error
    onAddAsset({ name, type, location, serialNumber, revisionNumber, purchaseDate, usageType, usageGroup, notes });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md m-4 overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Pridať nové náradie</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="revisionNumber" className="block text-sm font-medium text-gray-700">Revízne číslo</label>
            <input type="text" id="revisionNumber" value={revisionNumber} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 focus:outline-none" readOnly />
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Názov</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">Typ</label>
            <input type="text" id="type" value={type} onChange={e => setType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
          </div>
           <div>
            <label htmlFor="usageType" className="block text-sm font-medium text-gray-700">Spôsob používania</label>
            <select id="usageType" value={usageType} onChange={e => setUsageType(e.target.value as UsageType)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required>
              <option value={UsageType.HEAVY_DUTY}>Ručné elektrické náradie alebo predlžovací prívod s namáhaním</option>
              <option value={UsageType.LIGHT_DUTY}>Ostatné elektrické spotrebiče alebo predlžovací prívod bez namáhania</option>
            </select>
          </div>
          <div>
            <label htmlFor="usageGroup" className="block text-sm font-medium text-gray-700">Skupina používania</label>
            <select id="usageGroup" value={usageGroup} onChange={e => setUsageGroup(e.target.value as UsageGroup)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required>
              <option value={UsageGroup.C}>C: Spotrebič alebo predlžovací prívod používaný vo vnútorných výrobných priestoroch firmy</option>
              <option value={UsageGroup.E}>E: Spotrebič alebo predlžovací prívod používaný pri administratívnej činnosti</option>
            </select>
          </div>
          <div>
            <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-700">Sériové číslo</label>
            <input 
              type="text" 
              id="serialNumber" 
              value={serialNumber} 
              onChange={e => setSerialNumber(e.target.value)} 
              className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${serialNumberError ? 'border-red-500 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`} 
              required 
            />
            {serialNumberError && <p className="mt-2 text-sm text-red-600">{serialNumberError}</p>}
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Lokalita</label>
            <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
          </div>
          <div>
            <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700">Dátum obstarania</label>
            <input type="date" id="purchaseDate" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Poznámka k zariadeniu</label>
            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"></textarea>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Zrušiť</button>
            <button 
              type="submit" 
              disabled={!!serialNumberError} 
              className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed transition-colors"
            >
              Pridať
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAssetModal;