import React, { useState } from 'react';
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
  BookOpen
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);

  const departments = ['all', ...Array.from(new Set(persons.map((p) => p.department)))];

  const filteredPersons = persons.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.primaryDuties.some((d) => d.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.assignedPublishers.some((pub) => pub.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = selectedDept === 'all' || p.department === selectedDept;
    return matchesSearch && matchesDept;
  });

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
      {/* Streamlined Header & Filter Toolbar */}
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
              {filteredPersons.length} personel kayıtlı &bull; Resmi görevler ve şirket atamaları
            </p>
          </div>
        </div>

        {/* Right: Quick Search, Department Filter & Add Button */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Personel veya görev ara..."
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

          <button
            onClick={onAddNewPerson}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Yeni Personel</span>
          </button>
        </div>
      </div>

      {/* Persons Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPersons.map((person) => {
          const stats = getPersonStats(person.name);

          return (
            <div
              key={person.id}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/70 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
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
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
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

                  {/* Assigned Publishers / Companies & Expertise */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    {person.assignedPublishers.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Sorumlu Olduğu Şirketler:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {person.assignedPublishers.map((pub) => (
                            <span
                              key={pub}
                              className="text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 font-medium flex items-center gap-1"
                            >
                              <Building2 className="w-3 h-3 text-blue-500" />
                              {pub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {person.specialExpertise.length > 0 && (
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1">
                          Özel Uzmanlık:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {person.specialExpertise.map((exp) => (
                            <span
                              key={exp}
                              className="text-xs px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 font-medium"
                            >
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

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
                    className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Raporlar</span>
                  </button>

                  <button
                    onClick={() => onStartDutyAnalysis(person.name)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>AI Görev Analizi</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Person Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(personToDelete)}
        title="Personeli Sil"
        message={`${personToDelete?.name} adlı personeli sistemden silmek istediğinize emin misiniz? Bu işlem personelin görev tanımını ve profilini kaldıracaktır.`}
        confirmText="Evet, Personeli Sil"
        cancelText="Vazgeç"
        isDanger={true}
        onConfirm={() => {
          if (personToDelete) {
            onDeletePerson(personToDelete.id);
            setPersonToDelete(null);
          }
        }}
        onClose={() => setPersonToDelete(null)}
      />
    </div>
  );
};
