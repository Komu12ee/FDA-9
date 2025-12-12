import { motion } from 'framer-motion';
import { FileText, Calendar, TrendingUp, Activity } from 'lucide-react';

export default function FilingDetailsCard({ filing }) {
    if (!filing) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-6 flex flex-col items-center justify-center h-full text-slate-400"
            >
                <Activity className="w-12 h-12 opacity-20 mb-3" />
                <p className="text-sm">Select a point on the scatter plot to view details</p>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            key={filing.ACC_NUM || filing.CoName} // Re-animate on change
            className="glass-card p-6 h-full border-l-4 border-l-blue-500"
        >
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 line-clamp-2">{filing.CoName}</h3>
                    <span className="text-xs text-slate-500 font-mono mt-1 block">{filing.ACC_NUM || 'N/A'}</span>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center text-sm text-slate-600">
                        <Calendar className="w-4 h-4 mr-2 opacity-70" /> Filing Date
                    </div>
                    <span className="font-medium text-slate-900">
                        {new Date(filing.FILING_DATE).toLocaleDateString()}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center text-sm text-slate-600">
                        <FileText className="w-4 h-4 mr-2 opacity-70" /> Filing Type
                    </div>
                    <span className="font-bold text-slate-900 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                        {filing.FORM_TYPE || '10-K'}
                    </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center text-sm text-slate-600">
                        <Activity className="w-4 h-4 mr-2 opacity-70" /> Complexity (CCTI)
                    </div>
                    <span className="font-bold text-slate-900">{parseFloat(filing.CCTI).toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center text-sm text-slate-600">
                        <TrendingUp className="w-4 h-4 mr-2 opacity-70" /> Excess Return
                    </div>
                    <span className={`font-bold ${filing.ExcessRet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(parseFloat(filing.ExcessRet)).toFixed(2)}%
                    </span>
                </div>

                {/* Additional Metrics Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <DetailItem label="Volatility" value={filing.Vol_30d ? (filing.Vol_30d * 100).toFixed(2) + '%' : 'N/A'} />
                    <DetailItem label="Momentum" value={filing.Momentum_12_1 ? (filing.Momentum_12_1 * 100).toFixed(2) + '%' : 'N/A'} />
                    <DetailItem label="Size" value={filing.Size_w ? filing.Size_w.toFixed(2) : 'N/A'} />
                    <DetailItem label="Book-to-Mkt" value={filing.BM_w ? filing.BM_w.toFixed(2) : 'N/A'} />
                    <DetailItem label="Negative Words" value={filing.Negative !== undefined ? filing.Negative : 'N/A'} isSentiment={true} color="text-red-600" />
                    <DetailItem label="Positive Words" value={filing.Positive !== undefined ? filing.Positive : 'N/A'} isSentiment={true} color="text-green-600" />
                </div>
            </div>
        </motion.div>
    );
}

function DetailItem({ label, value, isSentiment, color }) {
    return (
        <div className="bg-slate-50 p-2 rounded">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</div>
            <div className={`font-semibold text-sm ${color || 'text-slate-900'}`}>{value}</div>
        </div>
    );
}
