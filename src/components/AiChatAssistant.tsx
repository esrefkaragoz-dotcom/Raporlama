import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Person, ReportItem } from '../types';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  RotateCcw, 
  HelpCircle,
  Clock,
  ArrowRight
} from 'lucide-react';

interface AiChatAssistantProps {
  persons: Person[];
  reports: ReportItem[];
}

const SUGGESTED_QUESTIONS = [
  'Disney cue-sheet çalışmalarında hangi personeller çalıştı ve durum nedir?',
  'Gizem Kurtoğlu\'nun resmi görev tanımı nedir ve raporda fiilen neler yapmış?',
  'Ekip içinde en çok process operasyonu gerçekleştiren personeller kimler?',
  'Pelikan CWR güncellemelerinde kimler görev alıyor ve olası riskler neler?',
  'Personellerin üstlendiği görevlerle fiili raporları arasında en belirgin sapmalar nelerdir?',
  'Cahit Benek Kürtçe eser düzenlemelerinde ne gibi işler gerçekleştirdi?',
];

export const AiChatAssistant: React.FC<AiChatAssistantProps> = ({ persons, reports }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Merhaba! Ben **MESAM Rapor & Görev Analiz AI Danışmanı**.

Sistemde kayıtlı **${persons.length} personelimizin resmi görev tanımları** ve **${reports.length} adet günlük iş raporu** hafızamda yüklüdür.

Bana personellerin üstlendiği sorumluluklar, iş yükü dağılımı, edisyonlar (Pelikan, Disney, Median, Ahenk vb.) veya bireysel performans hakkında dilediğiniz soruyu sorabilirsiniz.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      const data = await res.json();
      if (data.ok && data.answer) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        const errMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Yanıt oluşturulamadı: ${data.error || 'Bilinmeyen hata'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ AI servisine bağlanırken hata oluştu.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: 'Sohbet geçmişi temizlendi. Yeni bir soru sorabilirsiniz.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 px-6 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/40">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              MESAM Rapor & Görev Danışmanı
              <span className="text-[10px] font-semibold px-2 py-0.2 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">
                Gemini 3.8 Flash
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Personel görevleri, günlük raporlar ve telif süreçleri hakkında akıllı soru-cevap
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
          title="Sohbeti Temizle"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Temizle</span>
        </button>
      </div>

      {/* Suggested Quick Questions */}
      <div className="p-3 px-6 bg-slate-50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
            Örnek Sorular:
          </span>
          <div className="flex space-x-2">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-xs whitespace-nowrap px-3 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 font-medium transition-all shadow-xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-xs shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-xs shadow-xs'
                }`}
              >
                <div className="whitespace-pre-line space-y-2">{m.content}</div>
                <div
                  className={`mt-2 text-[10px] text-right ${
                    isUser ? 'text-blue-200' : 'text-slate-400'
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl rounded-tl-xs border border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span>Gemini raporları ve görev tanımlarını tarıyor...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Personel, görevler veya raporlar hakkında soru sorun (örn: Kim hangi edisyonla ilgilendi?)..."
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            <span>Gönder</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
