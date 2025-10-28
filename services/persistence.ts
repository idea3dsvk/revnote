import { Asset, Operator } from '../types';
import firebaseService from './firebaseService';
import { isFirebaseConfigured } from './firebaseConfig';

const ASSETS_KEY = 'evr_assets_v1';
const OPERATOR_KEY = 'evr_operator_v1';
const SELECTED_ASSET_KEY = 'evr_selected_asset_v1';

// ============= ASSETS =============

export const loadAssets = async (): Promise<Asset[] | null> => {
  // Ak je Firebase nakonfigurované, načítaj z Firebase
  if (isFirebaseConfigured) {
    try {
      const firebaseAssets = await firebaseService.loadAssetsFromFirebase();
      if (firebaseAssets.length > 0) {
        // Ulož do localStorage ako cache
        localStorage.setItem(ASSETS_KEY, JSON.stringify(firebaseAssets));
        return firebaseAssets;
      }
    } catch (error) {
      console.error('Error loading from Firebase, falling back to localStorage', error);
    }
  }

  // Fallback na localStorage
  try {
    const raw = localStorage.getItem(ASSETS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Asset[];
  } catch (e) {
    console.error('Failed to load assets from localStorage', e);
    return null;
  }
};

export const saveAssets = async (assets: Asset[]) => {
  // Ulož do localStorage
  try {
    localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
  } catch (e) {
    console.error('Failed to save assets to localStorage', e);
  }

  // Synchronizuj s Firebase
  if (isFirebaseConfigured) {
    try {
      await firebaseService.syncAssetsToFirebase(assets);
    } catch (error) {
      console.error('Error syncing assets to Firebase', error);
    }
  }
};

// ============= OPERATOR =============

export const loadOperator = async (): Promise<Operator | null> => {
  // Ak je Firebase nakonfigurované, načítaj z Firebase
  if (isFirebaseConfigured) {
    try {
      const firebaseOperator = await firebaseService.loadOperatorFromFirebase();
      if (firebaseOperator) {
        // Ulož do localStorage ako cache
        localStorage.setItem(OPERATOR_KEY, JSON.stringify(firebaseOperator));
        return firebaseOperator;
      }
    } catch (error) {
      console.error('Error loading operator from Firebase, falling back to localStorage', error);
    }
  }

  // Fallback na localStorage
  try {
    const raw = localStorage.getItem(OPERATOR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Operator;
  } catch (e) {
    console.error('Failed to load operator from localStorage', e);
    return null;
  }
};

export const saveOperator = async (operator: Operator) => {
  // Ulož do localStorage
  try {
    localStorage.setItem(OPERATOR_KEY, JSON.stringify(operator));
  } catch (e) {
    console.error('Failed to save operator to localStorage', e);
  }

  // Synchronizuj s Firebase
  if (isFirebaseConfigured) {
    try {
      await firebaseService.saveOperatorToFirebase(operator);
    } catch (error) {
      console.error('Error syncing operator to Firebase', error);
    }
  }
};

export const loadSelectedAssetId = (): string | null => {
  try {
    return localStorage.getItem(SELECTED_ASSET_KEY);
  } catch (e) {
    console.error('Failed to load selected asset id from localStorage', e);
    return null;
  }
};

export const saveSelectedAssetId = (id: string | null) => {
  try {
    if (id == null) {
      localStorage.removeItem(SELECTED_ASSET_KEY);
    } else {
      localStorage.setItem(SELECTED_ASSET_KEY, id);
    }
  } catch (e) {
    console.error('Failed to save selected asset id to localStorage', e);
  }
};

export const clearAllPersistence = () => {
  try {
    localStorage.removeItem(ASSETS_KEY);
    localStorage.removeItem(OPERATOR_KEY);
    localStorage.removeItem(SELECTED_ASSET_KEY);
    console.log('LocalStorage cleared (Firebase data remains intact)');
  } catch (e) {
    console.error('Failed to clear persistence', e);
  }
};

export default {
  loadAssets,
  saveAssets,
  loadOperator,
  saveOperator,
  loadSelectedAssetId,
  saveSelectedAssetId,
  clearAllPersistence,
};
