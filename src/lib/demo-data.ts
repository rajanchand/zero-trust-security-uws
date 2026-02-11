export type Role = 'USER' | 'ADMIN' | 'SUPERADMIN' | 'IT';

export interface DemoUser {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  role: Role;
  status: 'active' | 'pending_verification' | 'disabled' | 'locked';
  createdAt: string;
  failedLoginAttempts: number;
  lockedUntil?: number;
}

export interface Device {
  id: string;
  userId: string;
  userAgent: string;
  os: string;
  browser: string;
  fingerprint: string;
  approved: boolean;
  requestedAt: string;
  approvedBy?: string;
  posture: {
    hasUpdatedOS: boolean;
    hasAV: boolean;
    diskEncrypted: boolean;
    screenLockEnabled: boolean;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  riskScore?: number;
  ip: string;
  location: string;
  outcome: 'success' | 'failure' | 'blocked';
}

export interface OTPRecord {
  userId: string;
  code: string;
  expiresAt: number;
  type: 'registration' | 'login';
  channel: 'email' | 'mobile' | 'both';
  attempts: number;
}

export const DEMO_USERS: DemoUser[] = [
  { id: 'u1', fullName: 'Super Admin', email: 'superadmin@demo.com', mobile: '+1234567890', password: 'Admin@1234', role: 'SUPERADMIN', status: 'active', createdAt: '2024-01-01T00:00:00Z', failedLoginAttempts: 0 },
  { id: 'u2', fullName: 'Admin User', email: 'admin@demo.com', mobile: '+1234567891', password: 'Admin@1234', role: 'ADMIN', status: 'active', createdAt: '2024-01-15T00:00:00Z', failedLoginAttempts: 0 },
  { id: 'u3', fullName: 'IT Specialist', email: 'it@demo.com', mobile: '+1234567892', password: 'Admin@1234', role: 'IT', status: 'active', createdAt: '2024-02-01T00:00:00Z', failedLoginAttempts: 0 },
  { id: 'u4', fullName: 'Regular User', email: 'user@demo.com', mobile: '+1234567893', password: 'Admin@1234', role: 'USER', status: 'active', createdAt: '2024-03-01T00:00:00Z', failedLoginAttempts: 0 },
];

export function initDemoData() {
  // Check schema version to auto-migrate
  const schemaVersion = localStorage.getItem('zt_schema_v');
  if (schemaVersion !== '3') {
    localStorage.setItem('zt_users', JSON.stringify(DEMO_USERS));
    localStorage.setItem('zt_devices', JSON.stringify([]));
    localStorage.setItem('zt_audit', JSON.stringify([]));
    localStorage.setItem('zt_otps', JSON.stringify([]));
    localStorage.setItem('zt_login_rate', JSON.stringify({}));
    localStorage.removeItem('zt_session');
    localStorage.removeItem('zt_blocked');
    localStorage.setItem('zt_schema_v', '3');
  }
  if (!localStorage.getItem('zt_users')) localStorage.setItem('zt_users', JSON.stringify(DEMO_USERS));
  if (!localStorage.getItem('zt_devices')) localStorage.setItem('zt_devices', JSON.stringify([]));
  if (!localStorage.getItem('zt_audit')) localStorage.setItem('zt_audit', JSON.stringify([]));
  if (!localStorage.getItem('zt_otps')) localStorage.setItem('zt_otps', JSON.stringify([]));
  if (!localStorage.getItem('zt_login_rate')) localStorage.setItem('zt_login_rate', JSON.stringify({}));
}

export function getUsers(): DemoUser[] { return JSON.parse(localStorage.getItem('zt_users') || '[]'); }
export function setUsers(users: DemoUser[]) { localStorage.setItem('zt_users', JSON.stringify(users)); }
export function getDevices(): Device[] { return JSON.parse(localStorage.getItem('zt_devices') || '[]'); }
export function setDevices(devices: Device[]) { localStorage.setItem('zt_devices', JSON.stringify(devices)); }
export function getAuditLogs(): AuditLog[] { return JSON.parse(localStorage.getItem('zt_audit') || '[]'); }
export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  const logs = getAuditLogs();
  logs.unshift({ ...log, id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), timestamp: new Date().toISOString() });
  localStorage.setItem('zt_audit', JSON.stringify(logs.slice(0, 500)));
}
export function getOTPs(): OTPRecord[] { return JSON.parse(localStorage.getItem('zt_otps') || '[]'); }
export function setOTPs(otps: OTPRecord[]) { localStorage.setItem('zt_otps', JSON.stringify(otps)); }

// Rate limiting
export function checkRateLimit(key: string, maxAttempts: number, windowMs: number): boolean {
  const rates: Record<string, number[]> = JSON.parse(localStorage.getItem('zt_login_rate') || '{}');
  const now = Date.now();
  const attempts = (rates[key] || []).filter(t => now - t < windowMs);
  return attempts.length < maxAttempts;
}
export function recordRateAttempt(key: string) {
  const rates: Record<string, number[]> = JSON.parse(localStorage.getItem('zt_login_rate') || '{}');
  if (!rates[key]) rates[key] = [];
  rates[key].push(Date.now());
  rates[key] = rates[key].slice(-20);
  localStorage.setItem('zt_login_rate', JSON.stringify(rates));
}
