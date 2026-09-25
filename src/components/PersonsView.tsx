import React, { useState, useMemo } from 'react';
import { Person, ReportItem } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { 
  Users, 
  Sparkles, 
  Plus, 
  Edit3, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Target, 
  Building2, 
  Briefcase,
  Search,
  Clock,
  Layers,
  FileSpreadsheet,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface PersonsViewProps {
  persons: Person[];
  reports: ReportItem[];
  onStartDutyAnalysis: (personName: string) => void;
  onViewPersonReports: (personName: string) => void;
  onEditPerson: (person: Person) => void;
  onDeletePerson: (personId: string) => void;
  onAddNewPerson: () => void;
}

export const PersonsView: React.FC<PersonsViewProps> = ({
  persons,
  reports,
  onStartDutyAnalysis,
  onViewPersonReports,
  onEditPerson,
  onDeletePerson,
  onAddNewPerson,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
  const [editionSearch, setEditionSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);

  const departments = ['all', ...Array.from(new Set(persons.map((p) => p.department)))];

  // Total unique assigned publishers across the team
  const totalPublishersCount = useMemo(() => {
    const pubSet = new Set<string>();
    persons.forEach((p) => {
      (p.assignedPublishers || []).forEach((pub) => {
        if (pub && pub !== 'Genel Eser Tescil Havuzu' && pub !== 'Üye Eser Bildirim Havuzu') {
          pubSet.add(pub);
        }
      });
    });
    return pubSet.size;
  }, [persons]);

  // Filtered persons based on regular search or department
  const filteredPersons = persons.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.specialRoleOrDuty && p.specialRoleOrDuty.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.primaryDuties.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.assignedPublishers.some((pub) => pub.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = selectedDept === 'all' || p.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  // Filtered persons specifically for the Matrix view when edition search is active
  const matrixPersons = useMemo(() => {
    if (!editionSearch.trim()) return persons;
    const q = editionSearch.toLowerCase().trim();
    return persons.filter((p) => 
      p.assignedPublishers.some((pub) => pub.toLowerCase().includes(q)) ||
      p.name.toLowerCase().includes(q) ||
      (p.specialRoleOrDuty && p.specialRoleOrDuty.toLowerCase().includes(q))
    );
  }, [persons, editionSearch]);

  const getPersonStats = (name: string) => {
    const personReports = reports.filter((r) => r.person.toLowerCase() === name.toLowerCase());
    const count = personReports.length;
    let processTotal = 0;
    let cueTotal = 0;
    let eserTotal = 0;
    let lastDate = '-';

    if (personReports.length > 0) {
      lastDate = personReports[0].start_date;
      personReports.forEach((r) => {
        if (r.parsedMetrics) {
          processTotal += r.parsedMetrics.processCount;
          cueTotal += r.parsedMetrics.cueSheetCount;
          eserTotal += r.parsedMetrics.eserCount;
        }
      });
    }

    return { count, processTotal, cueTotal, eserTotal, lastDate };
  };

  return (
    <div className="space-y-4">
      {/* Streamlined Header & View Switcher */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Title & Count */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Personel & Görev Tanımları
            </h1>
            <p className="text-xs text-slate-500">
              {persons.length} personel &bull; {totalPublishersCount} resmi edisyon &bull; SharePoint Görev Dağılımı
            </p>
          </div>
        </div>

        {/* Center: Segmented View Mode Toggle */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-700/60 shrink-0">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'cards'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Personel Kartları ({persons.length})</span>
          </button>
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'matrix'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Edisyon & Görev Matrisi (SharePoint)</span>
          </button>
        </div>

        {/* Right: Add Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAddNewPerson}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Personel</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Personel, edisyon veya görev ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept === 'all' ? 'Tüm Birimler' : dept}
                </option>
              ))}
            </select>
          </div>

          {/* Persons Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredPersons.map((person) => {
              const stats = getPersonStats(person.name);

              return (
                <div
                  key={person.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/70 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top User Info Header */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-md shadow-blue-500/20">
                          {person.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                            {person.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                              {person.title}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {person.department}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onEditPerson(person)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Görev Tanımını Düzenle"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPersonToDelete(person)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Personeli Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Official Special Role & Cue Duty Badges */}
                    {(person.specialRoleOrDuty || person.hasCueDuty) && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {person.specialRoleOrDuty && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 text-xs font-bold flex items-center gap-1.5">
                            <span>⭐</span>
                            <span>{person.specialRoleOrDuty}</span>
                          </span>
                        )}
                        {person.hasCueDuty && (
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60 text-xs font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Cue-Sheet Nöbeti (Cues)</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Assigned Duties Section */}
                    <div className="mt-4 space-y-3">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                          Üstlendiği Birincil Görevler ({person.primaryDuties.length})
                        </h4>
                        <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                          {person.primaryDuties.map((duty, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-snug">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{duty}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Secondary Duties */}
                      {person.secondaryDuties.length > 0 && (
                        <div>
                          <h4 className="text-[11px] font-semibold text-slate-400 mb-1">İkincil / Ek Görevler:</h4>
                          <div className="flex flex-wrap gap-1">
                            {person.secondaryDuties.map((duty, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
                              >
                                {duty}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Assigned Publishers / Companies */}
                      {person.assignedPublishers.length > 0 && (
                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              <Building2 className="w-3.5 h-3.5 text-blue-500" />
                              <span>Sorumlu Olduğu Edisyonlar ({person.assignedPublishers.length})</span>
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
                            {person.assignedPublishers.map((pub) => (
                              <span
                                key={pub}
                                className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 font-medium"
                              >
                                {pub}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Targets & Quotas */}
                      <div className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                          <Target className="w-3.5 h-3.5 text-amber-500" />
                          <span>Günlük Hedef:</span>
                        </div>
                        <div className="flex items-center space-x-3 text-slate-700 dark:text-slate-300 font-semibold">
                          <span>Process: {person.targetDailyProcess || '-'}</span>
                          <span>Cue-Sheet: {person.targetDailyCueSheet || '-'}</span>
                          <span>Eser: {person.targetDailyEser || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Actual Stats & AI Action */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{stats.count} Rapor</span>
                      {stats.processTotal > 0 && ` • ${stats.processTotal} proc`}
                      {stats.cueTotal > 0 && ` • ${stats.cueTotal} cue`}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewPersonReports(person.name)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Raporlar
                      </button>

                      <button
                        onClick={() => onStartDutyAnalysis(person.name)}
                        className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>AI Görev Karnesi</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: EDİSYON & GÖREV DAĞILIM MATRİSİ (SHAREPOINT EXCEL LİSTESİ) */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Kayıtlı Personel
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>{persons.length} Uzman</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Atanmış Edisyon
              </span>
              <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                <span>{totalPublishersCount} Edisyon</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Özel Bildirim Yetkisi
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <span className="text-base">⭐</span>
                <span>6 Sorumlu</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Cue-Sheet Nöbeti
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>4 Uzman (Cues)</span>
              </div>
            </div>
          </div>

          {/* SharePoint Interactive Filter & Search Bar */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Edisyon / Şirket veya Personel ara (örn: Pelikan, Wediacorp, DMC, Kalan)..."
                value={editionSearch}
                onChange={(e) => setEditionSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>MESAM Resmi SharePoint Edisyon ve İş Dağılımı Tablosu ile 100% senkronize</span>
            </div>
          </div>

          {/* Comprehensive Matrix Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">Personel & Pozisyon</th>
                    <th className="py-3 px-4">Resmi Özel Sorumluluk</th>
                    <th className="py-3 px-4">Cue Nöbeti</th>
                    <th className="py-3 px-4">Sorumlu Olduğu Edisyonlar & Şirketler</th>
                    <th className="py-3 px-4 text-center">Edisyon Sayısı</th>
                    <th className="py-3 px-4 text-center">Rapor Sayısı</th>
                    <th className="py-3 px-4 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {matrixPersons.map((p) => {
                    const stats = getPersonStats(p.name);
                    const isMatched = editionSearch.trim() && p.assignedPublishers.some((pub) => 
                      pub.toLowerCase().includes(editionSearch.toLowerCase().trim())
                    );

                    return (
                      <tr 
                        key={p.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors ${
                          isMatched ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                        }`}
                      >
                        {/* Person Name & Title */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                            <span>{p.name}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {p.title} &bull; {p.department}
                          </div>
                        </td>

                        {/* Special Role / Duty */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {p.specialRoleOrDuty ? (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-bold text-xs inline-flex items-center gap-1">
                              <span>⭐</span>
                              <span>{p.specialRoleOrDuty}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">-</span>
                          )}
                        </td>

                        {/* Cue Duty */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {p.hasCueDuty ? (
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60 font-bold text-xs inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Cues Nöbetçisi</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">-</span>
                          )}
                        </td>

                        {/* Assigned Publishers */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-lg">
                            {p.assignedPublishers.map((pub) => {
                              const isPubMatch = editionSearch.trim() && pub.toLowerCase().includes(editionSearch.toLowerCase().trim());
                              return (
                                <span
                                  key={pub}
                                  className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                                    isPubMatch 
                                      ? 'bg-amber-500 text-white font-bold ring-2 ring-amber-400' 
                                      : 'bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300'
                                  }`}
                                >
                                  {pub}
                                </span>
                              );
                            })}
                          </div>
                        </td>

                        {/* Edition Count */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-black text-xs">
                            {p.assignedPublishers.length}
                          </span>
                        </td>

                        {/* Report Count */}
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                          {stats.count > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">{stats.count} rapor</span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => onStartDutyAnalysis(p.name)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            <span>Karne</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {personToDelete && (
        <ConfirmModal
          isOpen={true}
          title="Personeli Sil"
          message={`"${personToDelete.name}" adlı personeli ve görev tanımlarını silmek istediğinizden emin misiniz?`}
          confirmText="Personeli Sil"
          onConfirm={() => {
            onDeletePerson(personToDelete.id);
            setPersonToDelete(null);
          }}
          onClose={() => setPersonToDelete(null)}
        />
      )}
    </div>
  );
};
