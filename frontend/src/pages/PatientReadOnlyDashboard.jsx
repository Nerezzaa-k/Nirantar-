import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Heart,
  Calendar,
  Pill,
  Clock,
  ShieldCheck,
  PhoneCall,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Building2,
  Lock,
  Eye,
  CheckCircle2,
  FileText,
  Activity,
  AlertCircle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export default function PatientReadOnlyDashboard() {
  const { user, logout } = useAuth();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [user]);

  const fetchPatientData = async () => {
    setLoading(true);
    try {
      // Find patient record linked to current user or hero patient PAT-1001
      const res = await api.get('/patients', { params: { search: 'PAT-1001' } });
      if (res.data.patients && res.data.patients.length > 0) {
        setPatientData(res.data.patients[0]);
      }
    } catch (err) {
      console.error('Error fetching patient read-only data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Static/Fallback data for Ramesh Kumar PAT-1001
  const patient = patientData || {
    name: 'Ramesh Kumar',
    patientCode: 'PAT-1001',
    age: 58,
    gender: 'Male',
    primaryCondition: { name: 'Hypertension (High Blood Pressure)' },
    villageId: { name: 'Kalyanpur', distanceToFacilityKm: 7.8 },
    remainingDaysOfMedication: 2,
    nextRefillDate: '2026-10-19',
    nextAppointmentDate: '2026-11-15'
  };

  const adherenceTrendData = [
    { week: 'W1', pillsTaken: 7, target: 7 },
    { week: 'W2', pillsTaken: 7, target: 7 },
    { week: 'W3', pillsTaken: 6, target: 7 },
    { week: 'W4', pillsTaken: 7, target: 7 },
    { week: 'W5', pillsTaken: 7, target: 7 },
    { week: 'W6', pillsTaken: 7, target: 7 },
    { week: 'W7', pillsTaken: 5, target: 7 },
    { week: 'W8', pillsTaken: 7, target: 7 }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* 1. Prominent Read-Only Portal Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-lg flex items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">
                Patient Portal (Read-Only Mode)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                View Access Only
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Securely view your treatment schedule and remaining medication. Clinical changes can only be made by Rampur CHC staff or Jan Swasthya NGO workers.
            </p>
          </div>
        </div>

        <button
          onClick={fetchPatientData}
          disabled={loading}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all shrink-0"
          title="Refresh Treatment Schedule"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 2. Patient Greeting & Identification Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200">
              Enrolled Chronic Care Patient
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {patient.patientCode || 'PAT-1001'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Namaste, {patient.name || 'Ramesh Kumar'}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-teal-600" />
              Condition: <strong className="text-slate-900 dark:text-white">{patient.primaryCondition?.name || 'Hypertension'}</strong>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Village: <strong className="text-slate-900 dark:text-white">{patient.villageId?.name || 'Kalyanpur'}</strong> ({patient.distanceToFacilityKm || 7.8} km)
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Assigned Facility: <strong className="text-slate-900 dark:text-white">Rampur CHC</strong>
            </span>
          </div>
        </div>

        {/* Adherence Status Badge */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-center shrink-0 min-w-[160px]">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
            Adherence Status
          </span>
          <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
            92%
          </div>
          <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold mt-0.5">
            Treatment Maintained
          </p>
        </div>
      </div>

      {/* 3. Core Medication & Refill Status Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Remaining Tablets */}
        <div className="p-5 rounded-3xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-rose-800 dark:text-rose-400">
            <span className="text-xs font-bold uppercase tracking-wider">Medicine Remaining</span>
            <Pill className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-700 dark:text-rose-400">
            {patient.remainingDaysOfMedication || 2} Days
          </div>
          <div className="p-2 rounded-xl bg-rose-100/70 dark:bg-rose-900/40 text-[11px] text-rose-800 dark:text-rose-200 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Refill due soon. Next delivery scheduled.</span>
          </div>
        </div>

        {/* Next Scheduled Refill Date */}
        <div className="p-5 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Next Refill Date</span>
            <Clock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            19 Oct 2026
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Method: <strong className="text-teal-700 dark:text-teal-400">Doorstep Delivery</strong> by Jan Swasthya NGO
          </div>
        </div>

        {/* Next Hospital Check-up */}
        <div className="p-5 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Hospital Appointment</span>
            <Calendar className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            15 Nov 2026
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Location: <strong className="text-slate-700 dark:text-slate-300">Rampur CHC (OPD Room 4)</strong>
          </div>
        </div>
      </div>

      {/* 4. Active Prescription & Regimen Details (Read-Only) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Active Prescription & Regimen (Read-Only)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prescribed by Dr. Rajesh Verma (Medical Officer In-Charge, Rampur CHC)
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            Verified Medical Record
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Medication: Amlodipine 5mg</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                Daily Morning
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p><strong>Instructions:</strong> Take 1 tablet every morning after breakfast with warm water.</p>
              <p><strong>Purpose:</strong> Controls systemic blood pressure and prevents heart strain.</p>
              <p><strong>Batch:</strong> Rampur CHC Pharmacy • 30-day supply cycle.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Latest Recorded Vitals</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                17 Oct 2026
              </span>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p><strong>Blood Pressure:</strong> 138/88 mmHg (Controlled)</p>
              <p><strong>Blood Sugar (Fasting):</strong> 142 mg/dL</p>
              <p><strong>Clinical Note:</strong> Condition stable. Continue current daily dosage without interruption.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 8-Week Adherence History Chart (Read-Only) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              8-Week Treatment Adherence Trend
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified daily medication tracking record
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Consistent Routine
          </span>
        </div>

        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={adherenceTrendData}>
              <defs>
                <linearGradient id="adherenceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[0, 7]} stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px'
                }}
              />
              <Area
                type="monotone"
                dataKey="pillsTaken"
                stroke="#0d9488"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#adherenceGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Frontline Care Team Contacts */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-900 to-slate-900 text-white shadow-lg space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-teal-300" />
            <span>Need Assistance or Experiencing Symptoms?</span>
          </h2>
          <p className="text-xs text-teal-100/80">
            As this portal is read-only, please reach out directly to your assigned healthcare contacts below for any emergency, symptom report, or refill request:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Hospital Contact */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-200">
              Primary Hospital
            </div>
            <div className="font-bold text-sm text-white">Rampur CHC Helpdesk</div>
            <p className="text-xs text-slate-300">Dr. Rajesh Verma (MOIC)</p>
            <a
              href="tel:+919876500000"
              className="inline-block mt-2 px-3 py-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold text-xs"
            >
              📞 Call Hospital
            </a>
          </div>

          {/* NGO Contact */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-200">
              NGO Field Coordinator
            </div>
            <div className="font-bold text-sm text-white">Sunita Devi (ASHA)</div>
            <p className="text-xs text-slate-300">Jan Swasthya NGO Village Lead</p>
            <a
              href="tel:+919876500001"
              className="inline-block mt-2 px-3 py-1 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold text-xs"
            >
              📞 Call NGO Worker
            </a>
          </div>

          {/* Emergency Ambulance */}
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300">
              Emergency Services
            </div>
            <div className="font-bold text-sm text-white">Toll-Free Helplines</div>
            <p className="text-xs text-slate-300">Ambulance: 108 • Health Advice: 104</p>
            <a
              href="tel:108"
              className="inline-block mt-2 px-3 py-1 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs"
            >
              🚨 Call 108 Ambulance
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
