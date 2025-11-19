import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Asset, Inspection, InspectionStatus, UsageType, UsageGroup, Operator, User } from './types';
import persistence from './services/persistence';
import authService from './services/authService';
import toastService from './services/toastService';
import firebaseService from './services/firebaseService';
import AssetList from './components/AssetList';
import AssetDetail from './components/AssetDetail';
import AddAssetModal from './components/AddAssetModal';
import AddInspectionModal from './components/AddInspectionModal';
import GeminiAssistant from './components/GeminiAssistant';
import OperatorModal from './components/OperatorModal';
import ExportImport from './components/ExportImport';
import LoginModal from './components/LoginModal';
import UserPanel from './components/UserPanel';
import UserManagement from './components/UserManagement';
import Dashboard from './components/Dashboard';
import SendReportModal from './components/SendReportModal';

const MOCK_ASSETS: Asset[] = [
  {
    id: '1',
    name: 'Aku vŕtačka Makita',
    type: 'Vŕtačka',
    location: 'Dielňa A',
    serialNumber: 'SN-MAK12345',
    revisionNumber: '010322',
    purchaseDate: '2022-03-15',
    nextInspectionDate: '2025-01-20',
    usageType: UsageType.HEAVY_DUTY,
    usageGroup: UsageGroup.C,
    isExcluded: false,
    notes: 'Zakúpené v sete s dvoma 5Ah batériami a rýchlonabíjačkou.',
    inspections: [
      { id: 'i1', date: '2024-07-24', inspectorName: 'Ján Vážny', status: InspectionStatus.PASS, notes: 'Všetko v poriadku, bez závad.', measuringDevice: 'Metrel MI 3309', insulationResistance: 550, protectiveConductorResistance: 0.12, leakageCurrent: 0.05 },
      { id: 'i2', date: '2023-01-18', inspectorName: 'Ján Vážny', status: InspectionStatus.PASS, notes: 'OK.', measuringDevice: 'Metrel MI 3309', insulationResistance: 600, protectiveConductorResistance: 0.11 },
    ],
  },
  {
    id: '2',
    name: 'Uhlová brúska Bosch',
    type: 'Brúska',
    location: 'Sklad',
    serialNumber: 'SN-BOS67890',
    revisionNumber: '020821',
    purchaseDate: '2021-08-01',
    nextInspectionDate: '2024-09-10',
    usageType: UsageType.HEAVY_DUTY,
    usageGroup: UsageGroup.C,
    isExcluded: false,
    inspections: [
      { id: 'i3', date: '2024-03-14', inspectorName: 'Peter Múdry', status: InspectionStatus.FAIL, notes: 'Poškodený prívodný kábel. Nutná výmena.', measuringDevice: 'Gossen Metrawatt Profitest', insulationResistance: 25, protectiveConductorResistance: 1.5 },
    ],
  },
   {
    id: '3',
    name: 'Priemyselný vysávač Kärcher',
    type: 'Vysávač',
    location: 'Hala B',
    serialNumber: 'SN-KAR11223',
    revisionNumber: '031123',
    purchaseDate: '2023-11-20',
    nextInspectionDate: '2025-11-19',
    usageType: UsageType.LIGHT_DUTY,
    usageGroup: UsageGroup.E,
    isExcluded: false,
    inspections: [],
  },
];

