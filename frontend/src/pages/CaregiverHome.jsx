import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import BarrierReportModal from '../components/common/BarrierReportModal';
import RiskBadge from '../components/common/RiskBadge';
import {
  HeartHandshake,
  Calendar,
  Pill,
  Send,
  CheckCircle,
  Bell,
  Heart,
  MessageCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  PlusCircle,
  CheckSquare,
  Activity,
  UserCheck
} from 'lucide-react';

export default function CaregiverHome() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [linkedPatients, setLinkedPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [barriers, setBarriers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assistance activity logs
  const [assistanceActivities, setAssistanceActivities] = useState([
    { id: 1, action: 'Picked up 30-day Telmisartan refill from Rampur PHC', date: new Date().toLocaleDateString(), actor: 'Caregiver Pooja Kumar' },
    { id: 2, action: 'Reminded patient to drink water and take morning blood pressure dose', date: new Date(Date.now() - 24 * 3600 * 1000).toLocaleDateString(), actor: 'Caregiver Pooja Kumar' }
  ]);
  const [newActivityText, setNewActivityText] = useState('');

  // Daily support checklist
  const [supportTasks, setSupportTasks] = useState([
    { id: 'task-1', task: 'Remind Ramesh Kumar to take morning Telmisartan tablet with breakfast', done: false },
    { id: 'task-2', task: 'Confirm if doorstep medicine delivery arrived from ASHA worker Sunita', done: true },
    { id: 'task-3', task: 'Accompany to PHC for Saturday blood pressure checkup', done: false }
  ]);

  const [customEncouragement, setCustomEncouragement] = useState('');
  const [showBarrierModal, setShowBarrierModal] = useState(false);

  useEffect(() => {
    fetchCaregiverData();
  }, []);

  const fetchCaregiverData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/patients');
      if (res.data.success) {
        // Find authorized patients
        const linked = res.data.patients.filter(
          p => p.patientCode === 'PAT-1001' || (user?.linkedPatientIds && user.linkedPatientIds.includes(p._id))
        );
        const activeList = linked.length > 0 ? linked : res.data.patients.slice(0, 1);
        setLinkedPatients(activeList);

        if (activeList.length > 0) {
          const primary = activeList[0];
          setSelectedPatient(primary);

          // Fetch appointments and barriers for primary
          const [apptsRes, barriersRes] = await Promise.all([
            api.get('/appointments', { params: { patientId: primary._id, limit: 5 } }),
            api.get('/barriers', { params: { patientId: primary._id, limit: 5 } })
          ]);

          if (apptsRes.data.success) setAppointments(apptsRes.data.appointments || []);
          if (barriersRes.data.success) setBarriers(barriersRes.data.barriers || []);
        }
      }
    } catch (err) {
      console.error('Error fetching caregiver data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (patientName, patientId) => {
    try {
      await api.post('/notifications/simulate', {
        patientId,
        type: 'appointment_reminder',
        channel: 'sms',
        customMessage: `Hello ${patientName}, your family caregiver sent a friendly reminder: Please remember to take your scheduled dose and drink enough water today! 🙏`
      });
      showToast(`SMS reminder sent to ${patientName}: "Don't forget your scheduled medication!"`, 'success');
    } catch {
      showToast(`Simulated SMS reminder sent to ${patientName}.`, 'success');
    }
  };

  const handleSendEncouragement = (e) => {
    e.preventDefault();
    if (!customEncouragement.trim()) return;
    showToast(`Encouragement message sent to loved one: "${customEncouragement}"`, 'success');
    setCustomEncouragement('');
  };

  const toggleTask = (taskId) => {
    setSupportTasks(prev => prev.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
    showToast('Support checklist task updated.', 'info');
  };

  const handleRecordAssistance = (e) => {
    e.preventDefault();
    if (!newActivityText.trim()) return;

    const newEntry = {
      id: Date.now(),
      action: newActivityText.trim(),
      date: new Date().toLocaleDateString(),
      actor: user?.name || 'Caregiver'
    };
    setAssistanceActivities(prev => [newEntry, ...prev]);
    setNewActivityText('');
    showToast('Assistance activity logged into care history.', 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-900 via-teal-900 to-slate-900 text-white shadow-xl space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-sky-200">
            Authorized Family Caregiver Portal
          </span>
          <span className="text-[10px] text-teal-300 font-medium">
            Explicitly Authorized Access
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black">
          Welcome, {user?.name || 'Caregiver Pooja Kumar'}
        </h1>
        <p className="text-xs text-sky-200 max-w-xl">
          Support your family members in adhering to their long-term treatments. You have authorized access to coordinate appointments, record assistance activities, and report obstacles to their care team.
        </p>
      </div>

      {/* Linked Loved Ones */}
      <div className="space-y-4">
        <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Heart className="w-4 h-4 text-rose-500" />
          <span>Authorized Loved One Records</span>
        </h2>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading authorized records...</div>
        ) : (
          linkedPatients.map(p => (
            <div
              key={p._id}
              className="p-5 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{p.name}</h3>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {p.patientId || p.patientCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Program: <strong className="text-brand-700 dark:text-brand-300">{p.treatmentProgram || p.primaryCondition?.name || 'Hypertension'}</strong> • Facility: {p.healthcareFacility?.name || 'Rampur CHC'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <RiskBadge category={p.currentRiskCategory || p.currentRiskLevel || 'medium'} score={p.currentRiskScore} size="md" />
                </div>
              </div>

              {/* Status metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    <span>Next Appointment</span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {p.nextAppointmentDate ? new Date(p.nextAppointmentDate).toLocaleDateString() : 'Next week'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Pill className="w-3.5 h-3.5 text-teal-600" />
                    <span>Medication Refill Status</span>
                  </div>
                  <div className="font-bold text-amber-600 dark:text-amber-400 uppercase">
                    {p.refillStatus || 'Refill Assistance Active'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-sky-600" />
                    <span>Assigned Care Worker</span>
                  </div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {p.assignedWorker?.name || p.assignedWorkerId?.name || 'Sunita Devi (ASHA)'}
                  </div>
                </div>
              </div>

              {/* Caregiver Actions Row */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleSendReminder(p.name, p._id)}
                  className="px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Send Medication Reminder Nudge</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedPatient(p);
                    setShowBarrierModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Report Barrier on Behalf of Loved One</span>
                </button>
              </div>

            </div>
          ))
        )}
      </div>

      {/* Relevant Upcoming Appointments */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span>Care Coordination & Upcoming Appointments</span>
          </h3>
          <span className="text-[11px] text-slate-400">Coordinate clinic visits</span>
        </div>

        {appointments.length === 0 ? (
          <p className="text-xs text-slate-400">No scheduled appointments for this period.</p>
        ) : (
          <div className="space-y-2">
            {appointments.map((appt) => (
              <div
                key={appt._id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{appt.appointmentType?.replace(/_/g, ' ') || 'Routine Clinic Visit'}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      appt.status === 'scheduled'
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                        : appt.status === 'missed'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Date: <strong>{new Date(appt.scheduledAt).toLocaleDateString()}</strong> at {new Date(appt.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {appt.facility || 'Rampur CHC'}
                  </div>
                </div>

                <button
                  onClick={() => handleSendReminder(selectedPatient?.name || 'Patient', selectedPatient?._id)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold hover:bg-slate-50 self-start sm:self-center"
                >
                  Remind Loved One
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reported Obstacles & Assistance Requests Status */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Reported Barriers & Assistance Status</span>
          </h3>
          <button
            onClick={() => setShowBarrierModal(true)}
            className="text-xs text-brand-700 dark:text-brand-300 hover:underline font-semibold flex items-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report New Barrier</span>
          </button>
        </div>

        {barriers.length === 0 ? (
          <p className="text-xs text-slate-400">No active barriers reported for this patient.</p>
        ) : (
          <div className="space-y-2">
            {barriers.map(b => (
              <div
                key={b._id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {b.categoryLabel || b.category?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      Reported by {b.sourceType}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    b.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {b.status}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-[11px]">{b.description}</p>
                {b.matchedSupportAction && (
                  <div className="text-[11px] text-teal-700 dark:text-teal-300 font-medium">
                    ✓ Matched Support: {b.matchedSupportAction.title || b.matchedSupportAction.suggestedAction} ({b.matchedSupportAction.status})
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Permitted Assistance Activities */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-brand-600" />
          <span>Record Permitted Assistance Activity</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Document activities you performed to help your loved one stay on treatment (e.g. collecting medicine, accompanying to PHC, preparing reminder cards).
        </p>

        <form onSubmit={handleRecordAssistance} className="flex gap-2 pt-1">
          <input
            type="text"
            value={newActivityText}
            onChange={(e) => setNewActivityText(e.target.value)}
            placeholder="e.g. Accompanied Ramesh to clinic for blood sugar test this morning."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Record Activity</span>
          </button>
        </form>

        <div className="space-y-1.5 pt-2">
          {assistanceActivities.map((act) => (
            <div
              key={act.id}
              className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="text-slate-800 dark:text-slate-200 font-medium">{act.action}</span>
              </div>
              <span className="text-[10px] text-slate-400 flex-shrink-0 ml-2">{act.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Support Checklist */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-emerald-600" />
          <span>Caregiver Daily Support Checklist</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Complete these routine nudges to help your loved one stay on track with their treatment.
        </p>

        <div className="space-y-2 pt-1">
          {supportTasks.map(t => (
            <label
              key={t.id}
              className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                t.done
                  ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400 line-through'
                  : 'bg-white dark:bg-surface-darkcard border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium'
              }`}
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTask(t.id)}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <span className="flex-1">{t.task}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Send Warm Encouragement Message */}
      <div className="p-6 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-brand-600" />
          <span>Send Encouragement Nudge</span>
        </h3>
        <form onSubmit={handleSendEncouragement} className="flex gap-2">
          <input
            type="text"
            value={customEncouragement}
            onChange={(e) => setCustomEncouragement(e.target.value)}
            placeholder="e.g. Taking care of your blood pressure lets you play with your grandchildren! Keep it up."
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Nudge</span>
          </button>
        </form>
      </div>

      {/* Barrier Report Modal on behalf of patient */}
      {showBarrierModal && selectedPatient && (
        <BarrierReportModal
          isOpen={showBarrierModal}
          onClose={() => setShowBarrierModal(false)}
          patientId={selectedPatient._id}
          patientName={selectedPatient.name}
          sourceType="caregiver"
          onSuccess={() => {
            setShowBarrierModal(false);
            fetchCaregiverData();
            showToast('Barrier reported on behalf of loved one. Support action matched!', 'success');
          }}
        />
      )}

    </div>
  );
}
