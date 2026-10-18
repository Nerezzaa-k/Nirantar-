import React, { useState } from 'react';
import api from '../../services/api';
import { X, Bot, Send, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';

export default function WorkerAssistantDrawer({ isOpen, onClose, initialPatient }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: initialPatient
        ? `Hello! I am your Nirantar AI Assistant. I have context on patient ${initialPatient.name} (${initialPatient.patientCode}, ${initialPatient.primaryCondition?.name || 'Hypertension'}, Risk: ${initialPatient.currentRiskScore}/100). How can I assist you with this patient's care plan?`
        : 'Hello! I am the Nirantar Care Worker Assistant. You can ask me questions about patient risk drivers, reason-to-action guidelines, travel barrier protocols, or PHC stock availability.'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const quickQuestions = [
    'Why was this patient flagged as high risk?',
    'What follow-up should be considered for a patient reporting travel difficulties?',
    'What should I do if a patient reports side effects?',
    'What are the most common reasons for missed refills?'
  ];

  const handleSend = async (queryText) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/worker-assistant', {
        query: textToSend,
        patientId: initialPatient?._id
      });

      if (res.data.success && res.data.response) {
        const assistantMsg = {
          role: 'assistant',
          text: res.data.response.answer,
          sources: res.data.response.grounded_records,
          engine: res.data.response.source
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Notice: Operating in clinical offline rules mode. High-risk patients should be prioritized for weekly doorstep outreach and verified with the village ASHA register.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-surface-darkcard border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-brand-900 to-teal-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-brand-300" />
          </div>
          <div>
            <h3 className="font-bold text-xs flex items-center gap-1.5">
              <span>Nirantar AI Assistant</span>
              <Sparkles className="w-3 h-3 text-brand-300" />
            </h3>
            <p className="text-[10px] text-brand-200">Clinical Protocol & Adherence Guidance</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 text-white/70 hover:text-white rounded-lg">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Message history */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-3 rounded-2xl max-w-[88%] leading-relaxed ${
                m.role === 'user'
                  ? 'bg-brand-700 text-white rounded-br-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              <p>{m.text}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold">Protocol Ref: </span>
                  {m.sources.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs italic">
            <Bot className="w-4 h-4 animate-bounce text-brand-600" />
            <span>AI Assistant is generating protocol guidance...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Suggested Questions</span>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[10px] text-left px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-500 transition-colors truncate max-w-full"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white dark:bg-surface-darkcard border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about adherence or patient..."
          className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 rounded-xl bg-brand-700 hover:bg-brand-800 disabled:opacity-50 text-white transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
