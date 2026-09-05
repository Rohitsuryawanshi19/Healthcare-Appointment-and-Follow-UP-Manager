import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot, User, ChevronDown, ChevronUp, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { aiChatService } from '../../services/aiChatService';

const quickPrompts = [
  'Persistent throbbing headache for 3 days',
  'Mild fever with dry cough and fatigue',
  'Joint stiffness and pain in the morning',
  'Dizziness when standing up quickly',
];

export function AiSymptomChatWidget({ onApplySymptoms }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        "Hello! I am CareFlow's AI symptom assistant. Describe your symptoms and I can help you prepare questions and understand general urgency before you choose a specialist.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isStreaming]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || isStreaming) return;

    setError('');
    const userMessage = { role: 'user', content: text };
    const newHistory = [...messages, userMessage];

    setMessages(newHistory);
    setInput('');
    setIsStreaming(true);

    // Placeholder for incoming assistant response
    const assistantIndex = newHistory.length;
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      await aiChatService.streamChat({
        message: text,
        history: newHistory,
        onChunk: (delta, accumulated) => {
          setMessages((prev) => {
            const copy = [...prev];
            if (copy[assistantIndex]) {
              copy[assistantIndex] = { role: 'assistant', content: accumulated };
            }
            return copy;
          });
        },
        onComplete: (finalText) => {
          setIsStreaming(false);
        },
        onError: (err) => {
          setIsStreaming(false);
          setError(err.message || 'Unable to complete AI stream. Please check connection.');
        },
      });
    } catch (err) {
      setIsStreaming(false);
      setError(err.message || 'AI request failed');
    }
  };

  return (
    <Card className="border border-teal-200/80 bg-gradient-to-b from-teal-50/40 via-white to-white shadow-sm overflow-hidden">
      {/* Collapsible Header */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-teal-50/60 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                AI Symptom Exploration Assistant
              </h3>
              <Badge variant="primary" size="sm">
                Interactive Triage
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Chat with AI to organize your symptoms before selecting a doctor.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-xs font-medium hidden sm:inline">
            {isOpen ? 'Minimize Chat' : 'Open Symptom Chat'}
          </span>
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </div>

      {/* Expanded Chat Body */}
      {isOpen && (
        <CardContent className="p-4 sm:p-5 pt-0 border-t border-slate-100 space-y-4">
          {/* Quick Suggestion Pills */}
          {messages.length <= 1 && (
            <div className="space-y-1.5 pt-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Common Symptom Inquiries:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleSend(q)}
                    className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:border-teal-400 hover:text-teal-800 transition-colors cursor-pointer text-left"
                  >
                    + {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Messages Log */}
          <div className="max-h-72 overflow-y-auto space-y-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${
                  m.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-xs'
                  }`}
                >
                  {m.content ? (
                    m.content
                  ) : (
                    <span className="flex items-center gap-1.5 text-slate-400 italic">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Analyzing clinical symptoms...
                    </span>
                  )}
                </div>
                {m.role === 'user' && (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-700 shrink-0 mt-0.5">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Chat Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your symptoms (e.g. onset, severity, triggers)..."
              disabled={isStreaming}
              className="flex-1 text-xs"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!input.trim() || isStreaming}
              isLoading={isStreaming}
              rightIcon={<Send className="h-3.5 w-3.5" />}
            >
              Send
            </Button>
          </form>

          {/* Clinical Safety Footnote */}
          <p className="text-[10px] text-slate-400 text-center leading-tight">
            🛡️ <em>CareFlow AI is an exploratory screening assistant. It does not provide medical diagnoses or prescribe medications. In an emergency, call local emergency services immediately.</em>
          </p>
        </CardContent>
      )}
    </Card>
  );
}
