import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Monitor, CheckCircle, XCircle, Unlock } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { DemoUser, Device, Role, getAuditLogs, AuditLog } from '@/lib/demo-data';
import { useToast } from '@/hooks/use-toast';

export default function Admin() {
  const { getAllUsers, updateUserRole, toggleUserStatus, approveDevice, denyDevice, getAllDevices, user, unlockUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [tab, setTab] = useState<'users' | 'devices' | 'logs'>('users');

  const refresh = () => { setUsers(getAllUsers()); setDevices(getAllDevices()); setLogs(getAuditLogs().slice(0, 50)); };
  useEffect(refresh, [getAllUsers, getAllDevices]);

  const handleRoleChange = (userId: string, role: string) => {
    if (role === 'SUPERADMIN' && user?.role !== 'SUPERADMIN') {
      toast({ title: 'Denied', description: 'Only SuperAdmin can assign SuperAdmin role', variant: 'destructive' });
      return;
    }
    updateUserRole(userId, role as Role); refresh(); toast({ title: 'Role Updated' });
  };

  const handleToggle = (userId: string) => { toggleUserStatus(userId); refresh(); };
  const handleUnlock = (userId: string) => { unlockUser(userId); refresh(); toast({ title: 'Account Unlocked' }); };
  const handleApprove = (id: string) => { approveDevice(id); refresh(); toast({ title: 'Device Approved' }); };
  const handleDeny = (id: string) => { denyDevice(id); refresh(); toast({ title: 'Device Denied' }); };

  const tabs = [
    { key: 'users' as const, label: 'Users', icon: Users },
    { key: 'devices' as const, label: 'Devices', icon: Monitor },
    { key: 'logs' as const, label: 'Audit Logs', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Admin Panel</h1>
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(t => (
            <Button key={t.key} variant={tab === t.key ? 'default' : 'ghost'} size="sm" onClick={() => { setTab(t.key); refresh(); }} className="gap-2">
              <t.icon className="h-4 w-4" />{t.label}
            </Button>
          ))}
        </div>

        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/30 text-muted-foreground">
                <th className="p-3 text-left">Name</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Role</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Actions</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="p-3 text-foreground">{u.fullName}</td>
                    <td className="p-3 font-mono text-primary text-xs">{u.email}</td>
                    <td className="p-3">
                      <Select value={u.role} onValueChange={v => handleRoleChange(u.id, v)}>
                        <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{['USER','ADMIN','IT','SUPERADMIN'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      <span className={`font-mono text-xs ${u.status === 'active' ? 'text-success' : u.status === 'locked' ? 'text-warning' : 'text-destructive'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="p-3 flex gap-1">
                      {u.status === 'locked' ? (
                        <Button variant="outline" size="sm" onClick={() => handleUnlock(u.id)} className="gap-1">
                          <Unlock className="h-3 w-3" /> Unlock
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleToggle(u.id)}>
                          {u.status === 'active' ? 'Disable' : 'Enable'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {tab === 'devices' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/30 text-muted-foreground">
                <th className="p-3 text-left">User</th><th className="p-3 text-left">Browser/OS</th><th className="p-3 text-left">Fingerprint</th><th className="p-3 text-left">Posture</th><th className="p-3 text-left">Approved</th><th className="p-3 text-left">Actions</th>
              </tr></thead>
              <tbody>
                {devices.map(d => {
                  const owner = users.find(u => u.id === d.userId);
                  const postureScore = [d.posture.hasUpdatedOS, d.posture.hasAV, d.posture.diskEncrypted, d.posture.screenLockEnabled].filter(Boolean).length;
                  return (
                    <tr key={d.id} className="border-b border-border last:border-0">
                      <td className="p-3 text-foreground">{owner?.fullName || d.userId}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{d.browser} / {d.os}</td>
                      <td className="p-3 font-mono text-xs text-primary">{d.fingerprint}</td>
                      <td className="p-3"><span className={`font-mono text-xs ${postureScore >= 3 ? 'text-success' : postureScore >= 2 ? 'text-warning' : 'text-destructive'}`}>{postureScore}/4</span></td>
                      <td className="p-3">{d.approved ? <CheckCircle className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}</td>
                      <td className="p-3 flex gap-2">
                        {!d.approved && <Button size="sm" variant="outline" onClick={() => handleApprove(d.id)}>Approve</Button>}
                        <Button size="sm" variant="ghost" onClick={() => handleDeny(d.id)} className="text-destructive">Deny</Button>
                      </td>
                    </tr>
                  );
                })}
                {devices.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No devices</td></tr>}
              </tbody>
            </table>
          </motion.div>
        )}

        {tab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/30 text-muted-foreground">
                <th className="p-3 text-left">Time</th><th className="p-3 text-left">User</th><th className="p-3 text-left">Action</th><th className="p-3 text-left">Risk</th><th className="p-3 text-left">Outcome</th><th className="p-3 text-left">Location</th>
              </tr></thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b border-border last:border-0 text-xs">
                    <td className="p-3 font-mono text-muted-foreground whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-primary font-mono">{l.userEmail || l.userId}</td>
                    <td className="p-3 text-foreground font-semibold">{l.action}</td>
                    <td className="p-3 font-mono">{l.riskScore ?? '—'}</td>
                    <td className="p-3"><span className={`font-mono ${l.outcome === 'success' ? 'text-success' : l.outcome === 'blocked' ? 'text-destructive' : 'text-warning'}`}>{l.outcome}</span></td>
                    <td className="p-3 text-muted-foreground">{l.location}</td>
                  </tr>
                ))}
                {logs.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No logs</td></tr>}
              </tbody>
            </table>
          </motion.div>
        )}
      </div>
    </div>
  );
}
