import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings, Check, RefreshCw } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function ConditionsConfigPage() {
  const { showToast } = useNotifications();
  const [conditions, setConditions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConditions();
  }, []);

  const fetchConditions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/conditions');
      if (res.data.success) {
        setConditions(res.data.conditions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (condId, updates) => {
    try {
      const res = await api.patch(`/conditions/${condId}`, updates);
      if (res.data.success) {
        showToast('Risk factor thresholds updated for condition!', 'success');
        fetchConditions();
      }
    } catch (e) {
      showToast('Failed to update condition', 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-600" />
            <span>Supported Conditions & Risk Engine Parameters</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            "One engine, a config row per disease" — Adjust follow-up intervals, refill grace periods, and risk factor weight distributions.
          </p>
        </div>
        <button onClick={fetchConditions} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {conditions.map((c) => (
          <div
            key={c._id}
            className="p-5 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{c.name}</h3>
                <span className="text-[10px] font-mono text-slate-400">Code: {c.code}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                c.enabled ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-600'
              }`}>
                {c.enabled ? 'Active Protocol' : 'Disabled'}
              </span>
            </div>

            {/* Intervals */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Refill Grace Period</span>
                <div className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-1">
                  {c.refillGracePeriodDays} days
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Follow-up Interval</span>
                <div className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-1">
                  {c.followUpIntervalDays} days
                </div>
              </div>
            </div>

            {/* Factor Weights */}
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Factor Weight Allotments (Max Points = 100)
              </span>
              <div className="space-y-1.5">
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-300">Refill Overdue Max Points:</span>
                  <span className="font-mono font-bold">{c.riskFactorConfiguration?.refillOverdueMax || 25} pts</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-300">Days Since Last Visit Max Points:</span>
                  <span className="font-mono font-bold">{c.riskFactorConfiguration?.daysSinceLastVisitMax || 20} pts</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-300">Past Missed Visits Max Points:</span>
                  <span className="font-mono font-bold">{c.riskFactorConfiguration?.pastMissedVisitsMax || 15} pts</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span className="text-slate-600 dark:text-slate-300">Clinical Trend Max Points:</span>
                  <span className="font-mono font-bold">{c.riskFactorConfiguration?.clinicalTrendMax || 15} pts</span>
                </div>
              </div>
            </div>

            {/* Standard Medicines */}
            {c.standardMedications && c.standardMedications.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Protocol Drugs: </span>
                {c.standardMedications.map(m => m.name).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}
