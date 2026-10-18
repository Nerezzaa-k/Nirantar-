import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Activity,
  Lock,
  Mail,
  Sun,
  Moon,
  ArrowRight,
  Shield,
  Heart,
  HeartHandshake,
  CheckCircle,
  Sparkles,
  Building2,
  Eye,
  Info
} from 'lucide-react';

export default function Login() {
  const { login, quickDemoLogin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Selected Login Persona tab: 'hospital' | 'ngo' | 'patient'
  const [activePersona, setActivePersona] = useState('hospital');

  const [email, setEmail] = useState('admin@nirantar.org');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Switch persona tab and update pre-filled values
  const handleSelectPersona = (persona) => {
    setActivePersona(persona);
    setError('');
    if (persona === 'hospital') {
      setEmail('admin@nirantar.org');
      setPassword('admin123');
    } else if (persona === 'ngo') {
      setEmail('asha.sunita@nirantar.org');
      setPassword('worker123');
    } else if (persona === 'patient') {
      setEmail('ramesh.kumar@patient.nirantar.org');
      setPassword('patient123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'patient') {
        navigate('/app/patient-portal');
      } else {
        navigate('/app/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (roleKey) => {
    setError('');
    setLoading(true);
    try {
      const user = await quickDemoLogin(roleKey);
      if (user.role === 'patient') {
        navigate('/app/patient-portal');
      } else {
        navigate('/app/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-dark flex flex-col justify-between transition-colors">
      
      {/* Top Navbar */}
      <nav className="p-4 sm:px-8 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-700 to-teal-900 flex items-center justify-center text-white shadow-md shadow-teal-700/20">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
              Nirantar <span className="text-teal-600 dark:text-teal-400 text-sm">v3</span>
            </span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-5">
          
          {/* Header text */}
          <div className="text-center space-y-1.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-900/50 inline-block">
              Treatment Adherence Platform
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Sign In to Nirantar
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              "Predict who will drop out. Find out why. Match the rescue to the reason."
            </p>
          </div>

          {/* 1. Login Persona Tabs (Hospital vs NGO vs Patient Read-Only) */}
          <div className="p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700 flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleSelectPersona('hospital')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activePersona === 'hospital'
                  ? 'bg-white dark:bg-surface-darkcard text-teal-950 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Hospital</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPersona('ngo')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activePersona === 'ngo'
                  ? 'bg-white dark:bg-surface-darkcard text-teal-950 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
              <span>NGO Partner</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPersona('patient')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activePersona === 'patient'
                  ? 'bg-white dark:bg-surface-darkcard text-teal-950 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-purple-600" />
              <span>Patient (Read-Only)</span>
            </button>
          </div>

          {/* Persona Helper Sub-banner */}
          <div className="p-3 rounded-2xl text-xs font-medium border flex items-center gap-2.5 transition-all bg-white dark:bg-surface-darkcard border-slate-200 dark:border-slate-800">
            {activePersona === 'hospital' && (
              <>
                <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Hospital Login:</strong> For Medical Officers, OPD Doctors, and Clinic Staff managing patient registers & pharmacy stock.
                </span>
              </>
            )}
            {activePersona === 'ngo' && (
              <>
                <HeartHandshake className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>NGO Partner Login:</strong> For ASHA, ANM, and Community Field Leads coordinating doorstep refills and patient rescues.
                </span>
              </>
            )}
            {activePersona === 'patient' && (
              <>
                <Eye className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Patient Portal (Read-Only):</strong> View your active medication schedule, remaining pills, and next clinic appointment dates.
                </span>
              </>
            )}
          </div>

          {/* Quick 1-Click Demo Logins */}
          <div className="p-4 rounded-2xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>1-Click Instant Evaluation Logins</span>
              </span>
              <span className="text-[10px] text-slate-400">Click to enter directly</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {/* Hospital Button */}
              <button
                type="button"
                onClick={() => handleQuickDemo('hospital')}
                className="p-2.5 rounded-xl border border-teal-200 dark:border-teal-900/50 bg-teal-50/60 dark:bg-teal-950/30 hover:bg-teal-100 dark:hover:bg-teal-900/50 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-teal-800 dark:text-teal-300 font-bold text-[11px]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Hospital MOIC</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Dr. Rajesh Verma
                </div>
              </button>

              {/* NGO Button */}
              <button
                type="button"
                onClick={() => handleQuickDemo('ngo')}
                className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  <span>NGO Field Lead</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Sunita Devi (ASHA)
                </div>
              </button>

              {/* Patient Read-Only Button */}
              <button
                type="button"
                onClick={() => handleQuickDemo('patient')}
                className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/60 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-purple-800 dark:text-purple-300 font-bold text-[11px]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Patient (Read-Only)</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  Ramesh Kumar (PAT-1001)
                </div>
              </button>
            </div>
          </div>

          {/* Form Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {activePersona === 'patient' ? 'Patient Registered Email' : 'Work Email Address'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      activePersona === 'patient'
                        ? 'ramesh.kumar@patient.nirantar.org'
                        : activePersona === 'ngo'
                        ? 'asha.sunita@nirantar.org'
                        : 'admin@nirantar.org'
                    }
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  <Link to="/forgot-password" className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-700/20 transition-all hover:scale-[1.01]"
              >
                <span>
                  {loading
                    ? 'Authenticating...'
                    : activePersona === 'patient'
                    ? 'Enter Patient Portal (Read-Only)'
                    : activePersona === 'ngo'
                    ? 'Sign In as NGO Partner'
                    : 'Sign In as Hospital Staff'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                Authorized healthcare worker registration?{' '}
                <Link to="/register" className="text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                  Register here
                </Link>
              </span>
            </div>

          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-[11px] text-slate-400">
        Nirantar v3 • Hospital & NGO Treatment Adherence Platform • Designed for NHM, CHCs & Grassroot NGOs
      </footer>

    </div>
  );
}
