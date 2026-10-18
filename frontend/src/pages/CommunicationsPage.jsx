import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import {
  MessageSquare,
  PhoneCall,
  Send,
  Sparkles,
  CheckCircle2,
  Clock,
  Smartphone,
  Volume2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  UserCheck
} from 'lucide-react';

export default function CommunicationsPage() {
  const { showToast } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Send form state
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [channel, setChannel] = useState('sms');
  const [messageType, setMessageType] = useState('appointment_reminder');
  const [customText, setCustomText] = useState('');
  const [sending, setSending] = useState(false);

  // Phone Simulator Preview State
  const [simulatedPreview, setSimulatedPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notifRes, patRes] = await Promise.all([
        api.get('/notifications', { params: { limit: 50 } }),
        api.get('/patients', { params: { limit: 50 } })
      ]);

      if (notifRes.data.success) {
        setNotifications(notifRes.data.notifications);
      }
      if (patRes.data.success && patRes.data.patients.length > 0) {
        setPatients(patRes.data.patients);
        setSelectedPatientId(patRes.data.patients[0]._id);
      }
    } catch (err) {
      showToast('Failed to load communication logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSimulated = async (e) => {
    e.preventDefault();
    if (!selectedPatientId) {
      showToast('Please select a patient', 'error');
      return;
    }

    setSending(true);
    try {
      const res = await api.post('/notifications/simulate', {
        patientId: selectedPatientId,
        type: messageType,
        channel,
        customMessage: customText || null
      });

      if (res.data.success) {
        showToast(`Simulated ${channel.toUpperCase()} message dispatched [DEMO]`, 'success');
        setSimulatedPreview(res.data.notification);
        setCustomText('');
        fetchData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to trigger simulation', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-900 text-xs font-bold text-sky-800 dark:text-sky-300">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Core Feature 9 • Telephony Simulation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            SMS & IVR Simulation Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Test and trigger simulated patient communications with clear DEMO/MOCK indicators.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-darkcard font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-2 shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-sky-600" />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Interactive Simulation Trigger Form */}
        <div className="lg:col-span-1 p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <div className="border-b pb-3 border-slate-100 dark:border-slate-800">
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-600" />
              <span>Trigger Simulated Message</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulates carrier dispatch with network latency & delivery log.
            </p>
          </div>

          <form onSubmit={handleSendSimulated} className="space-y-4">
            
            {/* Patient Selector */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Patient: *</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium"
              >
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.patientId || p.patientCode}) — {p.treatmentProgram}
                  </option>
                ))}
              </select>
            </div>

            {/* Channel (SMS vs IVR) */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Channel: *</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition ${
                    channel === 'sms'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>SMS Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('ivr')}
                  className={`p-2.5 rounded-xl border font-bold flex items-center justify-center gap-2 transition ${
                    channel === 'ivr'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Volume2 className="w-4 h-4" />
                  <span>IVR Voice Call</span>
                </button>
              </div>
            </div>

            {/* Message Template / Type */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Message Purpose: *</label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium"
              >
                <option value="appointment_reminder">Appointment Reminder</option>
                <option value="follow_up">Missed Visit Follow-Up</option>
                <option value="check_in_request">Weekly Adherence Check-In</option>
                <option value="support_update">Support Action Status Update</option>
                <option value="custom">Custom Non-Clinical Message</option>
              </select>
            </div>

            {/* Custom text override */}
            {messageType === 'custom' && (
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Custom Message Text:</label>
                <textarea
                  rows={3}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Type respectful, privacy-conscious message..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-surface-dark font-medium outline-none"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{sending ? 'Simulating Dispatch...' : `Send Simulated ${channel.toUpperCase()} [DEMO]`}</span>
            </button>

          </form>

          {/* Interactive Phone Simulator Display */}
          {simulatedPreview && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 border border-slate-800 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3 h-3 text-sky-400" />
                  <span>Simulated Handset Screen</span>
                </span>
                <span className="text-emerald-400 font-bold uppercase tracking-wider">Delivered</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/80 text-[11px] leading-relaxed border border-slate-700/60 font-mono">
                {simulatedPreview.message}
              </div>
              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Latency: {simulatedPreview.simulationDetails?.networkLatencyMs}ms</span>
                <span>Gateway: Mock Telecom Bridge</span>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Communication History Log */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">Communication Audit Log</h2>
              <p className="text-[11px] text-slate-400">Chronological history of simulated messages & voice calls.</p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
              {notifications.length} Logs
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading communications log...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No simulated messages found. Send one using the trigger form.</div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-dark hover:border-sky-500 transition space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        notif.channel === 'ivr'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                          : 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                      }`}>
                        {notif.channel}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {notif.recipientName || notif.patient?.name || 'Patient'}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({notif.recipientPhone || '+91 98765 00000'})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                        {notif.deliveryStatus} [MOCK]
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-700 dark:text-slate-300 font-mono bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {notif.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Purpose: <strong className="capitalize">{notif.type.replace(/_/g, ' ')}</strong></span>
                    <span>Simulated Latency: {notif.simulationDetails?.networkLatencyMs || 150}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
