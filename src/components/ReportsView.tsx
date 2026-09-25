import React, { useState } from 'react';
import { Person, ReportItem } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  Plus, 
  Calendar, 
  Tag, 
  Cpu, 
  Film, 
  Music, 
  Scale, 
  Filter,
  Sparkles,
  Building2
} from 'lucide-react';

interface ReportsViewProps {
  reports: ReportItem[];
  persons: Person[];
  onAddNewReport: () => void;
  onDeleteReport: (id: string) => void;
  onSelectPerson: (name: string) => void;
  filterPersonName?: string;
  onClearPersonFilter?: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  persons,
  onAddNewReport,
  onDeleteReport,
  onSelectPerson,
  filterPersonName,
  onClearPersonFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(filterPersonName || 'all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPublisher, setSelectedPublisher] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportToDelete, setReportToDelete] = useState<ReportItem | null>(null);

  // Collect available publishers & categories
  const allPublishers = Array.from(
    new Set(
      reports.flatMap((r) => r.parsedMetrics?.detectedPublishers || [])
    )
  ).sort();

  const allCategories = [
    'Process',
    'Cue Sheet',
    'Eser Kaydı / Bildirimi',
    'Sözleşme & Hak Sahipliği',
    'Dilekçe & Hukuk / TBK',
    'Unknown / Çakışma / Eşleştirme',
    'Toplantı & Telefon / Görüşme',
  ];

  // Filter logic
  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.report.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.person.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPerson = selectedPerson === 'all' || r.person.toLowerCase() === selectedPerson.toLowerCase();

    const matchesStart = !startDate || r.start_date >= startDate;
    const matchesEnd = !endDate || r.start_date <= endDate;

    const matchesCategory =
      selectedCategory === 'all' ||
      r.parsedMetrics?.detectedCategories.includes(selectedCategory);

    const matchesPublisher =
      selectedPublisher === 'all' ||
      r.parsedMetrics?.detectedPublishers.includes(selectedPublisher);

    return matchesSearch && matchesPerson && matchesStart && matchesEnd && matchesCategory && matchesPublisher;
  });

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['ID', 'Kayit Zamani', 'Kisi', 'Baslangic Tarihi', 'Bitis Tarihi', 'Rapor'];
    const rows = filteredReports.map((r) => [
      r.id,
      r.created_at,
      r.person,
      r.start_date,
      r.end_date,
      `"${r.report.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `raporlar_filtreli_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Gelen Günlük İş Raporları
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Toplam <span className="font-bold text-slate-900 dark:text-white">{reports.length}</span> rapor kaydı,{' '}
            <span className="font-bold text-blue-600 dark:text-blue-400">{filteredReports.length}</span> rapor listeleniyor.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-all"
            title="CSV / Excel Tablosu İndir"
          >
            <Download className="w-4 h-4" />
            <span>CSV İndir</span>
          </button>

          <button
            onClick={onAddNewReport}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Rapor Ekle</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Rapor içeriğinde veya kişi adında ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Person Selector */}
          <div className="sm:w-60">
            <select
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Kişiler ({persons.length})</option>
              {persons.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second row of filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          {/* Category Filter */}
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Tüm İş Kategorileri</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Publisher Filter */}
          <div className="flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedPublisher}
              onChange={(e) => setSelectedPublisher(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">Tüm Edisyon / Şirketler</option>
              {allPublishers.map((pub) => (
                <option key={pub} value={pub}>
                  {pub}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
              placeholder="Başlangıç"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
              placeholder="Bitiş"
            />
          </div>

          {/* Reset Filters */}
          {(searchTerm || selectedPerson !== 'all' || selectedCategory !== 'all' || selectedPublisher !== 'all' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedPerson('all');
                setSelectedCategory('all');
                setSelectedPublisher('all');
                setStartDate('');
                setEndDate('');
                if (onClearPersonFilter) onClearPersonFilter();
              }}
              className="text-xs text-blue-600 hover:underline font-semibold ml-auto"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      </div>

      {/* Reports Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-4">Tarih</th>
                <th className="py-3 px-4">Personel</th>
                <th className="py-3 px-4">Rapor İçeriği</th>
                <th className="py-3 px-4">Tespit Edilen Metrikler</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Seçili filtrelerle eşleşen rapor bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredReports.map((item) => {
                  const m = item.parsedMetrics;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300 font-medium">
                        <div>{item.start_date}</div>
                        {item.end_date && item.end_date !== item.start_date && (
                          <div className="text-[10px] text-slate-400">~ {item.end_date}</div>
                        )}
                      </td>

                      {/* Person */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => onSelectPerson(item.person)}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {item.person}
                        </button>
                      </td>

                      {/* Report Content */}
                      <td className="py-3 px-4 max-w-md">
                        <div className="whitespace-pre-line text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                          {item.report}
                        </div>
                      </td>

                      {/* Parsed Badges */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="flex flex-wrap gap-1">
                          {m && m.processCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                              <Cpu className="w-3 h-3" />
                              {m.processCount} Proc
                            </span>
                          )}
                          {m && m.cueSheetCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold flex items-center gap-1">
                              <Film className="w-3 h-3" />
                              {m.cueSheetCount} Cue
                            </span>
                          )}
                          {m && m.eserCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-bold flex items-center gap-1">
                              <Music className="w-3 h-3" />
                              {m.eserCount} Eser
                            </span>
                          )}
                          {m && m.dilekceCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-bold flex items-center gap-1">
                              <Scale className="w-3 h-3" />
                              {m.dilekceCount} Dilekçe
                            </span>
                          )}
                          {m &&
                            m.detectedPublishers.map((pub) => (
                              <span
                                key={pub}
                                className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[10px] font-medium"
                              >
                                {pub}
                              </span>
                            ))}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setReportToDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Raporu Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Report Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(reportToDelete)}
        title="Rapor Kaydını Sil"
        message={`${reportToDelete?.person} personeline ait (${reportToDelete?.start_date}) tarihli rapor kaydını silmek istediğinize emin misiniz?`}
        confirmText="Evet, Raporu Sil"
        cancelText="Vazgeç"
        isDanger={true}
        onConfirm={() => {
          if (reportToDelete) {
            onDeleteReport(reportToDelete.id);
            setReportToDelete(null);
          }
        }}
        onClose={() => setReportToDelete(null)}
      />
    </div>
  );
};
