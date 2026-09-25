import React from 'react';
import { 
  BarChart3, 
  Users, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  PlusCircle, 
  UploadCloud, 
  RotateCcw,
  Music2
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'persons' | 'ai-analysis' | 'reports' | 'chat';
  setActiveTab: (tab: 'dashboard' | 'persons' | 'ai-analysis' | 'reports' | 'chat') => void;
  onOpenNewReport: () => void;
  onOpenImport: () => void;
  onResetData: () => void;
  reportsCount: number;
  personsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewReport,
  onOpenImport,
  onResetData,
  reportsCount,
  personsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  MESAM <span className="text-blue-400 font-semibold">Rapor & Görev Analiz</span>
                </span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  Gemini 3.8 AI
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Telif & Dokümantasyon Personel Görev - Rapor Uyumu Sistemi
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Genel Bakış</span>
            </button>

            <button
              onClick={() => setActiveTab('persons')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'persons'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Personel & Görevler</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {personsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ai-analysis')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'ai-analysis'
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Görev Analizi</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'reports'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Gelen Raporlar</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {reportsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Asistan</span>
            </button>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenNewReport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all"
              title="Yeni Rapor Gir"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Rapor Ekle</span>
            </button>

            <button
              onClick={onOpenImport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all"
              title="Dışarıdan Toplu Rapor İçe Aktar"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">İçe Aktar</span>
            </button>

            <button
              onClick={onResetData}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all"
              title="Varsayılan Verileri Geri Yükle"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Genel Bakış
          </button>
          <button
            onClick={() => setActiveTab('persons')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'persons' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Personel ({personsCount})
          </button>
          <button
            onClick={() => setActiveTab('ai-analysis')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap flex items-center gap-1 ${
              activeTab === 'ai-analysis' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            AI Analizi
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'reports' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            Raporlar ({reportsCount})
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === 'chat' ? 'bg-blue-600 text-white' : 'text-slate-400'
            }`}
          >
            AI Asistan
          </button>
        </div>
      </div>
    </header>
  );
};
