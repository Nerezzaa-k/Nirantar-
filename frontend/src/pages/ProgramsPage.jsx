import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import {
  Layers,
  Settings,
  Plus,
  CheckCircle2,
  Calendar,
  Sliders,
  Shield,
  Activity,
  Heart,
  Edit2,
  Save,
  X
} from 'lucide-react';

export default function ProgramsPage() {
  const { showToast } = useNotifications();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [editingProgram, setEditingProgram] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/programs');
      if (res.data.success) {
        setPrograms(res.data.programs);
        if (res.data.programs.length > 0) {
          setSelectedProgram(res.data.programs[0]);
        }
      }
    } catch (err) {
      showToast('Failed to load treatment programs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (prog) => {
    setEditingProgram({
      ...prog,
      appointmentTypesText: (prog.appointmentTypes || []).join(', ')
    });
  };

  const handleSaveProgram = async (e) => {
    e.preventDefault();
    if (!editingProgram) return;

    setSaving(true);
    try {
      const payload = {
        name: editingProgram.name,
        department: editingProgram.department,
        description: editingProgram.description,
        defaultFollowUpIntervalDays: Number(editingProgram.defaultFollowUpIntervalDays),
        appointmentTypes: editingProgram.appointmentTypesText
          ? editingProgram.appointmentTypesText.split(',').map((s) => s.trim()).filter(Boolean)
          : editingProgram.appointmentTypes
      };

      const res = await api.put(`/programs/${editingProgram._id}`, payload);
      if (res.data.success) {
        showToast('Treatment program settings updated successfully!', 'success');
        setEditingProgram(null);
        fetchPrograms();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update program', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100 text-xs">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-900 text-xs font-bold text-purple-800 dark:text-purple-300">
          <Layers className="w-3.5 h-3.5" />
          <span>Core Feature 11 • Multi-Department Configurator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
          Long-Term Treatment Programs
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Configure follow-up intervals, appointment types, and prioritization rules across clinical departments.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left List of Configured Programs */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 px-1">
            Active Care Programs ({programs.length})
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading programs...</div>
          ) : (
            programs.map((prog) => {
              const isSelected = selectedProgram?._id === prog._id;
              return (
                <div
                  key={prog._id}
                  onClick={() => setSelectedProgram(prog)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 shadow-md text-purple-950 dark:text-purple-200'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-darkcard hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {prog.programCode}
                    </span>
                    <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                      Interval: {prog.defaultFollowUpIntervalDays} days
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm mt-2">{prog.name}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Dept: {prog.department}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Right Details & Edit Panel */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          {selectedProgram ? (
            <>
              <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
                <div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {selectedProgram.programCode}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                    {selectedProgram.name}
                  </h2>
                  <p className="text-slate-500 text-xs">
                    Department: <strong className="text-slate-700 dark:text-slate-300">{selectedProgram.department}</strong>
                  </p>
                </div>

                <button
                  onClick={() => handleEditClick(selectedProgram)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/20"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Configure Settings</span>
                </button>
              </div>

              {/* Description */}
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Program Overview & Scope:</span>
                <p className="p-3.5 rounded-2xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 leading-relaxed">
                  {selectedProgram.description || 'No description provided.'}
                </p>
              </div>

              {/* Appointment Types */}
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Configured Appointment & Monitoring Types:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(selectedProgram.appointmentTypes || []).map((type, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-teal-800 dark:text-teal-300 font-bold text-xs"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prioritization Weights */}
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                  Explainable Prioritization Rule Weights:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Missed Visits</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedProgram.prioritizationRules?.missedAppointmentWeight || 30} pts
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Follow-up Days</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedProgram.prioritizationRules?.daysSinceFollowUpWeight || 20} pts
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Overdue Days</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedProgram.prioritizationRules?.overdueDaysWeight || 20} pts
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-dark border border-slate-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Open Barriers</span>
                    <span className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedProgram.prioritizationRules?.unresolvedBarrierWeight || 15} pts
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">Select a program to inspect configuration.</div>
          )}
        </div>

      </div>

      {/* Edit Program Modal */}
      {editingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Configure {editingProgram.name}</h3>
              <button onClick={() => setEditingProgram(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Program Name: *</label>
                <input
                  type="text"
                  value={editingProgram.name}
                  onChange={(e) => setEditingProgram({ ...editingProgram, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Clinical Department: *</label>
                <input
                  type="text"
                  value={editingProgram.department}
                  onChange={(e) => setEditingProgram({ ...editingProgram, department: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Default Follow-up Interval (Days): *</label>
                <input
                  type="number"
                  value={editingProgram.defaultFollowUpIntervalDays}
                  onChange={(e) => setEditingProgram({ ...editingProgram, defaultFollowUpIntervalDays: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium"
                  required
                  min={7}
                  max={180}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Appointment Types (Comma separated):</label>
                <textarea
                  rows={2}
                  value={editingProgram.appointmentTypesText}
                  onChange={(e) => setEditingProgram({ ...editingProgram, appointmentTypesText: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProgram(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/30"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
