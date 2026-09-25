import React, { useState } from 'react';
import { UploadCloud, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { ReportItem } from '../types';

interface ReportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: () => void;
}

export const ReportImportModal: React.FC<ReportImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [rawText, setRawText] = useState('');
  const [importing, setImporting] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Simple parser for CSV (semicolon or comma separated) or JSON
  const handleParse = (text: string) => {
    setRawText(text);
    setStatusMsg('');
    setErrorMsg('');
    const trimmed = text.trim();
    if (!trimmed) {
      setParsedPreview([]);
      return;
    }

    // Try JSON first
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const json = JSON.parse(trimmed);
        if (Array.isArray(json)) {
          const valid = json.map((item) => ({
            person: item.person || item.kisi || item.name || '',
            start_date: item.start_date || item.tarih || item.date || new Date().toISOString().slice(0, 10),
            end_date: item.end_date || item.start_date || new Date().toISOString().slice(0, 10),
            report: item.report || item.rapor || '',
          })).filter((x) => x.person && x.report);
          setParsedPreview(valid);
          setStatusMsg(`${valid.length} adet geçerli JSON raporu tespit edildi.`);
          return;
        }
      } catch (e) {
        // fallthrough to CSV
      }
    }

    // Try CSV format
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const parsedRows: any[] = [];

    // Check if line 0 is header
    const firstLine = lines[0].toLowerCase();
    const isSemicolon = lines[0].includes(';');
    const delimiter = isSemicolon ? ';' : ',';

    const startIndex = firstLine.includes('kisi') || firstLine.includes('person') || firstLine.includes('rapor') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV split
      const parts = line.split(delimiter).map((p) => p.trim().replace(/^"|"$/g, ''));
      if (parts.length >= 3) {
        // If has 6 parts (standard MESAM format: ID;Kayit Zamani;Kisi;Baslangic;Bitis;Rapor)
        if (parts.length >= 6) {
          parsedRows.push({
            person: parts[2],
            start_date: parts[3],
            end_date: parts[4],
            report: parts.slice(5).join(delimiter),
          });
        } else if (parts.length === 3) {
          // Format: Kisi, Tarih, Rapor
          parsedRows.push({
            person: parts[0],
            start_date: parts[1],
            end_date: parts[1],
            report: parts[2],
          });
        } else {
          parsedRows.push({
            person: parts[0],
            start_date: parts[1],
            end_date: parts[2] || parts[1],
            report: parts.slice(3).join(delimiter),
          });
        }
      }
    }

    setParsedPreview(parsedRows);
    setStatusMsg(`${parsedRows.length} adet satır başarıyla ayrıştırıldı.`);
  };

  const handleExecuteImport = async () => {
    if (parsedPreview.length === 0) {
      setErrorMsg('İçe aktarılacak geçerli rapor bulunamadı.');
      return;
    }

    setImporting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/reports/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: parsedPreview }),
      });
      const data = await res.json();
      if (data.ok) {
        onImportSuccess();
        onClose();
      } else {
        setErrorMsg(data.error || 'İçe aktarma başarısız oldu.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Sunucuya gönderilirken bir hata oluştu.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            Dışarıdan Toplu Rapor İçe Aktar
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs text-slate-500 leading-relaxed mb-2">
              Dışarıdan gelen CSV, noktalı virgüllü Excel çıktısı (<code>ID;Kayit Zamani;Kisi;Baslangic;Bitis;Rapor</code>)
              veya JSON verisini buraya yapıştırabilirsiniz:
            </p>

            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => handleParse(e.target.value)}
              placeholder="Örnek CSV / Metin:
Nursena Harput;2026-09-24;2026-09-24;Pelikan cue-sheet kontrolü yapıldı
Onur İnanç;2026-09-24;2026-09-24;110 adet process yapıldı"
              className="w-full font-mono text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {statusMsg && (
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center space-x-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview list */}
          {parsedPreview.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/60 text-xs">
              {parsedPreview.slice(0, 10).map((row, i) => (
                <div key={i} className="p-2.5 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white mr-2">{row.person}</span>
                    <span className="text-slate-400 text-[11px]">({row.start_date})</span>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] truncate max-w-sm mt-0.5">
                      {row.report}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-semibold shrink-0">
                    Geçerli
                  </span>
                </div>
              ))}
              {parsedPreview.length > 10 && (
                <div className="p-2 text-center text-xs text-slate-400 italic">
                  ve {parsedPreview.length - 10} adet daha...
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              İptal
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={parsedPreview.length === 0 || importing}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-all disabled:opacity-50"
            >
              {importing ? 'Aktarılıyor...' : `${parsedPreview.length} Raporu Sisteme Aktar`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
