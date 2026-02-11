import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Shield, AlertTriangle, CheckCircle, XCircle, Activity, TrendingUp, Lock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuditLogs, AuditLog } from '@/lib/demo-data';
import RiskScoreGauge from '@/components/RiskScoreGauge';

export default function ITDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filter, setFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  useEffect(() => { setLogs(getAuditLogs()); }, []);

  const filtered = useMemo(() => logs.filter(l => {
    const matchText = !filter || l.action.toLowerCase().includes(filter.toLowerCase()) ||
      l.userEmail.toLowerCase().includes(filter.toLowerCase()) ||
      l.details.toLowerCase().includes(filter.toLowerCase());
    const matchOutcome = outcomeFilter === 'all' || l.outcome === outcomeFilter;
    return matchText && matchOutcome;
  }), [logs, filter, outcomeFilter]);

  const stats = useMemo(() => {
    const withRisk = logs.filter(l => l.riskScore !== undefined);
    return {
      total: logs.length,
      success: logs.filter(l => l.outcome === 'success').length,
      failures: logs.filter(l => l.outcome === 'failure').length,
      blocked: logs.filter(l => l.outcome === 'blocked').length,
      avgRisk: withRisk.length > 0 ? Math.round(withRisk.reduce((a, l) => a + (l.riskScore || 0), 0) / withRisk.length) : 0,
      loginFails: logs.filter(l => l.action === 'LOGIN_FAIL').length,
      otpFails: logs.filter(l => l.action === 'OTP_FAIL').length,
      lockedAccounts: logs.filter(l => l.action === 'ACCOUNT_LOCKED').length,
      newDevices: logs.filter(l => l.action === 'NEW_DEVICE').length,
      policyBlocks: logs.filter(l => l.action === 'ACCESS_BLOCKED').length,
    };
  }, [logs]);

  // Suspicious logins = logins from unusual IPs or blocked
  const suspiciousLogs = useMemo(() =>
    logs.filter(l => l.outcome === 'blocked' || l.action === 'ACCOUNT_LOCKED' || l.action === 'ACCESS_BLOCKED' || (l.riskScore && l.riskScore > 50)),
  [logs]);

  const statCards = [
    { label: 'Total Events', value: stats.total, icon: Shield, color: 'text-primary' },
    { label: 'Successful', value: stats.success, icon: CheckCircle, color: 'text-success' },
    { label: 'Failed', value: stats.failures, icon: AlertTriangle, color: 'text-warning' },
    { label: 'Blocked', value: stats.blocked, icon: XCircle, color: 'text-destructive' },
  ];

  const securityMetrics = [
    { label: 'Login Failures', value: stats.loginFails, icon: AlertTriangle, color: 'text-warning' },
    { label: 'OTP Failures', value: stats.otpFails, icon: Lock, color: 'text-warning' },
    { label: 'Accounts Locked', value: stats.lockedAccounts, icon: XCircle, color: 'text-destructive' },
    { label: 'New Devices', value: stats.newDevices, icon: Monitor, color: 'text-accent' },
    { label: 'Policy Blocks', value: stats.policyBlocks, icon: Shield, color: 'text-destructive' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Monitor className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">IT Security Dashboard</h1>
            <p className="text-sm text-muted-foreground">Zero Trust monitoring & analytics</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <div className="text-2xl md:text-3xl font-bold font-mono text-foreground mt-2">{s.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Risk Score + Security Metrics */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card p-6 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Avg Risk Score</h3>
            <RiskScoreGauge score={stats.avgRisk} />
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2 rounded-lg border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Security Metrics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {securityMetrics.map(m => (
                <div key={m.label} className="rounded-md bg-secondary/50 p-3 text-center">
                  <m.icon className={`h-5 w-5 ${m.color} mx-auto mb-1`} />
                  <div className="text-xl font-bold font-mono text-foreground">{m.value}</div>
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Suspicious Activity */}
        {suspiciousLogs.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 mb-6">
            <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Suspicious Activity Alerts ({suspiciousLogs.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {suspiciousLogs.slice(0, 10).map(l => (
                <div key={l.id} className="flex items-center gap-3 text-xs">
                  <span className="font-mono text-muted-foreground whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</span>
                  <span className="text-primary font-mono">{l.userEmail || '—'}</span>
                  <span className="font-semibold text-foreground">{l.action}</span>
                  <span className={`font-mono ${l.outcome === 'blocked' ? 'text-destructive' : 'text-warning'}`}>{l.outcome}</span>
                  {l.riskScore !== undefined && <span className="font-mono text-muted-foreground">Risk: {l.riskScore}</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Input placeholder="Search logs..." value={filter} onChange={e => setFilter(e.target.value)} className="sm:flex-1" />
          <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Outcome" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failure">Failure</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Logs Table */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/30 text-muted-foreground">
              <th className="p-3 text-left">Time</th><th className="p-3 text-left">User</th><th className="p-3 text-left">Action</th><th className="p-3 text-left">Details</th><th className="p-3 text-left">Risk</th><th className="p-3 text-left">Outcome</th><th className="p-3 text-left">IP</th><th className="p-3 text-left">Location</th>
            </tr></thead>
            <tbody>
              {filtered.slice(0, 100).map(l => (
                <tr key={l.id} className="border-b border-border last:border-0 text-xs">
                  <td className="p-3 font-mono text-muted-foreground whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                  <td className="p-3 text-primary font-mono">{l.userEmail || '—'}</td>
                  <td className="p-3 text-foreground font-semibold">{l.action}</td>
                  <td className="p-3 text-muted-foreground max-w-[250px] truncate" title={l.details}>{l.details}</td>
                  <td className="p-3 font-mono">
                    {l.riskScore !== undefined ? (
                      <span className={l.riskScore <= 30 ? 'text-success' : l.riskScore <= 60 ? 'text-warning' : 'text-destructive'}>{l.riskScore}</span>
                    ) : '—'}
                  </td>
                  <td className="p-3"><span className={`font-mono ${l.outcome === 'success' ? 'text-success' : l.outcome === 'blocked' ? 'text-destructive' : 'text-warning'}`}>{l.outcome}</span></td>
                  <td className="p-3 font-mono text-muted-foreground">{l.ip}</td>
                  <td className="p-3 text-muted-foreground">{l.location}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No logs found</td></tr>}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
}
