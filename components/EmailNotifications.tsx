import React, { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface NotificationSettings {
  enabled: boolean;
  recipients: string[];
  daysBeforeInspection: number[];
}

interface EmailNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
}

const EmailNotifications: React.FC<EmailNotificationsProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    recipients: [],
    daysBeforeInspection: [30, 14, 7, 3, 1, 0],
  });
  const [newEmail, setNewEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      // Load from Firestore
      const { db } = await import('../services/firebaseConfig');
      if (!db) return;

      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'settings', 'notifications');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setSettings(docSnap.data() as NotificationSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const functions = getFunctions();
      const updateSettings = httpsCallable(functions, 'updateNotificationSettings');
      
      await updateSettings(settings);
      
      setMessage({ type: 'success', text: 'Nastavenia boli uložené' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Chyba pri ukladaní nastavení' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setIsTesting(true);
    setMessage(null);

    try {
      const functions = getFunctions();
      const triggerReminders = httpsCallable(functions, 'triggerInspectionReminders');
      
      await triggerReminders();
      
      setMessage({ type: 'success', text: 'Testovacie emaily boli odoslané' });
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage({ type: 'error', text: 'Chyba pri odosielaní testovacích emailov' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleAddEmail = () => {
    if (!newEmail || !isValidEmail(newEmail)) {
      setMessage({ type: 'error', text: 'Zadajte platnú emailovú adresu' });
      return;
    }

    if (settings.recipients.includes(newEmail)) {
      setMessage({ type: 'error', text: 'Táto emailová adresa už existuje' });
      return;
    }

    setSettings({
      ...settings,
      recipients: [...settings.recipients, newEmail],
    });
    setNewEmail('');
    setMessage(null);
  };

  const handleRemoveEmail = (email: string) => {
    setSettings({
      ...settings,
      recipients: settings.recipients.filter(e => e !== email),
    });
  };

  const handleToggleDay = (day: number) => {
    const days = settings.daysBeforeInspection;
    if (days.includes(day)) {
      setSettings({
        ...settings,
        daysBeforeInspection: days.filter(d => d !== day),
      });
    } else {
      setSettings({
        ...settings,
        daysBeforeInspection: [...days, day].sort((a, b) => b - a),
      });
    }
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Email Notifikácie</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Enable/Disable */}
          <div className="mb-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-lg font-medium text-gray-900">
                Zapnúť email notifikácie
              </span>
            </label>
            <p className="mt-2 text-sm text-gray-500 ml-8">
              Automaticky odosiela pripomienky o blížiacich sa revíziách každý deň o 9:00 ráno
            </p>
          </div>

          {/* Email Recipients */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Príjemcovia emailov</h3>
            
            <div className="flex gap-2 mb-3">
              <input
                type="email"
                placeholder="priklad@email.sk"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                onClick={handleAddEmail}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Pridať
              </button>
            </div>

            <div className="space-y-2">
              {settings.recipients.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-700">{email}</span>
                  <button
                    onClick={() => handleRemoveEmail(email)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}

              {settings.recipients.length === 0 && (
                <p className="text-center text-gray-500 py-4">Zatiaľ nie sú pridaní žiadni príjemcovia</p>
              )}
            </div>
          </div>

          {/* Days Before Inspection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Kedy poslať pripomienku (počet dní pred revíziou)
            </h3>
            <div className="flex flex-wrap gap-2">
              {[30, 14, 7, 3, 1, 0].map((day) => (
                <button
                  key={day}
                  onClick={() => handleToggleDay(day)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    settings.daysBeforeInspection.includes(day)
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {day === 0 ? 'V deň revízie' : `${day} ${day === 1 ? 'deň' : 'dní'}`}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Email sa odošle ak je zariadenie práve vo vybranom počte dní pred revíziou
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving || settings.recipients.length === 0}
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 
                       transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? 'Ukladám...' : 'Uložiť nastavenia'}
            </button>
            
            <button
              onClick={handleTestEmail}
              disabled={isTesting || !settings.enabled || settings.recipients.length === 0}
              className="px-6 py-3 border-2 border-primary-600 text-primary-600 rounded-lg 
                       hover:bg-primary-50 transition-colors disabled:border-gray-300 
                       disabled:text-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {isTesting ? 'Odosielam...' : 'Testovať'}
            </button>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Poznámka:</strong> Email notifikácie vyžadujú Firebase Functions a SendGrid nastavenie. 
              Viac informácií nájdete v <code className="bg-blue-100 px-1 rounded">functions/README.md</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailNotifications;
