import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Settings, Filter, Activity, PieChart, TrendingUp, Cpu, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function DashboardLayout({ children, filters, setFilters, initData, onRunFilter }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleFilterChange = (key, val) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  // Close mobile menu when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background flex font-sans text-slate-900 overflow-x-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30 flex items-center justify-between px-4">
        <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          CCTI Analytics
        </h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-md hover:bg-slate-100 text-slate-600"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Desktop: user fixed, Mobile: use transform */}
      <aside
        className={`
            fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 overflow-y-auto transition-transform duration-300 ease-in-out
            lg:translate-x-0 lg:static lg:h-screen
            ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        <div className="p-6 border-b border-slate-100 hidden lg:block">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            CCTI Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">Advanced SEC Filing Analysis</p>
        </div>

        <div className="p-6 space-y-6 pt-20 lg:pt-6">
          {/* Added top padding for mobile to account for close button visual overlap if needed, though overlay covers it */}
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

              {/* SIC - Simple Select for MVP */}
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
                onClick={() => {
                  onRunFilter();
                  setIsMobileMenuOpen(false); // Close menu on mobile after apply
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 pt-20 lg:pt-8 w-full">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Executive Dashboard</h2>
            <p className="text-slate-500 text-sm lg:text-base">Real-time analysis of filing complexity and market impact.</p>
          </div>
        </header>

        <div className="space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
