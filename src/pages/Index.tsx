import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';

export default function Index() {
  return (
    <div className="min-h-screen bg-background grid-bg flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-mono text-primary">Zero Trust Security</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6">
              <span className="text-foreground">Never Trust.</span><br />
              <span className="text-gradient">Always Verify.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Secure access with identity verification, device trust, and risk-based policy decisions.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="gap-2 gradient-primary border-0 text-primary-foreground px-8 h-12 text-base font-semibold">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg" className="gap-2 h-12 text-base border-border">Sign In</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Zero Trust Security
      </footer>
    </div>
  );
}
