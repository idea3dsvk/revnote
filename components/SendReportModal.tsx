import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';

interface SendReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SendReportModal({ isOpen, onClose }: SendReportModalProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const functions = getFunctions();

  const handleSendReport = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error('Neplatný email formát');
      return;
    }

    setIsSending(true);
    const loadingToast = toast.loading('Odosielam report...');
    
    try {
      const sendReport = httpsCallable(functions, 'sendInspectionReport');
      const result = await sendReport({ recipientEmail });
      const data = result.data as { 
        success: boolean; 
        message: string; 
        stats: { overdue: number; dueSoon: number; ok: number } 
      };
      
      toast.dismiss(loadingToast);
      toast.success(
        `${data.message}\n\n` +
        `Po termíne: ${data.stats.overdue}\n` +
        `Do 30 dní: ${data.stats.dueSoon}\n` +
        `V poriadku: ${data.stats.ok}`,
        { duration: 5000 }
      );
      setRecipientEmail('');
      onClose();
    } catch (error) {
      console.error('Error sending report:', error);
      toast.dismiss(loadingToast);
      toast.error('Nepodarilo sa odoslať report');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            📧 Odoslať email report
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSending}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Odošle prehľad všetkých zariadení a ich stavu revízií na zadaný email.
          </p>

          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email príjemcu
          </label>
          <input
            id="email"
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && recipientEmail && !isSending) {
                handleSendReport();
              }
            }}
            placeholder="priklad@email.sk"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSending}
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Report obsahuje:</strong>
            <br />• Zariadenia po termíne revízie
            <br />• Zariadenia s revíziou do 30 dní
            <br />• Zariadenia v poriadku (nad 30 dní)
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isSending}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Zrušiť
          </button>
          <button
            onClick={handleSendReport}
            disabled={!recipientEmail || isSending}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? 'Odosielam...' : 'Odoslať report'}
          </button>
        </div>
      </div>
    </div>
  );
}
