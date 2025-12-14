import Plot from 'react-plotly.js';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ScatterAnalysis({ data, onPointClick }) {
// No debug state needed

    if (!data || !data.points) return null;

    const pointsX = data.points.map(p => p.CCTI);
    const pointsY = data.points.map(p => p.ExcessRet);
    const text = data.points.map(p => `${p.CoName} (${p.FILING_DATE})`);

    const trendX = data.trend.map(p => p.CCTI);
    const trendY = data.trend.map(p => p.Trend);

    return (
        <div
            className="glass-card p-6"
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-slate-800">Nonlinear Complexity Analysis</h3>

            </div>

            <div className="w-full h-80">
                <Plot
                    data={[
                        {
                            x: pointsX,
                            y: pointsY,
                            text: text,
                            customdata: data.points,
                            mode: 'markers',
                            type: 'scatter',
                            marker: { color: '#64748b', opacity: 0.6, size: 10 }, // Even Bigger
                            name: 'Filings'
                        },
                        {
                            x: trendX,
                            y: trendY,
                            mode: 'lines',
                            type: 'scatter',
                            line: { color: '#ef4444', width: 3 },
                            name: 'Trend (LOESS)',
                            hoverinfo: 'skip'
                        }
                    ]}
                    layout={{
                        autosize: true,
                        margin: { l: 40, r: 10, t: 10, b: 40 },
                        showlegend: true,
                        plot_bgcolor: 'rgba(0,0,0,0)',
                        paper_bgcolor: 'rgba(0,0,0,0)',
                        xaxis: { title: 'CCTI (Complexity)', showgrid: true, gridcolor: '#f1f5f9' },
                        yaxis: { title: 'Excess Return', showgrid: true, gridcolor: '#f1f5f9' },
                        hovermode: 'closest',
                        clickmode: 'event',
                        dragmode: 'pan' // Changed to PAN to avoiding zooming on click
                    }}
                    useResizeHandler={true}
                    style={{ width: '100%', height: '100%' }}
                    config={{ displayModeBar: true, scrollZoom: true }}
                    // onHover removed
                    onClick={(evt) => {
                        console.log("Plot Clicked!", evt);

                        // Fallback logic
                        let pointData = null;
                        if (evt.points && evt.points[0]) {
                            if (evt.points[0].customdata) {
                                pointData = evt.points[0].customdata;
                            } else if (data.points[evt.points[0].pointIndex]) {
                                pointData = data.points[evt.points[0].pointIndex];
                            }
                        }

                        if (pointData) {
                            // setDebugMsg removed
                            if (onPointClick) onPointClick(pointData);
                        } else {
                            // setDebugMsg removed
                        }
                    }}
                />
            </div>
            <p className="text-xs text-slate-400 mt-2">Red line indicates the nonlinear relationship. Click a point to view details.</p>

            {/* DEBUG DEBUG DEBUG */}
            {/* Debug UI removed */}
        </div>
    );
}
