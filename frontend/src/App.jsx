import { useState, useEffect } from 'react';
import axios from 'axios';
import DashboardLayout from './components/DashboardLayout';
import MetricCard from './components/MetricCard';
import CCTIDistribution from './components/charts/CCTIDistribution';
import SentimentHeatmap from './components/charts/SentimentHeatmap';
import ScatterAnalysis from './components/charts/ScatterAnalysis';
import PredictionSimulator from './components/PredictionSimulator';
import FilingDetailsCard from './components/FilingDetailsCard';

function App() {
  const [initData, setInitData] = useState(null);
  const [metrics, setMetrics] = useState({ total: 0, ccti: 0, ret: 0, vol: 0 });
  const [charts, setCharts] = useState({ hist: [], heatmap: null, scatter: null });
  const [filters, setFilters] = useState({});
  const [sentimentCol, setSentimentCol] = useState('Negative');
  const [loading, setLoading] = useState(true);
  const [selectedFiling, setSelectedFiling] = useState(null); // New state

  // Initial Load
  useEffect(() => {
    async function init() {
      try {
        const res = await axios.get('http://localhost:8000/api/init_filters');
        setInitData(res.data);
        setFilters({
          start_date: res.data.min_date,
          end_date: res.data.max_date
        });
      } catch (e) {
        console.error("Backend offline?", e);
      }
    }
    init();
  }, []);

  // Fetch Data based on filters
  const fetchData = async () => {
    setLoading(true);
    try {
      // Parallel requests for performance
      const [mRes, hRes, hmRes, sRes] = await Promise.all([
        axios.post('http://localhost:8000/api/metrics', filters),
        axios.post('http://localhost:8000/api/charts/ccti_distribution', filters),
        axios.post(`http://localhost:8000/api/charts/heatmap?sentiment_col=${sentimentCol}`, filters),
        axios.post('http://localhost:8000/api/charts/scatter', filters)
      ]);

      setMetrics({
        total: mRes.data.total_filings,
        ccti: mRes.data.avg_ccti,
        ret: mRes.data.avg_excess_ret,
        vol: mRes.data.avg_vol
      });

      setCharts({
        hist: hRes.data,
        heatmap: hmRes.data,
        scatter: sRes.data
      });
      setSelectedFiling(null); // Reset selection on new filter

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run on first filter set
  useEffect(() => {
    if (filters.start_date) fetchData();
  }, [filters.start_date]);

  // Re-fetch heatmap when sentiment col changes
  useEffect(() => {
    if (filters.start_date) {
      axios.post(`http://localhost:8000/api/charts/heatmap?sentiment_col=${sentimentCol}`, filters)
        .then(res => setCharts(prev => ({ ...prev, heatmap: res.data })));
    }
  }, [sentimentCol]);

  return (
    <DashboardLayout
      filters={filters}
      setFilters={setFilters}
      initData={initData}
      onRunFilter={fetchData}
    >
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <MetricCard title="Total Filings" value={metrics.total.toLocaleString()} delay={0} />
        <MetricCard title="Avg Complexity (CCTI)" value={metrics.ccti.toFixed(2)} delay={0.1} />
        <MetricCard title="Avg Excess Return" value={`${(metrics.ret).toFixed(2)}%`} subtext="30-day window" delay={0.2} />
        <MetricCard title="Avg Volatility" value={metrics.vol.toFixed(4)} delay={0.3} />
      </div>

      {loading && (
        <div className="text-center py-4 text-blue-600 animate-pulse">Updating Analytics...</div>
      )}

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CCTIDistribution data={charts.hist} />
        <ScatterAnalysis
          data={charts.scatter}
          onPointClick={setSelectedFiling}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SentimentHeatmap
          data={charts.heatmap}
          selectedSentiment={sentimentCol}
          onSentimentChange={setSentimentCol}
        />
        {/* Details Card */}
        <FilingDetailsCard filing={selectedFiling} />
      </div>

      <PredictionSimulator />

    </DashboardLayout>
  );
}

export default App;
