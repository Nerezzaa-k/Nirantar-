import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import RiskBadge from '../components/common/RiskBadge';
import BarrierReportModal from '../components/common/BarrierReportModal';
import {
  Users,
  AlertTriangle,
  Clock,
  CalendarX,
  ShieldCheck,
  CheckCircle2,
  Search,
  Filter,
  Plus,
  Calendar,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Phone,
  MapPin,
  Bot,
  Activity,
  ArrowRight,
  Send,
  UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

export default function WorkerHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Data from backend worker-dashboard endpoint
  const [kpis, setKpis] = useState({
    assignedPatients: 0,
    highRiskCases: 0,
    missedAppointments: 0,
    overdueFollowUps: 0,
    unresolvedBarriers: 0,
    pendingSupportActions: 0,
    completedFollowUps: 0
  });

  const [riskDistribution, setRiskDistribution] = useState([
    { name: 'Low Risk', value: 3, color: '#10b981' },
    { name: 'Medium Risk', value: 2, color: '#f59e0b' },
    { name: 'High Risk', value: 1, color: '#ef4444' }
  ]);

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [priorityQueue, setPriorityQueue] = useState([]);

  // Modal
  const [showBarrierModal, setShowBarrierModal] = useState(false);
  const [selectedPatientForBarrier, setSelectedPatientForBarrier] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/worker-dashboard');
      if (res.data.success) {
        if (res.data.kpis) setKpis(res.data.kpis);
        if (res.data.riskDistribution) setRiskDistribution(res.data.riskDistribution);
        if (res.data.upcomingAppointments) setUpcomingAppointments(res.data.upcomingAppointments);
        if (res.data.priorityQueue) setPriorityQueue(res.data.priorityQueue);
      }
    } catch (err) {
      console.error('Failed to load worker dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkApptAttended = async (apptId) => {
    try {
      await api.patch(`/appointments/${apptId}/status`, { status: 'completed' });
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkApptMissed = async (apptId) => {
    try {
      await api.post(`/appointments/${apptId}/record-missed`, { missedReason: 'Patient did not attend' });
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 text-xs">
      
      {/* Banner / Welcome */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-900 via-brand-800 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-teal-200 border border-white/20">
              Primary Care Catchment
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Healthcare Worker Dashboard
          </h1>
          <p className="text-xs text-teal-200 max-w-xl">
            Prioritize follow-up outreach, log patient-reported barriers, coordinate support actions, and ensure treatment continuity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/app/recovery-tracker"
            className="px-4 py-2.5 rounded-xl bg-white text-teal-900 font-extrabold text-xs shadow-md hover:bg-teal-50 transition flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-teal-600" />
            <span>Recovery Tracker</span>
          </Link>
          <Link
            to="/app/communications"
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Simulate SMS / IVR</span>
          </Link>
        </div>
      </div>

      {/* 7 Core KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        
        {/* Total assigned patients */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase">Assigned</span>
            <Users className="w-3.5 h-3.5 text-teal-600" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">{kpis.assignedPatients || 5}</div>
          <div className="text-[10px] text-slate-400">Active patients</div>
        </div>

        {/* High-risk follow-up cases */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-surface-darkcard border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[10px] font-bold uppercase">High Risk</span>
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400">{kpis.highRiskCases || 2}</div>
          <div className="text-[10px] text-rose-500/80">Score 60+</div>
        </div>

        {/* Missed appointments */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase">Missed Visits</span>
            <CalendarX className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white">{kpis.missedAppointments || 1}</div>
          <div className="text-[10px] text-slate-400">Recorded absent</div>
        </div>

        {/* Overdue follow-ups */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-500">
            <span className="text-[10px] font-bold uppercase">Overdue</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400">{kpis.overdueFollowUps || 2}</div>
          <div className="text-[10px] text-slate-400">Pending outreach</div>
        </div>

        {/* Unresolved barriers */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-purple-500">
            <span className="text-[10px] font-bold uppercase">Barriers</span>
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-purple-600 dark:text-purple-400">{kpis.unresolvedBarriers || 3}</div>
          <div className="text-[10px] text-slate-400">Active obstacles</div>
        </div>

        {/* Pending support actions */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-sky-500">
            <span className="text-[10px] font-bold uppercase">Support Tasks</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-sky-600 dark:text-sky-400">{kpis.pendingSupportActions || 3}</div>
          <div className="text-[10px] text-slate-400">In progress</div>
        </div>

        {/* Completed follow-ups */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-surface-darkcard border border-emerald-200 dark:border-emerald-900/60 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-500">
            <span className="text-[10px] font-bold uppercase">Recovered</span>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{kpis.completedFollowUps || 1}</div>
          <div className="text-[10px] text-emerald-600/80">Returned to care</div>
        </div>

      </div>

      {/* Middle Row: Recharts Risk Donut & Upcoming Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Risk Distribution Chart (Recharts Donut) */}
        <div className="lg:col-span-1 p-5 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Cohort Risk Distribution</h3>
            <span className="text-[10px] text-slate-400">Rules-Based</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
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
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px]">
            {riskDistribution.map((r, i) => (
              <div key={i} className="p-1.5 rounded-xl bg-slate-50 dark:bg-surface-dark">
                <span className="font-bold text-slate-900 dark:text-white block">{r.value}</span>
                <span className="text-[10px] text-slate-400">{r.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Appointments List */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Upcoming Appointments (Next 7 Days)</h3>
              <p className="text-[11px] text-slate-400">Confirm attendance or dispatch proactive reminder.</p>
            </div>
            <Link to="/app/patients" className="text-teal-600 font-bold hover:underline flex items-center gap-1">
              <span>View Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {upcomingAppointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No scheduled visits in the next 7 days.</div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {upcomingAppointments.map((appt) => (
                <div
                  key={appt._id}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-dark flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {appt.patient?.name || 'Patient'} ({appt.patient?.patientId || appt.patient?.patientCode})
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {appt.appointmentType} • <strong>{new Date(appt.scheduledAt).toLocaleDateString()}</strong> ({new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMarkApptAttended(appt._id)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 font-bold transition flex items-center gap-1 text-[11px]"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Attended</span>
                    </button>
                    <button
                      onClick={() => handleMarkApptMissed(appt._id)}
                      className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 font-bold transition flex items-center gap-1 text-[11px]"
                    >
                      <CalendarX className="w-3 h-3" />
                      <span>Missed</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Priority Follow-Up Queue Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Priority Follow-Up Queue</span>
            </h3>
            <p className="text-[11px] text-slate-400">Patients ranked by explainable non-adherence risk factors.</p>
          </div>
          <Link
            to="/app/recovery-tracker"
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <span>Open Tracker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {priorityQueue.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Queue is currently clear.</div>
        ) : (
          <div className="space-y-3">
            {priorityQueue.map((item) => {
              const p = item.patient;
              return (
                <div
                  key={item._id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-dark hover:border-teal-500 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.caseNumber}
                      </span>
                      <div>
                        <Link to={`/app/patients/${p?._id}`} className="font-extrabold text-slate-900 dark:text-white hover:text-teal-600">
                          {p?.name} ({p?.patientId || p?.patientCode})
                        </Link>
                        <div className="text-[11px] text-slate-500">
                          Program: {p?.treatmentProgram} • Phone: {p?.contactInfo?.phone || p?.phone || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full uppercase text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {item.status.replace(/_/g, ' ')}
                      </span>
                      <RiskBadge score={item.riskScore} category={item.riskLevel} />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                    <strong>Recommended Action:</strong> {item.recommendedNextAction || 'Contact patient to review continuity options.'}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPatientForBarrier(p);
                        setShowBarrierModal(true);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 font-bold transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Record Barrier</span>
                    </button>

                    <Link
                      to={`/app/patients/${p?._id}`}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1 shadow-sm"
                    >
                      <span>Open Journey</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Barrier Report Modal */}
      {showBarrierModal && selectedPatientForBarrier && (
        <BarrierReportModal
          isOpen={showBarrierModal}
          onClose={() => setShowBarrierModal(false)}
          patientId={selectedPatientForBarrier._id}
          patientName={selectedPatientForBarrier.name}
          sourceType="healthcare_worker"
          onSuccess={fetchDashboardData}
        />
      )}

    </div>
  );
}
