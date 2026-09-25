import React, { useState, useEffect } from 'react';
import { Person, ReportItem, PersonDutyAnalysis, TeamWorkloadAnalysis } from '../types';
import { AiChatAssistant } from './AiChatAssistant';
import { 
  Sparkles, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Lightbulb, 
  Printer, 
  TrendingUp, 
  Briefcase, 
  Building2,
  FileCheck,
  Award,
  RefreshCw,
  MessageSquare
} from 'lucide-react';

interface AiAnalysisViewProps {
  persons: Person[];
  reports: ReportItem[];
  preselectedPersonName?: string;
  onClearPreselectedPerson?: () => void;
  initialSubTab?: 'individual' | 'team' | 'assistant';
}

export const AiAnalysisView: React.FC<AiAnalysisViewProps> = ({
  persons,
  reports,
  preselectedPersonName,
  initialSubTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'individual' | 'team' | 'assistant'>(
    initialSubTab || 'individual'
  );

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [selectedPerson, setSelectedPerson] = useState<string>(
    preselectedPersonName || (persons.length > 0 ? persons[0].name : '')
  );

  const [loadingIndividual, setLoadingIndividual] = useState(false);
  const [individualResult, setIndividualResult] = useState<PersonDutyAnalysis | null>(null);

  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamResult, setTeamResult] = useState<TeamWorkloadAnalysis | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const currentPersonObj = persons.find((p) => p.name.toLowerCase() === selectedPerson.toLowerCase());

  // Run individual analysis
  const handleRunIndividualAnalysis = async (personNameToAnalyze = selectedPerson) => {
    if (!personNameToAnalyze) return;
    setLoadingIndividual(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai/person-duty-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personName: personNameToAnalyze }),
      });
      const data = await res.json();
      if (data.ok && data.analysis) {
        setIndividualResult(data.analysis);
      } else {
        setErrorMsg(data.error || 'Analiz oluşturulamadı.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('AI bağlantısında bir hata oluştu.');
    } finally {
      setLoadingIndividual(false);
    }
  };

  // Run team analysis
  const handleRunTeamAnalysis = async () => {
    setLoadingTeam(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/ai/team-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.ok && data.analysis) {
        setTeamResult(data.analysis);
      } else {
        setErrorMsg(data.error || 'Ekip analizi oluşturulamadı.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('AI bağlantısında bir hata oluştu.');
    } finally {
      setLoadingTeam(false);
    }
  };

  // Print helper
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Streamlined Top Controls & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm print:hidden">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              AI Görev & Rol Uyumu Analizi
            </h1>
            <p className="text-xs text-slate-500">
              Personel görev tanımları ile fiili raporların Gemini AI tarafından karşılaştırılması
            </p>
          </div>
        </div>

        {/* Clean Segmented Sub-tab Switcher - Simplified 3 Tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl border border-slate-200/60 dark:border-slate-600/40 shrink-0">
          <button
            onClick={() => setActiveSubTab('individual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'individual'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Bireysel Kişi Karnesi</span>
          </button>
          <button
            onClick={() => {
              setActiveSubTab('team');
              if (!teamResult) handleRunTeamAnalysis();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'team'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ekip Geneli İş Yükü</span>
          </button>
          <button
            onClick={() => setActiveSubTab('assistant')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'assistant'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Danışman (Soru-Cevap)</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-semibold border border-rose-200 dark:border-rose-900/50 print:hidden">
          {errorMsg}
        </div>
      )}

      {/* SUBTAB 1: INDIVIDUAL PERSON DUTY ALIGNMENT ANALYSIS */}
      {activeSubTab === 'individual' && (
        <div className="space-y-6">
          {/* Person Selector & Duty Definition Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm print:hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5">
                  İncelenecek Personeli Seçin:
                </label>
                <select
                  value={selectedPerson}
                  onChange={(e) => {
                    setSelectedPerson(e.target.value);
                    setIndividualResult(null);
                  }}
                  className="w-full sm:max-w-md px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {persons.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} — {p.title} ({p.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => handleRunIndividualAnalysis(selectedPerson)}
                  disabled={loadingIndividual}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-blue-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {loadingIndividual ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Gemini AI Analiz Ediyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>AI Görev Uyum Analizini Başlat</span>
                    </>
                  )}
                </button>

                {individualResult && (
                  <button
                    onClick={handlePrint}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-200 transition-colors"
                    title="Yazdır / PDF Olarak Kaydet"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Current Person's Assigned Profile Baseline */}
            {currentPersonObj && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Üstlendiği Birincil Görevler:
                  </span>
                  <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                    {currentPersonObj.primaryDuties.map((d, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Atanan Şirket & Edisyonlar:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {currentPersonObj.assignedPublishers.map((pub, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                      >
                        {pub}
                      </span>
                    ))}
                  </div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mt-2 mb-1">
                    Özel Uzmanlık:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {currentPersonObj.specialExpertise.map((exp, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium"
                      >
                        {exp}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Günlük Performans Hedefi:
                  </span>
                  <div className="space-y-1 text-slate-700 dark:text-slate-300">
                    <div>Process: <span className="font-semibold">{currentPersonObj.targetDailyProcess || '-'} adet</span></div>
                    <div>Cue-Sheet: <span className="font-semibold">{currentPersonObj.targetDailyCueSheet || '-'} bölüm</span></div>
                    <div>Eser Kayıt: <span className="font-semibold">{currentPersonObj.targetDailyEser || '-'} adet</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prompt to Run Analysis if not yet run */}
          {!individualResult && !loadingIndividual && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {selectedPerson} İçin AI Görev Analizi Hazır
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Yukarıdaki butona basarak personelin sisteme girdiği tüm raporları ile üstlendiği resmi görev tanımlarını
                Gemini AI ile derinlemesine karşılaştırın.
              </p>
              <button
                onClick={() => handleRunIndividualAnalysis(selectedPerson)}
                className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow"
              >
                Analizi Şimdi Başlat
              </button>
            </div>
          )}

          {/* Loading Skeleton */}
          {loadingIndividual && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-4">
              <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Gemini 3.8 Flash, {selectedPerson}'in raporlarını görev tanımıyla kıyaslıyor...
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Eser sayıları, CWR güncellemeleri, cue-sheet hacimleri ve görev dışı yapılan işler inceleniyor.
              </p>
            </div>
          )}

          {/* RESULTS DISPLAY */}
          {individualResult && (
            <div className="space-y-6">
              {/* Score & Executive Badge Card */}
              <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/80 p-6 shadow-md">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-700/60">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                      Bireysel Performans & Rol Uyumu Karnesi
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {individualResult.personName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Dönem: {individualResult.periodText || 'Son Raporlama Periyodu'}
                    </p>
                  </div>

                  {/* Score Ring / Pill */}
                  <div className="flex items-center space-x-4 bg-slate-100 dark:bg-slate-800/80 px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
                    <div className="text-center">
                      <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
                        %{individualResult.dutyAlignmentScore}
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Görev Uyumu Skoru
                      </span>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                    <div>
                      <div className="text-xs font-semibold text-slate-500">Uyum Seviyesi:</div>
                      <span
                        className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          individualResult.alignmentLevel === 'Çok Yüksek'
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            : individualResult.alignmentLevel === 'Yüksek'
                            ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {individualResult.alignmentLevel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Overall Summary Text */}
                <div className="mt-5 bg-white dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    Yönetici Özeti
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {individualResult.summary}
                  </p>
                </div>

                {/* Work Volume Stats Mini Grid */}
                {individualResult.workVolumeSummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-[11px] font-semibold text-slate-400 block">Toplam Rapor</span>
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        {individualResult.workVolumeSummary.totalReports}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-[11px] font-semibold text-slate-400 block">Process</span>
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {individualResult.workVolumeSummary.totalProcess.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-[11px] font-semibold text-slate-400 block">Cue-Sheet</span>
                      <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {individualResult.workVolumeSummary.totalCueSheets.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-[11px] font-semibold text-slate-400 block">Eser Tescil</span>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {individualResult.workVolumeSummary.totalEser.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                      <span className="text-[11px] font-semibold text-slate-400 block">Dilekçe</span>
                      <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                        {individualResult.workVolumeSummary.totalDilekce}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 3-Column Detailed Analysis Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1: In-Scope Duties Performed */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 p-5 shadow-sm">
                  <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm mb-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <h3>Görev Tanımına Tam Uygun İşler</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Personelin üstlendiği resmi görevler kapsamında başarıyla yerine getirdiği işlemler:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    {individualResult.inScopeDutiesPerformed.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                        <span className="text-emerald-600 font-bold mt-0.5">•</span>
                        <span className="leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2: Out of Scope / Extra Tasks */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-900/40 p-5 shadow-sm">
                  <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400 font-bold text-sm mb-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <h3>Görev Tanımı Dışı / Ekstra İşler</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Resmi görev listesinde yer almayan, acil veya diğer birimlere destek olarak yapılan işler:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    {individualResult.outOfScopeTasks.length === 0 ? (
                      <li className="text-slate-400 italic text-xs">Görev tanımı dışı belirgin iş kaydedilmedi.</li>
                    ) : (
                      individualResult.outOfScopeTasks.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-100 dark:border-amber-900/30">
                          <span className="text-amber-600 font-bold mt-0.5">•</span>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                {/* 3: Neglected or Under-reported Duties */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-900/40 p-5 shadow-sm">
                  <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400 font-bold text-sm mb-3">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    <h3>Bekleyen / İhmal Edilen Alanlar</h3>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Görev tanımında olup incelenen raporlarda az rastlanan veya yapılmadığı görülen alanlar:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                    {individualResult.neglectedOrPendingDuties.length === 0 ? (
                      <li className="text-slate-400 italic text-xs">Tüm atanmış sorumluluklar düzenli raporlandı.</li>
                    ) : (
                      individualResult.neglectedOrPendingDuties.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 bg-rose-50/50 dark:bg-rose-950/20 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/30">
                          <span className="text-rose-600 font-bold mt-0.5">•</span>
                          <span className="leading-snug">{item}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              {/* Manager Recommendations Card */}
              <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-indigo-800">
                <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm uppercase tracking-wider mb-2">
                  <Lightbulb className="w-5 h-5" />
                  <span>Yöneticiye Yönlendirme ve Tavsiyeler (Eşref Bey / Yönetim)</span>
                </div>
                <p className="text-xs text-slate-300 mb-4">
                  Bu personelin kapasite kullanımı, iş yükü dengelenmesi ve hedef takibi için önerilen eylemler:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {individualResult.managerRecommendations.map((rec, i) => (
                    <div key={i} className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-xs text-slate-200 leading-relaxed font-medium">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: TEAM WORKLOAD & BOTTLENECK ANALYSIS */}
      {activeSubTab === 'team' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Ekip Geneli İş Yükü ve Darboğaz Analizi
              </h2>
              <p className="text-xs text-slate-500">
                Tüm personelin üstlendiği roller ile gerçek üretimini karşılaştırarak yığılmaları ve riskleri tespit eder.
              </p>
            </div>
            <button
              onClick={handleRunTeamAnalysis}
              disabled={loadingTeam}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
            >
              {loadingTeam ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Analizi Yenile</span>
            </button>
          </div>

          {loadingTeam && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center space-y-4">
              <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Ekip geneli iş yükü ve edisyon dağılımı analiz ediliyor...
              </div>
            </div>
          )}

          {teamResult && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {teamResult.title || 'Ekip İş Yükü ve Verimlilik Raporu'}
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold">
                    Ekip Skoru: %{teamResult.teamProductivityScore}
                  </span>
                </div>
                <p className="mt-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {teamResult.executiveSummary}
                </p>
              </div>

              {/* Workload Distribution Table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Kişi Bazlı İş Yükü Seviyeleri ve Rol Uyumu
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase tracking-wider font-semibold">
                        <th className="pb-2.5">Personel</th>
                        <th className="pb-2.5">İş Yükü Seviyesi</th>
                        <th className="pb-2.5">Ana Odaklandığı Süreç</th>
                        <th className="pb-2.5">Görev Uyumu</th>
                        <th className="pb-2.5">Değerlendirme Notu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {teamResult.workloadDistribution?.map((item, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="py-3 font-semibold text-slate-900 dark:text-white">
                            {item.personName}
                          </td>
                          <td className="py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                item.loadLevel === 'Aşırı Yüklü'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : item.loadLevel === 'Yoğun'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                  : item.loadLevel === 'Dengeli'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {item.loadLevel}
                            </span>
                          </td>
                          <td className="py-3 text-slate-700 dark:text-slate-300">{item.primaryFocus}</td>
                          <td className="py-3 font-bold text-blue-600 dark:text-blue-400">%{item.alignmentScore}</td>
                          <td className="py-3 text-slate-500 dark:text-slate-400 max-w-xs">{item.comment}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottlenecks and Publisher Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Bottlenecks */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-4 h-4" />
                    Kritik Darboğazlar ve Operasyonel Riskler
                  </h3>
                  <div className="space-y-3">
                    {teamResult.criticalBottlenecks?.map((b, i) => (
                      <div key={i} className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                          <span>{b.areaOrProject}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300">
                            {b.riskLevel}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{b.description}</p>
                        <div className="mt-2 text-rose-800 dark:text-rose-300 font-medium">
                          Öneri: {b.suggestedAction}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Publisher Coverage */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-3">
                    <Building2 className="w-4 h-4" />
                    Şirket & Edisyon Süreç Durumu
                  </h3>
                  <div className="space-y-2.5 text-xs">
                    {teamResult.publisherCoverage?.map((p, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">{p.publisherName}</div>
                          <div className="text-[11px] text-slate-400">
                            Sorumlular: {Array.isArray(p.activeHandlers) && p.activeHandlers.length > 0 ? p.activeHandlers.join(', ') : (p.activeHandlers || 'Genel Ekip')}
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                          {p.workStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategic Advice Card */}
              {teamResult.strategicAdvice && teamResult.strategicAdvice.length > 0 && (
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-indigo-800/60">
                  <div className="flex items-center space-x-2 text-amber-300 font-bold text-sm uppercase tracking-wider mb-2">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                    <span>Yönetime Stratejik Eylem Planı (Eşref Bey / Yönetim Kurulu)</span>
                  </div>
                  <p className="text-xs text-slate-300 mb-4">
                    İş yükünün dengelenmesi, darboğazların çözülmesi ve edisyon süreçlerinin kesintisiz yürümesi için önerilen adımlar:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {teamResult.strategicAdvice.map((advice, i) => (
                      <div key={i} className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-xs text-slate-200 leading-relaxed font-medium">{advice}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: INTERACTIVE AI ASSISTANT */}
      {activeSubTab === 'assistant' && (
        <AiChatAssistant persons={persons} reports={reports} />
      )}
    </div>
  );
};
