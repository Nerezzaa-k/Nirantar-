import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  Heart,
  ShieldCheck,
  Activity,
  ArrowRight,
  UserCheck,
  Users,
  Building2,
  CheckCircle2,
  Clock,
  Sparkles,
  PhoneCall,
  Mic,
  BarChart3,
  Layers,
  ChevronRight,
  TrendingUp,
  FileText,
  AlertTriangle,
  Lock,
  Globe2
} from 'lucide-react';

export default function LandingPage() {
  const { quickDemoLogin, isAuthenticated, user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [loggingInRole, setLoggingInRole] = useState(null);

  const handleQuickDemo = async (roleKey) => {
    setLoggingInRole(roleKey);
    try {
      await quickDemoLogin(roleKey);
      showToast(`Welcome! Logged in as ${DEMO_CREDENTIALS[roleKey].name}`, 'success');
      if (roleKey === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/app/home');
      }
    } catch (err) {
      showToast(err.message || 'Demo login failed', 'error');
    } finally {
      setLoggingInRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-dark text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/30">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                NIRANTAR
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                  Care Continuity
                </span>
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block">AI-Assisted Treatment Continuity Platform</p>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600 dark:text-slate-400">
            <a href="#mission" className="hover:text-teal-600 transition">Our Mission</a>
            <a href="#features" className="hover:text-teal-600 transition">Features</a>
            <a href="#roles" className="hover:text-teal-600 transition">Roles & Access</a>
            <a href="#programs" className="hover:text-teal-600 transition">Care Programs</a>
          </nav>

          {/* Auth Action */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={user?.role === 'admin' ? '/dashboard' : '/app/home'}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-darkcard">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-4">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-900 text-xs font-bold text-teal-800 dark:text-teal-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Healthcare Continuity Architecture</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              Don’t Just Remind Patients.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-sky-600">
                Understand Why They Drop Out
              </span>{' '}
              and Help Them Stay in Care.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Nirantar empowers hospitals, community health workers, NGOs, and caregivers to identify patients at risk of treatment discontinuation, uncover reported logistical barriers, match actionable support, and monitor verified recovery back to care.
            </p>

          </div>

          {/* 1-Click Interactive Role Selector Cards */}
          <div id="roles" className="mt-12 max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Live Interactive MVP — Test Any Role With 1 Click:
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Role 1: Healthcare Worker */}
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-surface-dark hover:border-teal-500 hover:shadow-xl transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-3">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Healthcare Worker</h3>
                  <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400 mt-0.5">Sunita Verma (ASHA)</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Prioritized follow-up queue, missed visit logging, barrier identification, contact attempts & recovery tracking.
                  </p>
                </div>
                <button
                  onClick={() => handleQuickDemo('worker')}
                  disabled={loggingInRole === 'worker'}
                  className="mt-4 w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 group-hover:scale-[1.02]"
                >
                  <span>{loggingInRole === 'worker' ? 'Logging in...' : 'Launch as Worker'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Role 2: Patient */}
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-surface-dark hover:border-sky-500 hover:shadow-xl transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-3">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Patient</h3>
                  <div className="text-[11px] font-bold text-sky-600 dark:text-sky-400 mt-0.5">Ramesh Kumar (Diabetes)</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Personal treatment info, appointments, assistance requests, and voice-enabled barrier reporting with Speech API.
                  </p>
                </div>
                <button
                  onClick={() => handleQuickDemo('patient')}
                  disabled={loggingInRole === 'patient'}
                  className="mt-4 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 group-hover:scale-[1.02]"
                >
                  <span>{loggingInRole === 'patient' ? 'Logging in...' : 'Launch as Patient'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Role 3: Caregiver */}
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-surface-dark hover:border-emerald-500 hover:shadow-xl transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center mb-3">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Family Caregiver</h3>
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">Pooja Kumar (Daughter)</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    View authorized loved ones only, coordinate follow-ups, report barriers on behalf of family, and log assistance.
                  </p>
                </div>
                <button
                  onClick={() => handleQuickDemo('caregiver')}
                  disabled={loggingInRole === 'caregiver'}
                  className="mt-4 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 group-hover:scale-[1.02]"
                >
                  <span>{loggingInRole === 'caregiver' ? 'Logging in...' : 'Launch as Caregiver'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Role 4: Administrator */}
              <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-surface-dark hover:border-indigo-500 hover:shadow-xl transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center mb-3">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Healthcare Administrator</h3>
                  <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">Dr. Rajesh Mehta (DHO)</div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Program-level analytics, Recharts barrier trends, follow-up recovery rates, and multi-department program rules.
                  </p>
                </div>
                <button
                  onClick={() => handleQuickDemo('admin')}
                  disabled={loggingInRole === 'admin'}
                  className="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 group-hover:scale-[1.02]"
                >
                  <span>{loggingInRole === 'admin' ? 'Logging in...' : 'Launch as Admin'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Core Mission & Problem-Solution Section */}
      <section id="mission" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">The Problem & The Paradigm Shift</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              Why Simple Reminders Fail in Chronic Illness
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              In long-term conditions like Diabetes, Hypertension, and Tuberculosis, patients don't discontinue care because they simply "forgot." They drop out due to flooded rural roads, catastrophic out-of-pocket costs, pharmacy stockouts, debilitating side effects, or skepticism when symptoms subside.
            </p>
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-xs text-teal-900 dark:text-teal-200 space-y-2">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <span>Nirantar's Fundamental Principle:</span>
              </div>
              <p className="pl-6 text-[11px] text-teal-800 dark:text-teal-300">
                "Never assume why a patient missed an appointment. Distinguish between patient-reported barriers, caregiver updates, healthcare worker observations, and system risk scores to match real logistical solutions."
              </p>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Transparent Decision-Support Architecture</span>
            </h3>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 font-bold">1</div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Explainable Risk Prioritization</div>
                  <p className="text-slate-500 text-[11px] mt-0.5">Calculates 0-100 risk scores with human review disclaimers, based on actual missed visits, overdue days, and open barriers.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 font-bold">2</div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Voice-Enabled Barrier Identification</div>
                  <p className="text-slate-500 text-[11px] mt-0.5">Browser Speech API lets patients report difficulties verbally in their native language before human review.</p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold">3</div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Barrier-to-Support Matching Engine</div>
                  <p className="text-slate-500 text-[11px] mt-0.5">Connects transportation problems to doorstep refills, financial strains to government subsidies, and side effects to doctor reviews.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-16 bg-white dark:bg-surface-darkcard border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">MVP Capabilities</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              Purpose-Built for Healthcare Workers in the Field
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-dark space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Follow-Up Recovery Tracker</h3>
              <p className="text-slate-500 leading-relaxed">
                Dedicated recovery dashboard tracking cases across 10 progressive statuses from 'New' to 'Verified Recovery', preventing cases from falling through the cracks.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-dark space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center">
                <PhoneCall className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">SMS & IVR Simulation Gateway</h3>
              <p className="text-slate-500 leading-relaxed">
                Lightweight simulated notifications service logging appointment reminders, check-in prompts, and voice scripts with clear [DEMO/MOCK] labels.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-dark space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Dynamic Recharts Analytics</h3>
              <p className="text-slate-500 leading-relaxed">
                Real database calculations of recovery rates, barrier breakdowns, monthly follow-up trends, and risk distribution donuts.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-dark space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Consolidated Patient Journey</h3>
              <p className="text-slate-500 leading-relaxed">
                6 comprehensive tabs: Overview, Appointments, Barriers, Support Actions, Contact Logs, and a Chronological Audit Timeline.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-dark space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Multi-Department Programs</h3>
              <p className="text-slate-500 leading-relaxed">
                Configurable continuity rules for Diabetes, Hypertension, Tuberculosis (DOTS), Oncology, and Cardiology departments.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-dark space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Offline-First PWA Support</h3>
              <p className="text-slate-500 leading-relaxed">
                Local draft creation for field barrier notes, online/offline status detection, and background synchronization on reconnect.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-8 bg-slate-100 dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
            <Heart className="w-4 h-4 text-teal-600 fill-current" />
            <span>NIRANTAR — AI-Assisted Treatment Continuity Platform</span>
          </div>
          <div>
            Built with MERN Stack • MongoDB Atlas • Vite • Tailwind CSS • Recharts
          </div>
        </div>
      </footer>

    </div>
  );
}
