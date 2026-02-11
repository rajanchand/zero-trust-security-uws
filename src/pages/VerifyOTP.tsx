import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export default function VerifyOTP() {
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(300);
  const [loading, setLoading] = useState(false);
  const { pendingOTP, verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!pendingOTP) { navigate('/login'); return; }
    const t = setInterval(() => setCountdown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [pendingOTP, navigate]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    setTimeout(() => {
      const result = verifyOTP(otp);
      setLoading(false);
      if (!result.success) {
        toast({ title: 'Verification Failed', description: result.error, variant: 'destructive' });
        return;
      }
      if (result.error === 'ACCESS_BLOCKED') {
        navigate('/access-denied');
        return;
      }
      toast({ title: '✅ Identity Verified', description: 'Zero Trust check passed. Access granted.' });
      navigate('/dashboard');
    }, 500);
  };

  const handleResend = () => {
    const result = resendOTP();
    if (result.success) {
      setCountdown(300);
      setOtp('');
      toast({ title: '📧 OTP Resent', description: `Your new code is: ${result.otp}` });
    }
  };

  const mins = Math.floor(countdown / 60);
  const secs = countdown % 60;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">OTP Verification</h1>
        <p className="text-sm text-muted-foreground mb-2">
          {pendingOTP?.type === 'registration'
            ? 'Enter the 6-digit code sent to your email & mobile'
            : 'Enter the 6-digit verification code'}
        </p>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="h-3.5 w-3.5 text-primary" />
              <span>{pendingOTP?.email}</span>
            </div>
            {pendingOTP?.type === 'registration' && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-accent" />
                <span>{pendingOTP?.mobile}</span>
              </div>
            )}
          </div>

          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              type="text" inputMode="numeric" maxLength={6} placeholder="000000"
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-[0.5em] font-mono h-14" required autoFocus
            />
            <div className="flex items-center justify-center gap-3">
              <div className={`text-sm ${countdown <= 60 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {countdown > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : 'Expired'}
              </div>
              <span className="text-muted-foreground">·</span>
              <div className="text-xs text-muted-foreground">5 min expiry</div>
            </div>

            <div className="w-full bg-secondary rounded-full h-1">
              <div
                className="h-1 rounded-full bg-primary transition-all duration-1000"
                style={{ width: `${(countdown / 300) * 100}%` }}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || countdown === 0 || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </Button>
          </form>
          <Button variant="ghost" className="mt-3 text-primary" onClick={handleResend} disabled={countdown > 270}>
            Resend OTP {countdown > 270 ? `(${countdown - 270}s)` : ''}
          </Button>
          <p className="text-xs text-muted-foreground mt-4">OTP is shown in toast notification above</p>
        </div>
      </div>
    </div>
  );
}
