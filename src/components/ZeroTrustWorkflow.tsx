import { motion } from 'framer-motion';
import { ArrowRight, Radio, BarChart3, ShieldCheck, Lock, FileText } from 'lucide-react';
import { PolicyResult } from '@/lib/zero-trust';

const steps = [
  { label: 'Request', icon: Radio, color: 'text-primary' },
  { label: 'Signals', icon: BarChart3, color: 'text-accent' },
  { label: 'Risk Score', icon: BarChart3, color: 'text-warning' },
  { label: 'Policy', icon: ShieldCheck, color: 'text-primary' },
  { label: 'Enforce', icon: Lock, color: 'text-success' },
  { label: 'Audit', icon: FileText, color: 'text-muted-foreground' },
];

export default function ZeroTrustWorkflow({ result }: { result?: PolicyResult | null }) {
  const decisionColor = result?.decision === 'allow' ? 'text-success' : result?.decision === 'step_up_mfa' ? 'text-warning' : 'text-destructive';

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Zero Trust Workflow</h3>
      <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center gap-2 min-w-[70px]"
            >
              <div className={`w-10 h-10 rounded-full border border-border bg-secondary flex items-center justify-center ${step.color}`}>
                <step.icon className="h-4 w-4" />
              </div>
              <span className="text-xs font-mono text-muted-foreground">{step.label}</span>
            </motion.div>
            {i < steps.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground mx-1 shrink-0" />}
          </div>
        ))}
      </div>
      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 rounded-md bg-secondary border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Decision:</span>
            <span className={`text-sm font-bold font-mono uppercase ${decisionColor}`}>{result.decision.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-muted-foreground">Risk Score:</span>
            <span className="text-sm font-mono font-bold text-foreground">{result.riskScore}/100</span>
          </div>
          {result.reasons.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground">
              {result.reasons.map((r, i) => <div key={i}>• {r}</div>)}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
