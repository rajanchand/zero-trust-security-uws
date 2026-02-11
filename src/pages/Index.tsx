import { Link } from 'react-router-dom';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

export default function Index() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <section className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-sm text-primary font-medium">Zero Trust Security</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Never Trust. Always Verify.
          </h1>

          <p className="text-muted-foreground mb-8">
            Secure access with identity verification, device trust, and risk-based policy decisions.
          </p>

          <div className="flex items-center justify-center gap-3">
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Zero Trust Security — Rajan Chand
      </footer>
    </div>
  );
}
