import { Shield, Monitor, MapPin, Clock, Cpu, Wifi } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { user, currentDevice, lastPolicyResult, requestDeviceApproval } = useAuth();
  if (!user) return null;

  const decision = lastPolicyResult?.decision;
  const decisionLabel = decision === 'allow' ? 'ALLOWED' : decision === 'step_up_mfa' ? 'STEP-UP MFA' : decision === 'block' ? 'BLOCKED' : 'PENDING';
  const decisionColor = decision === 'allow' ? 'text-green-400' : decision === 'step_up_mfa' ? 'text-yellow-400' : decision === 'block' ? 'text-red-400' : 'text-gray-400';
  const decisionBorder = decision === 'allow' ? 'border-green-500/30' : decision === 'step_up_mfa' ? 'border-yellow-500/30' : decision === 'block' ? 'border-red-500/30' : 'border-border';
  const riskScore = lastPolicyResult?.riskScore ?? 0;
  const riskColor = riskScore <= 30 ? 'text-green-400' : riskScore <= 60 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome, {user.fullName}</p>
        </div>

        {/* Profile Card */}
        <div className="rounded-lg border border-border bg-card p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{user.fullName}</h3>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-muted-foreground">Role:</span> <span className="text-accent">{user.role}</span></div>
            <div><span className="text-muted-foreground">Status:</span> <span className="text-green-400">{user.status}</span></div>
          </div>
        </div>

        {/* Access Decision */}
        {lastPolicyResult && (
          <div className={`rounded-lg border ${decisionBorder} bg-card p-5 mb-6`}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">Access Decision</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground text-xs mb-1">Decision</p>
                <p className={`text-lg font-bold font-mono ${decisionColor}`}>{decisionLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs mb-1">Risk Score</p>
                <p className={`text-lg font-bold font-mono ${riskColor}`}>{riskScore}<span className="text-sm text-muted-foreground">/100</span></p>
              </div>
            </div>

            {/* Signals */}
            <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2"><MapPin className="h-3 w-3" />{lastPolicyResult.signals.city}, {lastPolicyResult.signals.country}</div>
              <div className="flex items-center gap-2"><Monitor className="h-3 w-3" />{lastPolicyResult.signals.browser} / {lastPolicyResult.signals.os}</div>
              <div className="flex items-center gap-2"><Clock className="h-3 w-3" />{new Date(lastPolicyResult.signals.loginTime).toLocaleString()}</div>
              <div className="flex items-center gap-2"><Shield className="h-3 w-3" />IP: {lastPolicyResult.signals.ip}</div>
              <div className="flex items-center gap-2"><Wifi className="h-3 w-3" />ISP: {lastPolicyResult.signals.isp}</div>
            </div>

            {/* Risk Reasons */}
            {lastPolicyResult.reasons.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground mb-1">Risk Factors:</p>
                <ul className="text-xs space-y-1">
                  {lastPolicyResult.reasons.map((r, i) => (
                    <li key={i} className="text-yellow-400">• {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Device Info */}
        {currentDevice && (
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase flex items-center gap-2">
              <Cpu className="h-4 w-4" /> Device Info
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Browser</span><span>{currentDevice.browser}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">OS</span><span>{currentDevice.os}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fingerprint</span><span className="text-xs text-primary font-mono">{currentDevice.fingerprint}</span></div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approved</span>
                  <span className={currentDevice.approved ? 'text-green-400' : 'text-red-400'}>
                    {currentDevice.approved ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Device Posture</p>
                {Object.entries(currentDevice.posture).map(([key, val]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground">{key}</span>
                    <span className={val ? 'text-green-400' : 'text-red-400'}>{val ? '✓' : '✗'}</span>
                  </div>
                ))}
              </div>
            </div>
            {!currentDevice.approved && (
              <Button variant="outline" className="mt-4" onClick={requestDeviceApproval}>Request Device Approval</Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
