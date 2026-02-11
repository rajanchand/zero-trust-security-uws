import { Device } from './demo-data';

export interface SignalData {
  ip: string;
  country: string;
  city: string;
  region: string;
  isp: string;
  timezone: string;
  lat: number;
  lon: number;
  userAgent: string;
  os: string;
  browser: string;
  loginTime: string;
  failedAttempts: number;
  deviceApproved: boolean;
  posture: {
    hasUpdatedOS: boolean;
    hasAV: boolean;
    diskEncrypted: boolean;
    screenLockEnabled: boolean;
  };
}

export type PolicyDecision = 'allow' | 'step_up_mfa' | 'block';

export interface PolicyResult {
  decision: PolicyDecision;
  riskScore: number;
  reasons: string[];
  signals: SignalData;
}

export interface RealIPInfo {
  ip: string;
  country: string;
  city: string;
  region: string;
  isp: string;
  timezone: string;
  lat: number;
  lon: number;
}

let cachedIPInfo: RealIPInfo | null = null;

export async function fetchRealIP(): Promise<RealIPInfo> {
  if (cachedIPInfo) return cachedIPInfo;
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (!res.ok) throw new Error('IP API failed');
    const data = await res.json();
    cachedIPInfo = {
      ip: data.ip || '0.0.0.0',
      country: data.country_name || data.country || 'Unknown',
      city: data.city || 'Unknown',
      region: data.region || '',
      isp: data.org || 'Unknown',
      timezone: data.timezone || '',
      lat: data.latitude || 0,
      lon: data.longitude || 0,
    };
    return cachedIPInfo;
  } catch {
    // Fallback
    cachedIPInfo = { ip: '0.0.0.0', country: 'Unknown', city: 'Unknown', region: '', isp: 'Unknown', timezone: '', lat: 0, lon: 0 };
    return cachedIPInfo;
  }
}

// Synchronous getter after first fetch
export function getCachedIP(): RealIPInfo {
  return cachedIPInfo || { ip: '0.0.0.0', country: 'Unknown', city: 'Unknown', region: '', isp: 'Unknown', timezone: '', lat: 0, lon: 0 };
}

export function getDeviceFingerprint(): string {
  let fp = localStorage.getItem('zt_device_fp');
  if (!fp) {
    fp = 'dev_' + Math.random().toString(36).slice(2, 12);
    localStorage.setItem('zt_device_fp', fp);
  }
  return fp;
}

export function detectOS(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone')) return 'iOS';
  return 'Unknown';
}

export function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  if (ua.includes('Edg')) return 'Edge';
  return 'Unknown';
}

export function getSimulatedPosture(): Device['posture'] {
  return {
    hasUpdatedOS: Math.random() > 0.2,
    hasAV: Math.random() > 0.15,
    diskEncrypted: Math.random() > 0.3,
    screenLockEnabled: Math.random() > 0.1,
  };
}

export function collectSignals(ipInfo: RealIPInfo, failedAttempts: number, deviceApproved: boolean, posture?: Device['posture']): SignalData {
  const p = posture || getSimulatedPosture();
  return {
    ip: ipInfo.ip,
    country: ipInfo.country,
    city: ipInfo.city,
    region: ipInfo.region,
    isp: ipInfo.isp,
    timezone: ipInfo.timezone,
    lat: ipInfo.lat,
    lon: ipInfo.lon,
    userAgent: navigator.userAgent,
    os: detectOS(),
    browser: detectBrowser(),
    loginTime: new Date().toISOString(),
    failedAttempts,
    deviceApproved,
    posture: p,
  };
}

export function computeRiskScore(signals: SignalData): number {
  let score = 0;

  const HIGH_RISK_COUNTRIES = ['Russia', 'China', 'North Korea', 'Iran', 'Syria'];
  if (HIGH_RISK_COUNTRIES.includes(signals.country)) score += 30;

  score += Math.min(signals.failedAttempts * 10, 30);

  if (!signals.deviceApproved) score += 15;

  if (!signals.posture.hasUpdatedOS) score += 8;
  if (!signals.posture.hasAV) score += 10;
  if (!signals.posture.diskEncrypted) score += 7;
  if (!signals.posture.screenLockEnabled) score += 5;

  const hour = new Date(signals.loginTime).getHours();
  if (hour < 6 || hour > 22) score += 10;

  // VPN/proxy detection (simple heuristic based on ISP names)
  const suspiciousISP = ['tor', 'vpn', 'proxy', 'hosting'].some(k => signals.isp.toLowerCase().includes(k));
  if (suspiciousISP) score += 15;

  return Math.min(score, 100);
}

export function evaluatePolicy(riskScore: number): PolicyResult['decision'] {
  if (riskScore <= 30) return 'allow';
  if (riskScore <= 60) return 'step_up_mfa';
  return 'block';
}

export function runZeroTrustCheck(ipInfo: RealIPInfo, failedAttempts: number, deviceApproved: boolean, posture?: Device['posture']): PolicyResult {
  const signals = collectSignals(ipInfo, failedAttempts, deviceApproved, posture);
  const riskScore = computeRiskScore(signals);
  const decision = evaluatePolicy(riskScore);
  
  const reasons: string[] = [];
  if (riskScore > 60) reasons.push('Risk score exceeds threshold');
  if (!signals.deviceApproved) reasons.push('Device not approved');
  if (signals.failedAttempts > 2) reasons.push('Multiple failed login attempts');
  if (!signals.posture.hasAV) reasons.push('No antivirus detected');
  if (!signals.posture.diskEncrypted) reasons.push('Disk not encrypted');
  const HIGH_RISK_COUNTRIES = ['Russia', 'China', 'North Korea', 'Iran', 'Syria'];
  if (HIGH_RISK_COUNTRIES.includes(signals.country)) reasons.push('High-risk location');
  const suspiciousISP = ['tor', 'vpn', 'proxy', 'hosting'].some(k => signals.isp.toLowerCase().includes(k));
  if (suspiciousISP) reasons.push('Suspicious ISP/VPN detected');

  return { decision, riskScore, reasons, signals };
}
