import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, LogOut, LayoutDashboard, Users, ShieldCheck, Monitor, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, isAuthenticated, logout, hasRole } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['USER', 'ADMIN', 'SUPERADMIN', 'IT'] as const },
    { to: '/admin', label: 'Admin', icon: Users, roles: ['ADMIN', 'SUPERADMIN'] as const },
    { to: '/superadmin', label: 'Super Admin', icon: ShieldCheck, roles: ['SUPERADMIN'] as const },
    { to: '/it', label: 'IT Security', icon: Monitor, roles: ['IT', 'SUPERADMIN'] as const },
  ];

  const visibleItems = navItems.filter(item => hasRole([...item.roles]));

  return (
    <nav className="border-b border-border glass sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-14 md:h-16 px-4">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2">
          <Shield className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          <span className="text-base md:text-lg font-bold text-gradient">Zero Trust</span>
        </Link>

        {/* Desktop nav */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center gap-1">
            {visibleItems.map(item => (
              <Link key={item.to} to={item.to}>
                <Button variant={location.pathname === item.to ? 'default' : 'ghost'} size="sm" className="gap-2">
                  <item.icon className="h-4 w-4" />{item.label}
                </Button>
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <div className="hidden sm:flex flex-col items-end text-sm">
                <span className="font-medium text-foreground">{user.fullName}</span>
                <span className="text-xs text-muted-foreground font-mono">{user.role}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}><LogOut className="h-4 w-4" /></Button>
              {/* Mobile hamburger */}
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setOpen(!open)}>
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Link to="/login"><Button variant="ghost" size="sm">Sign In</Button></Link>
              <Link to="/register"><Button size="sm">Sign Up</Button></Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && isAuthenticated && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {user && (
                <div className="sm:hidden pb-3 mb-2 border-b border-border">
                  <div className="font-medium text-foreground text-sm">{user.fullName}</div>
                  <div className="text-xs text-muted-foreground font-mono">{user.role}</div>
                </div>
              )}
              {visibleItems.map(item => (
                <Link key={item.to} to={item.to} onClick={() => setOpen(false)}>
                  <Button
                    variant={location.pathname === item.to ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start gap-3"
                  >
                    <item.icon className="h-4 w-4" />{item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
