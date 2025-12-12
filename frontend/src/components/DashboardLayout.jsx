import { motion } from 'framer-motion';
import { LayoutDashboard, Settings, Filter, Activity, PieChart, TrendingUp, Cpu } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({ children, filters, setFilters, initData, onRunFilter }) {
  const [isOpen, setIsOpen] = useState(true);

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  return (
    <div className="min-h-screen bg-background flex font-sans text-slate-900">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="w-72 bg-white border-r border-slate-200 fixed h-full z-10 overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            CCTI Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">Advanced SEC Filing Analysis</p>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="flex items-center text-sm font-semibold text-slate-900 mb-3">
              <Filter className="w-4 h-4 mr-2" /> Global Filters
            </h3>
            
            <div className="space-y-4">
              {/* Date Range */}
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Start Date</label>
                <input 
                  type="date" 
                  className="w-full text-sm border rounded-md p-2 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={filters.start_date || ''}
                  onChange={e => handleFilterChange('start_date', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 mb-1 block">End Date</label>
                <input 
                  type="date" 
                  className="w-full text-sm border rounded-md p-2 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={filters.end_date || ''}
                  onChange={e => handleFilterChange('end_date', e.target.value)}
                />
              </div>

              {/* SIC - Simple Select for MVP (Could be MultiSelect) */}
              <div>
                 <label className="text-xs text-slate-500 mb-1 block">Industry (SIC)</label>
                 <select 
                   multiple
                   className="w-full h-32 text-xs border rounded-md p-2 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                   onChange={e => {
                     const options = Array.from(e.target.selectedOptions, option => parseFloat(option.value));
                     handleFilterChange('sics', options.length > 0 ? options : null);
                   }}
                 >
                   {initData?.sics?.map(sic => (
                     <option key={sic} value={sic}>{sic}</option>
                   ))}
                 </select>
                 <span className="text-[10px] text-slate-400">Ctrl+Click to select multiple</span>
              </div>

              {/* Form Type */}
              <div>
                 <label className="text-xs text-slate-500 mb-1 block">Form Type</label>
                 <select 
                   multiple
                   className="w-full h-24 text-xs border rounded-md p-2 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                   onChange={e => {
                     const options = Array.from(e.target.selectedOptions, option => option.value);
                     handleFilterChange('forms', options.length > 0 ? options : null);
                   }}
                 >
                   {initData?.forms?.map(f => (
                     <option key={f} value={f}>{f}</option>
                   ))}
                 </select>
              </div>

               {/* Market Condition */}
               <div>
                  <label className="text-xs text-slate-500 mb-1 block">Market Condition</label>
                  <div className="flex gap-2">
                    {[0, 1].map(cond => (
                      <label key={cond} className="flex items-center text-xs cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mr-1 accent-blue-600"
                          checked={filters.market_conditions?.includes(cond)}
                          onChange={e => {
                             const current = filters.market_conditions || [];
                             const next = e.target.checked 
                               ? [...current, cond]
                               : current.filter(c => c !== cond);
                             handleFilterChange('market_conditions', next.length ? next : null);
                          }}
                        /> 
                        {cond === 0 ? 'Expansion' : 'Recession'}
                      </label>
                    ))}
                  </div>
               </div>

              <button 
                onClick={onRunFilter}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="ml-72 flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Executive Dashboard</h2>
            <p className="text-slate-500">Real-time analysis of filing complexity and market impact.</p>
          </div>
        </header>

        <div className="space-y-8">
           {children}
        </div>
      </main>
    </div>
  );
}
