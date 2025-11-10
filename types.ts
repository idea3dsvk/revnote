export enum InspectionStatus {
  PASS = 'VYHOVUJE',
  FAIL = 'NEVYHOVUJE',
  DUE = 'PLÁNOVANÁ',
  EXCLUDED = 'VYLUČENÉ',
}

export enum UsageType {
  HEAVY_DUTY = 'Ručné elektrické náradie alebo predlžovací prívod s namáhaním',
  LIGHT_DUTY = 'Ostatné elektrické spotrebiče alebo predlžovací prívod bez namáhania',
}

export enum UsageGroup {
  C = 'C: Spotrebič alebo predlžovací prívod používaný vo vnútorných výrobných priestoroch firmy',
  E = 'E: Spotrebič alebo predlžovací prívod používaný pri administratívnej činnosti',
}

export interface Inspection {
  id: string;
  date: string;
  inspectorName: string;
  status: InspectionStatus;
  notes: string;
  measuringDevice: string;
  insulationResistance: number;
  protectiveConductorResistance: number;
  protectiveConductorCurrent?: number;
  touchCurrent?: number;
  leakageCurrent?: number;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  location: string;
  serialNumber: string;
  revisionNumber: string;
  purchaseDate: string;
  nextInspectionDate: string;
  usageType: UsageType;
  usageGroup: UsageGroup;
  inspections: Inspection[];
  notes?: string;
  isExcluded?: boolean;
}

export interface Operator {
  name: string;
  address: string;
  ico: string;
  contactPerson: string;
}

export enum UserRole {
  ADMINISTRATOR = 'ADMINISTRATOR',
  REVISOR = 'REVISOR',
  USER = 'USER'
}

export interface User {
  id: string;
  username: string;
  password: string; // V reálnej aplikácii by bolo hashované
  role: UserRole;
  fullName: string;
  email: string;
  createdAt: string;
  isActive: boolean;
}

export interface AuthSession {
  user: User;
  loginTime: string;
}
