import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  Sparkles, 
  FileText, 
  MessageSquare, 
  Plus, 
  UploadCloud, 
  RotateCcw,
  Music2,
  MoreHorizontal
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
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setIsActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isTabActive = (id: string) => {
    if (id === 'ai-analysis') {
      return activeTab === 'ai-analysis' || activeTab === 'chat';
    }
    return activeTab === id;
  };

  const navItems: { id: 'dashboard' | 'persons' | 'reports' | 'ai-analysis'; label: string; count?: number; icon: React.ReactNode; isAi?: boolean }[] = [
    { id: 'dashboard', label: 'Genel Bakış', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'persons', label: 'Personel', count: personsCount, icon: <Users className="w-4 h-4" /> },
    { id: 'reports', label: 'Raporlar', count: reportsCount, icon: <FileText className="w-4 h-4" /> },
    { id: 'ai-analysis', label: 'AI Analiz & Danışman', icon: <Sparkles className="w-4 h-4 text-amber-300" />, isAi: true },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-15">
          {/* Logo & Brand - Minimalist & Clean */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
              <Music2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-bold text-base tracking-tight text-white">MESAM</span>
              <span className="text-slate-400 font-normal text-xs">Analiz AI</span>
            </div>
          </div>

          {/* Central Segmented Nav Tabs - Clean and Compact */}
          <nav className="hidden md:flex items-center p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
            {navItems.map((item) => {
              const isActive = isTabActive(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                      isActive 
                        ? 'bg-blue-700 text-blue-100' 
                        : 'bg-slate-700 text-slate-300'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Header Actions - Clean Single Button + Compact Menu */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenNewReport}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Yeni Rapor Gir"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Rapor Ekle</span>
            </button>

            {/* More Actions Dropdown */}
            <div className="relative" ref={actionsRef}>
              <button
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/80 transition-colors cursor-pointer"
                title="Diğer İşlemler"
                aria-label="Diğer İşlemler"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isActionsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-700/60 uppercase tracking-wider">
                    Sistem Araçları
                  </div>
                  <button
                    onClick={() => {
                      setIsActionsOpen(false);
                      onOpenImport();
                    }}
                    className="w-full px-3 py-2 text-left flex items-center space-x-2.5 text-slate-200 hover:bg-slate-700/70 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-blue-400" />
                    <span>Toplu Rapor İçe Aktar (CSV)</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsActionsOpen(false);
                      onResetData();
                    }}
                    className="w-full px-3 py-2 text-left flex items-center space-x-2.5 text-rose-300 hover:bg-slate-700/70 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4 text-rose-400" />
                    <span>Başlangıç Verilerine Sıfırla</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-1.5 border-t border-slate-800/80 scrollbar-none">
          {navItems.map((item) => {
            const isActive = isTabActive(item.id);
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200 bg-slate-800/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {typeof item.count === 'number' && (
                  <span className="text-[10px] opacity-75">({item.count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
