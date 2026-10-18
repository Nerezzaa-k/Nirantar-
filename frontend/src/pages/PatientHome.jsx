import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import BarrierReportModal from '../components/common/BarrierReportModal';
import {
  Heart,
  Calendar,
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  PhoneCall,
  UserCheck,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  PlusCircle,
  MapPin,
  HelpCircle,
  FileText
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function PatientHome() {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [patientData, setPatientData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [barriers, setBarriers] = useState([]);
  const [supportActions, setSupportActions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Barrier reporting modal
  const [showBarrierModal, setShowBarrierModal] = useState(false);
  const [prefilledReason, setPrefilledReason] = useState(null);

  useEffect(() => {
    fetchPatientData();
  }, [user]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      // Find patient record linked to current user or hero patient PAT-1001
      const targetId = user?.patientId?._id || user?.patientId;
      let pId = targetId;

      if (!pId) {
        // Fallback to hero patient PAT-1001 for demo experience
        const res = await api.get('/patients', { params: { search: 'PAT-1001' } });
        if (res.data.patients && res.data.patients.length > 0) {
          pId = res.data.patients[0]._id;
        }
      }

      if (pId) {
        const [pRes, apptsRes, barriersRes, supportRes, notifsRes] = await Promise.all([
          api.get(`/patients/${pId}`),
          api.get('/appointments', { params: { patientId: pId, limit: 10 } }),
          api.get('/barriers', { params: { patientId: pId, limit: 10 } }),
          api.get('/support-actions', { params: { patientId: pId, limit: 10 } }),
          api.get('/notifications', { params: { patientId: pId, limit: 10 } })
        ]);

        if (pRes.data.success) {
          setPatientData(pRes.data.patient);
        }
        if (apptsRes.data.success) {
          setAppointments(apptsRes.data.appointments || []);
        }
        if (barriersRes.data.success) {
          setBarriers(barriersRes.data.barriers || []);
        }
        if (supportRes.data.success) {
          setSupportActions(supportRes.data.actions || []);
        }
        if (notifsRes.data.success) {
          setNotifications(notifsRes.data.notifications || []);
        }
      }
    } catch (err) {
      console.error('Error fetching patient portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const remainingTablets = 4;
  const daysOfMedicineLeft = Math.max(0, Math.round(remainingTablets / 1));

  const adherenceTrendData = [
    { week: 'W1', pillsTaken: 7, target: 7 },
    { week: 'W2', pillsTaken: 7, target: 7 },
    { week: 'W3', pillsTaken: 6, target: 7 },
    { week: 'W4', pillsTaken: 7, target: 7 },
    { week: 'W5', pillsTaken: 4, target: 7 },
    { week: 'W6', pillsTaken: 3, target: 7 }
  ];

  const handleOpenBarrierModal = (prefill = null) => {
    setPrefilledReason(prefill);
    setShowBarrierModal(true);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Warm Greeting Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-900 via-brand-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[11px] font-semibold text-brand-200">
            <Heart className="w-3.5 h-3.5 text-rose-300" />
            <span>Nirantar Long-Term Care Continuity</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Namaste, {patientData?.name || user?.name || 'Patient'} 🙏
          </h1>
          <p className="text-xs sm:text-sm text-brand-200/90 max-w-xl">
            You are enrolled in the <strong className="text-white">{patientData?.treatmentProgram || 'Hypertension'} Continuity Program</strong>.
            We're here to understand whatever obstacles you face and provide solutions that work for you.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/app/check-in"
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl bg-white text-brand-900 font-extrabold text-xs sm:text-sm shadow-xl hover:bg-brand-50 hover:scale-[1.02] transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Complete 1-Minute Check-in</span>
              <ArrowRight className="w-4 h-4 text-brand-700" />
            </Link>

            <button
              onClick={() => handleOpenBarrierModal()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 font-bold text-xs sm:text-sm backdrop-blur transition-all"
            >
              <AlertCircle className="w-4 h-4 text-amber-300" />
              <span>Report Treatment Barrier / Request Help</span>
            </button>
          </div>
        </div>

        {/* Glow */}
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
      </div>

      {/* Overview Cards: Medicine left, Next refill, Assigned worker */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Remaining Tablets */}
        <div className={`p-5 rounded-2xl border shadow-sm ${
          remainingTablets <= 5
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
            : 'bg-white dark:bg-surface-darkcard border-slate-200 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Remaining Medication</span>
            <Pill className={`w-5 h-5 ${remainingTablets <= 5 ? 'text-rose-500' : 'text-brand-600'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${remainingTablets <= 5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
              {remainingTablets}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">tablets left (~{daysOfMedicineLeft} days)</span>
          </div>
          {remainingTablets <= 5 && (
            <div className="mt-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              ⚠️ Refill needed soon to prevent missing doses
            </div>
          )}
        </div>

        {/* Next Clinic Date */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Next Clinic Date</span>
            <Calendar className="w-5 h-5 text-teal-600" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {patientData?.nextAppointmentDate ? new Date(patientData.nextAppointmentDate).toLocaleDateString() : 'Scheduled Soon'}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              {patientData?.healthcareFacility?.name || 'Primary Health Center Rampur'}
            </p>
          </div>
        </div>

        {/* Assigned Worker */}
        <div className="p-5 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Your Care Worker</span>
            <UserCheck className="w-5 h-5 text-brand-600" />
          </div>
          <div className="mt-2">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {patientData?.assignedWorker?.name || patientData?.assignedWorkerId?.name || 'Sunita Devi (ASHA)'}
            </span>
            <p className="text-[11px] text-brand-700 dark:text-brand-300 font-medium mt-1">
              Supports doorstep delivery & check-ins
            </p>
          </div>
        </div>

      </div>

      {/* Appointments Section: Upcoming and Missed */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Your Care Appointments & Follow-ups</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review your scheduled visits, past visits, or report why you missed an appointment.
            </p>
          </div>
          <button
            onClick={() => handleOpenBarrierModal()}
            className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Missed Reason</span>
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
            No appointments on record yet.
          </div>
        ) : (
          <div className="space-y-2.5">
            {appointments.map((appt) => {
              const isMissed = appt.status === 'missed';
              const isScheduled = appt.status === 'scheduled';
              return (
                <div
                  key={appt._id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    isMissed
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                      : isScheduled
                      ? 'bg-teal-50/40 dark:bg-brand-950/20 border-teal-200/80 dark:border-brand-900/40'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {appt.appointmentType?.replace(/_/g, ' ') || 'Consultation & Refill'}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        isMissed
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : isScheduled
                          ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {appt.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px]">
                      <span>Date: <strong>{new Date(appt.scheduledAt).toLocaleDateString()}</strong> at {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>Facility: {appt.facility || 'Primary Health Center'}</span>
                    </div>
                    {appt.notes && (
                      <p className="text-slate-600 dark:text-slate-400 text-[11px]">Note: {appt.notes}</p>
                    )}
                  </div>

                  {isMissed && (
                    <button
                      onClick={() => handleOpenBarrierModal(appt)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 self-start sm:self-center shadow-sm"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Report Why I Missed</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reported Barriers & Support Actions Status */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Reported Obstacles & Matched Support Actions</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track the status of help requested and actions assigned to your care team.
            </p>
          </div>
          <button
            onClick={() => handleOpenBarrierModal()}
            className="text-xs text-brand-700 dark:text-brand-300 hover:underline font-semibold flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Assistance Request</span>
          </button>
        </div>

        {barriers.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
            No obstacles reported. If you face any issues with transport, costs, or side effects, let us know!
          </div>
        ) : (
          <div className="space-y-3">
            {barriers.map((b) => (
              <div
                key={b._id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 space-y-2 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {b.categoryLabel || b.category?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Reported by {b.sourceType}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full self-start sm:self-center ${
                    b.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {b.status}
                  </span>
                </div>

                <p className="text-slate-700 dark:text-slate-300">{b.description || 'Assistance requested with treatment continuity.'}</p>

                {b.matchedSupportAction && (
                  <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/60 text-xs">
                    <div className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      <span>Assigned Rescue Action: {b.matchedSupportAction.title || b.matchedSupportAction.suggestedAction}</span>
                    </div>
                    <div className="text-[11px] text-teal-700 dark:text-teal-300 mt-0.5">
                      Status: <strong className="uppercase">{b.matchedSupportAction.status}</strong> • Reason: {b.matchedSupportAction.recommendationReason}
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400">
                  Reported on: {new Date(b.reportedAt || b.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adherence Trends Graph */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <span>Weekly Medication Adherence Trend</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Based on self-reported tablets taken vs prescribed daily doses (7/week)
            </p>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
            Self-reported logs
          </span>
        </div>

        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={adherenceTrendData}>
              <defs>
                <linearGradient id="adherenceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis domain={[0, 7]} stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '11px'
                }}
              />
              <Area
                type="monotone"
                dataKey="pillsTaken"
                stroke="#0d9488"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#adherenceGradient)"
                name="Tablets Taken"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Simulated Reminders & Notification Gateway Messages */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <span>Simulated Reminders & SMS Delivered</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Demo reminders received via automated SMS/IVR simulator.
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300">
            [DEMO / MOCK GATEWAY]
          </span>
        </div>

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 border border-dashed rounded-xl">
            No simulated reminders received yet.
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.slice(0, 5).map((notif) => (
              <div
                key={notif._id}
                className="p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/50 flex items-start gap-3 text-xs"
              >
                <div className="p-2 rounded-lg bg-sky-600 text-white flex-shrink-0 mt-0.5">
                  {notif.channel === 'ivr' ? <PhoneCall className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-900 dark:text-sky-200 uppercase text-[10px]">
                      {notif.channel?.toUpperCase()} • {notif.type?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-mono text-[11px] leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice-Enabled Barrier Reporting Modal */}
      {showBarrierModal && patientData && (
        <BarrierReportModal
          isOpen={showBarrierModal}
          onClose={() => {
            setShowBarrierModal(false);
            setPrefilledReason(null);
          }}
          patientId={patientData._id}
          patientName={patientData.name}
          sourceType="patient"
          onSuccess={() => {
            setShowBarrierModal(false);
            setPrefilledReason(null);
            fetchPatientData();
            showToast('Barrier reported. Support action matched!', 'success');
          }}
        />
      )}

    </div>
  );
}
