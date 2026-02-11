import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, Phone, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showChannelPicker, setShowChannelPicker] = useState(false);
  const { login, sendLoginOTP } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const result = login(email.trim(), password);
      setLoading(false);
      if (!result.success) {
        toast({ title: 'Login Failed', description: result.error, variant: 'destructive' });
        return;
      }
      if (result.needsChannel) {
        setShowChannelPicker(true);
      }
    }, 600);
  };

  const handleChannelSelect = (channel: 'email' | 'mobile') => {
    const result = sendLoginOTP(channel);
    if (result.success) {
      toast({ title: '📧 OTP Sent', description: `Your ${channel} OTP is: ${result.otp}` });
      navigate('/verify-otp');
    }
  };

  return (
    <div className="min-h-screen bg-background grid-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-gradient">Zero Trust</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Sign In</h1>
          <p className="text-sm text-muted-foreground mt-1">Verify your identity to continue</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          {!showChannelPicker ? (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="user@demo.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 pr-10" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary border-0 text-primary-foreground" disabled={loading}>
                  {loading ? 'Verifying Identity...' : 'Sign In'}
                </Button>
              </form>

              <div className="mt-4 p-3 rounded-md bg-secondary/50 border border-border">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-warning shrink-0" />
                  <span>Account locks after 5 failed attempts. Rate limiting is active.</span>
                </div>
              </div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="text-center">
                <Shield className="h-10 w-10 text-primary mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-foreground">Multi-Factor Authentication</h3>
                <p className="text-sm text-muted-foreground mt-1">Choose how to receive your OTP</p>
              </div>
              <Button onClick={() => handleChannelSelect('email')} variant="outline" className="w-full h-14 justify-start gap-4 border-border hover:border-primary/50">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">Email OTP</div>
                  <div className="text-xs text-muted-foreground">Send code to your email</div>
                </div>
              </Button>
              <Button onClick={() => handleChannelSelect('mobile')} variant="outline" className="w-full h-14 justify-start gap-4 border-border hover:border-primary/50">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-accent" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">SMS OTP</div>
                  <div className="text-xs text-muted-foreground">Send code to your mobile</div>
                </div>
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setShowChannelPicker(false)}>
                ← Back to login
              </Button>
            </motion.div>
          )}

          <p className="text-sm text-muted-foreground text-center mt-4">
            Don't have an account? <Link to="/register" className="text-primary hover:underline">Sign Up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
