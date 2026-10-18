import React, { useState } from 'react';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { X, Calendar, Activity, Check } from 'lucide-react';

export default function RecordVisitModal({ isOpen, onClose, patient, onVisitSaved }) {
  const { showToast } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    visitType: 'routine_checkup',
    status: 'attended',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    bloodGlucose: '',
    notes: '',
    nextAppointmentDate: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        patientId: patient._id,
        visitDate: form.visitDate,
        visitType: form.visitType,
        status: form.status,
        clinicalMeasurements: {
          bloodPressureSystolic: form.bloodPressureSystolic ? Number(form.bloodPressureSystolic) : undefined,
          bloodPressureDiastolic: form.bloodPressureDiastolic ? Number(form.bloodPressureDiastolic) : undefined,
          bloodGlucose: form.bloodGlucose ? Number(form.bloodGlucose) : undefined
        },
        notes: form.notes,
        nextAppointmentDate: form.nextAppointmentDate || undefined
      };

      const res = await api.post('/visits', payload);
      if (res.data.success) {
        showToast('Clinic/Home visit recorded successfully.', 'success');
        if (onVisitSaved) onVisitSaved();
        onClose();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record visit', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-surface-darkcard rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 bg-brand-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Calendar className="w-5 h-5 text-brand-300" />
            <h3 className="font-bold text-sm">Record Patient Visit: {patient?.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-white/70 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Visit Date</label>
              <input
                type="date"
                required
                value={form.visitDate}
                onChange={(e) => setForm({ ...form, visitDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Visit Type</label>
              <select
                value={form.visitType}
                onChange={(e) => setForm({ ...form, visitType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="routine_checkup">Routine Checkup (PHC)</option>
                <option value="home_visit">Doorstep Home Visit (ASHA)</option>
                <option value="follow_up">Clinical Follow-up</option>
                <option value="refill_collection">Refill Collection</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Visit Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value="attended">Attended</option>
                <option value="missed">Missed Appointment</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Next Follow-up Date</label>
              <input
                type="date"
                value={form.nextAppointmentDate}
                onChange={(e) => setForm({ ...form, nextAppointmentDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Vitals */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-brand-600" />
              <span>Clinical Vitals (Optional)</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-500">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  placeholder="e.g. 130"
                  value={form.bloodPressureSystolic}
                  onChange={(e) => setForm({ ...form, bloodPressureSystolic: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  placeholder="e.g. 85"
                  value={form.bloodPressureDiastolic}
                  onChange={(e) => setForm({ ...form, bloodPressureDiastolic: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500">Blood Glucose (mg/dL)</label>
                <input
                  type="number"
                  placeholder="e.g. 120"
                  value={form.bloodGlucose}
                  onChange={(e) => setForm({ ...form, bloodGlucose: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Clinical / Field Notes</label>
            <textarea
              rows="2"
              placeholder="Adherence check, side effects, notes..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
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
              className="px-5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : 'Save Visit'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
