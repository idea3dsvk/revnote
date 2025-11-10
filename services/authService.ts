import { User, UserRole } from '../types';
import { auth, db, isFirebaseConfigured } from './firebaseConfig';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';

// Kolekcia používateľov vo Firestore
const USERS_COLLECTION = 'users';

// Cache pre aktuálneho používateľa
let currentUserCache: User | null = null;

// Inicializácia auth listenera
export const initializeAuth = (onUserChange: (user: User | null) => void): (() => void) => {
  if (!auth) {
    console.warn('Firebase Auth not initialized');
    return () => {};
  }

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Používateľ je prihlásený, načítaj jeho dáta z Firestore
      const userData = await getUserData(firebaseUser.uid);
      currentUserCache = userData;
      onUserChange(userData);
    } else {
      // Používateľ je odhlásený
      currentUserCache = null;
      onUserChange(null);
    }
  });
};

// Získanie dát používateľa z Firestore
const getUserData = async (uid: string): Promise<User | null> => {
  if (!db) return null;

  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        id: userDoc.id,
        username: data.username,
        password: '', // Heslo sa neukladá do cache
        role: data.role || UserRole.USER,
        fullName: data.fullName,
        email: data.email,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        isActive: data.isActive !== false
      };
    }
    
    return null;
  } catch (error) {
    console.error('Chyba pri načítaní používateľských dát:', error);
    return null;
  }
};

// Prihlásenie
export const login = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  if (!auth || !isFirebaseConfigured) {
    return { success: false, error: 'Firebase nie je nakonfigurovaný' };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userData = await getUserData(userCredential.user.uid);
    
    if (!userData) {
      await firebaseSignOut(auth);
      return { success: false, error: 'Používateľské dáta nenájdené' };
    }

    if (!userData.isActive) {
      await firebaseSignOut(auth);
      return { success: false, error: 'Používateľský účet je deaktivovaný' };
    }

    currentUserCache = userData;
    return { success: true, user: userData };
  } catch (error: any) {
    console.error('Chyba pri prihlásení:', error);
    
    let errorMessage = 'Chyba pri prihlásení';
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
      errorMessage = 'Nesprávny email alebo heslo';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Príliš mnoho pokusov. Skúste neskôr.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Chyba pripojenia k internetu';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Odhlásenie
export const logout = async (): Promise<void> => {
  if (!auth) return;
  
  try {
    await firebaseSignOut(auth);
    currentUserCache = null;
  } catch (error) {
    console.error('Chyba pri odhlasovaní:', error);
  }
};

// Získanie aktuálneho používateľa
export const getCurrentUser = (): User | null => {
  return currentUserCache;
};

// Kontrola oprávnení
export const hasPermission = (requiredRole: UserRole): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Administrátor má všetky práva
  if (user.role === UserRole.ADMINISTRATOR) return true;
  
  // Revisor má práva revizora a používateľa
  if (user.role === UserRole.REVISOR && (requiredRole === UserRole.REVISOR || requiredRole === UserRole.USER)) {
    return true;
  }
  
  // Používateľ má iba svoje práva
  if (user.role === UserRole.USER && requiredRole === UserRole.USER) {
    return true;
  }
  
  return false;
};

// Kontrola konkrétnych akcií
export const canAddAsset = (): boolean => hasPermission(UserRole.REVISOR);
export const canAddInspection = (): boolean => hasPermission(UserRole.REVISOR);
export const canExcludeAsset = (): boolean => hasPermission(UserRole.REVISOR);
export const canDeleteAsset = (): boolean => getCurrentUser()?.role === UserRole.ADMINISTRATOR;
export const canExportImport = (): boolean => getCurrentUser()?.role === UserRole.ADMINISTRATOR;
export const canEditOperator = (): boolean => getCurrentUser()?.role === UserRole.ADMINISTRATOR;
export const canManageUsers = (): boolean => getCurrentUser()?.role === UserRole.ADMINISTRATOR;
export const canViewAssets = (): boolean => hasPermission(UserRole.USER);
export const canGeneratePDF = (): boolean => hasPermission(UserRole.USER);

// Vytvorenie nového používateľa vo Firestore (admin funkcia)
// Poznámka: Skutočné vytvorenie Firebase Auth účtu musí byť cez Firebase Admin SDK alebo Firebase Console
export const createUserProfile = async (
  uid: string,
  userData: {
    username: string;
    email: string;
    fullName: string;
    role: UserRole;
  }
): Promise<{ success: boolean; error?: string }> => {
  if (!db || !canManageUsers()) {
    return { success: false, error: 'Nemáte oprávnenie vytvárať používateľov' };
  }

  try {
    await setDoc(doc(db, USERS_COLLECTION, uid), {
      username: userData.username,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role,
      createdAt: Timestamp.now(),
      isActive: true
    });
    
    return { success: true };
  } catch (error) {
    console.error('Chyba pri vytváraní používateľského profilu:', error);
    return { success: false, error: 'Chyba pri vytváraní profilu' };
  }
};

// Načítanie všetkých používateľov (admin funkcia)
export const loadUsers = async (): Promise<User[]> => {
  if (!db || !canManageUsers()) {
    return [];
  }

  try {
    const usersSnapshot = await getDocs(collection(db, USERS_COLLECTION));
    const users: User[] = [];
    
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        username: data.username,
        password: '', // Heslo nie je uložené vo Firestore
        role: data.role || UserRole.USER,
        fullName: data.fullName,
        email: data.email,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        isActive: data.isActive !== false
      });
    });
    
    return users;
  } catch (error) {
    console.error('Chyba pri načítaní používateľov:', error);
    return [];
  }
};

// Aktualizácia používateľa
export const updateUser = async (userId: string, updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
  if (!db || !canManageUsers()) {
    return { success: false, error: 'Nemáte oprávnenie upravovať používateľov' };
  }

  try {
    const updateData: any = {};
    if (updates.username) updateData.username = updates.username;
    if (updates.fullName) updateData.fullName = updates.fullName;
    if (updates.email) updateData.email = updates.email;
    if (updates.role) updateData.role = updates.role;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    
    await updateDoc(doc(db, USERS_COLLECTION, userId), updateData);
    return { success: true };
  } catch (error) {
    console.error('Chyba pri aktualizácii používateľa:', error);
    return { success: false, error: 'Chyba pri aktualizácii používateľa' };
  }
};

// Deaktivácia používateľa
export const deactivateUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  return updateUser(userId, { isActive: false });
};

// Aktivácia používateľa
export const activateUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  return updateUser(userId, { isActive: true });
};

export default {
  initializeAuth,
  login,
  logout,
  getCurrentUser,
  hasPermission,
  canAddAsset,
  canAddInspection,
  canExcludeAsset,
  canDeleteAsset,
  canExportImport,
  canEditOperator,
  canManageUsers,
  canViewAssets,
  canGeneratePDF,
  createUserProfile,
  loadUsers,
  updateUser,
  deactivateUser,
  activateUser
};
