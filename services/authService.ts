import { User, UserRole, AuthSession } from '../types';

const USERS_KEY = 'evr_users_v1';
const SESSION_KEY = 'evr_session_v1';

// Predvolený administrátorský účet
const DEFAULT_ADMIN: User = {
  id: 'admin-001',
  username: 'admin',
  password: 'admin123', // V produkcii by bolo hashované!
  role: UserRole.ADMINISTRATOR,
  fullName: 'Administrátor systému',
  email: 'admin@example.com',
  createdAt: new Date().toISOString(),
  isActive: true
};

// Inicializácia používateľov (vytvorí admin účet ak neexistuje)
export const initializeUsers = (): void => {
  const users = loadUsers();
  if (users.length === 0) {
    saveUsers([DEFAULT_ADMIN]);
  }
};

// Načítanie používateľov
export const loadUsers = (): User[] => {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as User[];
  } catch (e) {
    console.error('Chyba pri načítaní používateľov', e);
    return [];
  }
};

// Uloženie používateľov
export const saveUsers = (users: User[]): void => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Chyba pri ukladaní používateľov', e);
  }
};

// Prihlásenie
export const login = (username: string, password: string): { success: boolean; user?: User; error?: string } => {
  const users = loadUsers();
  const user = users.find(u => u.username === username && u.isActive);
  
  if (!user) {
    return { success: false, error: 'Používateľ neexistuje alebo je deaktivovaný' };
  }
  
  if (user.password !== password) {
    return { success: false, error: 'Nesprávne heslo' };
  }
  
  // Vytvorenie session
  const session: AuthSession = {
    user: { ...user, password: '' }, // Nevracaj heslo do session
    loginTime: new Date().toISOString()
  };
  
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Chyba pri vytváraní session', e);
  }
  
  return { success: true, user: session.user };
};

// Odhlásenie
export const logout = (): void => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.error('Chyba pri odhlasovaní', e);
  }
};

// Získanie aktuálnej session
export const getCurrentSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch (e) {
    console.error('Chyba pri načítaní session', e);
    return null;
  }
};

// Získanie aktuálneho používateľa
export const getCurrentUser = (): User | null => {
  const session = getCurrentSession();
  return session?.user || null;
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
export const canExportImport = (): boolean => getCurrentUser()?.role === UserRole.ADMINISTRATOR;
export const canEditOperator = (): boolean => getCurrentUser()?.role === UserRole.ADMINISTRATOR;
export const canManageUsers = (): boolean => getCurrentUser()?.role === UserRole.ADMINISTRATOR;
export const canViewAssets = (): boolean => hasPermission(UserRole.USER);
export const canGeneratePDF = (): boolean => hasPermission(UserRole.USER);

// Registrácia nového používateľa (iba admin)
export const registerUser = (userData: Omit<User, 'id' | 'createdAt' | 'isActive'>): { success: boolean; error?: string } => {
  if (!canManageUsers()) {
    return { success: false, error: 'Nemáte oprávnenie pridávať používateľov' };
  }
  
  const users = loadUsers();
  
  // Kontrola duplicity username
  if (users.some(u => u.username === userData.username)) {
    return { success: false, error: 'Používateľské meno už existuje' };
  }
  
  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}`,
    createdAt: new Date().toISOString(),
    isActive: true
  };
  
  saveUsers([...users, newUser]);
  return { success: true };
};

// Aktualizácia používateľa
export const updateUser = (userId: string, updates: Partial<User>): { success: boolean; error?: string } => {
  if (!canManageUsers()) {
    return { success: false, error: 'Nemáte oprávnenie upravovať používateľov' };
  }
  
  const users = loadUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index === -1) {
    return { success: false, error: 'Používateľ nenájdený' };
  }
  
  users[index] = { ...users[index], ...updates };
  saveUsers(users);
  return { success: true };
};

// Deaktivácia používateľa
export const deactivateUser = (userId: string): { success: boolean; error?: string } => {
  return updateUser(userId, { isActive: false });
};

// Aktivácia používateľa
export const activateUser = (userId: string): { success: boolean; error?: string } => {
  return updateUser(userId, { isActive: true });
};

export default {
  initializeUsers,
  loadUsers,
  saveUsers,
  login,
  logout,
  getCurrentSession,
  getCurrentUser,
  hasPermission,
  canAddAsset,
  canAddInspection,
  canExcludeAsset,
  canExportImport,
  canEditOperator,
  canManageUsers,
  canViewAssets,
  canGeneratePDF,
  registerUser,
  updateUser,
  deactivateUser,
  activateUser
};
