import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import RecordOutcomeModal from '../components/common/RecordOutcomeModal';
import { useNotifications } from '../context/NotificationContext';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  RefreshCw,
  Sparkles,
  MapPin,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function InterventionsPage() {
  const { showToast } = useNotifications();
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);

  useEffect(() => {
    fetchInterventions();
  }, [statusFilter, priorityFilter]);

  const fetchInterventions = async () => {
    setLoading(true);
    try {
      const params = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        limit: 50
      };
      const res = await api.get('/interventions', { params });
      if (res.data.success) {
        setInterventions(res.data.interventions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">High</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Medium</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-brand-600" />
            <span>Targeted Rescue Interventions Queue</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            "Match the rescue to the reason" — Dispatch doorstep refills, counselling scripts, off-peak clinics, or medical escalations.
          </p>
        </div>

        <button
          onClick={fetchInterventions}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          title="Refresh tasks"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="font-semibold text-slate-400 mr-1">Status:</span>
          {['all', 'assigned', 'in_progress', 'completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl uppercase text-[10px] font-bold transition-colors ${
                statusFilter === st
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-400">Priority:</span>
          {['all', 'urgent', 'high', 'medium'].map((pr) => (
            <button
              key={pr}
              onClick={() => setPriorityFilter(pr)}
              className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold ${
                priorityFilter === pr
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {pr}
            </button>
          ))}
        </div>
      </div>

      {/* Interventions Cards List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
            Loading rescue tasks...
          </div>
        ) : interventions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No active interventions matching current filters.
          </div>
        ) : (
          interventions.map((int) => {
            const isCompleted = int.status === 'completed';
            return (
              <div
                key={int._id}
                className="p-5 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getPriorityBadge(int.priority)}
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                      Type: {int.interventionType?.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Created: {new Date(int.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400">Reported Barrier:</span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      "{int.reportedReason}"
                    </h3>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="font-semibold text-brand-700 dark:text-brand-300">Action: </span>
                    <span className="text-slate-800 dark:text-slate-200">{int.recommendedAction}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                      Patient: <Link to={`/app/patients/${int.patientId?._id}`} className="text-brand-700 dark:text-brand-300 hover:underline">{int.patientId?.name}</Link> ({int.patientId?.patientCode})
                    </span>
                    <span>Condition: <strong>{int.conditionId?.name || 'Hypertension'}</strong></span>
                    <span>Assigned to: <strong>{int.assignedTo?.name || 'ASHA Worker'}</strong></span>
                    {int.dueDate && <span>Due Date: <strong>{new Date(int.dueDate).toLocaleDateString()}</strong></span>}
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex items-center gap-3 flex-shrink-0 self-start md:self-center">
                  {isCompleted ? (
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Completed</span>
                      </span>
                      {int.completedAt && (
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(int.completedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedIntervention(int);
                        setShowOutcomeModal(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                    >
                      <Check className="w-4 h-4" />
                      <span>Complete & Record Outcome</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Record Outcome Modal */}
      {showOutcomeModal && (
        <RecordOutcomeModal
          isOpen={showOutcomeModal}
          onClose={() => setShowOutcomeModal(false)}
          intervention={selectedIntervention}
          onOutcomeSaved={fetchInterventions}
        />
      )}

    </div>
  );
}
