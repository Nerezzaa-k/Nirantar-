import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Award, ShieldAlert, CheckCircle, RefreshCw, Info } from 'lucide-react';

export default function EffectivenessPage() {
  const [effectiveness, setEffectiveness] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEffectiveness();
  }, []);

  const fetchEffectiveness = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/intervention-effectiveness');
      if (res.data.success) {
        setEffectiveness(res.data.effectiveness);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <span>"What Works" Adherence Learning Engine</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            "LEARN step" — Evaluating real-world outcome rates across each rescue strategy to guide future clinical allocations.
          </p>
        </div>
        <button onClick={fetchEffectiveness} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Honest Limits & Evaluation Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Evaluation Integrity & Sample Size Policy</p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Success rates are calculated directly from worker-recorded outcomes where the patient was verified reached and medication adherence was confirmed resumed. An observed resumption does not independently prove single causality. Interventions with fewer than 10 logged outcomes are flagged with a <strong className="text-amber-700 dark:text-amber-400">Preliminary</strong> badge until statistical power is reached.
          </p>
        </div>
      </div>

      {/* Effectiveness Table Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/20">
                <th className="py-3 px-3">Intervention Strategy</th>
                <th className="py-3 px-3">Assigned</th>
                <th className="py-3 px-3">Completed</th>
                <th className="py-3 px-3">Contact Rate</th>
                <th className="py-3 px-3">Resumed / Maintained</th>
                <th className="py-3 px-3">Observed Effectiveness</th>
                <th className="py-3 px-3">Data Rigor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {effectiveness.map((eff, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white">
                    {eff.label}
                  </td>
                  <td className="py-3.5 px-3 font-mono">{eff.assignedCount}</td>
                  <td className="py-3.5 px-3 font-mono font-semibold">{eff.completedCount}</td>
                  <td className="py-3.5 px-3 font-mono">
                    {eff.completedCount > 0 ? Math.round((eff.patientReachedCount / eff.completedCount) * 100) : 0}%
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {eff.successfulCount} patients
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${eff.successRate}%` }}
                        />
                      </div>
                      <span className="font-mono font-black text-slate-900 dark:text-white">
                        {eff.successRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    {eff.isPreliminary ? (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 font-semibold border border-amber-200">
                        Preliminary (n={eff.sampleSize})
                      </span>
                    ) : (
                      <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 font-semibold border border-emerald-200">
                        Reliable (n={eff.sampleSize})
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
