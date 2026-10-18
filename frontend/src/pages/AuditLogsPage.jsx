import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, RefreshCw, Clock } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit-logs');
      if (res.data.success) {
        setLogs(res.data.logs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-purple-600" />
            <span>Healthcare Security & Audit Trails</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Immutable audit record of user logins, risk calculations, check-in barrier reports, and outcome entries.
          </p>
        </div>
        <button onClick={fetchLogs} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
            Loading security audit log...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="py-3 px-3">Timestamp</th>
                  <th className="py-3 px-3">User & Role</th>
                  <th className="py-3 px-3">Action Event</th>
                  <th className="py-3 px-3">Resource Type</th>
                  <th className="py-3 px-3">Safe Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {logs.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(l.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{l.userId?.name || 'System / Service'}</div>
                      <div className="text-[10px] text-slate-400">{l.userId?.email} ({l.userId?.role})</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-brand-700 dark:text-brand-300">
                      {l.resourceType}
                    </td>
                    <td className="py-3 px-3 font-mono text-[10px] text-slate-500 max-w-xs truncate">
                      {l.relevantMetadata ? JSON.stringify(l.relevantMetadata) : 'None'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
