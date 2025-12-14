import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, TrendingUp, Search } from 'lucide-react';
import axios from 'axios';

export default function PredictionSimulator() {
  const [inputs, setInputs] = useState({
    CCTI: -1.9,
    Vol_30d: 0.05,
    Momentum_12_1: 0.1,
    BM_w: 0.5,
    Size_w: 5.0,
    Negative: 100,
    Positive: 50
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (key, val) => {
    setInputs(prev => ({ ...prev, [key]: val }));
  };

  const runPrediction = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await axios.post(`${API_URL}/api/predict`, inputs);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      className="glass-card p-6 mt-8 border-t-4 border-t-blue-500"
    >
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">ML Prediction Simulator</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Controls */}
        <div className="md:col-span-2 grid grid-cols-2 gap-6">
          <Slider label="CCTI (Complexity)" value={inputs.CCTI} min={-5} max={5} step={0.1} onChange={v => handleChange('CCTI', v)} />
          <Slider label="Volatility (30d)" value={inputs.Vol_30d} min={0} max={0.2} step={0.001} onChange={v => handleChange('Vol_30d', v)} />
          <Slider label="Momentum" value={inputs.Momentum_12_1} min={-1} max={1} step={0.01} onChange={v => handleChange('Momentum_12_1', v)} />
          <Slider label="Book-to-Market" value={inputs.BM_w} min={0} max={2} step={0.1} onChange={v => handleChange('BM_w', v)} />
          <Slider label="Size" value={inputs.Size_w} min={0} max={15} step={0.5} onChange={v => handleChange('Size_w', v)} />
          <Slider label="Negative Words" value={inputs.Negative} min={0} max={2000} step={10} onChange={v => handleChange('Negative', v)} />
          <Slider label="Positive Words" value={inputs.Positive} min={0} max={2000} step={10} onChange={v => handleChange('Positive', v)} />

          <div className="flex items-end">
            <button
              onClick={runPrediction}
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Calculating...' : <><Play className="w-4 h-4" /> Simulate Return</>}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
          {!result ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ActivityIcon />
              <p className="mt-2 text-sm">Run simulation to see results</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Expected Excess Return</p>
                <p className={`text-4xl font-bold mt-2 ${result.predicted_excess_return >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(result.predicted_excess_return).toFixed(2)}%
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-900 uppercase flex items-center gap-2">
                  <Search className="w-3 h-3" /> Similar Historical Filings
                </h4>
                {result.similar_filings.map((f, i) => (
                  <div key={i} className="text-xs bg-white p-2 rounded border border-slate-100 shadow-sm flex justify-between">
                    <div className="truncate w-32 font-medium" title={f.CoName}>{f.CoName}</div>
                    <div className="text-slate-500">{f.FILING_DATE}</div>
                    <div className={`${f.ExcessRet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(f.ExcessRet).toFixed(2)}%
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Slider({ label, value, min, max, step, onChange }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-xs font-medium text-slate-700">{label}</label>
        <span className="text-xs text-slate-500">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
    </div>
  );
}

function ActivityIcon() {
  return (
    <svg className="w-10 h-10 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
  );
}
