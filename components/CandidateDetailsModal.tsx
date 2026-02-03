
import React, { useState, useEffect } from 'react';
import { Application, Job } from '../types';
import { X, User, Briefcase, GraduationCap, History, Loader2, ShieldCheck, Sparkles, Phone, Mail, Calendar, FileText, Trash2, Award, AlertCircle, MapPin, Zap, CheckCircle2, RefreshCw } from 'lucide-react';
import { translateCandidateData, getCachedTranslation, analyzeJobSuitability } from '../services/gemini';
import { Language, TRANSLATIONS, getNameTitle } from '../utils/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  job: Job | undefined;
  allJobs?: Job[]; // Added: Pass all jobs for comparison
  onUpdateApplication: (id: string, score: number, summary: string, suggestions?: any[]) => Promise<void>;
  onDeleteCandidate: (id: string) => Promise<void>;
  language: Language;
}

const FormatText: React.FC<{ content: string; isLight?: boolean }> = ({ content, isLight = false }) => {
    if (!content) return <span className="text-slate-400 italic text-lg">ບໍ່ມີຂໍ້ມູນ...</span>;
    
    // Normalize newlines and bullets
    const processedContent = content
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');

    // Split by double newline to separate blocks, then by single newline for items
    const blocks = processedContent.split('\n').filter(line => line.trim() !== '');

    return (
        <div className="space-y-4 font-sans">
            {blocks.map((line, idx) => {
                const trimmedLine = line.trim();
                
                // Detection logic for headers
                const isHeader = (trimmedLine.endsWith(':') || 
                                 (trimmedLine === trimmedLine.toUpperCase() && trimmedLine.length > 5 && !trimmedLine.includes('•'))) && 
                                 !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-');
                
                // If it starts with a bullet point or hyphen
                const isBullet = trimmedLine.startsWith('•') || trimmedLine.startsWith('-');
                const cleanText = trimmedLine.replace(/^[•\-]\s*/, '');

                if (isHeader) {
                    return (
                        <div key={idx} className="mt-8 mb-4 border-b border-slate-200 dark:border-white/10 pb-2">
                             <span className={`text-sm font-black uppercase tracking-[0.25em] ${isLight ? 'text-blue-700' : 'text-blue-400'}`}>
                                {cleanText}
                            </span>
                        </div>
                    );
                }

                return (
                    <div key={idx} className="flex items-start gap-3">
                        {/* Custom Bullet Point */}
                        <div className={`mt-2 w-2 h-2 rounded-full shrink-0 ${isLight ? 'bg-blue-600' : 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]'}`} />
                        
                        <span className={`leading-relaxed ${isLight ? 'text-slate-700 font-medium text-[16px]' : 'text-slate-200 font-normal text-[16px]'}`}>
                            {cleanText}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const size = 150; const stroke = 12; const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-blue-500' : 'text-red-500';
  return (
    <div className="flex flex-col items-center p-10 bg-white dark:bg-gemini-surface rounded-[3rem] border border-slate-100 dark:border-gemini-border shadow-md w-full font-sans">
      <div className="relative flex items-center justify-center mb-6" style={{ width: size, height: size }}>
        <svg height={size} width={size} className="transform -rotate-90">
          <circle stroke="currentColor" strokeWidth={stroke} fill="transparent" r={radius} cx={size / 2} cy={size / 2} className="text-slate-100 dark:text-gemini-border" />
          <circle stroke="currentColor" strokeWidth={stroke} strokeDasharray={circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 2.5s ease-out' }} strokeLinecap="round" fill="transparent" r={radius} cx={size / 2} cy={size / 2} className={`${color}`} />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className={`text-5xl font-black tracking-tighter ${color}`}>{score}%</span>
          <span className="text-xs font-black text-slate-400 uppercase tracking-widest mt-2">Match</span>
        </div>
      </div>
      <div className={`px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.2em] border-2 shadow-sm ${score >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
        {score >= 80 ? 'PREMIUM MATCH' : 'QUALIFIED PROFILE'}
      </div>
    </div>
  );
};

const CandidateDetailsModal: React.FC<Props> = ({ isOpen, onClose, application, job, allJobs = [], onUpdateApplication, onDeleteCandidate, language }) => {
  const [translating, setTranslating] = useState(false);
  const [displayData, setDisplayData] = useState<any>(null);
  
  // New States for "AI Career Match"
  const [analyzingJobs, setAnalyzingJobs] = useState(false);
  const [jobSuggestions, setJobSuggestions] = useState<any[] | null>(null);

  const t = TRANSLATIONS[language];

  useEffect(() => {
    if (isOpen && application) {
        // Reset states
        setDisplayData(null); 
        setAnalyzingJobs(false);

        // Load Job Suggestions from persistent DB if available
        if (application.ai_job_suggestions && application.ai_job_suggestions.length > 0) {
            setJobSuggestions(application.ai_job_suggestions);
        } else {
            setJobSuggestions(null);
        }
        
        const cached = getCachedTranslation(application.id, language);
        if (cached) { 
            setDisplayData(cached); 
            return; 
        }

        const localizeContent = async () => {
            setTranslating(true);
            try {
                // This function now handles "Re-analysis" if the summary is raw data
                const result = await translateCandidateData(application.id, application.candidate, application.ai_summary, language);
                setDisplayData(result);
            } catch (e) {
                // Fallback to existing data
                setDisplayData({ work_history: application.candidate.work_history, education: application.candidate.education, ai_summary: application.ai_summary });
            } finally { setTranslating(false); }
        };
        localizeContent();
    }
  }, [isOpen, application, language]);

  const handleAnalyzeJobFit = async () => {
      if (!application || !allJobs.length) return;
      setAnalyzingJobs(true);
      try {
          const suggestions = await analyzeJobSuitability(application.candidate, allJobs, language);
          setJobSuggestions(suggestions);
          
          // SAVE TO DATABASE PERSISTENTLY
          await onUpdateApplication(
              application.id, 
              application.ai_match_score, 
              application.ai_summary, 
              suggestions // Pass suggestions to be saved
          );

      } catch (e) {
          console.error(e);
      } finally {
          setAnalyzingJobs(false);
      }
  };

  if (!isOpen || !application) return null;

  // Determine font size based on name length to prevent overflow
  const title = getNameTitle(application.candidate.gender, language);
  const fullName = `${application.candidate.first_name} ${application.candidate.last_name}`;
  const fullDisplayName = `${title} ${fullName}`.trim();

  const getHeaderClass = (name: string) => {
    const len = name.length;
    if (len > 35) return 'text-2xl sm:text-3xl';
    if (len > 25) return 'text-3xl sm:text-4xl';
    return 'text-4xl sm:text-5xl';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-50 p-4 backdrop-blur-3xl overflow-y-auto flex items-center justify-center font-sans">
      <div className="bg-slate-50 dark:bg-gemini-bg rounded-[3.5rem] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col border border-white/10 max-h-[96vh] animate-scale-in">
        
        {/* Banner Section */}
        <div className="h-72 bg-slate-900 relative flex-shrink-0">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-slate-900 to-black opacity-95"></div>
             
             {/* Top Right: Close Button Only */}
             <div className="absolute top-10 right-10 flex items-center gap-4 z-20">
                <button onClick={onClose} className="bg-white/15 hover:bg-white/25 text-white p-4 rounded-2xl backdrop-blur-xl transition-all border border-white/20">
                    <X size={32}/>
                </button>
             </div>

             {/* Bottom Right: Open CV Button */}
             {application.cv_url && (
                <div className="absolute bottom-12 right-10 z-20">
                    <button 
                        onClick={() => window.open(application.cv_url, '_blank')}
                        className="flex items-center gap-4 px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-500/40 transition-all active:scale-95"
                    >
                        <FileText size={22} />
                        OPEN CV
                    </button>
                </div>
             )}
             
             <div className="absolute bottom-12 left-6 sm:left-12 md:left-16 flex items-center gap-6 md:gap-10 z-10 pr-4 max-w-[80%]">
                <div className="w-32 h-32 md:w-44 md:h-44 rounded-[2rem] md:rounded-[3rem] bg-white dark:bg-gemini-surface p-2 shadow-2xl border-4 border-white dark:border-gemini-border overflow-hidden shrink-0 hidden sm:block">
                    <img src={application.candidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${application.candidate.first_name}`} className="w-full h-full object-cover rounded-[2.5rem]" alt="Avatar" />
                </div>
                <div className="mb-2">
                    <h1 className={`${getHeaderClass(fullDisplayName)} font-black text-white tracking-tight uppercase mb-4 drop-shadow-lg leading-tight font-sans`}>
                        {fullDisplayName}
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-2 md:px-6 md:py-3 bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 rounded-2xl flex items-center gap-3 md:gap-4">
                            <Briefcase size={20} className="text-blue-300" />
                            <span className="text-xs md:text-sm font-black text-blue-100 uppercase tracking-widest truncate max-w-[200px] md:max-w-xs">{application.candidate.applied_position}</span>
                        </div>
                    </div>
                </div>
             </div>
        </div>

        {/* Main Content */}
        <div className="p-8 md:p-12 pt-10 overflow-y-auto custom-scrollbar flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-7 space-y-12">
                    <div className="bg-white dark:bg-gemini-surface rounded-[3.5rem] p-12 border border-slate-100 dark:border-gemini-border shadow-sm">
                        <h3 className="text-sm font-black text-blue-600 uppercase tracking-[0.4em] mb-12 flex items-center gap-4">
                            <User size={22}/> {t.general_info}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-10 gap-x-12">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t.phone}</label>
                                <p className="font-black text-slate-900 dark:text-white flex items-center gap-3 text-lg">
                                    <Phone size={20} className="text-blue-500/60 shrink-0" /> <span className="break-all">{application.candidate.phone}</span>
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t.email}</label>
                                <p className="font-black text-slate-900 dark:text-white flex items-center gap-3 text-lg">
                                    <Mail size={20} className="text-blue-500/60 shrink-0" /> <span className="break-all leading-tight">{application.candidate.email}</span>
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{t.age}</label>
                                <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <Calendar size={20} className="text-blue-500/60 shrink-0" /> {application.candidate.age} {t.years_suffix}
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">Experience</label>
                                <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <Award size={20} className="text-blue-500/60 shrink-0" /> {application.candidate.experience_years}+ {t.years_suffix}
                                </p>
                            </div>
                             {/* Display Address */}
                            <div className="space-y-2 col-span-full">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Address</label>
                                <p className="text-lg font-black text-slate-900 dark:text-white flex items-start gap-3">
                                    <MapPin size={20} className="text-blue-500/60 shrink-0 mt-1" /> 
                                    <span>{application.candidate.address || 'N/A'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gemini-surface rounded-[3.5rem] p-12 border border-slate-100 dark:border-gemini-border shadow-sm space-y-16">
                        <section>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                                <History size={24}/> {t.history}
                            </h3>
                            <div className="pl-6">
                                {translating ? <Loader2 className="animate-spin text-blue-500" /> : displayData && <FormatText content={displayData.work_history} isLight={true} />}
                            </div>
                        </section>
                        <section className="pt-12 border-t border-slate-100 dark:border-white/5">
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                                <GraduationCap size={24}/> {t.education}
                            </h3>
                            <div className="pl-6">
                                {translating ? <Loader2 className="animate-spin text-blue-500" /> : displayData && <FormatText content={displayData.education} isLight={true} />}
                            </div>
                        </section>
                    </div>
                </div>
                <div className="lg:col-span-5 space-y-10">
                    <ScoreRing score={application.ai_match_score} />
                    <div className="bg-[#0f1012] rounded-[3.5rem] p-12 border border-white/5 shadow-2xl relative overflow-hidden min-h-[600px]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px]"></div>
                        <div className="flex items-center justify-between mb-12">
                            <h3 className="text-base font-black text-white flex items-center gap-5 tracking-[0.25em] uppercase">
                                <Sparkles size={28} className="text-blue-400 animate-pulse" /> AI ANALYSIS
                            </h3>
                            <div className="px-4 py-1.5 rounded-lg bg-white/10 text-[10px] font-black text-blue-300 tracking-widest border border-white/10 uppercase">ENTERPRISE</div>
                        </div>
                        <div className="bg-white/[0.04] backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10">
                            {translating ? (
                                <div className="py-32 flex flex-col items-center gap-8">
                                    <Loader2 className="animate-spin text-blue-400" size={48}/>
                                    <span className="text-xs font-black text-white/30 uppercase tracking-[0.5em]">Analyzing Profile...</span>
                                </div>
                            ) : (
                                displayData && <FormatText content={displayData.ai_summary} isLight={false} />
                            )}
                        </div>

                         {/* AI CAREER MATCH BUTTON & SECTION */}
                        <div className="mt-8 pt-8 border-t border-white/10">
                             {!jobSuggestions ? (
                                <button 
                                    onClick={handleAnalyzeJobFit}
                                    disabled={analyzingJobs}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-900/40 active:scale-95 disabled:opacity-50"
                                >
                                    {analyzingJobs ? <Loader2 className="animate-spin" /> : <Zap size={16} fill="currentColor" />}
                                    {analyzingJobs ? "Finding Best Fits..." : "Analyze Career Match"}
                                </button>
                             ) : (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-xs font-black text-blue-300 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle2 size={14} /> Top Job Suggestions
                                        </h4>
                                        <button 
                                            onClick={handleAnalyzeJobFit} 
                                            disabled={analyzingJobs}
                                            className="text-[10px] text-slate-500 hover:text-white uppercase font-bold flex items-center gap-1"
                                        >
                                           <RefreshCw size={10} className={analyzingJobs ? 'animate-spin' : ''}/> Re-Analyze
                                        </button>
                                    </div>
                                    
                                    {jobSuggestions.map((suggestion, idx) => (
                                        <div key={idx} className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-bold text-white text-sm">{suggestion.title}</h5>
                                                <span className={`text-xs font-black px-2 py-0.5 rounded ${suggestion.matchScore >= 80 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                                    {suggestion.matchScore}%
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 leading-relaxed">{suggestion.reason}</p>
                                        </div>
                                    ))}
                                </div>
                             )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-inner"><ShieldCheck size={28}/></div>
                            <p className="text-sm font-bold text-white/40 leading-relaxed italic">
                                ບົດວິເຄາະນີ້ຖືກສ້າງຂຶ້ນໂດຍລະບົບ AI Gemini ເພື່ອຊ່ວຍໃຫ້ການຄັດເລືອກບຸກຄະລາກອນຂອງທ່ານມີປະສິດທິພາບສູງສຸດ.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
export default CandidateDetailsModal;
