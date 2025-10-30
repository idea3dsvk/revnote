import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  onSnapshot,
  writeBatch,
  Firestore
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseConfig';
import { Asset, Operator, User } from '../types';

// Helper function to get db with type assertion
const getDb = (): Firestore => db as Firestore;

// Kolekcie v Firestore
const COLLECTIONS = {
  ASSETS: 'assets',
  OPERATOR: 'operator',
  USERS: 'users',
  SETTINGS: 'settings'
};

// ============= ASSETS =============

// Helper to remove undefined values from objects (Firebase doesn't accept undefined)
const cleanUndefined = <T extends Record<string, any>>(obj: T): T => {
  const cleaned = {} as T;
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (value !== undefined) {
      if (Array.isArray(value)) {
        cleaned[key as keyof T] = value.map(item => 
          typeof item === 'object' && item !== null ? cleanUndefined(item) : item
        ) as T[keyof T];
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key as keyof T] = cleanUndefined(value);
      } else {
        cleaned[key as keyof T] = value;
      }
    }
  });
  return cleaned;
};

export const syncAssetsToFirebase = async (assets: Asset[]): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured, skipping sync');
    return;
  }

  try {
    const batch = writeBatch(getDb() as Firestore);
    
    assets.forEach(asset => {
      const assetRef = doc(db as Firestore, COLLECTIONS.ASSETS, asset.id);
      // Clean undefined values before saving to Firebase
      const cleanedAsset = cleanUndefined(asset);
      batch.set(assetRef, cleanedAsset);
    });
    
    await batch.commit();
    console.log('Assets synced to Firebase');
  } catch (error) {
    console.error('Error syncing assets to Firebase:', error);
    throw error;
  }
};

export const loadAssetsFromFirebase = async (): Promise<Asset[]> => {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  try {
    const assetsCollection = collection(getDb(), COLLECTIONS.ASSETS);
    const snapshot = await getDocs(assetsCollection);
    const assets = snapshot.docs.map(doc => doc.data() as Asset);
    console.log('Assets loaded from Firebase:', assets.length);
    return assets;
  } catch (error) {
    console.error('Error loading assets from Firebase:', error);
    return [];
  }
};

export const saveAssetToFirebase = async (asset: Asset): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  try {
    const assetRef = doc(getDb(), COLLECTIONS.ASSETS, asset.id);
    // Clean undefined values before saving to Firebase
    const cleanedAsset = cleanUndefined(asset);
    await setDoc(assetRef, cleanedAsset);
    console.log('Asset saved to Firebase:', asset.id);
  } catch (error) {
    console.error('Error saving asset to Firebase:', error);
    throw error;
  }
};

export const deleteAssetFromFirebase = async (assetId: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  try {
    const assetRef = doc(getDb(), COLLECTIONS.ASSETS, assetId);
    await deleteDoc(assetRef);
    console.log('Asset deleted from Firebase:', assetId);
  } catch (error) {
    console.error('Error deleting asset from Firebase:', error);
    throw error;
  }
};

// ============= OPERATOR =============

export const saveOperatorToFirebase = async (operator: Operator): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  try {
    const operatorRef = doc(getDb(), COLLECTIONS.OPERATOR, 'current');
    await setDoc(operatorRef, operator);
    console.log('Operator saved to Firebase');
  } catch (error) {
    console.error('Error saving operator to Firebase:', error);
    throw error;
  }
};

export const loadOperatorFromFirebase = async (): Promise<Operator | null> => {
  if (!isFirebaseConfigured || !db) {
    return null;
  }

  try {
    const operatorRef = doc(getDb(), COLLECTIONS.OPERATOR, 'current');
    const snapshot = await getDocs(collection(getDb(), COLLECTIONS.OPERATOR));
    
    if (snapshot.empty) {
      return null;
    }
    
    const operatorDoc = snapshot.docs[0];
    return operatorDoc.data() as Operator;
  } catch (error) {
    console.error('Error loading operator from Firebase:', error);
    return null;
  }
};

// ============= USERS =============

export const syncUsersToFirebase = async (users: User[]): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    return;
  }

  try {
    const batch = writeBatch(getDb());
    
    users.forEach(user => {
      const userRef = doc(getDb(), COLLECTIONS.USERS, user.id);
      batch.set(userRef, user);
    });
    
    await batch.commit();
    console.log('Users synced to Firebase');
  } catch (error) {
    console.error('Error syncing users to Firebase:', error);
    throw error;
  }
};

export const loadUsersFromFirebase = async (): Promise<User[]> => {
  if (!isFirebaseConfigured || !db) {
    return [];
  }

  try {
    const usersCollection = collection(getDb(), COLLECTIONS.USERS);
    const snapshot = await getDocs(usersCollection);
    const users = snapshot.docs.map(doc => doc.data() as User);
    console.log('Users loaded from Firebase:', users.length);
    return users;
  } catch (error) {
    console.error('Error loading users from Firebase:', error);
    return [];
  }
};

// ============= REALTIME LISTENERS =============

export const subscribeToAssets = (callback: (assets: Asset[]) => void): (() => void) => {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  const assetsCollection = collection(getDb(), COLLECTIONS.ASSETS);
  
  const unsubscribe = onSnapshot(assetsCollection, (snapshot) => {
    const assets = snapshot.docs.map(doc => doc.data() as Asset);
    callback(assets);
  }, (error) => {
    console.error('Error in assets subscription:', error);
  });

  return unsubscribe;
};

export const subscribeToOperator = (callback: (operator: Operator | null) => void): (() => void) => {
  if (!isFirebaseConfigured || !db) {
    return () => {};
  }

  const operatorCollection = collection(getDb(), COLLECTIONS.OPERATOR);
  
  const unsubscribe = onSnapshot(operatorCollection, (snapshot) => {
    if (snapshot.empty) {
      callback(null);
      return;
    }
    const operator = snapshot.docs[0].data() as Operator;
    callback(operator);
  }, (error) => {
    console.error('Error in operator subscription:', error);
  });

  return unsubscribe;
};

export default {
  syncAssetsToFirebase,
  loadAssetsFromFirebase,
  saveAssetToFirebase,
  deleteAssetFromFirebase,
  saveOperatorToFirebase,
  loadOperatorFromFirebase,
  syncUsersToFirebase,
  loadUsersFromFirebase,
  subscribeToAssets,
  subscribeToOperator
};
