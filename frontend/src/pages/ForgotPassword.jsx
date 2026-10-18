import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (e) {
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white dark:bg-surface-darkcard rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
        
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-brand-700 text-white flex items-center justify-center mx-auto mb-2">
            <Activity className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reset Password</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Enter your email to receive a password reset link
          </p>
        </div>

        {submitted ? (
          <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900 text-center space-y-2">
            <CheckCircle className="w-8 h-8 text-teal-600 dark:text-teal-400 mx-auto" />
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Reset instructions sent to {email}
            </p>
            <p className="text-[11px] text-slate-500">
              In prototype mode, you can immediately login using the demo credentials on the login screen.
            </p>
            <Link
              to="/login"
              className="inline-block mt-2 text-xs font-bold text-brand-700 dark:text-brand-300 hover:underline"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Registered Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="asha.sunita@nirantar.org"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold flex items-center justify-center gap-2"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center pt-2">
              <Link to="/login" className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </Link>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
