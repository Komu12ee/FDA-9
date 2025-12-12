import { motion } from 'framer-motion';

export default function MetricCard({ title, value, subtext, delay = 0 }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-6 flex flex-col justify-between h-32"
    >
      <h3 className="text-secondary text-sm font-medium uppercase tracking-wider">{title}</h3>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-slate-800">{value}</span>
      </div>
      {subtext && <span className="text-xs text-slate-500">{subtext}</span>}
    </motion.div>
  );
}
