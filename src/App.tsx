import React, { useState, useEffect } from 'react';
import { Person, ReportItem } from './types';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { PersonsView } from './components/PersonsView';
import { AiAnalysisView } from './components/AiAnalysisView';
import { ReportsView } from './components/ReportsView';
import { AiChatAssistant } from './components/AiChatAssistant';
import { NewReportModal } from './components/NewReportModal';
import { ReportImportModal } from './components/ReportImportModal';
import { EditPersonModal } from './components/EditPersonModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'persons' | 'ai-analysis' | 'reports' | 'chat'>('dashboard');

  const [persons, setPersons] = useState<Person[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cross-view selections
  const [filterPersonName, setFilterPersonName] = useState<string>('');
  const [preselectedPersonForAi, setPreselectedPersonForAi] = useState<string>('');

  // Modals & Feedback
  const [isNewReportOpen, setIsNewReportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isEditPersonOpen, setIsEditPersonOpen] = useState(false);
  const [personToEdit, setPersonToEdit] = useState<Person | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [pRes, rRes] = await Promise.all([
        fetch('/api/persons'),
        fetch('/api/reports'),
      ]);
      const pData = await pRes.json();
      const rData = await rRes.json();

      if (pData.ok && pData.persons) {
        setPersons(pData.persons);
      }
      if (rData.ok && rData.reports) {
        setReports(rData.reports);
      }
    } catch (err) {
      console.error('Veri yüklenirken hata:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Save report
  const handleSaveReport = async (reportData: { person: string; start_date: string; end_date: string; report: string }) => {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData),
    });
    const data = await res.json();
    if (data.ok) {
      await fetchAllData();
    } else {
      throw new Error(data.error);
    }
  };

  // Delete report
  const handleDeleteReport = async (id: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        showToast('Rapor kaydı başarıyla silindi.', 'success');
      } else {
        showToast(data.error || 'Rapor silinemedi.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Rapor silinirken bağlantı hatası oluştu.', 'error');
    }
  };

  // Save / Update Person
  const handleSavePerson = async (personData: Partial<Person>) => {
    const isEdit = Boolean(personData.id);
    const url = isEdit ? `/api/persons/${personData.id}` : '/api/persons';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personData),
    });
    const data = await res.json();
    if (data.ok) {
      await fetchAllData();
      showToast(isEdit ? 'Personel görev tanımı güncellendi.' : 'Yeni personel sisteme eklendi.', 'success');
    } else {
      showToast(data.error || 'Kayıt başarısız oldu.', 'error');
      throw new Error(data.error);
    }
  };

  // Delete Person
  const handleDeletePerson = async (id: string) => {
    try {
      const res = await fetch(`/api/persons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        setPersons((prev) => prev.filter((p) => p.id !== id));
        showToast('Personel ve görev tanımı başarıyla silindi.', 'success');
      } else {
        showToast(data.error || 'Personel silinemedi.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Personel silinirken hata oluştu.', 'error');
    }
  };

  // Reset to initial data
  const handleExecuteResetData = async () => {
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        await fetchAllData();
        showToast('Tüm veriler başarıyla başlangıç verilerine sıfırlandı.', 'success');
      } else {
        showToast('Sıfırlama başarısız oldu.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Sıfırlama sırasında sunucu hatası oluştu.', 'error');
    }
  };

  // Flow handlers
  const handleStartDutyAnalysis = (personName: string) => {
    setPreselectedPersonForAi(personName);
    setActiveTab('ai-analysis');
  };

  const handleViewPersonReports = (personName: string) => {
    setFilterPersonName(personName);
    setActiveTab('reports');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased">
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'reports') setFilterPersonName('');
        }}
        onOpenNewReport={() => setIsNewReportOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onResetData={() => setIsResetConfirmOpen(true)}
        reportsCount={reports.length}
        personsCount={persons.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-500">MESAM Raporlama Sistemi Yükleniyor...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                persons={persons}
                reports={reports}
                onSelectPerson={handleViewPersonReports}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onStartDutyAnalysis={handleStartDutyAnalysis}
              />
            )}

            {activeTab === 'persons' && (
              <PersonsView
                persons={persons}
                reports={reports}
                onStartDutyAnalysis={handleStartDutyAnalysis}
                onViewPersonReports={handleViewPersonReports}
                onEditPerson={(p) => {
                  setPersonToEdit(p);
                  setIsEditPersonOpen(true);
                }}
                onDeletePerson={handleDeletePerson}
                onAddNewPerson={() => {
                  setPersonToEdit(null);
                  setIsEditPersonOpen(true);
                }}
              />
            )}

            {(activeTab === 'ai-analysis' || activeTab === 'chat') && (
              <AiAnalysisView
                persons={persons}
                reports={reports}
                preselectedPersonName={preselectedPersonForAi}
                onClearPreselectedPerson={() => setPreselectedPersonForAi('')}
                initialSubTab={activeTab === 'chat' ? 'assistant' : 'individual'}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                reports={reports}
                persons={persons}
                onAddNewReport={() => setIsNewReportOpen(true)}
                onDeleteReport={handleDeleteReport}
                onSelectPerson={handleViewPersonReports}
                filterPersonName={filterPersonName}
                onClearPersonFilter={() => setFilterPersonName('')}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-4 px-6 text-center text-xs text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>MESAM Musiki Eseri Sahipleri Grubu Meslek Birliği &bull; Telif Dokümantasyon AI Birimi</span>
          <span>Google Gemini 3.8 Flash API Destekli Görev & Performans Analiz Altyapısı</span>
        </div>
      </footer>

      {/* Modals */}
      <NewReportModal
        isOpen={isNewReportOpen}
        onClose={() => setIsNewReportOpen(false)}
        persons={persons}
        onSaveReport={handleSaveReport}
      />

      <ReportImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={fetchAllData}
      />

      <EditPersonModal
        isOpen={isEditPersonOpen}
        onClose={() => {
          setIsEditPersonOpen(false);
          setPersonToEdit(null);
        }}
        personToEdit={personToEdit}
        onSavePerson={handleSavePerson}
      />

      {/* Reset Data Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Verileri Sıfırla"
        message="Tüm verileri MESAM başlangıç verilerine sıfırlamak istiyor musunuz? Yeni eklediğiniz raporlar ve personeller ilk varsayılan durumuna döndürülecektir."
        confirmText="Evet, Sıfırla"
        cancelText="Vazgeç"
        isDanger={true}
        onConfirm={handleExecuteResetData}
        onClose={() => setIsResetConfirmOpen(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
