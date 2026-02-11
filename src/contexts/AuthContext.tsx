import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DemoUser, Role, getUsers, setUsers, addAuditLog, getDevices, setDevices, getOTPs, setOTPs, initDemoData, Device, checkRateLimit, recordRateAttempt } from '@/lib/demo-data';
import { runZeroTrustCheck, PolicyResult, getDeviceFingerprint, detectOS, detectBrowser, fetchRealIP, getCachedIP, getSimulatedPosture, RealIPInfo } from '@/lib/zero-trust';
import { logOTP, logEvent } from '@/lib/mongodb';

interface AuthState {
  user: DemoUser | null;
  isAuthenticated: boolean;
  pendingOTP: { userId: string; type: 'registration' | 'login'; email: string; mobile: string } | null;
  lastPolicyResult: PolicyResult | null;
  currentDevice: Device | null;
  ipInfo: RealIPInfo | null;
}

interface AuthContextType extends AuthState {
  register: (data: { fullName: string; email: string; mobile: string; password: string }) => { success: boolean; error?: string; otp?: string };
  login: (email: string, password: string) => { success: boolean; error?: string; requiresOTP: boolean; needsChannel?: boolean };
  sendLoginOTP: (channel: 'email' | 'mobile') => { success: boolean; otp?: string };
  verifyOTP: (code: string) => { success: boolean; error?: string };
  resendOTP: () => { success: boolean; otp?: string };
  logout: () => void;
  hasRole: (requiredRoles: Role[]) => boolean;
  getAllUsers: () => DemoUser[];
  addUser: (data: { fullName: string; email: string; mobile: string; password: string; role: Role }) => { success: boolean; error?: string };
  updateUser: (userId: string, data: Partial<Pick<DemoUser, 'fullName' | 'email' | 'mobile' | 'role' | 'status'>>) => void;
  updateUserRole: (userId: string, role: Role) => void;
  toggleUserStatus: (userId: string) => void;
  deleteUser: (userId: string) => void;
  approveDevice: (deviceId: string) => void;
  denyDevice: (deviceId: string) => void;
  getAllDevices: () => Device[];
  requestDeviceApproval: () => void;
  unlockUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    pendingOTP: null,
    lastPolicyResult: null,
    currentDevice: null,
    ipInfo: null,
  });

  useEffect(() => {
    initDemoData();
    fetchRealIP().then(info => setState(s => ({ ...s, ipInfo: info })));
    const saved = localStorage.getItem('zt_session');
    if (saved) {
      const session = JSON.parse(saved);
      const users = getUsers();
      const user = users.find(u => u.id === session.userId);
      if (user && (user.status === 'active')) {
        const fp = getDeviceFingerprint();
        const devices = getDevices();
        const device = devices.find(d => d.userId === user.id && d.fingerprint === fp);
        setState(s => ({ ...s, user, isAuthenticated: true, currentDevice: device || null, lastPolicyResult: session.lastPolicy || null }));
      }
    }
  }, []);

  const getIP = useCallback(() => state.ipInfo || getCachedIP(), [state.ipInfo]);

  const generateOTP = useCallback((): string => Math.floor(100000 + Math.random() * 900000).toString(), []);

  const register = useCallback((data: { fullName: string; email: string; mobile: string; password: string }) => {
    const users = getUsers();
    if (users.find(u => u.email === data.email)) return { success: false, error: 'Email already registered' };
    const newUser: DemoUser = {
      id: 'u_' + Date.now(), fullName: data.fullName, email: data.email, mobile: data.mobile,
      password: data.password, role: 'USER', status: 'pending_verification', createdAt: new Date().toISOString(), failedLoginAttempts: 0,
    };
    users.push(newUser);
    setUsers(users);
    const otp = generateOTP();
    const otps = getOTPs();
    otps.push({ userId: newUser.id, code: otp, expiresAt: Date.now() + 5 * 60 * 1000, type: 'registration', channel: 'both', attempts: 0 });
    setOTPs(otps);
    const ip = getIP();
    addAuditLog({ userId: newUser.id, userEmail: newUser.email, action: 'REGISTER', details: 'New user registration', ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
    addAuditLog({ userId: newUser.id, userEmail: newUser.email, action: 'OTP_SENT', details: `Registration OTP sent to email & mobile: ${otp}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
    setState(s => ({ ...s, pendingOTP: { userId: newUser.id, type: 'registration', email: newUser.email, mobile: newUser.mobile } }));
    console.log(`📧 OTP for ${data.email}: ${otp}`);
    console.log(`📱 SMS OTP for ${data.mobile}: ${otp}`);
    logOTP({ email: data.email, mobile: data.mobile, otp, type: 'registration', channel: 'both' });
    logEvent({
      event: 'USER_REGISTERED',
      user: { fullName: data.fullName, email: data.email, mobile: data.mobile, role: 'USER', status: 'pending_verification' },
      otp: { code: otp, channel: 'both', type: 'registration' },
      ip: ip.ip,
      location: `${ip.city}, ${ip.region}, ${ip.country}`,
      details: 'New user registration — OTP sent to email & mobile',
    });
    return { success: true, otp };
  }, [generateOTP, getIP]);

  const login = useCallback((email: string, password: string) => {
    // Rate limit check
    if (!checkRateLimit(`login_${email}`, 10, 60000)) {
      return { success: false, error: 'Too many login attempts. Wait 1 minute.', requiresOTP: false };
    }
    recordRateAttempt(`login_${email}`);

    const users = getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return { success: false, error: 'Invalid credentials', requiresOTP: false };

    // Check account lock
    if (user.status === 'locked') {
      if (user.lockedUntil && Date.now() < user.lockedUntil) {
        const mins = Math.ceil((user.lockedUntil - Date.now()) / 60000);
        return { success: false, error: `Account locked. Try again in ${mins} minute(s).`, requiresOTP: false };
      }
      // Auto-unlock after lockout period
      user.status = 'active';
      user.failedLoginAttempts = 0;
      user.lockedUntil = undefined;
      setUsers(users);
    }

    if (user.password !== password) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      const ip = getIP();
      addAuditLog({ userId: user.id, userEmail: user.email, action: 'LOGIN_FAIL', details: `Invalid password (attempt ${user.failedLoginAttempts}/5)`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'failure' });
      logEvent({
        event: 'LOGIN_FAILED',
        user: { fullName: user.fullName, email: user.email, role: user.role, status: user.status },
        ip: ip.ip, location: `${ip.city}, ${ip.region}, ${ip.country}`,
        details: `Invalid password — attempt ${user.failedLoginAttempts}/5`,
      });
      
      if (user.failedLoginAttempts >= 5) {
        user.status = 'locked';
        user.lockedUntil = Date.now() + 15 * 60 * 1000; // 15min lock
        setUsers(users);
        addAuditLog({ userId: user.id, userEmail: user.email, action: 'ACCOUNT_LOCKED', details: 'Account locked after 5 failed attempts', ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'blocked' });
        logEvent({ event: 'ACCOUNT_LOCKED', user: { fullName: user.fullName, email: user.email }, ip: ip.ip, location: `${ip.city}, ${ip.country}`, details: 'Locked after 5 failed attempts (15 min)' });
        return { success: false, error: 'Account locked after 5 failed attempts. Try again in 15 minutes.', requiresOTP: false };
      }
      setUsers(users);
      return { success: false, error: `Invalid credentials (${5 - user.failedLoginAttempts} attempts remaining)`, requiresOTP: false };
    }

    if (user.status === 'disabled') return { success: false, error: 'Account disabled by administrator', requiresOTP: false };
    if (user.status === 'pending_verification') return { success: false, error: 'Account not verified. Complete OTP verification first.', requiresOTP: false };

    // Reset failed attempts on success
    user.failedLoginAttempts = 0;
    setUsers(users);

    // Don't generate OTP yet — let user choose channel
    setState(s => ({ ...s, pendingOTP: { userId: user.id, type: 'login', email: user.email, mobile: user.mobile } }));
    logEvent({
      event: 'LOGIN_CREDENTIALS_OK',
      user: { fullName: user.fullName, email: user.email, mobile: user.mobile, role: user.role, status: user.status },
      ip: getIP().ip, location: `${getIP().city}, ${getIP().region}, ${getIP().country}`,
      details: 'Password verified — waiting for OTP channel selection',
    });
    return { success: true, requiresOTP: true, needsChannel: true };
  }, [getIP]);

  const sendLoginOTP = useCallback((channel: 'email' | 'mobile') => {
    if (!state.pendingOTP) return { success: false };
    const otp = generateOTP();
    const otps = getOTPs();
    // Remove old OTPs for this user
    const filtered = otps.filter(o => !(o.userId === state.pendingOTP!.userId && o.type === 'login'));
    filtered.push({ userId: state.pendingOTP.userId, code: otp, expiresAt: Date.now() + 5 * 60 * 1000, type: 'login', channel, attempts: 0 });
    setOTPs(filtered);
    const ip = getIP();
    const dest = channel === 'email' ? state.pendingOTP.email : state.pendingOTP.mobile;
    addAuditLog({ userId: state.pendingOTP.userId, userEmail: state.pendingOTP.email, action: 'OTP_SENT', details: `Login OTP sent via ${channel} to ${dest}: ${otp}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
    if (channel === 'email') {
      console.log(`📧 Email OTP for ${state.pendingOTP.email}: ${otp}`);
    } else {
      console.log(`📱 SMS OTP for ${state.pendingOTP.mobile}: ${otp}`);
    }
    logOTP({ email: state.pendingOTP.email, mobile: state.pendingOTP.mobile, otp, type: 'login', channel });
    logEvent({
      event: 'OTP_SENT',
      user: { email: state.pendingOTP.email, mobile: state.pendingOTP.mobile },
      otp: { code: otp, channel, type: 'login' },
      ip: ip.ip, location: `${ip.city}, ${ip.region}, ${ip.country}`,
      details: `Login OTP sent via ${channel} to ${dest}`,
    });
    return { success: true, otp };
  }, [state.pendingOTP, generateOTP, getIP]);

  const verifyOTP = useCallback((code: string) => {
    if (!state.pendingOTP) return { success: false, error: 'No pending OTP' };
    const otps = getOTPs();
    const idx = otps.findIndex(o => o.userId === state.pendingOTP!.userId && o.type === state.pendingOTP!.type);
    if (idx === -1) return { success: false, error: 'OTP expired or not sent. Please request a new one.' };
    const otp = otps[idx];
    if (otp.attempts >= 5) { otps.splice(idx, 1); setOTPs(otps); return { success: false, error: 'Too many attempts. Request a new OTP.' }; }
    if (Date.now() > otp.expiresAt) { otps.splice(idx, 1); setOTPs(otps); return { success: false, error: 'OTP expired. Request a new one.' }; }
    if (otp.code !== code) {
      otp.attempts++;
      setOTPs(otps);
      const ip = getIP();
      addAuditLog({ userId: otp.userId, userEmail: state.pendingOTP.email, action: 'OTP_FAIL', details: `Invalid OTP (attempt ${otp.attempts}/5)`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'failure' });
      logEvent({ event: 'OTP_FAILED', user: { email: state.pendingOTP.email }, ip: ip.ip, location: `${ip.city}, ${ip.country}`, details: `Invalid OTP — attempt ${otp.attempts}/5` });
      return { success: false, error: `Invalid OTP (${5 - otp.attempts} attempts remaining)` };
    }

    otps.splice(idx, 1);
    setOTPs(otps);

    const users = getUsers();
    const user = users.find(u => u.id === state.pendingOTP!.userId);
    if (!user) return { success: false, error: 'User not found' };

    if (state.pendingOTP.type === 'registration') { user.status = 'active'; setUsers(users); }

    const fp = getDeviceFingerprint();
    const devices = getDevices();
    let device = devices.find(d => d.userId === user.id && d.fingerprint === fp);
    if (!device) {
      device = {
        id: 'dev_' + Date.now(), userId: user.id, userAgent: navigator.userAgent,
        os: detectOS(), browser: detectBrowser(), fingerprint: fp,
        approved: false, requestedAt: new Date().toISOString(), posture: getSimulatedPosture(),
      };
      devices.push(device);
      setDevices(devices);
      const ip = getIP();
      addAuditLog({ userId: user.id, userEmail: user.email, action: 'NEW_DEVICE', details: `New device detected: ${device.browser} on ${device.os}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
      logEvent({
        event: 'NEW_DEVICE_DETECTED',
        user: { fullName: user.fullName, email: user.email, role: user.role },
        device: { browser: device.browser, os: device.os, approved: device.approved, fingerprint: device.fingerprint, posture: device.posture },
        ip: ip.ip, location: `${ip.city}, ${ip.region}, ${ip.country}`,
      });
    }

    const ip = getIP();
    const policy = runZeroTrustCheck(ip, user.failedLoginAttempts || 0, device.approved, device.posture);

    addAuditLog({ userId: user.id, userEmail: user.email, action: 'OTP_VERIFIED', details: `OTP verified via ${otp.channel}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success', riskScore: policy.riskScore });
    addAuditLog({ userId: user.id, userEmail: user.email, action: 'ZERO_TRUST_CHECK', details: `Signals: IP=${ip.ip}, ISP=${ip.isp}, Device=${device.approved ? 'Trusted' : 'Untrusted'}, Posture: OS=${device.posture.hasUpdatedOS}, AV=${device.posture.hasAV}, Encrypted=${device.posture.diskEncrypted}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success', riskScore: policy.riskScore });
    addAuditLog({ userId: user.id, userEmail: user.email, action: 'POLICY_DECISION', details: `Decision: ${policy.decision.toUpperCase()} | Risk: ${policy.riskScore}/100 | ${policy.reasons.join('; ') || 'No risk factors'}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: policy.decision === 'block' ? 'blocked' : 'success', riskScore: policy.riskScore });

    // Log full zero-trust decision to server terminal
    logEvent({
      event: 'ZERO_TRUST_DECISION',
      user: { fullName: user.fullName, email: user.email, mobile: user.mobile, role: user.role, status: user.status },
      ip: ip.ip, location: `${ip.city}, ${ip.region}, ${ip.country}`,
      device: { browser: device.browser, os: device.os, approved: device.approved, fingerprint: device.fingerprint, posture: device.posture },
      policy: { decision: policy.decision, riskScore: policy.riskScore, reasons: policy.reasons },
      details: `ISP: ${ip.isp} | Timezone: ${ip.timezone}`,
    });

    if (policy.decision === 'block') {
      addAuditLog({ userId: user.id, userEmail: user.email, action: 'ACCESS_BLOCKED', details: `Access denied: ${policy.reasons.join(', ')}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'blocked', riskScore: policy.riskScore });
      localStorage.setItem('zt_blocked', JSON.stringify({ reasons: policy.reasons, riskScore: policy.riskScore, signals: policy.signals }));
      setState(s => ({ ...s, pendingOTP: null, lastPolicyResult: policy }));
      return { success: true, error: 'ACCESS_BLOCKED' };
    }

    addAuditLog({ userId: user.id, userEmail: user.email, action: 'LOGIN_SUCCESS', details: `Login from ${device.browser}/${device.os} | JWT issued`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success', riskScore: policy.riskScore });

    logEvent({
      event: 'LOGIN_SUCCESS',
      user: { fullName: user.fullName, email: user.email, mobile: user.mobile, role: user.role, status: user.status },
      ip: ip.ip, location: `${ip.city}, ${ip.region}, ${ip.country}`,
      device: { browser: device.browser, os: device.os, approved: device.approved, fingerprint: device.fingerprint, posture: device.posture },
      policy: { decision: policy.decision, riskScore: policy.riskScore, reasons: policy.reasons },
    });

    localStorage.setItem('zt_session', JSON.stringify({ userId: user.id, lastPolicy: policy }));
    setState(s => ({ ...s, user, isAuthenticated: true, pendingOTP: null, lastPolicyResult: policy, currentDevice: device }));
    return { success: true };
  }, [state.pendingOTP, getIP]);

  const resendOTP = useCallback(() => {
    if (!state.pendingOTP) return { success: false };
    const otps = getOTPs();
    const existing = otps.find(o => o.userId === state.pendingOTP!.userId && o.type === state.pendingOTP!.type);
    const channel = existing?.channel || 'email';
    const filtered = otps.filter(o => !(o.userId === state.pendingOTP!.userId && o.type === state.pendingOTP!.type));
    const otp = generateOTP();
    filtered.push({ userId: state.pendingOTP.userId, code: otp, expiresAt: Date.now() + 5 * 60 * 1000, type: state.pendingOTP.type, channel, attempts: 0 });
    setOTPs(filtered);
    console.log(`📧 Resent OTP (${channel}): ${otp}`);
    logOTP({ email: state.pendingOTP.email, mobile: state.pendingOTP.mobile, otp, type: state.pendingOTP.type, channel });
    return { success: true, otp };
  }, [state.pendingOTP, generateOTP]);

  const logout = useCallback(() => {
    if (state.user) {
      const ip = getIP();
      addAuditLog({ userId: state.user.id, userEmail: state.user.email, action: 'LOGOUT', details: 'User logged out', ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
      logEvent({
        event: 'LOGOUT',
        user: { fullName: state.user.fullName, email: state.user.email, role: state.user.role },
        ip: ip.ip, location: `${ip.city}, ${ip.region}, ${ip.country}`,
      });
    }
    localStorage.removeItem('zt_session');
    setState(s => ({ ...s, user: null, isAuthenticated: false, pendingOTP: null, lastPolicyResult: null, currentDevice: null }));
  }, [state.user, getIP]);

  const hasRole = useCallback((requiredRoles: Role[]) => {
    if (!state.user) return false;
    if (state.user.role === 'SUPERADMIN') return true;
    return requiredRoles.includes(state.user.role);
  }, [state.user]);

  const getAllUsers = useCallback(() => getUsers(), []);

  const addUser = useCallback((data: { fullName: string; email: string; mobile: string; password: string; role: Role }) => {
    const users = getUsers();
    if (users.find(u => u.email === data.email)) return { success: false, error: 'Email already exists' };
    users.push({ id: 'u_' + Date.now(), ...data, status: 'active', createdAt: new Date().toISOString(), failedLoginAttempts: 0 });
    setUsers(users);
    const ip = getIP();
    addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'USER_CREATED', details: `Created user: ${data.email} [${data.role}]`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
    return { success: true };
  }, [state.user, getIP]);

  const updateUser = useCallback((userId: string, data: Partial<Pick<DemoUser, 'fullName' | 'email' | 'mobile' | 'role' | 'status'>>) => {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (user) { Object.assign(user, data); setUsers(users); const ip = getIP(); addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'USER_UPDATED', details: `Updated user: ${user.email}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' }); }
  }, [state.user, getIP]);

  const updateUserRole = useCallback((userId: string, role: Role) => {
    const users = getUsers(); const user = users.find(u => u.id === userId);
    if (user) { user.role = role; setUsers(users); const ip = getIP(); addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'ROLE_CHANGED', details: `${user.email} → ${role}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' }); }
  }, [state.user, getIP]);

  const toggleUserStatus = useCallback((userId: string) => {
    const users = getUsers(); const user = users.find(u => u.id === userId);
    if (user) { user.status = user.status === 'active' ? 'disabled' : 'active'; setUsers(users); const ip = getIP(); addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'USER_STATUS_CHANGED', details: `${user.email} → ${user.status}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' }); }
  }, [state.user, getIP]);

  const unlockUser = useCallback((userId: string) => {
    const users = getUsers(); const user = users.find(u => u.id === userId);
    if (user) { user.status = 'active'; user.failedLoginAttempts = 0; user.lockedUntil = undefined; setUsers(users); const ip = getIP(); addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'USER_UNLOCKED', details: `${user.email} unlocked by admin`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' }); }
  }, [state.user, getIP]);

  const deleteUser = useCallback((userId: string) => {
    const users = getUsers(); const target = users.find(u => u.id === userId);
    setUsers(users.filter(u => u.id !== userId));
    const ip = getIP(); addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'USER_DELETED', details: `Deleted: ${target?.email || userId}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
  }, [state.user, getIP]);

  const approveDevice = useCallback((deviceId: string) => {
    const devices = getDevices(); const device = devices.find(d => d.id === deviceId);
    if (device) { device.approved = true; device.approvedBy = state.user?.id; setDevices(devices); const ip = getIP(); addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'DEVICE_APPROVED', details: `Device ${deviceId} approved`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' }); }
  }, [state.user, getIP]);

  const denyDevice = useCallback((deviceId: string) => {
    setDevices(getDevices().filter(d => d.id !== deviceId));
    const ip = getIP(); addAuditLog({ userId: state.user?.id || '', userEmail: state.user?.email || '', action: 'DEVICE_DENIED', details: `Device ${deviceId} removed`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
  }, [state.user, getIP]);

  const getAllDevices = useCallback(() => getDevices(), []);

  const requestDeviceApproval = useCallback(() => {
    if (!state.user || !state.currentDevice) return;
    const ip = getIP();
    addAuditLog({ userId: state.user.id, userEmail: state.user.email, action: 'DEVICE_APPROVAL_REQUEST', details: `${state.currentDevice.browser}/${state.currentDevice.os}`, ip: ip.ip, location: `${ip.city}, ${ip.country}`, outcome: 'success' });
  }, [state.user, state.currentDevice, getIP]);

  return (
    <AuthContext.Provider value={{
      ...state, register, login, sendLoginOTP, verifyOTP, resendOTP, logout, hasRole,
      getAllUsers, addUser, updateUser, updateUserRole, toggleUserStatus, deleteUser,
      approveDevice, denyDevice, getAllDevices, requestDeviceApproval, unlockUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
