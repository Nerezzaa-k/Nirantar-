import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import RiskBadge from '../components/common/RiskBadge';
import AiExplanationModal from '../components/common/AiExplanationModal';
import RecordVisitModal from '../components/common/RecordVisitModal';
import { useNotifications } from '../context/NotificationContext';
import {
  Users,
  Search,
  Filter,
  Plus,
  Calendar,
  Sparkles,
  ChevronRight,
  RefreshCw,
  Phone,
  MapPin,
  X
} from 'lucide-react';

export default function PatientDirectory() {
  const { showToast } = useNotifications();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // New patient modal
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [villages, setVillages] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [newPatientForm, setNewPatientForm] = useState({
    name: '',
    age: '',
    gender: 'Female',
    phone: '',
    villageId: '',
    primaryCondition: '',
    distanceToFacilityKm: 5.0
  });

  // Modals
  const [selectedPatientForAi, setSelectedPatientForAi] = useState(null);
  const [selectedPatientRisk, setSelectedPatientRisk] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedPatientForVisit, setSelectedPatientForVisit] = useState(null);
  const [showVisitModal, setShowVisitModal] = useState(false);

  useEffect(() => {
    fetchPatients();
    loadVillagesAndConditions();
  }, [activeFilter, page]);

  const loadVillagesAndConditions = async () => {
    try {
      const [vRes, cRes] = await Promise.all([
        api.get('/villages'),
        api.get('/conditions')
      ]);
      if (vRes.data.success) {
        setVillages(vRes.data.villages);
        if (vRes.data.villages.length > 0) {
          setNewPatientForm(prev => ({ ...prev, villageId: vRes.data.villages[0]._id }));
        }
      }
      if (cRes.data.success) {
        setConditions(cRes.data.conditions);
        if (cRes.data.conditions.length > 0) {
          setNewPatientForm(prev => ({ ...prev, primaryCondition: cRes.data.conditions[0]._id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 25,
        filter: activeFilter !== 'all' ? activeFilter : undefined,
        search: searchQuery || undefined
      };
      const res = await api.get('/patients', { params });
      if (res.data.success) {
        setPatients(res.data.patients);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchPatients();
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/patients', newPatientForm);
      if (res.data.success) {
        showToast(`Patient ${res.data.patient.name} registered and initial risk score calculated!`, 'success');
        setShowNewPatientModal(false);
        fetchPatients();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create patient', 'error');
    }
  };

  const openAiExplain = async (patient) => {
    setSelectedPatientForAi(patient);
    try {
      const res = await api.get(`/patients/${patient._id}/risk`);
      if (res.data.success) {
        setSelectedPatientRisk(res.data.riskScore);
        setShowAiModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filterTabs = [
    { key: 'all', label: 'All Patients' },
    { key: 'high_risk', label: '🚨 High Risk (60+)' },
    { key: 'due_soon', label: '📅 Due Soon' },
    { key: 'missed_visit', label: '❌ Missed Visit' },
    { key: 'missed_refill', label: '💊 Overdue Refill' },
    { key: 'pending_intervention', label: '⚡ Pending Action' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            <span>Patient Adherence Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete list of registered long-term care patients across facilities and village catchment areas.
          </p>
        </div>

        <button
          onClick={() => setShowNewPatientModal(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-brand-700/20"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, ID (e.g. PAT-1001), village or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {filterTabs.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setActiveFilter(f.key);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors font-medium text-xs ${
                activeFilter === f.key
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patients Table */}
      <div className="rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
            Loading patient records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/20">
                  <th className="py-3 px-4">Patient Name & ID</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Village</th>
                  <th className="py-3 px-4">Risk Category</th>
                  <th className="py-3 px-4">Refill Status</th>
                  <th className="py-3 px-4">Next Clinic Visit</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {patients.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4">
                      <Link to={`/app/patients/${p._id}`} className="font-bold text-slate-900 dark:text-white hover:underline">
                        {p.name}
                      </Link>
                      <div className="text-[10px] font-mono text-slate-400">{p.patientCode} • {p.age}y, {p.gender}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-brand-700 dark:text-brand-300">
                      {p.primaryCondition?.name || 'Hypertension'}
                    </td>
                    <td className="py-3.5 px-4">
                      {p.villageId?.name}
                      <div className="text-[10px] text-slate-400">{p.distanceToFacilityKm} km away</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <RiskBadge category={p.currentRiskCategory} score={p.currentRiskScore} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                        p.refillStatus === 'collected' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        p.refillStatus === 'overdue' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {p.refillStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {p.nextAppointmentDate ? new Date(p.nextAppointmentDate).toLocaleDateString() : 'None'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openAiExplain(p)}
                          className="px-2.5 py-1 rounded-lg border border-brand-200 dark:border-brand-900 bg-brand-50/60 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold hover:bg-brand-100 flex items-center gap-1"
                          title="Explain Risk Score"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Explain</span>
                        </button>
                        <Link
                          to={`/app/patients/${p._id}`}
                          className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Patient Registration Modal */}
      {showNewPatientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-surface-darkcard rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-brand-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Register New Patient</h3>
              <button onClick={() => setShowNewPatientModal(false)} className="p-1 text-white/70 hover:text-white rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="p-6 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newPatientForm.name}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, name: e.target.value })}
                    placeholder="e.g. Anand Prakash"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    value={newPatientForm.age}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, age: e.target.value })}
                    placeholder="e.g. 52"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                  <select
                    value={newPatientForm.gender}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={newPatientForm.phone}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, phone: e.target.value })}
                    placeholder="+91 98765 00000"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Village</label>
                  <select
                    value={newPatientForm.villageId}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, villageId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {villages.map(v => (
                      <option key={v._id} value={v._id}>{v.name} ({v.district})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Primary Condition</label>
                  <select
                    value={newPatientForm.primaryCondition}
                    onChange={(e) => setNewPatientForm({ ...newPatientForm, primaryCondition: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {conditions.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Distance to PHC (km)</label>
                <input
                  type="number"
                  step="0.1"
                  value={newPatientForm.distanceToFacilityKm}
                  onChange={(e) => setNewPatientForm({ ...newPatientForm, distanceToFacilityKm: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewPatientModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-semibold"
                >
                  Save & Calculate Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Explanation Modal */}
      {showAiModal && (
        <AiExplanationModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          patient={selectedPatientForAi}
          riskScore={selectedPatientRisk}
        />
      )}

    </div>
  );
}
