
import React, { useState } from 'react';
import { Application, STATUS_LABELS, ApplicationStatus, Job } from '../types';
import { Search, Filter, Phone, Mail, Briefcase, Calendar, Edit, FileText, Trash2, ChevronDown, SortDesc, Sparkles } from 'lucide-react';
import { Language, TRANSLATIONS, getNameTitle } from '../utils/translations';

interface Props {
  applications: Application[];
  jobs: Job[];
  onViewCandidate: (app: Application) => void;
  onEditCandidate: (app: Application) => void;
  onDeleteCandidate: (id: string) => void;
  language: Language;
}

const SearchView: React.FC<Props> = ({ applications, jobs, onViewCandidate, onEditCandidate, onDeleteCandidate, language }) => {
  const t = TRANSLATIONS[language];
  
  // Search States
  const [query, setQuery] = useState('');
  
  // Filter States
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  // Sorting State
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  // Logic to process the list
  const processedApps = [...applications]
    .filter(app => {
        // 1. Text Search
        const searchLower = query.toLowerCase();
        const matchesText = (
            app.candidate.first_name.toLowerCase().includes(searchLower) ||
            app.candidate.last_name.toLowerCase().includes(searchLower) ||
            app.candidate.email.toLowerCase().includes(searchLower) ||
            app.candidate.phone.includes(query)
        );
        if (!matchesText) return false;

        // 2. Job Filter
        if (selectedJobId && app.job_id !== selectedJobId) return false;

        // 3. Status Filter
        if (selectedStatus && app.status !== selectedStatus) return false;

        return true;
    })
    .sort((a, b) => {
        if (sortBy === 'score') {
            // Sort by Match Score (Highest first)
            return (b.ai_match_score || 0) - (a.ai_match_score || 0);
        } else {
            // Sort by Date (Newest first)
            const dateB = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.applied_at).getTime();
            const dateA = b.updated_at ? new Date(b.updated_at).getTime() : new Date(a.applied_at).getTime();
            return dateA - dateB;
        }
    });

  const handleEditClick = (e: React.MouseEvent, app: Application) => {
      e.stopPropagation();
      onEditCandidate(app);
  };

  const handleDeleteClick = (e: React.MouseEvent<any>, appId: string) => {
      e.stopPropagation();
      // Directly call parent delete function (which handles confirmation)
      onDeleteCandidate(appId);
  };

  const handleViewCVClick = (e: React.MouseEvent, url: string) => {
      e.stopPropagation();
      if (url) window.open(url, '_blank');
  };

  const getStatusLabel = (status: ApplicationStatus) => {
    // @ts-ignore
    return t[`status_${status.toLowerCase()}`] || status;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
        <div className="max-w-4xl">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.menu_search}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">ຄົ້ນຫາ ແລະ ກັ່ນຕອງຂໍ້ມູນຜູ້ສະໝັກຕາມຕໍາແໜ່ງງານ ແລະ ຄະແນນ AI.</p>
            
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-4 top-4 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="ພິມຊື່, ເບີໂທ, ຫຼື ອີເມວ ເພື່ອຄົນຫາ..." 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-lg"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>

                {/* Advanced Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Job Filter */}
                    <div className="relative flex-1">
                        <Briefcase className="absolute left-4 top-3.5 text-slate-400 w-4 h-4" />
                        <select 
                            className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl appearance-none outline-none focus:border-blue-500 text-sm font-bold text-slate-700 dark:text-slate-300"
                            value={selectedJobId}
                            onChange={(e) => setSelectedJobId(e.target.value)}
                        >
                            <option value="">ທຸກຕໍາແໜ່ງ (All Jobs)</option>
                            {jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-3.5 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Status Filter */}
                    <div className="relative flex-1">
                        <Filter className="absolute left-4 top-3.5 text-slate-400 w-4 h-4" />
                        <select 
                            className="w-full pl-10 pr-10 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl appearance-none outline-none focus:border-blue-500 text-sm font-bold text-slate-700 dark:text-slate-300"
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            <option value="">ທຸກສະຖານະ (All Status)</option>
                            {Object.values(ApplicationStatus).map(status => (
                                <option key={status} value={status}>{getStatusLabel(status)}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-3.5 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>

                    {/* Sort By */}
                    <div className="relative flex-1">
                        <SortDesc className="absolute left-4 top-3.5 text-slate-400 w-4 h-4" />
                        <select 
                            className={`w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-xl appearance-none outline-none focus:border-blue-500 text-sm font-bold ${sortBy === 'score' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
                        >
                            <option value="date">ລຽງຕາມວັນທີ (Newest)</option>
                            <option value="score">ລຽງຕາມຄະແນນ AI (Best Match)</option>
                        </select>
                        <ChevronDown className="absolute right-4 top-3.5 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Filter size={18} /> ຜົນການຄົ້ນຫາ ({processedApps.length})
            </h3>
        </div>
        
        {processedApps.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {processedApps.map((app) => (
                    <div 
                        key={app.id} 
                        className="p-6 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between group gap-4"
                        onClick={() => onViewCandidate(app)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors overflow-hidden shrink-0 border border-slate-200 dark:border-slate-600">
                                <img 
                                    src={app.candidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.candidate.first_name}`} 
                                    className="w-full h-full object-cover" 
                                    alt="Avatar"
                                />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-2">
                                    {getNameTitle(app.candidate.gender, language)} {app.candidate.first_name} {app.candidate.last_name}
                                    {sortBy === 'score' && app.ai_match_score >= 80 && (
                                        <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 border border-green-200">
                                            <Sparkles size={10} /> BEST MATCH
                                        </span>
                                    )}
                                </h4>
                                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                                    <span className="flex items-center gap-1"><Briefcase size={14}/> {app.candidate.applied_position}</span>
                                    <span className="hidden sm:inline w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(app.applied_at).toLocaleDateString('lo-LA')}</span>
                                    
                                    {/* Score Indicator */}
                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${
                                        app.ai_match_score >= 80 ? 'bg-green-50 text-green-700' : 
                                        app.ai_match_score >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                        AI: {app.ai_match_score}%
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 justify-between sm:justify-end w-full sm:w-auto">
                            <div className="text-right hidden md:block">
                                <div className="flex items-center justify-end gap-1 text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    <Phone size={14} /> {app.candidate.phone}
                                </div>
                                <div className="flex items-center justify-end gap-1 text-sm text-slate-600 dark:text-slate-400">
                                    <Mail size={14} /> {app.candidate.email}
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${STATUS_LABELS[app.status].color}`}>
                                    {getStatusLabel(app.status)}
                                </span>
                                
                                <div className="flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-700">
                                    {app.cv_url && (
                                        <button 
                                            onClick={(e) => handleViewCVClick(e, app.cv_url!)}
                                            className="p-2.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all border border-emerald-100 dark:border-emerald-800/30 shadow-sm flex items-center gap-2"
                                            title="View CV File"
                                        >
                                            <FileText size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">CV</span>
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => handleEditClick(e, app)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                                        title={t.edit_candidate}
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDeleteClick(e, app.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                        title={t.delete_candidate}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="p-12 text-center">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={32} className="text-slate-300 dark:text-slate-500" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">ບໍ່ພົບຂໍ້ມູນທີ່ຄົ້ນຫາ</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">ລອງປ່ຽນເງື່ອນໄຂການຄົ້ນຫາ ຫຼື ຕົວກັ່ນຕອງໃໝ່.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default SearchView;
