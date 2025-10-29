import React, { useState, useEffect } from 'react';
import { Asset, Inspection, InspectionStatus, UsageType, UsageGroup, Operator, User } from './types';
import persistence from './services/persistence';
import authService from './services/authService';
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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isAddInspectionModalOpen, setIsAddInspectionModalOpen] = useState(false);
  const [assetForNewInspection, setAssetForNewInspection] = useState<Asset | null>(null);
  const [isOperatorModalOpen, setIsOperatorModalOpen] = useState(false);
  const [operator, setOperator] = useState<Operator>({
    name: 'Názov Vašej Firmy s.r.o.',
    address: 'Príkladová 123, 811 01 Bratislava',
    ico: '12345678',
    contactPerson: 'Ján Vzorový',
  });
  
  useEffect(() => {
    // Initialize auth and check for existing session
    authService.initializeUsers();
    const session = authService.getCurrentSession();
    if (session) {
      setCurrentUser(session.user);
    }
  }, []);
  
  useEffect(() => {
    // Load data from Firebase/localStorage
    const loadData = async () => {
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
        // Fallback to mock data on error
        const initialAssets = JSON.parse(JSON.stringify(MOCK_ASSETS));
        setAssets(initialAssets);
        if (initialAssets.length > 0) {
          setSelectedAssetId(initialAssets[0].id);
        }
      }
    };

    loadData();
  }, []);

  // Real-time synchronization with Firebase
  useEffect(() => {
    const firebaseService = require('./services/firebaseService').default;
    
    // Subscribe to assets changes
    const unsubscribeAssets = firebaseService.subscribeToAssets((updatedAssets: Asset[]) => {
      if (updatedAssets.length > 0) {
        setAssets(updatedAssets);
        localStorage.setItem('evr_assets_v1', JSON.stringify(updatedAssets));
        console.log('Assets updated from Firebase (real-time):', updatedAssets.length);
      }
    });

    // Subscribe to operator changes
    const unsubscribeOperator = firebaseService.subscribeToOperator((updatedOperator: Operator | null) => {
      if (updatedOperator) {
        setOperator(updatedOperator);
        localStorage.setItem('evr_operator_v1', JSON.stringify(updatedOperator));
        console.log('Operator updated from Firebase (real-time)');
      }
    });

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeAssets();
      unsubscribeOperator();
    };
  }, []);
  
  const handleSaveOperator = (data: Operator) => {
    setOperator(data);
    setIsOperatorModalOpen(false);
  };

  const handleAddAsset = (assetData: Omit<Asset, 'id' | 'inspections' | 'nextInspectionDate' | 'isExcluded'>) => {
    const newAsset: Asset = {
      ...assetData,
      id: new Date().toISOString(),
      // The next inspection date is initially set to the purchase date.
      // It will be properly updated after the first inspection is added.
      nextInspectionDate: assetData.purchaseDate,
      inspections: [],
      isExcluded: false,
    };
    setAssets(prevAssets => [...prevAssets, newAsset]);
    setSelectedAssetId(newAsset.id);
  };
  
  const handleAddInspection = (newInspectionData: Omit<Inspection, 'id'>) => {
    if (!assetForNewInspection) return;

    const newInspection: Inspection = {
        ...newInspectionData,
        id: new Date().toISOString(),
    };
    
    const newNextInspectionDate = calculateNextInspectionDate(
        newInspection.date, 
        assetForNewInspection.usageType, 
        assetForNewInspection.usageGroup
    );

    setAssets(prevAssets =>
        prevAssets.map(asset =>
            asset.id === assetForNewInspection.id
                ? { 
                    ...asset, 
                    inspections: [...asset.inspections, newInspection],
                    nextInspectionDate: newNextInspectionDate
                  }
                : asset
        )
    );
  };

  const handleExcludeAsset = (assetId: string) => {
    setAssets(prevAssets =>
      prevAssets.map(asset =>
        asset.id === assetId
          ? { ...asset, isExcluded: true }
          : asset
      )
    );
    // If the excluded asset was selected, deselect it
    if (selectedAssetId === assetId) {
        setSelectedAssetId(null);
    }
  };

  const handleRestoreAsset = (assetId: string) => {
    setAssets(prevAssets =>
      prevAssets.map(asset =>
        asset.id === assetId
          ? { ...asset, isExcluded: false }
          : asset
      )
    );
  };

  const handleDeleteAsset = (assetId: string) => {
    setAssets(prevAssets => prevAssets.filter(asset => asset.id !== assetId));
    // If the deleted asset was selected, deselect it
    if (selectedAssetId === assetId) {
        setSelectedAssetId(null);
    }
  };

  // Persist assets, operator and selected asset id whenever they change
  useEffect(() => {
    try {
      persistence.saveAssets(assets);
    } catch (e) {
      // already handled in persistence
    }
  }, [assets]);

  useEffect(() => {
    if (operator) {
      persistence.saveOperator(operator);
    }
  }, [operator]);

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

  const handleLogout = () => {
    setCurrentUser(null);
  }

  // Ak nie je prihlásený používateľ, zobraz login modal
  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  const selectedAsset = assets.find(asset => asset.id === selectedAssetId);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-md w-full">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-4">
            <h1 className="text-2xl md:text-3xl font-bold leading-tight text-gray-900">
                Evidencia revízií náradia a spotrebičov
            </h1>
            <div className="flex items-center gap-4">
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
      <main className="flex-grow p-4 md:p-6 lg:p-8">
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

      <GeminiAssistant assets={assets} />

    </div>
  );
};

export default App;