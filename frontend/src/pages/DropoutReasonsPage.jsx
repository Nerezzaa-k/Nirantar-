import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { PieChart as PieIcon, BarChart3, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart as RechartsPie,
  Pie
} from 'recharts';

export default function DropoutReasonsPage() {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReasons();
  }, []);

  const fetchReasons = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/dropout-reasons');
      if (res.data.success) {
        setReasons(res.data.reasons);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0d9488', '#f59e0b', '#e11d48', '#3b82f6', '#8b5cf6', '#64748b', '#10b981'];

  return (
    <div className="space-y-6">
      
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <PieIcon className="w-6 h-6 text-brand-600" />
            <span>Why Patients Drop Out • Root Barrier Analytics</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            "Find out why" — Aggregating self-reported barriers across weekly check-ins, home visits, and missed refill logs.
          </p>
        </div>
        <button onClick={fetchReasons} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Horizontal Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-600" />
            <span>Prevalence of Barriers (Count)</span>
          </h2>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reasons} layout="vertical" margin={{ left: 40, right: 20 }}>
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="reason" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {reasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Distribution Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-brand-600" />
            <span>Proportional Distribution (%)</span>
          </h2>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={reasons}
                  dataKey="count"
                  nameKey="reason"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {reasons.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '11px'
                  }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Detailed Mapping Breakdown Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Reason-to-Action Protocol Mapping</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase">
                <th className="py-2.5 px-3">Reported Barrier Reason</th>
                <th className="py-2.5 px-3">Incidence</th>
                <th className="py-2.5 px-3">Share</th>
                <th className="py-2.5 px-3">Configured Rescue Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {reasons.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span>{r.reason}</span>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold">{r.count} reports</td>
                  <td className="py-3 px-3 font-mono">{r.percentage}%</td>
                  <td className="py-3 px-3 text-brand-700 dark:text-brand-300 font-medium">
                    {r.reason.includes('travel') ? 'Village Doorstep Refill Batch' :
                     r.reason.includes('unavailable') ? 'Alternate PHC Stock Escalation' :
                     r.reason.includes('fine') ? 'Asymptomatic Counselling Script & Family Buddy Nudge' :
                     r.reason.includes('wages') ? 'Off-Peak Clinic Hours Slot' :
                     r.reason.includes('side effects') ? 'Direct Escalation to Medical Officer' :
                     r.reason.includes('forgot') ? 'Caregiver Reminder Plan' : 'Human In-Person Home Verification'}
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
