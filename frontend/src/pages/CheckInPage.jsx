import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import {
  CheckCircle2,
  Heart,
  AlertTriangle,
  HelpCircle,
  Pill,
  Send,
  Sparkles,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function CheckInPage() {
  const { user, role } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  
  // Step form state
  const [feelings, setFeelings] = useState('I feel fine');
  const [hasEnoughMedicine, setHasEnoughMedicine] = useState(true);
  const [tabletsRemaining, setTabletsRemaining] = useState(5);
  const [selectedReason, setSelectedReason] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState(null);

  useEffect(() => {
    const init = async () => {
      // If user is patient with patientId, use it directly
      if (user?.role === 'patient' && user?.patientId) {
        setSelectedPatientId(user.patientId._id || user.patientId);
      } else {
        // Fetch patient list so worker/caregiver can select patient
        try {
          const res = await api.get('/patients', { params: { limit: 50 } });
          if (res.data.success && res.data.patients.length > 0) {
            setPatients(res.data.patients);
            // Default to hero patient PAT-1001 if available
            const hero = res.data.patients.find(p => p.patientCode === 'PAT-1001');
            setSelectedPatientId(hero ? hero._id : res.data.patients[0]._id);
          }
        } catch (e) {
          console.error('Failed to fetch patients list for checkin:', e);
        }
      }
    };
    init();
  }, [user]);

  const feelingOptions = [
    { value: 'I feel fine', label: 'I Feel Fine 😊', desc: 'No troubling symptoms or dizziness', color: 'emerald' },
    { value: 'I have symptoms or concerns', label: 'I Have Symptoms ⚠️', desc: 'Headaches, fatigue, chest flutter or concerns', color: 'amber' },
    { value: 'I need help', label: 'I Need Help 🚨', desc: 'Need urgent attention or unwell', color: 'rose' }
  ];

  const reasonOptions = [
    { value: 'I cannot travel to the healthcare facility', label: 'I cannot travel to the healthcare facility', category: 'travel' },
    { value: 'Feels fine and thinks treatment is unnecessary', label: 'I feel fine and think I no longer need medicine', category: 'belief' },
    { value: 'Medicine is unavailable', label: 'Medicine is unavailable at my pharmacy / PHC', category: 'stock' },
    { value: 'I cannot afford transport or lose wages by attending', label: 'I cannot afford transport or lose daily wages', category: 'money' },
    { value: 'I am experiencing side effects', label: 'I am experiencing side effects from tablets', category: 'clinical' },
    { value: 'I forgot my medication or appointment', label: 'I forgot my medication or appointment date', category: 'cognitive' },
    { value: 'I am too busy with work or family responsibilities', label: 'Too busy with agricultural work or family care', category: 'time' },
    { value: 'Other', label: 'Other personal barrier', category: 'other' },
    { value: 'Prefer not to say', label: 'Prefer not to say', category: 'privacy' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      showToast('Please select a patient', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientId: selectedPatientId,
        reportedSymptomsOrConcerns: feelings,
        medicineAvailable: hasEnoughMedicine,
        tabletsRemaining: Number(tabletsRemaining),
        selectedReason: hasEnoughMedicine ? (selectedReason || undefined) : (selectedReason || 'Medicine is unavailable'),
        additionalNotes: notes
      };

      const res = await api.post('/checkins', payload);
      if (res.data.success) {
        showToast('Weekly check-in recorded! Rescue intervention triggered.', 'success');
        setSubmittedResult(res.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit check-in', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 to-brand-800 text-white shadow-xl space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-brand-200">
            Self-Reported Adherence Check
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black">Weekly Treatment Check-in</h1>
        <p className="text-xs text-brand-200">
          Answer 3 quick questions. If you are experiencing obstacles, Nirantar will match you with the right rescue action immediately.
        </p>
      </div>

      {submittedResult ? (
        /* Confirmation & Rescue Action Screen */
        <div className="p-6 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Check-In Recorded Successfully!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your response has been saved in MongoDB and dispatched to your assigned ASHA care worker.
            </p>
          </div>

          {/* Rescue Engine Match Card */}
          {submittedResult.intervention ? (
            <div className="p-4 rounded-xl bg-teal-50 dark:bg-brand-950/40 border border-teal-200 dark:border-brand-900 space-y-3">
              <div className="flex items-center gap-2 text-brand-800 dark:text-brand-300 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>Configured Rescue Engine Action Match</span>
              </div>

              <div className="space-y-1 text-xs">
                <div className="text-slate-500 dark:text-slate-400">Target Reason:</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  "{submittedResult.intervention.reportedReason}"
                </div>

                <div className="pt-2 text-slate-500 dark:text-slate-400">Automated Care Recommendation:</div>
                <div className="p-3 rounded-lg bg-white dark:bg-surface-darkcard font-medium text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                  {submittedResult.intervention.recommendedAction}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Task Status: <strong className="text-amber-600 uppercase font-semibold">Assigned</strong></span>
                <span>Priority: <strong className="text-rose-600 uppercase font-semibold">{submittedResult.intervention.priority}</strong></span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
              No barriers reported. Your adherence remains well-maintained. Continue taking your daily prescribed doses!
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => setSubmittedResult(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Submit Another Check-in
            </button>
            <button
              onClick={() => navigate('/app/home')}
              className="px-5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <span>Back to Home</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      ) : (
        /* The Check-In Form */
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-xs">
          
          {/* Patient Selector for Worker/Caregiver modes */}
          {role !== 'patient' && patients.length > 0 && (
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Reporting on Behalf of Patient:
              </label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                {patients.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.patientCode}) — {p.primaryCondition?.name || 'Hypertension'} • {p.villageId?.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Question 1: How are you feeling today? */}
          <div className="space-y-2">
            <label className="block font-bold text-sm text-slate-900 dark:text-white">
              1. How are you feeling today?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {feelingOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setFeelings(opt.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    feelings === opt.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 ring-2 ring-brand-500/20 font-bold'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-xs">{opt.label}</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-normal">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question 2: Medicine Availability & Tablets Remaining */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <label className="block font-bold text-sm text-slate-900 dark:text-white">
              2. Do you have enough medication at home?
            </label>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="medicineAvailable"
                  checked={hasEnoughMedicine === true}
                  onChange={() => setHasEnoughMedicine(true)}
                  className="w-4 h-4 text-brand-600"
                />
                <span>Yes, I have medication remaining</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="radio"
                  name="medicineAvailable"
                  checked={hasEnoughMedicine === false}
                  onChange={() => {
                    setHasEnoughMedicine(false);
                    setSelectedReason('Medicine is unavailable');
                  }}
                  className="w-4 h-4 text-rose-600"
                />
                <span>No, I am out of medicine</span>
              </label>
            </div>

            {hasEnoughMedicine && (
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] text-slate-500">Estimated tablets remaining:</span>
                  <span className="font-mono font-bold text-brand-700 dark:text-brand-300 text-sm">{tabletsRemaining} tablets</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={tabletsRemaining}
                  onChange={(e) => setTabletsRemaining(e.target.value)}
                  className="w-full accent-brand-600 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Question 3: Barriers & Reasons */}
          <div className="space-y-2">
            <label className="block font-bold text-sm text-slate-900 dark:text-white">
              3. Is anything making it hard to take pills or attend the clinic?
            </label>
            <p className="text-[11px] text-slate-500">
              Select the primary barrier you are facing. Nirantar matches each reason to an active rescue:
            </p>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {reasonOptions.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedReason === r.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-200 font-semibold ring-1 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedReason"
                    value={r.value}
                    checked={selectedReason === r.value}
                    onChange={() => setSelectedReason(r.value)}
                    className="w-4 h-4 text-brand-600"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Optional Note */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Optional Note for Your Care Worker:
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Roads flooded due to monsoon, or experiencing morning dizziness..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-brand-700 hover:bg-brand-800 text-white font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-brand-700/20 transition-all hover:scale-[1.01]"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Recording Check-in...' : 'Submit Weekly Check-In'}</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
