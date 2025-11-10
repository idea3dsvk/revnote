import React, { useState, useEffect } from 'react';
import { Inspection, InspectionStatus } from '../types';

interface AddInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddInspection: (inspection: Omit<Inspection, 'id'>) => void;
  assetName: string;
}

const AddInspectionModal: React.FC<AddInspectionModalProps> = ({ isOpen, onClose, onAddInspection, assetName }) => {
  const [date, setDate] = useState('');
  const [inspectorName, setInspectorName] = useState('');
  const [status, setStatus] = useState<InspectionStatus>(InspectionStatus.PASS);
  const [notes, setNotes] = useState('');
  const [measuringDevice, setMeasuringDevice] = useState('');
  const [insulationResistance, setInsulationResistance] = useState('');
  const [protectiveConductorResistance, setProtectiveConductorResistance] = useState('');
  const [protectiveConductorCurrent, setProtectiveConductorCurrent] = useState('');
  const [touchCurrent, setTouchCurrent] = useState('');
  const [leakageCurrent, setLeakageCurrent] = useState('');

  useEffect(() => {
    if (isOpen) {
        setDate(new Date().toISOString().split('T')[0]);
        setInspectorName('');
        setStatus(InspectionStatus.PASS);
        setNotes('');
        setMeasuringDevice('');
        setInsulationResistance('');
        setProtectiveConductorResistance('');
        setProtectiveConductorCurrent('');
        setTouchCurrent('');
        setLeakageCurrent('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddInspection({ 
      date, 
      inspectorName, 
      status, 
      notes,
      measuringDevice,
      insulationResistance: parseFloat(insulationResistance),
      protectiveConductorResistance: parseFloat(protectiveConductorResistance),
      protectiveConductorCurrent: protectiveConductorCurrent ? parseFloat(protectiveConductorCurrent) : undefined,
      touchCurrent: touchCurrent ? parseFloat(touchCurrent) : undefined,
      leakageCurrent: leakageCurrent ? parseFloat(leakageCurrent) : undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg m-4 overflow-y-auto max-h-[90vh]">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">Nová revízia</h2>
        <p className="text-gray-600 mb-6">pre {assetName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700">Dátum revízie</label>
              <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Stav</label>
              <select id="status" value={status} onChange={e => setStatus(e.target.value as InspectionStatus)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required>
                <option value={InspectionStatus.PASS}>Vyhovuje</option>
                <option value={InspectionStatus.FAIL}>Nevyhovuje</option>
              </select>
            </div>
          </div>
           <div>
              <label htmlFor="inspectorName" className="block text-sm font-medium text-gray-700">Revízny technik</label>
              <input type="text" id="inspectorName" value={inspectorName} onChange={e => setInspectorName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
            </div>
          <div>
            <label htmlFor="measuringDevice" className="block text-sm font-medium text-gray-700">Merací prístroj</label>
            <input type="text" id="measuringDevice" value={measuringDevice} onChange={e => setMeasuringDevice(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="insulationResistance" className="block text-sm font-medium text-gray-700">Odpor izolácie Riso [MΩ]:</label>
                <input type="number" step="0.01" min="0" id="insulationResistance" value={insulationResistance} onChange={e => setInsulationResistance(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
            </div>
             <div>
                <label htmlFor="protectiveConductorResistance" className="block text-sm font-medium text-gray-700">Odpor ochranného vodiča Rpe [Ω]:</label>
                <input type="number" step="0.01" min="0" id="protectiveConductorResistance" value={protectiveConductorResistance} onChange={e => setProtectiveConductorResistance(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="protectiveConductorCurrent" className="block text-sm font-medium text-gray-700">Prúd ochr. vodičom [mA]:</label>
              <input type="number" step="0.01" min="0" id="protectiveConductorCurrent" value={protectiveConductorCurrent} onChange={e => setProtectiveConductorCurrent(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label htmlFor="touchCurrent" className="block text-sm font-medium text-gray-700">Dotykový prúd IF [mA]:</label>
              <input type="number" step="0.01" min="0" id="touchCurrent" value={touchCurrent} onChange={e => setTouchCurrent(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
            </div>
            <div>
              <label htmlFor="leakageCurrent" className="block text-sm font-medium text-gray-700">Unikajúci prúd Iup [mA]:</label>
              <input type="number" step="0.01" min="0" id="leakageCurrent" value={leakageCurrent} onChange={e => setLeakageCurrent(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Poznámka k revízii</label>
            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"></textarea>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Zrušiť</button>
            <button type="submit" className="bg-primary-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-700">Uložiť</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInspectionModal;