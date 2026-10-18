import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { X, Sparkles, AlertCircle, CheckCircle, Brain, ShieldAlert, RefreshCw } from 'lucide-react';
import RiskBadge from './RiskBadge';

export default function AiExplanationModal({ isOpen, onClose, patient, riskScore }) {
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState(null);

  useEffect(() => {
    if (isOpen && patient && riskScore) {
      fetchExplanation();
    }
  }, [isOpen, patient, riskScore]);

  const fetchExplanation = async () => {
    setLoading(true);
    try {
      const res = await api.post('/ai/explain-risk', {
        patientId: patient._id,
        score: riskScore.score,
        category: riskScore.category,
        factorBreakdown: riskScore.factorBreakdown,
        missingDataPoints: riskScore.missingDataPoints
      });
      if (res.data.success) {
        setAiData(res.data.explanation);
      }
    } catch (err) {
      console.error('Failed to get AI explanation:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-surface-darkcard rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-900 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur">
              <Sparkles className="w-5 h-5 text-brand-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">Explainable Risk Analysis</h3>
                <span className="text-[10px] bg-brand-500/30 text-brand-200 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  {aiData?.source === 'openai' ? 'OpenAI GPT-4o' : 'Clinical Rules Engine'}
                </span>
              </div>
              <p className="text-xs text-brand-200/90">
                Patient: <span className="font-semibold text-white">{patient?.name}</span> ({patient?.patientCode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs text-slate-700 dark:text-slate-300">
          
          {/* Risk overview banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 gap-4">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Calculated Adherence Risk</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {riskScore?.score}/100
                </span>
                <RiskBadge category={riskScore?.category} size="md" />
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Primary Condition</span>
              <p className="text-sm font-bold text-brand-700 dark:text-brand-300 mt-0.5">
                {patient?.primaryCondition?.name || 'Hypertension'}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-brand-600 animate-spin" />
              <p className="text-sm font-medium text-slate-500">Synthesizing clinical adherence explanation...</p>
            </div>
          ) : (
            <>
              {/* Natural language summary */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-brand-600" />
                  <span>Clinical Reasoning Summary</span>
                </h4>
                <div className="p-4 rounded-xl bg-teal-50/70 dark:bg-brand-950/40 border border-teal-100 dark:border-brand-900/50 text-slate-800 dark:text-slate-200 leading-relaxed text-xs">
                  {aiData?.summary}
                </div>
              </div>

              {/* Factor Breakdown Table */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2">
                  Transparent Factor Attribution
                </h4>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-700">
                  {riskScore?.factorBreakdown?.map((f, i) => (
                    <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="space-y-0.5 flex-1 pr-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{f.factor}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{f.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs ${
                          f.points > 10 ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                          f.points > 0 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          +{f.points} pts
                        </span>
                        <span className="text-slate-400 text-[10px]">/ {f.maxPoints} max</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Recommended Community Actions</span>
                </h4>
                <div className="space-y-2">
                  {aiData?.recommended_actions?.map((act, i) => (
                    <div key={i} className="p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-start gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{act.action}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                            Priority: {act.priority}
                          </span>
                          {act.requires_human_review && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              Requires human verification
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Limitations / Disclaimers */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Limitations & Medical Safety Notice</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-600 dark:text-slate-400">
                  {aiData?.limitations?.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                  <li>Risk scores represent predictive non-adherence likelihood and do not replace clinical judgment or direct physician consultation.</li>
                </ul>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Close Explanation
          </button>
        </div>

      </div>
    </div>
  );
}
