import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import RiskBadge from '../components/common/RiskBadge';
import BarrierReportModal from '../components/common/BarrierReportModal';
import { useNotifications } from '../context/NotificationContext';
import {
  User,
  Activity,
  Calendar,
  Pill,
  AlertCircle,
  FileText,
  Clock,
  MapPin,
  Phone,
  Sparkles,
  ArrowLeft,
  Plus,
  CheckCircle,
  ShieldAlert,
  Award,
  RefreshCw,
  MessageSquare,
  Truck,
  Heart,
  DollarSign,
  PhoneCall,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  X
} from 'lucide-react';

const JOURNEY_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'appointments', label: 'Appointments' },
  { key: 'barriers', label: 'Barriers' },
  { key: 'support_actions', label: 'Support Actions' },
  { key: 'contact_history', label: 'Contact History' },
  { key: 'timeline', label: 'Follow-up Timeline' }
];

export default function PatientDetail() {
  const { id } = useParams();
  const { showToast } = useNotifications();

  const [patient, setPatient] = useState(null);
  const [journey, setJourney] = useState({
    appointments: [],
    barriers: [],
    supportActions: [],
    followUpCases: [],
    notifications: [],
    timeline: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [showBarrierModal, setShowBarrierModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [newApptType, setNewApptType] = useState('Routine Checkup');
  const [newApptDate, setNewApptDate] = useState('');
  const [newApptNotes, setNewApptNotes] = useState('');
  const [savingAppt, setSavingAppt] = useState(false);

  useEffect(() => {
    fetchPatientJourney();
  }, [id]);

  const fetchPatientJourney = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/patients/${id}/journey`);
      if (res.data.success) {
        setPatient(res.data.patient);
        setJourney(res.data.journey);
      }
    } catch (err) {
      console.error('Failed to load patient journey:', err);
      showToast('Error loading patient journey', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    if (!newApptDate) {
      showToast('Please select scheduled date', 'error');
      return;
    }
    setSavingAppt(true);
    try {
      const res = await api.post('/appointments', {
        patientId: patient._id,
        appointmentType: newApptType,
        scheduledAt: newApptDate,
        notes: newApptNotes
      });
      if (res.data.success) {
        showToast('Appointment scheduled successfully', 'success');
        setShowAppointmentModal(false);
        setNewApptDate('');
        setNewApptNotes('');
        fetchPatientJourney();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to schedule appointment', 'error');
    } finally {
      setSavingAppt(false);
    }
  };

  const handleUpdateSupportAction = async (actionId, status) => {
    try {
      const res = await api.patch(`/support-actions/${actionId}/status`, { status });
      if (res.data.success) {
        showToast(`Support action marked ${status.replace(/_/g, ' ')}`, 'success');
        fetchPatientJourney();
      }
    } catch (err) {
      showToast('Failed to update action status', 'error');
    }
  };

  if (loading && !patient) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-teal-600 mb-2" />
        Loading consolidated patient journey...
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="py-24 text-center text-slate-400 text-xs">
        Patient record not found.
      </div>
    );
  }

  const assignedWorkerName = patient.assignedWorker?.name || patient.assignedWorkerId?.name || 'Sunita Verma (ASHA)';
  const caregiverInfo = (patient.authorizedCaregivers && patient.authorizedCaregivers.length > 0)
    ? patient.authorizedCaregivers[0]
    : (patient.linkedCaregiverIds && patient.linkedCaregiverIds.length > 0 ? patient.linkedCaregiverIds[0] : null);

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 text-xs">
      
      {/* Back button */}
      <div>
        <Link
          to="/app/patients"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-teal-600 font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Directory</span>
        </Link>
      </div>

      {/* Patient Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-black text-xl flex items-center justify-center flex-shrink-0 shadow-inner">
              {patient.name.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {patient.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {patient.patientId || patient.patientCode}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-bold text-[11px]">
                  {patient.treatmentProgram || 'Diabetes'} Program
                </span>
              </div>

              <div className="text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-3 text-xs">
                <span>Age: <strong>{patient.age} yrs</strong> ({patient.gender})</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{patient.contactInfo?.phone || patient.phone || '+91 98765 00000'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{patient.location?.address || patient.healthcareFacility?.name || 'Rampur PHC Area'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
            <RiskBadge score={patient.currentRiskScore} category={patient.currentRiskLevel || patient.currentRiskCategory} />
            <span className="text-[11px] text-slate-400">
              Assessed: {patient.lastAssessmentDate ? new Date(patient.lastAssessmentDate).toLocaleDateString() : 'Today'}
            </span>
          </div>

        </div>

        {/* Profile Details Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 font-semibold block">Assigned Health Worker:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{assignedWorkerName}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 font-semibold block">Primary Facility:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {patient.healthcareFacility?.name || 'PHC Rampur'} ({patient.healthcareFacility?.distanceKm || 4.5} km)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 font-semibold block">Authorized Family Caregiver:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {caregiverInfo?.name || 'Pooja Kumar (Daughter)'}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 font-semibold block">Contact Preference:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 capitalize">
              {patient.contactInfo?.preferredContactMethod?.replace(/_/g, ' ') || 'Phone Call'} (Consent: Active)
            </span>
          </div>
        </div>

      </div>

      {/* 6 Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
        {JOURNEY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === tab.key
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{tab.label}</span>
            {tab.key === 'barriers' && journey.barriers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {journey.barriers.length}
              </span>
            )}
            {tab.key === 'support_actions' && journey.supportActions.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">
                {journey.supportActions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-2 space-y-4">
            
            {/* Risk Prioritization Breakdown Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>Explainable Continuity Prioritization</span>
                </h3>
                <span className="text-[11px] text-slate-400">Rules-Based Decision Support</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/60">
                <div className="text-teal-950 dark:text-teal-200 font-bold">
                  Recommended Next Action:
                </div>
                <p className="text-[11px] text-teal-800 dark:text-teal-300 mt-0.5">
                  {journey.followUpCases[0]?.recommendedNextAction || 'Maintain routine monitoring and medication refill availability check.'}
                </p>
              </div>

              {/* Factors list */}
              <div className="space-y-2 pt-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">Factors Driving Score:</span>
                <div className="space-y-1.5">
                  {(journey.followUpCases[0]?.contributingFactors || [
                    { factor: 'Follow-up Interval Elapsed', points: 20, description: 'Elapsed days since last clinic follow-up.' },
                    { factor: 'Reported Transportation Barrier', points: 15, description: 'Road flooded, unable to travel to PHC.' }
                  ]).map((f, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-[11px]">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{f.factor}:</span>{' '}
                        <span className="text-slate-500">{f.description}</span>
                      </div>
                      <span className="font-bold text-rose-600 dark:text-rose-400">+{f.points} pts</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                <span>Notice: Prioritization score is an operational decision aid for health workers. It does not determine clinical diagnoses.</span>
              </div>
            </div>

          </div>

          <div className="space-y-4">
            
            {/* Quick Actions Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Staff Quick Actions</h3>
              
              <button
                type="button"
                onClick={() => setShowBarrierModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Record Patient Barrier</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAppointmentModal(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-teal-500 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 font-bold transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule New Appointment</span>
              </button>

              <Link
                to="/app/recovery-tracker"
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Open Recovery Tracker</span>
              </Link>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Appointments */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Scheduled & Past Appointments</h3>
            <button
              onClick={() => setShowAppointmentModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Appointment</span>
            </button>
          </div>

          {journey.appointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-3xl">No appointments scheduled yet.</div>
          ) : (
            <div className="space-y-3">
              {journey.appointments.map((a) => (
                <div key={a._id} className="p-4 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{a.appointmentType}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        a.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : a.status === 'missed'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : a.status === 'rescheduled'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="text-slate-500 mt-1">
                      Scheduled: <strong>{new Date(a.scheduledAt).toLocaleDateString()}</strong> at {a.facility || 'Primary Health Center'}
                    </p>
                    {a.missedReason && (
                      <p className="text-rose-600 dark:text-rose-400 mt-0.5">Reason: {a.missedReason}</p>
                    )}
                  </div>
                  <div className="text-right text-slate-400">
                    {a.completedAt ? `Completed on ${new Date(a.completedAt).toLocaleDateString()}` : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Barriers */}
      {activeTab === 'barriers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Reported Barriers & Root Causes</h3>
              <p className="text-[11px] text-slate-400">Always distinguished by verified reporting source.</p>
            </div>
            <button
              onClick={() => setShowBarrierModal(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report New Barrier</span>
            </button>
          </div>

          {journey.barriers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-3xl">No barriers reported.</div>
          ) : (
            <div className="space-y-3">
              {journey.barriers.map((b) => (
                <div key={b._id} className="p-5 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {b.categoryLabel || b.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase">
                        Source: {b.sourceType} ({b.reporterName || 'Self'})
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(b.reportedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-surface-dark p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{b.description}"
                  </p>

                  {b.voiceTranscript && (
                    <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-300 flex items-center gap-2 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      <span><strong>Speech Transcript:</strong> "{b.voiceTranscript}"</span>
                    </div>
                  )}

                  {b.matchedSupportAction && (
                    <div className="pt-2 text-slate-500 text-[11px] flex items-center gap-2">
                      <span className="font-bold text-teal-600">Matched Action:</span>
                      <span>{b.matchedSupportAction.title || b.matchedSupportAction.actionType}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Support Actions */}
      {activeTab === 'support_actions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Matched Support Actions & Interventions</h3>
          </div>

          {journey.supportActions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-3xl">No support actions assigned.</div>
          ) : (
            <div className="space-y-3">
              {journey.supportActions.map((act) => (
                <div key={act._id} className="p-5 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{act.title || act.actionType}</h4>
                      <p className="text-slate-500 text-[11px] mt-0.5">Assigned to: <strong>{act.assignedTo?.name || act.assignedTeam}</strong></p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                      {act.status}
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-300 text-xs">
                    {act.suggestedAction}
                  </p>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                    {act.status !== 'completed' && (
                      <button
                        onClick={() => handleUpdateSupportAction(act._id, 'completed')}
                        className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Action Completed</span>
                      </button>
                    )}
                    {act.status === 'suggested' && (
                      <button
                        onClick={() => handleUpdateSupportAction(act._id, 'accepted')}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        Accept Action
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Contact History */}
      {activeTab === 'contact_history' && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Simulated Messages & Outreach History</h3>

          {journey.notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-3xl">No communications logged yet.</div>
          ) : (
            <div className="space-y-3">
              {journey.notifications.map((n) => (
                <div key={n._id} className="p-4 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-sky-600 dark:text-sky-400 uppercase">
                      {n.channel} • {n.type.replace(/_/g, ' ')} [MOCK]
                    </span>
                    <span className="text-slate-400">
                      {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-surface-dark p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Follow-up Timeline */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="border-b pb-3 border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Longitudinal Treatment Continuity Journey</h3>
            <p className="text-[11px] text-slate-400">Complete audit trail of registrations, appointments, barriers, support actions, and contacts.</p>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-200 dark:before:bg-teal-900">
            {journey.timeline.map((ev) => (
              <div key={ev.id} className="relative space-y-1">
                <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white dark:border-slate-900" />
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">{ev.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {ev.badge}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">{ev.description}</p>
                <div className="text-[10px] text-slate-400">
                  By: <strong>{ev.actor}</strong> • {new Date(ev.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Schedule Appointment */}
      {showAppointmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Schedule Appointment</h3>
              <button onClick={() => setShowAppointmentModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Appointment Type: *</label>
                <select
                  value={newApptType}
                  onChange={(e) => setNewApptType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium"
                >
                  <option value="Routine Review & Vitals">Routine Review & Vitals</option>
                  <option value="Medication Refill">Medication Refill</option>
                  <option value="HbA1c & Fasting Lab">HbA1c & Fasting Lab</option>
                  <option value="Blood Pressure Checkup">Blood Pressure Checkup</option>
                  <option value="Clinical Doctor Referral">Clinical Doctor Referral</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Scheduled Date & Time: *</label>
                <input
                  type="datetime-local"
                  value={newApptDate}
                  onChange={(e) => setNewApptDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Clinical Notes:</label>
                <textarea
                  rows={2}
                  value={newApptNotes}
                  onChange={(e) => setNewApptNotes(e.target.value)}
                  placeholder="e.g. Fasting recommended; bring old medication strips"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAppointmentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAppt}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/30"
                >
                  {savingAppt ? 'Scheduling...' : 'Save Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Voice-Enabled Barrier Reporting */}
      <BarrierReportModal
        isOpen={showBarrierModal}
        onClose={() => setShowBarrierModal(false)}
        patientId={patient._id}
        patientName={patient.name}
        sourceType="healthcare_worker"
        onSuccess={fetchPatientJourney}
      />

    </div>
  );
}
