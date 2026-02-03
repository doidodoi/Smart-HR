
import React from 'react';
import { LayoutDashboard, Users, Settings, LogOut, Menu, Search as SearchIcon, UserPlus, Sparkles, Globe, ExternalLink } from 'lucide-react';
import { Language, TRANSLATIONS } from '../utils/translations';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  activeTab: 'DASHBOARD' | 'KANBAN' | 'ADD_CANDIDATE' | 'SEARCH' | 'SETTINGS';
  onTabChange: (tab: 'DASHBOARD' | 'KANBAN' | 'ADD_CANDIDATE' | 'SEARCH' | 'SETTINGS') => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  userRole: 'ADMIN' | 'USER'; 
  onOpenPublicView: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, activeTab, onTabChange, isDarkMode, toggleDarkMode, language, userRole, onOpenPublicView }) => {
  const t = TRANSLATIONS[language];
  const isKanban = activeTab === 'KANBAN';
  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-gemini-bg font-sans transition-colors duration-300">
      <aside className="w-72 bg-white dark:bg-gemini-surface border-r border-slate-200 dark:border-gemini-border flex flex-col shadow-sm z-20 hidden md:flex transition-colors duration-300">
        <div className="p-8 border-b border-slate-100 dark:border-gemini-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Sparkles className="text-white w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-gemini-text tracking-tight leading-none">Smart <span className="text-blue-600 dark:text-blue-400">HR</span></h1>
                <p className="text-[10px] font-bold text-slate-400 dark:text-gemini-muted uppercase tracking-widest mt-0.5">Recruit System</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-6 space-y-2">
          <p className="px-4 text-xs font-bold text-slate-400 dark:text-gemini-muted uppercase tracking-wider mb-2">Menu</p>
          
          {/* ADMIN ONLY MENUS */}
          {isAdmin && (
            <>
              <button 
                onClick={() => onTabChange('DASHBOARD')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === 'DASHBOARD' ? 'bg-blue-50 dark:bg-gemini-hover text-blue-700 dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-gemini-muted hover:bg-slate-50 dark:hover:bg-gemini-hover hover:text-slate-900 dark:hover:text-gemini-text font-medium'}`}
              >
                <LayoutDashboard size={22} className={activeTab === 'DASHBOARD' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-gemini-muted dark:group-hover:text-gemini-text'} />
                <span>{t.menu_dashboard}</span>
              </button>
              
              <button 
                onClick={() => onTabChange('KANBAN')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === 'KANBAN' ? 'bg-blue-50 dark:bg-gemini-hover text-blue-700 dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-gemini-muted hover:bg-slate-50 dark:hover:bg-gemini-hover hover:text-slate-900 dark:hover:text-gemini-text font-medium'}`}
              >
                <Users size={22} className={activeTab === 'KANBAN' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-gemini-muted dark:group-hover:text-gemini-text'} />
                <span>{t.menu_pipeline}</span>
              </button>
            </>
          )}

          {/* VISIBLE TO ALL: REGISTER CANDIDATE */}
          <button 
            onClick={() => onTabChange('ADD_CANDIDATE')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === 'ADD_CANDIDATE' ? 'bg-blue-50 dark:bg-gemini-hover text-blue-700 dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-gemini-muted hover:bg-slate-50 dark:hover:bg-gemini-hover hover:text-slate-900 dark:hover:text-gemini-text font-medium'}`}
          >
            <UserPlus size={22} className={activeTab === 'ADD_CANDIDATE' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-gemini-muted dark:group-hover:text-gemini-text'} />
            <span>{t.menu_register}</span>
          </button>

          {/* ADMIN ONLY MENUS */}
          {isAdmin && (
            <button 
                onClick={() => onTabChange('SEARCH')}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === 'SEARCH' ? 'bg-blue-50 dark:bg-gemini-hover text-blue-700 dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-gemini-muted hover:bg-slate-50 dark:hover:bg-gemini-hover hover:text-slate-900 dark:hover:text-gemini-text font-medium'}`}
            >
                <SearchIcon size={22} className={activeTab === 'SEARCH' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-gemini-muted dark:group-hover:text-gemini-text'} />
                <span>{t.menu_search}</span>
            </button>
          )}
        </nav>

        <div className="p-6 border-t border-slate-100 dark:border-gemini-border space-y-2">
            {isAdmin && (
                <button 
                    onClick={() => onTabChange('SETTINGS')}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group ${activeTab === 'SETTINGS' ? 'bg-blue-50 dark:bg-gemini-hover text-blue-700 dark:text-blue-400 font-bold shadow-sm' : 'text-slate-500 dark:text-gemini-muted hover:bg-slate-50 dark:hover:bg-gemini-hover hover:text-slate-900 dark:hover:text-gemini-text font-medium'}`}
                >
                    <Settings size={22} className={activeTab === 'SETTINGS' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-gemini-muted dark:group-hover:text-gemini-text'} />
                    <span>{t.menu_settings}</span>
                </button>
            )}

            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 font-medium transition-all">
                <LogOut size={22} />
                <span>{t.menu_logout}</span>
            </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white/80 dark:bg-gemini-bg/80 backdrop-blur-md h-20 border-b border-slate-200 dark:border-gemini-border flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm transition-colors duration-300">
            <div className="flex items-center gap-4">
                <button className="md:hidden text-slate-500 dark:text-gemini-muted"><Menu/></button>
                <h2 className="text-xl font-bold text-slate-800 dark:text-gemini-text">
                    {activeTab === 'DASHBOARD' && t.menu_dashboard}
                    {activeTab === 'KANBAN' && t.menu_pipeline}
                    {activeTab === 'ADD_CANDIDATE' && t.menu_register}
                    {activeTab === 'SEARCH' && t.menu_search}
                    {activeTab === 'SETTINGS' && t.menu_settings}
                </h2>
            </div>
            
            <div className="flex items-center gap-6">
                {/* PREVIEW BUTTON - Switches Internal View State */}
                <button 
                    onClick={onOpenPublicView} 
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold transition-all border border-blue-100 dark:border-blue-800 shadow-sm group cursor-pointer"
                    title="Switch to Public Form Preview"
                >
                    <Globe size={16} className="text-blue-500" />
                    <span className="uppercase tracking-wide">VIEW PUBLIC PAGE</span>
                    <ExternalLink size={14} className="opacity-50" />
                </button>

                <div className="flex items-center gap-3 pl-2 cursor-pointer group">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-slate-900 dark:text-gemini-text group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                           {userRole === 'ADMIN' ? 'Admin User' : 'Recruiter'}
                        </p>
                        <p className="text-xs font-medium text-slate-500 dark:text-gemini-muted">
                           {userRole === 'ADMIN' ? 'HR Manager' : 'Staff'}
                        </p>
                    </div>
                    <div className="h-11 w-11 bg-slate-100 dark:bg-gemini-surface rounded-full border-2 border-white dark:border-gemini-border shadow-md overflow-hidden group-hover:ring-2 ring-blue-500 transition-all">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userRole === 'ADMIN' ? 'Felix' : 'Recruiter'}`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </header>
        <main className={`flex-1 transition-colors duration-300 flex flex-col ${isKanban ? 'overflow-hidden bg-slate-50 dark:bg-gemini-bg' : 'overflow-auto p-8 bg-slate-50 dark:bg-gemini-bg'}`}>
            <div className={`${isKanban ? 'h-full w-full' : 'max-w-7xl mx-auto w-full'}`}>
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
