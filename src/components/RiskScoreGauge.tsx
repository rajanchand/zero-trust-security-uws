import { motion } from 'framer-motion';

export default function RiskScoreGauge({ score }: { score: number }) {
  const color = score <= 30 ? 'hsl(142, 72%, 42%)' : score <= 60 ? 'hsl(38, 92%, 50%)' : 'hsl(0, 72%, 51%)';
  const label = score <= 30 ? 'Low Risk' : score <= 60 ? 'Medium Risk' : 'High Risk';
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(220, 15%, 18%)" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-2xl font-bold font-mono"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="text-sm font-semibold font-mono" style={{ color }}>{label}</span>
    </div>
  );
}