const calculateNextInspectionDate = (baseDate: string, usageType: UsageType, usageGroup: UsageGroup): string => {
  const date = new Date(baseDate);
  let daysToAdd = 0;

  if (usageType === UsageType.HEAVY_DUTY) {
    if (usageGroup === UsageGroup.C) {
      daysToAdd = 180;
    } else { // UsageGroup.E
      daysToAdd = 360;
    }
  } else { // UsageType.LIGHT_DUTY
    if (usageGroup === UsageGroup.C) {
      daysToAdd = 360;
    } else { // UsageGroup.E
      daysToAdd = 720;
    }
  }
  
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
};


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isAddInspectionModalOpen, setIsAddInspectionModalOpen] = useState(false);
  const [assetForNewInspection, setAssetForNewInspection] = useState<Asset | null>(null);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [isSendReportModalOpen, setIsSendReportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [operator, setOperator] = useState<Operator>({
    name: 'Názov Vašej Firmy s.r.o.',
    address: 'Príkladová 123, 811 01 Bratislava',
    ico: '12345678',
    contactPerson: 'Ján Vzorový',
  });
  
  useEffect(() => {
    // Initialize Firebase auth listener
    const unsubscribe = authService.initializeAuth((user) => {
      setCurrentUser(user);
    });

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    // Load data from Firebase/localStorage
    const loadData = async () => {
      setIsLoading(true);
      try {
        const loadedAssets = await persistence.loadAssets();
        const loadedOperator = await persistence.loadOperator();
        const loadedSelectedId = persistence.loadSelectedAssetId();

        if (loadedAssets && loadedAssets.length > 0) {
          setAssets(loadedAssets);
          setSelectedAssetId(loadedSelectedId ?? loadedAssets[0].id);
        } else {
          // Create a deep copy of mock data to prevent mutation of the original constant.
          const initialAssets = JSON.parse(JSON.stringify(MOCK_ASSETS));
          setAssets(initialAssets);
          if (initialAssets.length > 0) {
            setSelectedAssetId(initialAssets[0].id);
          }
        }

        if (loadedOperator) {
          setOperator(loadedOperator);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toastService.error('Chyba pri načítavaní dát. Použité vzorové dáta.');
        // Fallback to mock data on error
        const initialAssets = JSON.parse(JSON.stringify(MOCK_ASSETS));
        setAssets(initialAssets);
        if (initialAssets.length > 0) {
          setSelectedAssetId(initialAssets[0].id);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Real-time synchronization with Firebase
  useEffect(() => {
    if (!currentUser) return; // Don't sync if not logged in
    
    // Subscribe to real-time updates from Firebase
    const unsubscribeAssets = firebaseService.subscribeToAssets((firebaseAssets: Asset[]) => {
      console.log('Real-time assets update received:', firebaseAssets.length);
      
      // Only update if we have data from Firebase
      if (firebaseAssets.length > 0) {
        setAssets(firebaseAssets);
        
        // If current selection doesn't exist anymore, reset it
        setSelectedAssetId(prevId => {
          if (prevId && !firebaseAssets.find(a => a.id === prevId)) {
            return firebaseAssets[0]?.id || null;
          }
          return prevId;
        });
        
        // Update localStorage cache
        localStorage.setItem('evr_assets_v1', JSON.stringify(firebaseAssets));
      }
    });

    const unsubscribeOperator = firebaseService.subscribeToOperator((firebaseOperator: Operator | null) => {
      console.log('Real-time operator update received');
      
      if (firebaseOperator) {
        setOperator(firebaseOperator);
        // Update localStorage cache
        localStorage.setItem('evr_operator_v1', JSON.stringify(firebaseOperator));
      }
    });

    // Cleanup subscriptions on unmount or user change
    return () => {
      unsubscribeAssets();
      unsubscribeOperator();
    };
  }, [currentUser]);
  
  const handleSaveOperator = async (data: Operator) => {
    try {
      setOperator(data);
      
      // Immediately save to Firebase and localStorage
      await persistence.saveOperator(data);
      
      setIsOperatorModalOpen(false);
      toastService.success('Údaje prevádzkovateľa boli uložené');
    } catch (error) {
      toastService.error('Chyba pri ukladaní prevádzkovateľa');
      console.error('Error saving operator:', error);
    }
  };

  const handleAddAsset = async (assetData: Omit<Asset, 'id' | 'inspections' | 'nextInspectionDate' | 'isExcluded'>) => {
    try {
      const newAsset: Asset = {
        ...assetData,
        id: new Date().toISOString(),
        // The next inspection date is initially set to the purchase date.
        // It will be properly updated after the first inspection is added.
        nextInspectionDate: assetData.purchaseDate,
        inspections: [],
        isExcluded: false,
      };
      
      // Update local state
      const updatedAssets = [...assets, newAsset];
      setAssets(updatedAssets);
      setSelectedAssetId(newAsset.id);
      
      // Immediately save to Firebase and localStorage
      await persistence.saveAssets(updatedAssets);
      
      toastService.success(`Zariadenie "${newAsset.name}" bolo pridané`);
    } catch (error) {
      toastService.error('Chyba pri pridávaní zariadenia');
      console.error('Error adding asset:', error);
    }
  };
  
  const handleAddInspection = async (newInspectionData: Omit<Inspection, 'id'>) => {
    if (!assetForNewInspection) return;

    try {
      const newInspection: Inspection = {
          ...newInspectionData,
          id: new Date().toISOString(),
      };
      
      const newNextInspectionDate = calculateNextInspectionDate(
          newInspection.date, 
          assetForNewInspection.usageType, 
          assetForNewInspection.usageGroup
      );

      const updatedAssets = assets.map(asset =>
          asset.id === assetForNewInspection.id
              ? { 
                  ...asset, 
                  inspections: [...asset.inspections, newInspection],
                  nextInspectionDate: newNextInspectionDate
                }
              : asset
      );
      
      setAssets(updatedAssets);
      
      // Immediately save to Firebase and localStorage
      await persistence.saveAssets(updatedAssets);
      
      toastService.success('Revízia bola pridaná');
    } catch (error) {
      toastService.error('Chyba pri pridávaní revízie');
      console.error('Error adding inspection:', error);
    }
  };

  const handleExcludeAsset = async (assetId: string) => {
    try {
      const updatedAssets = assets.map(asset =>
        asset.id === assetId
          ? { ...asset, isExcluded: true }
          : asset
      );
      
      setAssets(updatedAssets);
      
      // If the excluded asset was selected, deselect it
      if (selectedAssetId === assetId) {
          setSelectedAssetId(null);
      }
      
      // Immediately save to Firebase and localStorage
      await persistence.saveAssets(updatedAssets);
      
      toastService.success('Zariadenie bolo vylúčené z evidencie');
    } catch (error) {
      toastService.error('Chyba pri vylučovaní zariadenia');
      console.error('Error excluding asset:', error);
    }
  };

  const handleRestoreAsset = async (assetId: string) => {
    try {
      const updatedAssets = assets.map(asset =>
        asset.id === assetId
          ? { ...asset, isExcluded: false }
          : asset
      );
      
      setAssets(updatedAssets);
      
      // Immediately save to Firebase and localStorage
      await persistence.saveAssets(updatedAssets);
      
      toastService.success('Zariadenie bolo obnovené do evidencie');
    } catch (error) {
      toastService.error('Chyba pri obnovovaní zariadenia');
      console.error('Error restoring asset:', error);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    try {
      const updatedAssets = assets.filter(asset => asset.id !== assetId);
      
      setAssets(updatedAssets);
      
      // If the deleted asset was selected, deselect it
      if (selectedAssetId === assetId) {
          setSelectedAssetId(null);
      }
      
      // Delete from Firebase explicitly first
      await firebaseService.deleteAssetFromFirebase(assetId);
      
      // Then save updated list to localStorage
      await persistence.saveAssets(updatedAssets);
      
      toastService.success('Zariadenie bolo vymazané');
    } catch (error) {
      toastService.error('Chyba pri mazaní zariadenia');
      console.error('Error deleting asset:', error);
    }
  };

  // Note: Assets and Operator are now saved explicitly in each handler function to ensure immediate Firebase sync

  useEffect(() => {
    persistence.saveSelectedAssetId(selectedAssetId);
  }, [selectedAssetId]);

  const openAddInspectionModal = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (asset) {
        setAssetForNewInspection(asset);
        setIsAddInspectionModalOpen(true);
    }
  }

  const handleImport = (data: { assets: Asset[]; operator: Operator }) => {
    setAssets(data.assets);
    setOperator(data.operator);
    if (data.assets.length > 0) {
      setSelectedAssetId(data.assets[0].id);
    } else {
      setSelectedAssetId(null);
    }
  }

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  }

  const handleLogout = async () => {
    try {
      await authService.logout();
      // setCurrentUser will be called automatically by the auth listener
    } catch (error) {
      console.error('Error during logout:', error);
      toastService.error('Chyba pri odhlasovaní');
    }
  }

  // Ak nie je prihlásený používateľ, zobraz login modal
  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  // Loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600 text-lg">Načítavam dáta...</p>
        </div>
      </div>
    );
  }

  const selectedAsset = assets.find(asset => asset.id === selectedAssetId);

  return (
    <>
      <Toaster />
      <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-md w-full">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight text-gray-900">
                Evidencia revízií náradia a spotrebičov
            </h1>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  showDashboard 
                    ? 'bg-primary-600 text-white hover:bg-primary-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showDashboard ? 'Skryť Dashboard' : 'Zobraziť Dashboard'}
              </button>
              {/* Email report button - temporarily hidden until Firebase Blaze plan upgrade */}
              {/* {authService.canManageUsers() && (
                <button
                  onClick={() => setIsSendReportModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                  title="Odoslať email report o stave revízií"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email report
                </button>
              )} */}
              {authService.canExportImport() && (
                <ExportImport 
                  assets={assets} 
                  operator={operator} 
                  onImport={handleImport}
                />
              )}
              <UserPanel 
                user={currentUser} 
                onLogout={handleLogout}
                onOpenUserManagement={() => setIsUserManagementOpen(true)}
              />
            </div>
        </div>
      </header>
      <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
        {showDashboard && (
          <div className="mb-6">
            <Dashboard assets={assets} />
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
            <div className="lg:col-span-1 h-full">
                <AssetList 
                    assets={assets} 
                    selectedAssetId={selectedAssetId} 
                    onSelectAsset={setSelectedAssetId}
                    onAddAsset={() => setIsAddAssetModalOpen(true)}
                    onOpenOperatorModal={() => setIsOperatorModalOpen(true)}
                    canAddAsset={authService.canAddAsset()}
                    canEditOperator={authService.canEditOperator()}
                />
            </div>
            <div className="lg:col-span-2 h-full overflow-y-auto bg-gray-50 rounded-lg">
                <AssetDetail 
                    asset={selectedAsset || null} 
                    onAddInspection={openAddInspectionModal}
                    operator={operator}
                    onExcludeAsset={handleExcludeAsset}
                    onRestoreAsset={handleRestoreAsset}
                    onDeleteAsset={handleDeleteAsset}
                    canAddInspection={authService.canAddInspection()}
                    canExcludeAsset={authService.canExcludeAsset()}
                    canDeleteAsset={authService.canDeleteAsset()}
                    canGeneratePDF={authService.canGeneratePDF()}
                />
            </div>
        </div>
      </main>

      <AddAssetModal 
        isOpen={isAddAssetModalOpen} 
        onClose={() => setIsAddAssetModalOpen(false)}
        onAddAsset={handleAddAsset}
        assets={assets}
      />

      {assetForNewInspection && (
        <AddInspectionModal
            isOpen={isAddInspectionModalOpen}
            onClose={() => setIsAddInspectionModalOpen(false)}
            onAddInspection={handleAddInspection}
            assetName={assetForNewInspection.name}
        />
      )}

      <OperatorModal
        isOpen={isOperatorModalOpen}
        onClose={() => setIsOperatorModalOpen(false)}
        onSave={handleSaveOperator}
        operator={operator}
      />

      {authService.canManageUsers() && (
        <UserManagement
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
        />
      )}

      {authService.canManageUsers() && (
        <SendReportModal
          isOpen={isSendReportModalOpen}
          onClose={() => setIsSendReportModalOpen(false)}
        />
      )}

      <GeminiAssistant assets={assets} />

    </div>
    </>
  );
};

export default App;