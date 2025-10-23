import { Asset, Operator } from '../types';

const ASSETS_KEY = 'evr_assets_v1';
const OPERATOR_KEY = 'evr_operator_v1';
const SELECTED_ASSET_KEY = 'evr_selected_asset_v1';

export const loadAssets = (): Asset[] | null => {
  try {
    const raw = localStorage.getItem(ASSETS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Asset[];
  } catch (e) {
    console.error('Failed to load assets from localStorage', e);
    return null;
  }
};

export const saveAssets = (assets: Asset[]) => {
  try {
    localStorage.setItem(ASSETS_KEY, JSON.stringify(assets));
  } catch (e) {
    console.error('Failed to save assets to localStorage', e);
  }
};

export const loadOperator = (): Operator | null => {
  try {
    const raw = localStorage.getItem(OPERATOR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Operator;
  } catch (e) {
    console.error('Failed to load operator from localStorage', e);
    return null;
  }
};

export const saveOperator = (operator: Operator) => {
  try {
    localStorage.setItem(OPERATOR_KEY, JSON.stringify(operator));
  } catch (e) {
    console.error('Failed to save operator to localStorage', e);
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
