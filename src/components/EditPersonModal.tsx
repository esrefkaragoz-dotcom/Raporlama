import React, { useState, useEffect } from 'react';
import { Person } from '../types';
import { X, Users, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface EditPersonModalProps {
  isOpen: boolean;
  onClose: () => void;
  personToEdit?: Person | null;
  onSavePerson: (personData: Partial<Person>) => Promise<void>;
}

export const EditPersonModal: React.FC<EditPersonModalProps> = ({
  isOpen,
  onClose,
  personToEdit,
  onSavePerson,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Dokümantasyon & Reprodüksiyon');
  const [title, setTitle] = useState('Dokümantasyon Uzmanı');

  const [primaryDuties, setPrimaryDuties] = useState<string[]>([]);
  const [newPrimaryDuty, setNewPrimaryDuty] = useState('');

  const [secondaryDuties, setSecondaryDuties] = useState<string[]>([]);
  const [newSecondaryDuty, setNewSecondaryDuty] = useState('');

  const [assignedPublishers, setAssignedPublishers] = useState<string[]>([]);
  const [newPublisher, setNewPublisher] = useState('');

  const [specialExpertise, setSpecialExpertise] = useState<string[]>([]);
  const [newExpertise, setNewExpertise] = useState('');

  const [specialRoleOrDuty, setSpecialRoleOrDuty] = useState('');
  const [hasCueDuty, setHasCueDuty] = useState(false);

  const [targetDailyProcess, setTargetDailyProcess] = useState<number | string>(50);
  const [targetDailyCueSheet, setTargetDailyCueSheet] = useState<number | string>(10);
  const [targetDailyEser, setTargetDailyEser] = useState<number | string>(30);
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setErrorMsg('');
    if (personToEdit) {
      setName(personToEdit.name);
      setEmail(personToEdit.email || '');
      setDepartment(personToEdit.department || 'Dokümantasyon & Reprodüksiyon');
      setTitle(personToEdit.title || 'Dokümantasyon Uzmanı');
      setSpecialRoleOrDuty(personToEdit.specialRoleOrDuty || '');
      setHasCueDuty(Boolean(personToEdit.hasCueDuty));
      setPrimaryDuties(personToEdit.primaryDuties || []);
      setSecondaryDuties(personToEdit.secondaryDuties || []);
      setAssignedPublishers(personToEdit.assignedPublishers || []);
      setSpecialExpertise(personToEdit.specialExpertise || []);
      setTargetDailyProcess(personToEdit.targetDailyProcess ?? 50);
      setTargetDailyCueSheet(personToEdit.targetDailyCueSheet ?? 10);
      setTargetDailyEser(personToEdit.targetDailyEser ?? 30);
      setNotes(personToEdit.notes || '');
    } else {
      setName('');
      setEmail('');
      setDepartment('Dokümantasyon & Reprodüksiyon');
      setTitle('Dokümantasyon Uzmanı');
      setSpecialRoleOrDuty('');
      setHasCueDuty(false);
      setPrimaryDuties(['Eser bildirimi ve tescil', 'Cue-sheet kontrolleri']);
      setSecondaryDuties(['Unknown eşleştirmeleri']);
      setAssignedPublishers(['Pelikan']);
      setSpecialExpertise(['CWR']);
      setTargetDailyProcess(50);
      setTargetDailyCueSheet(10);
      setTargetDailyEser(30);
      setNotes('');
    }
  }, [personToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddPrimaryDuty = () => {
    if (newPrimaryDuty.trim()) {
      setPrimaryDuties([...primaryDuties, newPrimaryDuty.trim()]);
      setNewPrimaryDuty('');
    }
  };

  const handleRemovePrimaryDuty = (idx: number) => {
    setPrimaryDuties(primaryDuties.filter((_, i) => i !== idx));
  };

  const handleAddPublisher = () => {
    if (newPublisher.trim() && !assignedPublishers.includes(newPublisher.trim())) {
      setAssignedPublishers([...assignedPublishers, newPublisher.trim()]);
      setNewPublisher('');
    }
  };

  const handleRemovePublisher = (pub: string) => {
    setAssignedPublishers(assignedPublishers.filter((p) => p !== pub));
  };

  const handleAddExpertise = () => {
    if (newExpertise.trim() && !specialExpertise.includes(newExpertise.trim())) {
      setSpecialExpertise([...specialExpertise, newExpertise.trim()]);
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (exp: string) => {
    setSpecialExpertise(specialExpertise.filter((e) => e !== exp));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Personel adı zorunludur.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await onSavePerson({
        id: personToEdit?.id,
        name: name.trim(),
        email: email.trim(),
        department: department.trim(),
        title: title.trim(),
        specialRoleOrDuty: specialRoleOrDuty.trim(),
        hasCueDuty,
        primaryDuties,
        secondaryDuties,
        assignedPublishers,
        specialExpertise,
        targetDailyProcess: Number(targetDailyProcess) || 0,
        targetDailyCueSheet: Number(targetDailyCueSheet) || 0,
        targetDailyEser: Number(targetDailyEser) || 0,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Kaydedilirken hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            {personToEdit ? `${personToEdit.name} — Görev Tanımı Düzenle` : 'Yeni Personel & Görev Tanımı Ekle'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
              {errorMsg}
            </div>
          )}
          {/* Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Personel Adı Soyadı:
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                E-Posta Adresi:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ad.soyad@mesam.org.tr"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Departman / Birim:
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Unvan / Görev Başlığı:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Official Special Role & Cue Duty (SharePoint Matrisi) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700 pt-4">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Resmi Özel Sorumluluk / Görev:
              </label>
              <input
                type="text"
                value={specialRoleOrDuty}
                onChange={(e) => setSpecialRoleOrDuty(e.target.value)}
                placeholder="Örn: TBK Bildirimleri, Üye Dilekçeleri, Eser Bildirimi..."
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center sm:pt-6">
              <label className="flex items-center space-x-2.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={hasCueDuty}
                  onChange={(e) => setHasCueDuty(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                />
                <span>Cue-Sheet Nöbeti (Cues) Sorumlusu</span>
              </label>
            </div>
          </div>

          {/* Primary Duties */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Üstlendiği Birincil Görevler (AI Uyum Analizinin Temel Referansı):
            </label>
            <div className="space-y-2 mb-2">
              {primaryDuties.map((duty, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">• {duty}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePrimaryDuty(idx)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPrimaryDuty}
                onChange={(e) => setNewPrimaryDuty(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPrimaryDuty();
                  }
                }}
                placeholder="Yeni birincil görev ekle (örn: Pelikan CWR kontrolleri)..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddPrimaryDuty}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* Assigned Publishers */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
              Sorumlu Olduğu Müzik Şirketleri & Edisyonlar:
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {assignedPublishers.map((pub) => (
                <span
                  key={pub}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-xs font-semibold flex items-center gap-1.5"
                >
                  {pub}
                  <button
                    type="button"
                    onClick={() => handleRemovePublisher(pub)}
                    className="hover:text-rose-500"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPublisher}
                onChange={(e) => setNewPublisher(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPublisher();
                  }
                }}
                placeholder="Şirket adı (örn: Pelikan, Disney, Median, Ahenk)..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddPublisher}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Ekle
              </button>
            </div>
          </div>

          {/* Daily Quotas */}
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
              Günlük Performans Hedef Kotaları:
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Process Hedefi:</span>
                <input
                  type="number"
                  value={targetDailyProcess}
                  onChange={(e) => setTargetDailyProcess(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Cue-Sheet Hedefi:</span>
                <input
                  type="number"
                  value={targetDailyCueSheet}
                  onChange={(e) => setTargetDailyCueSheet(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Eser Kayıt Hedefi:</span>
                <input
                  type="number"
                  value={targetDailyEser}
                  onChange={(e) => setTargetDailyEser(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-700">
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
              {submitting ? 'Kaydediliyor...' : 'Görev Tanımını Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
