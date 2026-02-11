import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AccessDenied() {
  const blocked = JSON.parse(localStorage.getItem('zt_blocked') || '{}');
  const reasons: string[] = blocked.reasons || ['Access denied by security policy'];
  const riskScore: number = blocked.riskScore || 100;
  const signals = blocked.signals;

  const riskColor = riskScore <= 30 ? 'text-success' : riskScore <= 60 ? 'text-warning' : 'text-destructive';

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg text-center">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>

        <h1 className="text-3xl font-black text-foreground mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">Your access request was blocked by the Zero Trust Policy Engine</p>

        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-left space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Risk Score</span>
            <span className={`text-2xl font-bold font-mono ${riskColor}`}>{riskScore}/100</span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              Block Reasons
            </div>
            <ul className="space-y-1">
              {reasons.map((r, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span>{r}
                </li>
              ))}
            </ul>
          </div>

          {signals && (
            <div className="border-t border-border pt-3 space-y-1 text-xs text-muted-foreground">
              <div>IP: <span className="font-mono text-foreground">{signals.ip}</span></div>
              <div>Location: <span className="font-mono text-foreground">{signals.city}, {signals.country}</span></div>
              <div>ISP: <span className="font-mono text-foreground">{signals.isp}</span></div>
              <div>Browser: <span className="font-mono text-foreground">{signals.browser} / {signals.os}</span></div>
              <div>Time: <span className="font-mono text-foreground">{new Date(signals.loginTime).toLocaleString()}</span></div>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">
            Contact your administrator if you believe this is an error.
          </p>
          <Link to="/login">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Login
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
