import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import HotspotMap from '../components/maps/HotspotMap';
import RiskBadge from '../components/common/RiskBadge';
import AiExplanationModal from '../components/common/AiExplanationModal';
import RecordVisitModal from '../components/common/RecordVisitModal';
import RecordOutcomeModal from '../components/common/RecordOutcomeModal';
import BarrierReportModal from '../components/common/BarrierReportModal';
import WorkerAssistantDrawer from '../components/common/WorkerAssistantDrawer';
import {
  Users,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingUp,
  MapPin,
  PieChart,
  Award,
  Package,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Filter,
  CheckCircle2,
  Phone,
  Calendar,
  Building2,
  HeartHandshake,
  Bot,
  Activity,
  ArrowRight,
  Send,
  Plus,
  Stethoscope,
  Search,
  CheckCircle,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export default function HospitalNgoDashboard() {
  const navigate = useNavigate();

  // Active section inside the single unified dashboard
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'barriers' | 'rescues' | 'whatWorks' | 'hotspots' | 'pharmacy'

  // Dashboard Data states
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [reasons, setReasons] = useState([]);
  const [effectiveness, setEffectiveness] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [patients, setPatients] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [pharmacyStock, setPharmacyStock] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);

  // Filters
  const [selectedCondition, setSelectedCondition] = useState('');
  const [conditionsList, setConditionsList] = useState([]);
  const [patientFilter, setPatientFilter] = useState('high_risk'); // 'all' | 'high_risk' | 'lapsed' | 'due_soon'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showAiModal, setShowAiModal] = useState(false);
  const [selectedPatientForAi, setSelectedPatientForAi] = useState(null);

  const [showVisitModal, setShowVisitModal] = useState(false);
  const [selectedPatientForVisit, setSelectedPatientForVisit] = useState(null);

  const [showBarrierModal, setShowBarrierModal] = useState(false);
  const [selectedPatientForBarrier, setSelectedPatientForBarrier] = useState(null);

  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState(null);

  const [showAssistant, setShowAssistant] = useState(false);

  useEffect(() => {
    fetchConditions();
    fetchDashboardData();
  }, [selectedCondition]);

  const fetchConditions = async () => {
    try {
      const res = await api.get('/conditions');
      if (res.data.success) {
        setConditionsList(res.data.conditions || []);
      }
    } catch (e) {
      console.error('Error fetching conditions:', e);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const query = selectedCondition ? { conditionId: selectedCondition } : {};

      const [
        summaryRes,
        reasonsRes,
        effRes,
        hotRes,
        patientsRes,
        interventionsRes,
        stockRes,
        aiRes
      ] = await Promise.all([
        api.get('/analytics/summary', { params: query }),
        api.get('/analytics/dropout-reasons', { params: query }),
        api.get('/analytics/intervention-effectiveness', { params: query }),
        api.get('/analytics/hotspots', { params: query }),
        api.get('/patients', { params: { limit: 50, conditionId: selectedCondition || undefined } }),
        api.get('/interventions', { params: { limit: 20 } }),
        api.get('/stock', { params: {} }),
        api.post('/ai/district-summary', {})
      ]);

      if (summaryRes.data.success) setMetrics(summaryRes.data.metrics);
      if (reasonsRes.data.success) setReasons(reasonsRes.data.reasons || []);
      if (effRes.data.success) setEffectiveness(effRes.data.effectiveness || []);
      if (hotRes.data.success) setHotspots(hotRes.data.hotspots || []);
      if (patientsRes.data.success) setPatients(patientsRes.data.patients || []);
      if (interventionsRes.data.success) setInterventions(interventionsRes.data.interventions || []);
      if (stockRes.data.success) setPharmacyStock(stockRes.data.stock || []);
      if (aiRes.data.success) setAiSummary(aiRes.data.summary);
    } catch (err) {
      console.error('Failed to load Hospital & NGO Dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Color palette for reason donut
  const REASON_COLORS = ['#0d9488', '#f59e0b', '#e11d48', '#3b82f6', '#8b5cf6', '#64748b', '#10b981'];

  // Filtered patients for priority queue
  const filteredPatients = patients.filter((p) => {
    // Condition filter
    if (selectedCondition && p.primaryCondition?._id !== selectedCondition && p.primaryCondition !== selectedCondition) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(query);
      const matchCode = p.patientCode?.toLowerCase().includes(query);
      const matchVillage = p.villageId?.name?.toLowerCase().includes(query);
      if (!matchName && !matchCode && !matchVillage) return false;
    }

    // Queue filter
    if (patientFilter === 'high_risk') {
      return p.currentRiskScore >= 60 || p.currentRiskCategory === 'high';
    }
    if (patientFilter === 'lapsed') {
      return p.remainingDaysOfMedication <= 0 || (p.missedVisitsCount && p.missedVisitsCount > 0);
    }
    if (patientFilter === 'due_soon') {
      return p.remainingDaysOfMedication <= 3 && p.remainingDaysOfMedication > 0;
    }
    return true; // 'all'
  });

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hospital & NGO Command Header */}
      <div className="rounded-3xl p-6 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-teal-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-teal-400/20 text-teal-200 border border-teal-400/30 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-300" />
                Hospital & NGO Operations Command
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1">
                <HeartHandshake className="w-3 h-3 text-teal-300" />
                Jan Swasthya NGO Collaborative
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Nirantar Adherence Operations
            </h1>
            <p className="text-xs text-teal-100/80 max-w-2xl">
              Catchment: <strong>Rampur Community Health Centre (CHC)</strong> & 5 Rural Gram Panchayats. 
              Predicting treatment dropouts, capturing patient barriers, and coordinating frontline rescue outreach.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Condition Filter */}
            <div className="relative">
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="pl-8 pr-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-400 backdrop-blur-md cursor-pointer"
              >
                <option value="" className="text-slate-900 bg-white">All Chronic Conditions</option>
                {conditionsList.map((cond) => (
                  <option key={cond._id} value={cond._id} className="text-slate-900 bg-white">
                    {cond.name}
                  </option>
                ))}
              </select>
              <Filter className="w-3.5 h-3.5 text-teal-300 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Quick Refresh */}
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Register Patient */}
            <Link
              to="/app/patients"
              className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-teal-500/20 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Enroll Patient</span>
            </Link>

            {/* AI Assistant Button */}
            <button
              onClick={() => setShowAssistant(true)}
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/20 transition-transform active:scale-95"
            >
              <Bot className="w-4 h-4" />
              <span>AI Copilot</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Mission-Critical Operational KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Total Enrolled */}
        <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Patients on Treatment</span>
            <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {metrics?.totalPatients || 35}
          </div>
          <div className="text-[10px] text-teal-700 dark:text-teal-400 font-medium">
            Active cohort monitored
          </div>
        </div>

        {/* KPI 2: High Risk Alert */}
        <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">High Risk Dropout</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400">
            {metrics?.highRiskCount || 8}
          </div>
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold">
            Score ≥ 60 • Needs urgent rescue
          </div>
        </div>

        {/* KPI 3: Lapsed / Missed */}
        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Lapsed / Overdue</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400">
            {metrics?.lapsedPatients || 14}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            Refill gap or missed visit
          </div>
        </div>

        {/* KPI 4: Active Rescues */}
        <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-900/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-sky-700 dark:text-sky-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Rescues</span>
            <Activity className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-700 dark:text-sky-400">
            {metrics?.pendingInterventions || 8}
          </div>
          <div className="text-[10px] text-sky-600 dark:text-sky-400 font-medium">
            Field tasks in progress
          </div>
        </div>

        {/* KPI 5: Rescued Retention */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rescue Success</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {metrics?.rescuedThisMonth || 13}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            Retention rate: 89.5%
          </div>
        </div>

        {/* KPI 6: Pharmacy Stockout Alert */}
        <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Hospital Pharmacy</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700 dark:text-purple-400">
            1 Stockout
          </div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium truncate">
            Telmisartan 40mg (Transfer avail)
          </div>
        </div>
      </div>

      {/* 3. AI Clinical & Catchment Adherence Briefing */}
      {aiSummary && (
        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 shadow-sm flex items-start gap-3">
          <div className="p-2 rounded-xl bg-teal-600 text-white shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wide">
                AI Clinical Decision Support Briefing
              </span>
              <span className="text-[10px] text-teal-700 dark:text-teal-400 font-mono">
                {aiSummary.source === 'openai' ? 'GPT-4o-mini' : 'Clinical Protocol Engine'}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {aiSummary.executiveNarrative || aiSummary.summary}
            </p>
          </div>
        </div>
      )}

      {/* 4. Single Dashboard Workflow Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'queue'
              ? 'bg-white dark:bg-surface-darkcard text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 text-teal-600" />
          <span>Priority Patient Queue ({filteredPatients.length})</span>
          <span className="w-2 h-2 rounded-full bg-rose-500" />
        </button>

        <button
          onClick={() => setActiveTab('barriers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'barriers'
              ? 'bg-white dark:bg-surface-darkcard text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PieChart className="w-4 h-4 text-amber-600" />
          <span>Barrier Intelligence ("UNDERSTAND")</span>
        </button>

        <button
          onClick={() => setActiveTab('rescues')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'rescues'
              ? 'bg-white dark:bg-surface-darkcard text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-sky-600" />
          <span>Field Rescue Tasks ("RESCUE")</span>
        </button>

        <button
          onClick={() => setActiveTab('whatWorks')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'whatWorks'
              ? 'bg-white dark:bg-surface-darkcard text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Award className="w-4 h-4 text-emerald-600" />
          <span>"What Works" Learning Engine ("LEARN")</span>
        </button>

        <button
          onClick={() => setActiveTab('hotspots')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'hotspots'
              ? 'bg-white dark:bg-surface-darkcard text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4 text-purple-600" />
          <span>Catchment Map</span>
        </button>

        <button
          onClick={() => setActiveTab('pharmacy')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'pharmacy'
              ? 'bg-white dark:bg-surface-darkcard text-teal-700 dark:text-teal-300 shadow-sm border border-slate-200 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-4 h-4 text-teal-600" />
          <span>Hospital Pharmacy</span>
        </button>
      </div>

      {/* 5. TAB VIEW 1: PRIORITY PATIENT WORK QUEUE ("PREDICT") */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Sub-toolbar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient name, PAT-1001, village..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Quick Segment Filter */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {[
                { id: 'high_risk', label: '🚨 High Risk (≥60)' },
                { id: 'lapsed', label: '⏳ Lapsed / Overdue' },
                { id: 'due_soon', label: '⚠️ Refill Due (≤3 days)' },
                { id: 'all', label: 'All Patients' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setPatientFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    patientFilter === f.id
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Patients List Grid */}
          <div className="space-y-2.5">
            {filteredPatients.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-teal-600" />
                <p className="text-sm font-semibold">No patients matching current filter criteria.</p>
                <p className="text-xs">Adjust your search or filter tags above.</p>
              </div>
            ) : (
              filteredPatients.map((patient) => {
                const isHero = patient.patientCode === 'PAT-1001';
                return (
                  <div
                    key={patient._id}
                    className={`p-4 rounded-2xl bg-white dark:bg-surface-darkcard border transition-all hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                      patient.currentRiskScore >= 60
                        ? 'border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Patient Core Info */}
                    <div className="space-y-1.5 flex-1 min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/app/patients/${patient._id}`}
                          className="font-extrabold text-sm text-slate-900 dark:text-white hover:text-teal-600 dark:hover:text-teal-400 transition-colors flex items-center gap-1.5"
                        >
                          <span>{patient.name}</span>
                          <span className="text-xs font-mono font-medium text-slate-400">
                            ({patient.patientCode})
                          </span>
                        </Link>
                        {isHero && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200">
                            Demo Hero Case
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {patient.primaryCondition?.name || 'Hypertension'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {patient.villageId?.name || 'Rampur'} ({patient.distanceToFacilityKm || 14} km)
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Medication remaining: <strong className={patient.remainingDaysOfMedication <= 2 ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>{patient.remainingDaysOfMedication || 2} days</strong>
                        </span>
                        {patient.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {patient.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Risk Badge & Score Contribution */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Adherence Risk
                        </div>
                        <div className="flex items-center gap-1.5 justify-end mt-0.5">
                          <span className={`text-base font-black ${patient.currentRiskScore >= 60 ? 'text-rose-600' : patient.currentRiskScore >= 30 ? 'text-amber-500' : 'text-emerald-600'}`}>
                            {patient.currentRiskScore}/100
                          </span>
                          <RiskBadge category={patient.currentRiskCategory || (patient.currentRiskScore >= 60 ? 'high' : patient.currentRiskScore >= 30 ? 'medium' : 'low')} />
                        </div>
                      </div>
                    </div>

                    {/* Action Triggers */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* AI Explain Risk */}
                      <button
                        onClick={() => {
                          setSelectedPatientForAi(patient);
                          setShowAiModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 dark:hover:bg-teal-900/50 flex items-center gap-1 transition-all"
                        title="AI clinical risk explanation"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span>AI Explain</span>
                      </button>

                      {/* Log Barrier / Check-in on behalf of patient */}
                      <button
                        onClick={() => {
                          setSelectedPatientForBarrier(patient);
                          setShowBarrierModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 flex items-center gap-1 transition-all"
                        title="Capture patient-reported barrier or check-in"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Log Barrier</span>
                      </button>

                      {/* Quick Record Visit */}
                      <button
                        onClick={() => {
                          setSelectedPatientForVisit(patient);
                          setShowVisitModal(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1 transition-all"
                        title="Record clinical visit or vitals"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-slate-600" />
                        <span>Log Visit</span>
                      </button>

                      {/* Patient Profile Link */}
                      <Link
                        to={`/app/patients/${patient._id}`}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View Patient Record"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 6. TAB VIEW 2: BARRIER INTELLIGENCE ("UNDERSTAND") */}
      {activeTab === 'barriers' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Reason Donut Chart */}
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Why Are Patients Dropping Out?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Patient-reported barriers captured via check-ins and hospital outreach
                </p>
              </div>
              <PieChart className="w-5 h-5 text-teal-600" />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={reasons}
                    dataKey="count"
                    nameKey="reason"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {reasons.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={REASON_COLORS[index % REASON_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px'
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reason Table & Action Protocol */}
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Reason-to-Rescue Protocol Mapping
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated clinical protocols dispatched for each detected barrier
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { reason: 'Cannot travel / Monsoon road disruption', count: 9, rescue: 'Doorstep Refill Batch Delivery', actor: 'ASHA / NGO Field Lead' },
                { reason: 'Cannot afford transport / Wage loss', count: 7, rescue: 'Transport Voucher / Rickshaw Link', actor: 'Panchayat Welfare' },
                { reason: 'Medicine unavailable at PHC', count: 5, rescue: 'Alternate PHC Stock Transfer', actor: 'Hospital Pharmacy MOIC' },
                { reason: 'Mild side effects / dizziness', count: 4, rescue: 'Medical Officer Home Call', actor: 'Staff Doctor' },
                { reason: 'Felt fine and discontinued', count: 3, rescue: 'Bilingual Adherence Education', actor: 'Care Coordinator' }
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{item.reason}</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 font-bold text-[10px]">
                        {item.count} cases
                      </span>
                    </div>
                    <div className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1">
                      <ArrowRight className="w-3 h-3" />
                      Rescue: {item.rescue}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {item.actor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB VIEW 3: FIELD RESCUE TASKS ("RESCUE") */}
      {activeTab === 'rescues' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Active Hospital & NGO Field Rescues
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Targeted adherence interventions currently dispatched across catchment villages
              </p>
            </div>
            <Link
              to="/app/interventions"
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>View Full Kanban Queue</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {interventions.length === 0 ? (
              <div className="col-span-full p-8 text-center text-slate-400">No active interventions.</div>
            ) : (
              interventions.slice(0, 6).map((item) => (
                <div
                  key={item._id}
                  className="p-4 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.priority === 'urgent' || item.priority === 'high'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {item.priority || 'High'} Priority
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {item.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {item.patientId?.name || 'Patient Case'}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                      <strong>Target Barrier:</strong> {item.targetBarrier || 'Travel disruption / refill overdue'}
                    </div>

                    <div className="text-[11px] text-teal-700 dark:text-teal-400 font-semibold">
                      Action: {item.recommendedAction || 'Doorstep delivery & clinical refill'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">
                      Assigned: {item.assignedToWorkerId?.name || 'Sunita Devi (ASHA)'}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedIntervention(item);
                        setShowOutcomeModal(true);
                      }}
                      className="px-2.5 py-1 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-1 transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Log Outcome</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 8. TAB VIEW 4: "WHAT WORKS" LEARNING ENGINE ("LEARN") */}
      {activeTab === 'whatWorks' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>"What Works" Adherence Efficacy Engine</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Live evidence table computed from real MongoDB outcome records: measuring which rescues effectively retain patients
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
              Live DB Aggregation
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-3">Rescue Protocol</th>
                  <th className="pb-3">Intervention Type</th>
                  <th className="pb-3 text-center">Assigned</th>
                  <th className="pb-3 text-center">Reached</th>
                  <th className="pb-3 text-center">Retained</th>
                  <th className="pb-3 text-right">Efficacy Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {effectiveness.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">
                      Loading intervention outcome history...
                    </td>
                  </tr>
                ) : (
                  effectiveness.map((eff, index) => {
                    const rate = eff.successRate || 0;
                    return (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 font-bold text-slate-900 dark:text-white">
                          {eff.label || eff.interventionType?.replace('_', ' ')}
                        </td>
                        <td className="py-3 font-mono text-[11px] text-slate-500">
                          {eff.interventionType}
                        </td>
                        <td className="py-3 text-center text-slate-700 dark:text-slate-300 font-semibold">
                          {eff.assignedCount || eff.sampleSize || 0}
                        </td>
                        <td className="py-3 text-center text-slate-700 dark:text-slate-300">
                          {eff.patientReachedCount || eff.completedCount || 0}
                        </td>
                        <td className="py-3 text-center text-emerald-600 font-bold">
                          {eff.successfulCount || 0}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                            rate >= 75
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : rate >= 50
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {rate}% Success
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 9. TAB VIEW 5: CATCHMENT AREA MAP */}
      {activeTab === 'hotspots' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Catchment Area Geographic Map
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interactive spatial visualization of Rampur CHC and surrounding partner villages
              </p>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> High Risk Hotspot
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ml-2" /> Safe Retained
            </span>
          </div>

          <div className="h-96 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <HotspotMap hotspots={hotspots} />
          </div>
        </div>
      )}

      {/* 10. TAB VIEW 6: HOSPITAL PHARMACY & INVENTORY */}
      {activeTab === 'pharmacy' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                <span>Hospital Essential Medicine Stock</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitoring chronic medications to preempt supply-side non-adherence
              </p>
            </div>
            <Link
              to="/dashboard/inventory"
              className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
            >
              <span>Manage Pharmacy</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="pb-3">Medication Name</th>
                  <th className="pb-3">Condition</th>
                  <th className="pb-3">Facility</th>
                  <th className="pb-3 text-center">Available Stock</th>
                  <th className="pb-3 text-center">Reorder Threshold</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {pharmacyStock.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">
                      Loading pharmacy stock...
                    </td>
                  </tr>
                ) : (
                  pharmacyStock.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">
                        {item.medicationName}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">
                        {item.conditionId?.name || 'Hypertension'}
                      </td>
                      <td className="py-3 text-slate-500">
                        {item.facilityId?.name || 'Rampur CHC'}
                      </td>
                      <td className="py-3 text-center font-mono font-bold">
                        {item.quantityAvailable} {item.unit || 'tablets'}
                      </td>
                      <td className="py-3 text-center text-slate-400">
                        {item.reorderThreshold} {item.unit || 'tablets'}
                      </td>
                      <td className="py-3 text-right">
                        {item.isStockout || item.quantityAvailable <= 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300">
                            🚨 Stockout Alert
                          </span>
                        ) : item.quantityAvailable <= item.reorderThreshold ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Adequate
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 11. MODALS */}
      {/* AI Explanation Modal */}
      {showAiModal && selectedPatientForAi && (
        <AiExplanationModal
          isOpen={showAiModal}
          onClose={() => {
            setShowAiModal(false);
            setSelectedPatientForAi(null);
          }}
          patient={selectedPatientForAi}
        />
      )}

      {/* Record Visit Modal */}
      {showVisitModal && selectedPatientForVisit && (
        <RecordVisitModal
          isOpen={showVisitModal}
          onClose={() => {
            setShowVisitModal(false);
            setSelectedPatientForVisit(null);
          }}
          patient={selectedPatientForVisit}
          onSuccess={() => {
            fetchDashboardData();
          }}
        />
      )}

      {/* Barrier Report Modal */}
      {showBarrierModal && selectedPatientForBarrier && (
        <BarrierReportModal
          isOpen={showBarrierModal}
          onClose={() => {
            setShowBarrierModal(false);
            setSelectedPatientForBarrier(null);
          }}
          patient={selectedPatientForBarrier}
          onSuccess={() => {
            fetchDashboardData();
          }}
        />
      )}

      {/* Record Outcome Modal */}
      {showOutcomeModal && selectedIntervention && (
        <RecordOutcomeModal
          isOpen={showOutcomeModal}
          onClose={() => {
            setShowOutcomeModal(false);
            setSelectedIntervention(null);
          }}
          intervention={selectedIntervention}
          onSuccess={() => {
            fetchDashboardData();
          }}
        />
      )}

      {/* AI Assistant Drawer */}
      <WorkerAssistantDrawer
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
      />
    </div>
  );
}
