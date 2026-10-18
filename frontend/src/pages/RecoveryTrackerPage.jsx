import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import {
  Clock,
  PhoneCall,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  UserCheck,
  ChevronRight,
  RefreshCw,
  Plus,
  Send,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
  X
} from 'lucide-react';
import RiskBadge from '../components/common/RiskBadge';

const STATUS_FILTERS = [
  { key: 'all', label: 'All Cases' },
  { key: 'open', label: 'Open Cases' },
  { key: 'high_priority', label: 'High Priority' },
  { key: 'overdue', label: 'Overdue Follow-ups' },
  { key: 'awaiting_contact', label: 'Awaiting Contact' },
  { key: 'awaiting_assistance', label: 'Awaiting Assistance' },
  { key: 'appointment_rescheduled', label: 'Rescheduled' },
  { key: 'follow_up_completed', label: 'Successfully Completed' }
];

const CASE_STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  contact_pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  contact_attempted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  barrier_identified: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  support_assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  in_progress: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
  appointment_rescheduled: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  follow_up_completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  unresolved: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  closed: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
};

export default function RecoveryTrackerPage() {
  const { showToast } = useNotifications();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('open');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [activeCaseModal, setActiveCaseModal] = useState(null); // 'contact', 'reschedule', 'outcome', 'reassess'
  const [selectedCase, setSelectedCase] = useState(null);

  // Form states
  const [contactChannel, setContactChannel] = useState('phone_call');
  const [contactOutcome, setContactOutcome] = useState('reached');
  const [contactNotes, setContactNotes] = useState('');

  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  const [outcomeStatus, setOutcomeStatus] = useState('recovered_to_care');
  const [recoveryReason, setRecoveryReason] = useState('');

  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCases();
  }, [activeFilter]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeFilter === 'open') params.status = 'open';
      else if (activeFilter === 'high_priority') params.riskLevel = 'high';
      else if (activeFilter === 'overdue') params.overdue = 'true';
      else if (activeFilter === 'awaiting_contact') params.status = 'awaiting_contact';
      else if (activeFilter === 'awaiting_assistance') params.status = 'awaiting_assistance';
      else if (activeFilter !== 'all') params.status = activeFilter;

      const res = await api.get('/recovery-cases', { params });
      if (res.data.success) {
        setCases(res.data.cases);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load recovery cases', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordContact = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/recovery-cases/${selectedCase._id}/contact-attempt`, {
        channel: contactChannel,
        outcome: contactOutcome,
        notes: contactNotes
      });
      if (res.data.success) {
        showToast('Contact attempt logged and status updated!', 'success');
        setActiveCaseModal(null);
        setContactNotes('');
        fetchCases();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record contact attempt', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordReschedule = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    if (!rescheduleDate) {
      showToast('Please select a new appointment date', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const apptId = selectedCase.relatedAppointment?._id || selectedCase.relatedAppointment;
      if (apptId) {
        await api.post(`/appointments/${apptId}/reschedule`, {
          newScheduledAt: rescheduleDate,
          reason: rescheduleReason
        });
      }
      await api.patch(`/recovery-cases/${selectedCase._id}/status`, {
        status: 'appointment_rescheduled',
        notes: `Rescheduled to ${new Date(rescheduleDate).toLocaleDateString()}. Reason: ${rescheduleReason}`
      });
      showToast('Appointment rescheduled and case status updated!', 'success');
      setActiveCaseModal(null);
      setRescheduleDate('');
      setRescheduleReason('');
      fetchCases();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reschedule appointment', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordOutcome = async (e) => {
    e.preventDefault();
    if (!selectedCase) return;
    if (!recoveryReason) {
      showToast('Please document the verified recovery reason', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post(`/recovery-cases/${selectedCase._id}/record-outcome`, {
        outcomeStatus,
        recoveryReason
      });
      if (res.data.success) {
        showToast('Recovery outcome documented and case marked recovered!', 'success');
        setActiveCaseModal(null);
        setRecoveryReason('');
        fetchCases();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record outcome', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReassessScore = async (patientId) => {
    try {
      const res = await api.post(`/recovery-cases/assess-patient/${patientId}`);
      if (res.data.success) {
        showToast(`Prioritization recalculated: Score ${res.data.assessment.riskScore}/100 [${res.data.assessment.riskLevel.toUpperCase()}]`, 'success');
        fetchCases();
      }
    } catch (err) {
      showToast('Recalculation failed', 'error');
    }
  };

  const filteredCases = cases.filter((c) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      c.caseNumber.toLowerCase().includes(s) ||
      c.patient?.name?.toLowerCase().includes(s) ||
      c.patient?.patientId?.toLowerCase().includes(s) ||
      c.patient?.treatmentProgram?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900 text-xs font-bold text-teal-800 dark:text-teal-300">
            <Clock className="w-3.5 h-3.5" />
            <span>Core Feature 5</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Follow-Up Recovery Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor and resolve non-adherence cases across 10 progressive recovery stages.
          </p>
        </div>

        <button
          onClick={fetchCases}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-darkcard font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-teal-600" />
          <span>Refresh Cases</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
              activeFilter === f.key
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
                : 'bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Search Input Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Case ID (FC-1001), Patient Name, or Care Program..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-darkcard text-xs focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
      </div>

      {/* Cases Table / Cards */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading follow-up recovery queue...</div>
      ) : filteredCases.length === 0 ? (
        <div className="p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <div className="font-bold text-sm text-slate-900 dark:text-white">No Unresolved Cases in This View</div>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            All prioritized follow-ups for this filter criteria have been attended or completed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCases.map((caseItem) => {
            const patient = caseItem.patient;
            const statusColor = CASE_STATUS_COLORS[caseItem.status] || 'bg-slate-100 text-slate-800';
            const attemptsCount = caseItem.contactAttempts?.length || 0;

            return (
              <div
                key={caseItem._id}
                className="p-5 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {caseItem.caseNumber}
                    </span>
                    <div>
                      <Link
                        to={`/app/patients/${patient?._id}`}
                        className="font-extrabold text-sm text-slate-900 dark:text-white hover:text-teal-600 transition flex items-center gap-1.5"
                      >
                        <span>{patient?.name || 'Patient'}</span>
                        <span className="text-xs text-slate-400 font-normal">({patient?.patientId || patient?.patientCode})</span>
                      </Link>
                      <div className="text-[11px] text-slate-500">
                        Program: <strong className="text-slate-700 dark:text-slate-300">{patient?.treatmentProgram || 'Chronic Care'}</strong> • Phone: {patient?.contactInfo?.phone || patient?.phone || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {caseItem.isOverdue && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Overdue {caseItem.overdueDays}d</span>
                      </span>
                    )}
                    
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${statusColor}`}>
                      {caseItem.status.replace(/_/g, ' ')}
                    </span>

                    <RiskBadge score={caseItem.riskScore} category={caseItem.riskLevel} />
                  </div>

                </div>

                {/* Middle Section: Contributing Factors & Recommended Action */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  
                  {/* Contributing Factors */}
                  <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                    <div className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>Factors Driving Risk Classification:</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                      {(caseItem.contributingFactors || []).slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-teal-600 font-bold">•</span>
                          <span><strong>{f.factor} (+{f.points} pts):</strong> {f.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended Action */}
                  <div className="space-y-1.5 bg-teal-50/50 dark:bg-teal-950/20 p-3.5 rounded-2xl border border-teal-200 dark:border-teal-900/60">
                    <div className="font-bold text-teal-950 dark:text-teal-200 flex items-center gap-1.5">
                      <ArrowRight className="w-3.5 h-3.5 text-teal-600" />
                      <span>Recommended Next Action:</span>
                    </div>
                    <p className="text-[11px] text-teal-900/90 dark:text-teal-300 leading-relaxed">
                      {caseItem.recommendedNextAction || 'Contact patient and review continuity support plan.'}
                    </p>
                    <div className="pt-1 text-[10px] text-slate-400">
                      Contact Attempts: <strong>{attemptsCount} logged</strong>
                    </div>
                  </div>

                </div>

                {/* Interactive Action Buttons */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-100 dark:border-slate-800/80">
                  
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/app/patients/${patient?._id}`}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition flex items-center gap-1.5"
                    >
                      <span>View Full Journey</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleReassessScore(patient?._id)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition text-slate-600 dark:text-slate-300 flex items-center gap-1"
                      title="Re-run explainable risk engine"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-teal-600" />
                      <span>Recalculate Score</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Record Contact Attempt */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCase(caseItem);
                        setActiveCaseModal('contact');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-teal-400 dark:text-teal-600" />
                      <span>Record Contact Attempt</span>
                    </button>

                    {/* Reschedule Appointment */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCase(caseItem);
                        setActiveCaseModal('reschedule');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-teal-500 text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 font-bold transition flex items-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>

                    {/* Mark Recovered / Close Case */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCase(caseItem);
                        setActiveCaseModal('outcome');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-teal-600/20"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Record Outcome / Recover</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Record Contact Attempt */}
      {activeCaseModal === 'contact' && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Record Contact Attempt</h3>
                <p className="text-[11px] text-slate-400">Patient: {selectedCase.patient?.name} ({selectedCase.caseNumber})</p>
              </div>
              <button onClick={() => setActiveCaseModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordContact} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Channel Used: *</label>
                <select
                  value={contactChannel}
                  onChange={(e) => setContactChannel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium"
                >
                  <option value="phone_call">Phone Call (Direct)</option>
                  <option value="sms">SMS Text</option>
                  <option value="ivr_call">IVR Voice Call</option>
                  <option value="home_visit">In-Person Home Visit</option>
                  <option value="whatsapp">WhatsApp Message</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Outcome: *</label>
                <select
                  value={contactOutcome}
                  onChange={(e) => setContactOutcome(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium"
                >
                  <option value="reached">Reached / Spoke with Patient or Caregiver</option>
                  <option value="no_answer">No Answer / Ringing</option>
                  <option value="busy">Busy / Call Disconnected</option>
                  <option value="wrong_number">Wrong Number / Switched Off</option>
                  <option value="callback_scheduled">Callback Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Internal Notes & Context:</label>
                <textarea
                  rows={3}
                  value={contactNotes}
                  onChange={(e) => setContactNotes(e.target.value)}
                  placeholder="e.g. Spoke to patient's daughter; confirmed road washed out; agreed on doorstep medicine delivery..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveCaseModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/30"
                >
                  {actionLoading ? 'Saving...' : 'Log Attempt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Reschedule Appointment */}
      {activeCaseModal === 'reschedule' && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Reschedule Follow-up Appointment</h3>
                <p className="text-[11px] text-slate-400">Patient: {selectedCase.patient?.name}</p>
              </div>
              <button onClick={() => setActiveCaseModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordReschedule} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Appointment Date: *</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reason for Rescheduling:</label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  placeholder="e.g. Patient requested morning slot; road cleared after rains"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveCaseModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/30"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Outcome / Mark Recovered */}
      {activeCaseModal === 'outcome' && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Document Verified Case Outcome</h3>
                <p className="text-[11px] text-slate-400">Patient: {selectedCase.patient?.name}</p>
              </div>
              <button onClick={() => setActiveCaseModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-300">
              <strong>Requirement:</strong> Do not mark a patient as recovered merely because a message was sent. Recovery must be based on a clearly documented outcome (e.g., patient attended clinic, collected doorstep refill, or completed consult).
            </div>

            <form onSubmit={handleRecordOutcome} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Outcome Status: *</label>
                <select
                  value={outcomeStatus}
                  onChange={(e) => setOutcomeStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium"
                >
                  <option value="recovered_to_care">Recovered to Care (Attended Visit / Received Refill)</option>
                  <option value="completed_followup">Follow-Up Successfully Completed</option>
                  <option value="unresolved_refusal">Patient Refused Follow-up / Care Lapsed</option>
                  <option value="patient_relocated">Patient Relocated Out of Area</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Verified Recovery Documentation: *</label>
                <textarea
                  rows={3}
                  value={recoveryReason}
                  onChange={(e) => setRecoveryReason(e.target.value)}
                  placeholder="Document clinical or logistical evidence (e.g. ASHA delivered 30-day Metformin buffer to home; blood sugar verified 134 mg/dL)..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveCaseModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-600/30"
                >
                  {actionLoading ? 'Saving...' : 'Document & Close Case'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
