import React, { useState } from 'react';
import { Person } from '../types';
import { X, PlusCircle, Calendar, User, FileText } from 'lucide-react';

interface NewReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  persons: Person[];
  onSaveReport: (reportData: { person: string; start_date: string; end_date: string; report: string }) => Promise<void>;
}

export const NewReportModal: React.FC<NewReportModalProps> = ({
  isOpen,
  onClose,
  persons,
  onSaveReport,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const [person, setPerson] = useState(persons.length > 0 ? persons[0].name : '');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!person || !reportText.trim()) {
      setErrorMsg('Lütfen kişi ve rapor metnini doldurun.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await onSaveReport({
        person,
        start_date: startDate,
        end_date: endDate || startDate,
        report: reportText.trim(),
      });
      setReportText('');
      setErrorMsg('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Rapor kaydedilirken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            Yeni Günlük Rapor Girişi
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
              {errorMsg}
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Personel Seçin:
            </label>
            <select
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              required
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              {persons.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.title})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Başlangıç Tarihi:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Bitiş Tarihi:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Rapor Metni / Yapılan İşler:
            </label>
            <textarea
              rows={5}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Örn: 45 adet process yapıldı, Pelikan CWR güncellendi, 3 cue-sheet sisteme girildi..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              💡 Sistem process, cue-sheet, eser sayılarını ve şirket adlarını otomatik algılar.
            </span>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-all disabled:opacity-50"
            >
              {submitting ? 'Kaydediliyor...' : 'Raporu Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
