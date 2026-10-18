import React, { useState } from 'react';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { X, Award, CheckCircle } from 'lucide-react';

export default function RecordOutcomeModal({ isOpen, onClose, intervention, onOutcomeSaved }) {
  const { showToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    outcomeType: 'treatment_resumed',
    patientReached: true,
    treatmentResumedOrMaintained: true,
    actionTakenNotes: 'Delivered medication supply at doorstep and delivered adherence script.',
    notes: 'Patient confirmed taking morning and evening tablets consistently.'
  });

  if (!isOpen || !intervention) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post(`/interventions/${intervention._id}/outcome`, {
        outcomeType: form.outcomeType,
        patientReached: form.patientReached,
        treatmentResumedOrMaintained: form.treatmentResumedOrMaintained,
        notes: `${form.actionTakenNotes} | Observed Outcome: ${form.notes}`
      });

      if (res.data.success) {
        showToast('Intervention completed and patient outcome recorded in database!', 'success');
        if (onOutcomeSaved) onOutcomeSaved();
        onClose();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record outcome', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-surface-darkcard rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Award className="w-5 h-5 text-emerald-300" />
            <div>
              <h3 className="font-bold text-sm">Record Rescue Outcome (LEARN Step)</h3>
              <p className="text-[11px] text-emerald-200">Patient: {intervention?.patientId?.name || 'Patient'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-white/70 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Target Barrier</span>
            <p className="font-bold text-slate-900 dark:text-white">{intervention?.reportedReason}</p>
            <p className="text-[11px] text-brand-700 dark:text-brand-300">Action: {intervention?.recommendedAction}</p>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Observed Outcome Status</label>
            <select
              value={form.outcomeType}
              onChange={(e) => setForm({ ...form, outcomeType: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
            >
              <option value="treatment_resumed">Treatment Resumed Successfully</option>
              <option value="treatment_maintained">Treatment Maintained (Continuous)</option>
              <option value="escalated_to_doctor">Escalated to PHC Medical Officer</option>
              <option value="patient_unreachable">Patient Unreachable</option>
              <option value="refused_care">Patient Refused Care</option>
              <option value="other">Other Outcome</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={form.patientReached}
                onChange={(e) => setForm({ ...form, patientReached: e.target.checked })}
                className="w-4 h-4 text-brand-600 rounded"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Patient Reached</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={form.treatmentResumedOrMaintained}
                onChange={(e) => setForm({ ...form, treatmentResumedOrMaintained: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200">Adherence Restored</span>
            </label>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">What Action Did You Take?</label>
            <input
              type="text"
              required
              value={form.actionTakenNotes}
              onChange={(e) => setForm({ ...form, actionTakenNotes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              placeholder="e.g. Conducted doorstep refill or counselling..."
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Observed Results & Follow-up Notes</label>
            <textarea
              rows="2"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              placeholder="Patient feedback, remaining tablets, verification..."
            />
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{loading ? 'Completing...' : 'Complete & Record Outcome'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
