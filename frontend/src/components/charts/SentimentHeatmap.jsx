import Plot from 'react-plotly.js';
import { motion } from 'framer-motion';

export default function SentimentHeatmap({ data, selectedSentiment, onSentimentChange }) {
    if (!data || !data.z || data.z.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Sentiment Interaction</h3>
                <select
                    className="text-xs border rounded p-1"
                    value={selectedSentiment}
                    onChange={(e) => onSentimentChange(e.target.value)}
                >
                    {['Negative', 'Positive', 'Uncertainty', 'Litigious', 'StrongModal'].map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>

            <div className="w-full h-80">
                <Plot
                    data={[
                        {
                            z: data.z,
                            x: data.x,
                            y: data.y,
                            type: 'heatmap',
                            colorscale: 'RdBu',
                            showscale: true
                        }
                    ]}
                    layout={{
                        autosize: true,
                        margin: { l: 50, r: 10, t: 10, b: 50 },
                        title: '',
                        xaxis: { title: 'Complexity (CCTI) Deciles' },
                        yaxis: { title: `${selectedSentiment} Deciles` },
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        paper_bgcolor: 'rgba(0,0,0,0)',
                    }}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                    config={{ displayModeBar: false }}
                />
            </div>
        </motion.div>
    );
}
