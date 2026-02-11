import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Trash2, UserPlus, Pencil, X, Check, Monitor, FileText, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { DemoUser, Role, Device, getAuditLogs, AuditLog } from '@/lib/demo-data';
import { useToast } from '@/hooks/use-toast';

export default function SuperAdmin() {
  const { getAllUsers, addUser, updateUser, updateUserRole, toggleUserStatus, deleteUser, approveDevice, denyDevice, getAllDevices } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [tab, setTab] = useState<'users' | 'devices' | 'logs'>('users');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<DemoUser>>({});
  const [newUser, setNewUser] = useState({ fullName: '', email: '', mobile: '', password: '', role: 'USER' as Role });
  const [logFilter, setLogFilter] = useState('');

  const refresh = () => {
    setUsers(getAllUsers());
    setDevices(getAllDevices());
    setLogs(getAuditLogs().slice(0, 100));
  };
  useEffect(refresh, [getAllUsers, getAllDevices]);

  const handleAddUser = () => {
    if (!newUser.fullName || !newUser.email || !newUser.password) {
      toast({ title: 'Error', description: 'Fill all required fields', variant: 'destructive' });
      return;
    }
    const result = addUser(newUser);
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
      return;
    }
    toast({ title: 'User Created' });
    setNewUser({ fullName: '', email: '', mobile: '', password: '', role: 'USER' });
    setShowAddUser(false);
    refresh();
  };

  const startEdit = (u: DemoUser) => {
    setEditingId(u.id);
    setEditForm({ fullName: u.fullName, email: u.email, mobile: u.mobile, role: u.role });
  };

  const saveEdit = (id: string) => {
    updateUser(id, editForm);
    setEditingId(null);
    refresh();
    toast({ title: 'User Updated' });
  };

  const handleDelete = (id: string) => { deleteUser(id); refresh(); toast({ title: 'User Deleted' }); };
  const handleToggle = (id: string) => { toggleUserStatus(id); refresh(); };
  const handleApprove = (id: string) => { approveDevice(id); refresh(); toast({ title: 'Device Approved' }); };
  const handleDeny = (id: string) => { denyDevice(id); refresh(); toast({ title: 'Device Denied' }); };

  const filteredLogs = logs.filter(l =>
    !logFilter || l.action.toLowerCase().includes(logFilter.toLowerCase()) ||
    l.userEmail.toLowerCase().includes(logFilter.toLowerCase())
  );

  const tabs = [
    { key: 'users' as const, label: 'Users', icon: Users },
    { key: 'devices' as const, label: 'Devices', icon: Monitor },
    { key: 'logs' as const, label: 'Audit Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Super Admin</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">Full access: create, edit, delete users, manage devices, view all logs.</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(t => (
            <Button key={t.key} variant={tab === t.key ? 'default' : 'ghost'} size="sm" onClick={() => { setTab(t.key); refresh(); }} className="gap-2">
              <t.icon className="h-4 w-4" />{t.label}
            </Button>
          ))}
        </div>

        {/* USERS TAB */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex justify-end mb-4">
              <Button size="sm" className="gap-2 gradient-primary border-0 text-primary-foreground" onClick={() => setShowAddUser(!showAddUser)}>
                <UserPlus className="h-4 w-4" />{showAddUser ? 'Cancel' : 'Add User'}
              </Button>
            </div>

            {showAddUser && (
              <div className="rounded-lg border border-primary/30 bg-card p-4 mb-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Create New User</h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div><Label className="text-xs">Full Name *</Label><Input value={newUser.fullName} onChange={e => setNewUser(n => ({ ...n, fullName: e.target.value }))} placeholder="John Doe" className="mt-1" /></div>
                  <div><Label className="text-xs">Email *</Label><Input type="email" value={newUser.email} onChange={e => setNewUser(n => ({ ...n, email: e.target.value }))} placeholder="john@example.com" className="mt-1" /></div>
                  <div><Label className="text-xs">Mobile</Label><Input value={newUser.mobile} onChange={e => setNewUser(n => ({ ...n, mobile: e.target.value }))} placeholder="+1234567890" className="mt-1" /></div>
                  <div><Label className="text-xs">Password *</Label><Input type="password" value={newUser.password} onChange={e => setNewUser(n => ({ ...n, password: e.target.value }))} placeholder="••••••••" className="mt-1" /></div>
                  <div>
                    <Label className="text-xs">Role</Label>
                    <Select value={newUser.role} onValueChange={v => setNewUser(n => ({ ...n, role: v as Role }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{['USER','ADMIN','IT','SUPERADMIN'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddUser} className="gradient-primary border-0 text-primary-foreground w-full">Create User</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-secondary/30 text-muted-foreground">
                  <th className="p-3 text-left">Name</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Mobile</th><th className="p-3 text-left">Role</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Actions</th>
                </tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      {editingId === u.id ? (
                        <>
                          <td className="p-2"><Input value={editForm.fullName || ''} onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))} className="h-8" /></td>
                          <td className="p-2"><Input value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className="h-8" /></td>
                          <td className="p-2"><Input value={editForm.mobile || ''} onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value }))} className="h-8" /></td>
                          <td className="p-2">
                            <Select value={editForm.role || 'USER'} onValueChange={v => setEditForm(f => ({ ...f, role: v as Role }))}>
                              <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>{['USER','ADMIN','IT','SUPERADMIN'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className="p-2"><span className={`font-mono text-xs ${u.status === 'active' ? 'text-success' : 'text-destructive'}`}>{u.status}</span></td>
                          <td className="p-2 flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => saveEdit(u.id)}><Check className="h-4 w-4 text-success" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-destructive" /></Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 text-foreground">{u.fullName}</td>
                          <td className="p-3 font-mono text-primary text-xs">{u.email}</td>
                          <td className="p-3 font-mono text-xs text-muted-foreground">{u.mobile}</td>
                          <td className="p-3"><span className="font-mono text-xs text-accent">{u.role}</span></td>
                          <td className="p-3"><span className={`font-mono text-xs ${u.status === 'active' ? 'text-success' : 'text-destructive'}`}>{u.status}</span></td>
                          <td className="p-3 flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => startEdit(u)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleToggle(u.id)} title={u.status === 'active' ? 'Disable' : 'Enable'}>
                              {u.status === 'active' ? 'Disable' : 'Enable'}
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)} className="text-destructive" title="Delete"><Trash2 className="h-4 w-4" /></Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* DEVICES TAB */}
        {tab === 'devices' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/30 text-muted-foreground">
                <th className="p-3 text-left">User</th><th className="p-3 text-left">Browser/OS</th><th className="p-3 text-left">Fingerprint</th><th className="p-3 text-left">Approved</th><th className="p-3 text-left">Actions</th>
              </tr></thead>
              <tbody>
                {devices.map(d => {
                  const owner = users.find(u => u.id === d.userId);
                  return (
                    <tr key={d.id} className="border-b border-border last:border-0">
                      <td className="p-3 text-foreground">{owner?.fullName || d.userId}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{d.browser} / {d.os}</td>
                      <td className="p-3 font-mono text-xs text-primary">{d.fingerprint}</td>
                      <td className="p-3"><span className={`font-mono text-xs ${d.approved ? 'text-success' : 'text-destructive'}`}>{d.approved ? 'Yes' : 'No'}</span></td>
                      <td className="p-3 flex gap-2">
                        {!d.approved && <Button size="sm" variant="outline" onClick={() => handleApprove(d.id)}>Approve</Button>}
                        <Button size="sm" variant="ghost" onClick={() => handleDeny(d.id)} className="text-destructive">Remove</Button>
                      </td>
                    </tr>
                  );
                })}
                {devices.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No devices</td></tr>}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* LOGS TAB */}
        {tab === 'logs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Input placeholder="Filter logs..." value={logFilter} onChange={e => setLogFilter(e.target.value)} className="mb-4" />
            <div className="rounded-lg border border-border bg-card overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-secondary/30 text-muted-foreground">
                  <th className="p-3 text-left">Time</th><th className="p-3 text-left">User</th><th className="p-3 text-left">Action</th><th className="p-3 text-left">Details</th><th className="p-3 text-left">Risk</th><th className="p-3 text-left">IP</th><th className="p-3 text-left">Location</th><th className="p-3 text-left">Outcome</th>
                </tr></thead>
                <tbody>
                  {filteredLogs.map(l => (
                    <tr key={l.id} className="border-b border-border last:border-0 text-xs">
                      <td className="p-3 font-mono text-muted-foreground whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
                      <td className="p-3 text-primary font-mono">{l.userEmail || '—'}</td>
                      <td className="p-3 text-foreground font-semibold">{l.action}</td>
                      <td className="p-3 text-muted-foreground max-w-[200px] truncate">{l.details}</td>
                      <td className="p-3 font-mono">{l.riskScore ?? '—'}</td>
                      <td className="p-3 font-mono text-muted-foreground">{l.ip}</td>
                      <td className="p-3 text-muted-foreground">{l.location}</td>
                      <td className="p-3"><span className={`font-mono ${l.outcome === 'success' ? 'text-success' : l.outcome === 'blocked' ? 'text-destructive' : 'text-warning'}`}>{l.outcome}</span></td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No logs</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
