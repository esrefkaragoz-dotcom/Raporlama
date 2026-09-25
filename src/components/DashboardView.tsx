import React, { useState } from 'react';
import { Person, ReportItem, TeamWorkloadAnalysis } from '../types';
import { 
  Users, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  persons: Person[];
  reports: ReportItem[];
  onSelectPerson: (personName: string) => void;
  onNavigateTab: (tab: 'dashboard' | 'persons' | 'ai-analysis' | 'reports' | 'chat') => void;
  onStartDutyAnalysis: (personName: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  persons,
  reports,
  onSelectPerson,
  onNavigateTab,
  onStartDutyAnalysis,
}) => {
  const [quickAiLoading, setQuickAiLoading] = useState(false);
  const [quickAiSummary, setQuickAiSummary] = useState<TeamWorkloadAnalysis | null>(null);
  const [aiError, setAiError] = useState('');

  const personReportCounts: { [person: string]: { count: number; process: number; cue: number; eser: number } } = {};

  reports.forEach((r) => {
    const m = r.parsedMetrics;

    if (!personReportCounts[r.person]) {
      personReportCounts[r.person] = { count: 0, process: 0, cue: 0, eser: 0 };
    }
    personReportCounts[r.person].count += 1;
    if (m) {
      personReportCounts[r.person].process += m.processCount;
      personReportCounts[r.person].cue += m.cueSheetCount;
      personReportCounts[r.person].eser += m.eserCount;
    }
  });

  const handleGenerateQuickSummary = async () => {
    setQuickAiLoading(true);
    setAiError('');
    try {
      const res = await fetch('/api/ai/team-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok && data.analysis) {
        setQuickAiSummary(data.analysis);
      } else {
        setAiError(data.error || 'Özet üretilemedi.');
      }
    } catch (err) {
      console.error(err);
      setAiError('AI bağlantı hatası oluştu.');
    } finally {
      setQuickAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 sm:p-8 shadow-xl border border-indigo-900/40">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Gemini 3.8 Flash AI Entegreli Yönetim Paneli</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            MESAM Personel Görev & Rapor Analiz Merkezi
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            Dışarıdan ve personelden gelen günlük iş raporlarını inceleyin, personelin üstlendiği görev tanımları ile
            fiili üretimini karşılaştırın. Gemini AI ile rol uyumu, iş yükü dengesi ve darboğazları tespit edin.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerateQuickSummary}
              disabled={quickAiLoading}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{quickAiLoading ? 'AI Analiz Hazırlanıyor...' : 'AI Ekip Raporu Üret'}</span>
            </button>

            <button
              onClick={() => onNavigateTab('ai-analysis')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 text-sm font-medium border border-slate-700/80 transition-all"
            >
              <span>Detaylı Görev Uyum Analizleri</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtle decorative background graphic */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {aiError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-semibold border border-rose-200 dark:border-rose-900/50">
          {aiError}
        </div>
      )}

      {/* AI Quick Executive Summary Box (If generated) */}
      {quickAiSummary && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 p-6 shadow-md transition-all">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {quickAiSummary.title || 'Gemini AI Yönetici Ekip Özeti'}
                </h3>
                <p className="text-xs text-slate-500">
                  {quickAiSummary.periodText || 'Raporlama verileri üzerinden üretildi'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-500">Ekip Üretkenlik Skoru:</span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-sm border border-emerald-500/30">
                %{quickAiSummary.teamProductivityScore || 88}
              </span>
            </div>
          </div>

          <div className="mt-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            {quickAiSummary.executiveSummary}
          </div>

          {/* Highlights & Bottlenecks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Bottlenecks */}
            <div className="border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 bg-amber-50/40 dark:bg-amber-950/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Tespit Edilen Kritik Darboğazlar ({quickAiSummary.criticalBottlenecks?.length || 0})
              </h4>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {quickAiSummary.criticalBottlenecks?.slice(0, 3).map((b, i) => (
                  <li key={i} className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      • {b.areaOrProject} ({b.riskLevel} Risk):
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 pl-3">{b.description}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Strategic Advice */}
            <div className="border border-blue-200 dark:border-blue-900/40 rounded-xl p-4 bg-blue-50/40 dark:bg-blue-950/20">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-400 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                Yönetim Stratejik Eylem Planı
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {quickAiSummary.strategicAdvice?.slice(0, 3).map((a, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Staff Duty Match Preview & Publisher Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Staff Activity & Quick Alignment Action */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Personel Görev & Aktivite Durumu
              </h2>
              <p className="text-xs text-slate-500">
                Personelin üstlendiği ana görevler ve rapordaki fiili işlem hacimleri
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('persons')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Tümünü Gör ({persons.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {persons.slice(0, 7).map((p) => {
              const act = personReportCounts[p.name] || { count: 0, process: 0, cue: 0, eser: 0 };
              return (
                <div
                  key={p.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shrink-0 mt-0.5">
                      {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {p.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          {p.title}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Üstlendiği: </span>
                        {p.primaryDuties.slice(0, 2).join(' • ')}
                      </div>
                      {p.assignedPublishers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {p.assignedPublishers.map((pub) => (
                            <span
                              key={pub}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                            >
                              {pub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                    <div className="text-right text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {act.count} Rapor
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {act.process > 0 && `${act.process} proc `}
                        {act.cue > 0 && `${act.cue} cue `}
                        {act.eser > 0 && `${act.eser} eser`}
                      </div>
                    </div>

                    <button
                      onClick={() => onStartDutyAnalysis(p.name)}
                      className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:hover:bg-indigo-900/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 transition-colors"
                      title="Bu personelin görev tanımı ile raporlarını AI ile karşılaştır"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>AI Analiz</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Quick AI Assistant Entry Card */}
        <div className="space-y-6">
          {/* Quick AI Assistant Entry Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 border border-indigo-700/50 shadow-md">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Yönetim Soru-Cevap</span>
            </div>
            <h3 className="font-bold text-base text-white">Akıllı AI Asistanı</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              "Disney çalışmalarında kimler görev aldı?", "Cahit Benek Kürtçe eserlerde ne durumda?", "Pelikan CWR açığı var mı?" gibi soruları anında cevaplar.
            </p>
            <button
              onClick={() => onNavigateTab('chat')}
              className="mt-4 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow"
            >
              <span>AI Asistanına Soru Sor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
