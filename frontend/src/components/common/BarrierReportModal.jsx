import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import {
  Mic,
  MicOff,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  X,
  Phone,
  MessageSquare,
  Home,
  DollarSign,
  Truck,
  Package,
  Activity,
  BookOpen,
  Calendar,
  Clock,
  Shield,
  Users,
  WifiOff,
  Sparkles
} from 'lucide-react';

export const BARRIER_CATEGORIES = [
  {
    key: 'financial_difficulties',
    label: 'Financial Difficulties',
    icon: DollarSign,
    color: 'emerald',
    description: 'Cannot afford medicines, clinic fees, or transport fare.'
  },
  {
    key: 'transportation_problems',
    label: 'Transportation Problems',
    icon: Truck,
    color: 'sky',
    description: 'Washed-out roads, distance, or lack of buses/rickshaws.'
  },
  {
    key: 'medication_availability',
    label: 'Medication Availability',
    icon: Package,
    color: 'amber',
    description: 'Local pharmacy/PHC is out of stock of prescribed tablets.'
  },
  {
    key: 'reported_side_effects',
    label: 'Reported Side Effects',
    icon: Activity,
    color: 'rose',
    description: 'Nausea, dizziness, bodily discomfort, or fears.'
  },
  {
    key: 'lack_of_awareness',
    label: 'Lack of Awareness / Literacy',
    icon: BookOpen,
    color: 'purple',
    description: 'Feels fine and believes ongoing daily medicine is unnecessary.'
  },
  {
    key: 'forgotten_appointments',
    label: 'Forgotten Appointments',
    icon: Calendar,
    color: 'indigo',
    description: 'Lost track of appointment date or routine schedule.'
  },
  {
    key: 'scheduling_conflicts',
    label: 'Scheduling Conflicts',
    icon: Clock,
    color: 'orange',
    description: 'Work shifts, agricultural harvest, or daily wage clashes.'
  },
  {
    key: 'difficulty_accessing_services',
    label: 'Difficulty Accessing Healthcare Services',
    icon: Shield,
    color: 'blue',
    description: 'Physical disability, facility overcrowding, or mobility barriers.'
  },
  {
    key: 'family_personal_circumstances',
    label: 'Family / Personal Circumstances',
    icon: Users,
    color: 'teal',
    description: 'Caregiver duties, domestic distress, or family migration.'
  },
  {
    key: 'other',
    label: 'Other',
    icon: HelpCircle,
    color: 'slate',
    description: 'Other personal, social, or unlisted challenges.'
  }
];

export default function BarrierReportModal({
  isOpen,
  onClose,
  patientId,
  patientName = 'Patient',
  sourceType = 'patient',
  onSuccess
}) {
  const { showToast } = useNotifications();

  const [category, setCategory] = useState('transportation_problems');
  const [description, setDescription] = useState('');
  const [difficultyDate, setDifficultyDate] = useState(new Date().toISOString().split('T')[0]);
  const [preferredContact, setPreferredContact] = useState('phone_call');
  const [assistanceRequested, setAssistanceRequested] = useState(true);
  const [assistanceDetails, setAssistanceDetails] = useState('');

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Check Speech Recognition API support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'hi-IN,en-IN,en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setVoiceTranscript(transcript);
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        showToast(`Voice input notice: ${event.error}`, 'error');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!speechSupported) {
      showToast('Speech recognition is not supported in this browser. Please type below.', 'info');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      showToast('Voice recording stopped. Please review text before submitting.', 'info');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        showToast('Listening... Speak your reason clearly.', 'success');
      } catch (err) {
        console.warn('Speech start error:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      showToast('Please select a barrier category', 'error');
      return;
    }

    const payload = {
      patientId,
      category,
      description: description || 'No detailed note provided.',
      difficultyDate,
      preferredMethodOfContact: preferredContact,
      assistanceRequested,
      assistanceDetails: assistanceDetails || description,
      sourceType,
      voiceInputUsed: Boolean(voiceTranscript),
      voiceTranscript: voiceTranscript || null
    };

    // If offline, store draft locally in localStorage
    if (!navigator.onLine) {
      const drafts = JSON.parse(localStorage.getItem('nirantar_offline_barriers') || '[]');
      drafts.push({ ...payload, savedLocallyAt: new Date().toISOString() });
      localStorage.setItem('nirantar_offline_barriers', JSON.stringify(drafts));
      showToast('Saved as local draft. Will sync automatically when connection returns.', 'info');
      if (onSuccess) onSuccess({ offlineDraft: true });
      onClose();
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/barriers', payload);
      if (res.data.success) {
        showToast('Barrier reported and support action automatically matched!', 'success');
        if (onSuccess) onSuccess(res.data);
        onClose();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit barrier', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-surface-darkcard border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-surface-darkcard/95 backdrop-blur z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                Barrier Identification
              </span>
              <span className="text-xs text-slate-400">
                Source: <strong className="text-slate-700 dark:text-slate-300 capitalize">{sourceType.replace(/_/g, ' ')}</strong>
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
              Report Reason for Missed Care: {patientName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Offline indicator if applicable */}
        {isOffline && (
          <div className="bg-amber-50 dark:bg-amber-950/50 border-b border-amber-200 dark:border-amber-900 p-3 px-6 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <WifiOff className="w-4 h-4 flex-shrink-0" />
            <span>You are currently offline. Your report will be saved as a local draft and synced automatically once internet reconnects.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          
          {/* Category Selection Grid */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-200 mb-2">
              Select What Caused the Difficulty or Missed Visit: *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 border rounded-2xl border-slate-200 dark:border-slate-800">
              {BARRIER_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                    <div>
                      <div className="font-bold text-xs">{cat.label}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        {cat.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice-Enabled Description Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 dark:text-slate-200">
                Optional Description & Context:
              </label>
              
              {/* Voice Input Button (Browser Speech API) */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                    : 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-teal-900'
                }`}
                title={speechSupported ? 'Tap to speak your barrier reason' : 'Speech API not supported in browser'}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isListening ? 'Listening (Tap to Stop)...' : 'Use Voice Input (Speech API)'}</span>
              </button>
            </div>

            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Road flooded by monsoon; lost daily agricultural wage; pharmacy stockout of Metformin..."
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-surface-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none text-xs"
            />
            
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Voice recognition transcribes speech live. Please review and edit before final submission.</span>
            </p>
          </div>

          {/* Date of Difficulty & Preferred Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Date of Missed Visit / Difficulty:
              </label>
              <input
                type="date"
                value={difficultyDate}
                onChange={(e) => setDifficultyDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Preferred Method of Contact:
              </label>
              <select
                value={preferredContact}
                onChange={(e) => setPreferredContact(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="phone_call">Phone Call (Direct)</option>
                <option value="sms">SMS Text Reminder</option>
                <option value="whatsapp">WhatsApp Message</option>
                <option value="home_visit">Home Outreach Visit</option>
              </select>
            </div>
          </div>

          {/* Request Assistance Checkbox */}
          <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-900/60 space-y-2">
            <label className="flex items-center gap-2 font-bold text-teal-950 dark:text-teal-200 cursor-pointer">
              <input
                type="checkbox"
                checked={assistanceRequested}
                onChange={(e) => setAssistanceRequested(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span>I am requesting support from my healthcare team to continue care</span>
            </label>
            <p className="text-[11px] text-teal-800/80 dark:text-teal-300/80 pl-6">
              Checking this triggers the Barrier-to-Support Matching Engine to suggest travel support, doorstep delivery, or financial subsidy.
            </p>
          </div>

          {/* Form Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-lg shadow-teal-600/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Barrier Report'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
