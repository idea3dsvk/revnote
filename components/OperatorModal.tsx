import React, { useState, useEffect } from 'react';
import { Operator } from '../types';

interface OperatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (operator: Operator) => void;
  operator: Operator | null;
}

const OperatorModal: React.FC<OperatorModalProps> = ({ isOpen, onClose, onSave, operator }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [ico, setIco] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  useEffect(() => {
    if (operator) {
      setName(operator.name || '');
      setAddress(operator.address || '');
      setIco(operator.ico || '');
      setContactPerson(operator.contactPerson || '');
    }
  }, [operator, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, address, ico, contactPerson });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md m-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Údaje o prevádzkovateľovi</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="opName" className="block text-sm font-medium text-gray-700">Názov firmy / Meno</label>
            <input type="text" id="opName" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
          </div>
          <div>
            <label htmlFor="opAddress" className="block text-sm font-medium text-gray-700">Adresa</label>
            <input type="text" id="opAddress" value={address} onChange={e => setAddress(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
          </div>
          <div>
            <label htmlFor="opIco" className="block text-sm font-medium text-gray-700">IČO</label>
            <input type="text" id="opIco" value={ico} onChange={e => setIco(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" required />
          </div>
          <div>
            <label htmlFor="opContact" className="block text-sm font-medium text-gray-700">Kontaktná osoba</label>
            <input type="text" id="opContact" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500" />
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

export default OperatorModal;
