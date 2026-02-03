
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UploadCloud, X, Loader2, AlertCircle, Sparkles, Briefcase, ChevronDown, CheckCircle, Monitor, Users, ShieldCheck, Banknote, Crown, ClipboardCheck, Database, LayoutGrid, Zap, ShoppingCart, SearchCheck, Info, MapPin, Phone, DollarSign, ArrowRight } from 'lucide-react';
import { Job } from '../types';
import { parseAndScoreCV } from '../services/gemini';
import { Language, TRANSLATIONS } from '../utils/translations';

interface Props {
  jobs: Job[];
  loadingJobs: boolean;
  errorJobs: string | null;
  onReloadJobs: () => void;
  onSave: (data: any, jobId: string, file?: File) => Promise<void>;
  language: Language;
}

const AddCandidateView: React.FC<Props> = ({ jobs, loadingJobs, errorJobs, onReloadJobs, onSave, language }) => {
  const t = TRANSLATIONS[language];
  const [activeTab, setActiveTab] = useState<'AI' | 'MANUAL'>('AI');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  
  // UI States for Large Filter
  const [selectedDept, setSelectedDept] = useState<string>('All');
  
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  const initialFormState = {
    first_name: '', last_name: '', gender: 'Male', age: 25, email: '', phone: '', address: '',
    expected_salary: '',
    experience_years: 0, work_history: '', education: '', skills: '', 
    ai_summary: '', match_score: 0
  };

  const [formData, setFormData] = useState(initialFormState);

  // Auto-scroll to upload section when a job is selected
  useEffect(() => {
    if (selectedJobId && uploadSectionRef.current) {
        uploadSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedJobId]);

  const departments = useMemo(() => {
      const depts = new Set(jobs.map(j => j.department || 'Other'));
      return ['All', ...Array.from(depts)];
  }, [jobs]);

  const filteredJobs = useMemo(() => {
      if (selectedDept === 'All') return jobs;
      return jobs.filter(j => j.department === selectedDept);
  }, [jobs, selectedDept]);

  const resetForm = () => {
    setFormData(initialFormState);
    setFile(null);
    setSelectedJobId('');
    setError(null);
    setShowSuccessModal(false);
    setActiveTab('AI');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getDepartmentIcon = (dept: string) => {
      switch(dept) {
          case 'HR Department': return <Users size={18} />;
          case 'IT Department': return <Monitor size={18} />;
          case 'Admin Department': return <ShieldCheck size={18} />;
          case 'Accounting Department': return <Banknote size={18} />;
          case 'Finance Department': return <Crown size={18} />;
          case 'Procurement Department': return <ShoppingCart size={18} />;
          case 'Internal Audit': return <SearchCheck size={18} />;
          default: return <Briefcase size={18} />;
      }
  };

  const processFile = async () => {
    if (!file) { setError("ກະລຸນາເລືອກໄຟລ໌ CV ກ່ອນ."); return; }
    if (!selectedJobId) { setError("ກະລຸນາເລືອກຕຳແໜ່ງງານກ່ອນ."); return; }
    setLoading(true); setError(null);
    try {
        const job = jobs.find(j => j.id === selectedJobId);
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(file);
        });
        const base64Data = await base64Promise;
        
        const result = await parseAndScoreCV(base64Data, file.type, job!, language);
        const skillsDisplay = Array.isArray(result.skills) ? result.skills.join(', ') : (result.skills || '');
        
        setFormData({ ...initialFormState, ...result, skills: skillsDisplay });
        setActiveTab('MANUAL');
    } catch (err: any) { 
        setError(err.message || "AI Analysis failed."); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleSave = async () => {
    if (!formData.first_name || !formData.email) { 
        setError("ຊື່ ແລະ ອີເມວ ແມ່ນຈຳເປັນ."); 
        return; 
    }
    if (!selectedJobId) {
        setError("ກະລຸນາເລືອກຕຳແໜ່ງງານ.");
        return;
    }

    setSaving(true);
    setError(null);
    try {
        const submissionData = {
            ...formData,
            skills: typeof formData.skills === 'string' 
                ? formData.skills.split(',').map(s => s.trim()).filter(s => s !== '') 
                : (Array.isArray(formData.skills) ? formData.skills : [])
        };

        await onSave(submissionData, selectedJobId, file || undefined);
        setShowSuccessModal(true);
    } catch (err: any) { 
        console.error(err);
        setError(err.message || "Failed to save: Database error."); 
    } finally { 
        setSaving(false); 
    }
  };

  return (
    <div className="animate-fade-in space-y-8 pb-32">
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/90 z-[60] flex items-center justify-center p-4 backdrop-blur-xl">
            <div className="bg-white dark:bg-gemini-surface rounded-[3rem] shadow-2xl p-12 max-w-sm w-full text-center border border-white/20 animate-scale-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><CheckCircle size={32} className="text-green-600" /></div>
                <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">ສຳເລັດ!</h3>
                <p className="text-slate-500 font-bold mb-8 text-sm">ຂໍ້ມູນຜູ້ສະໝັກຖືກບັນທຶກແລ້ວ.</p>
                <button onClick={resetForm} className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl transition-all uppercase tracking-widest text-xs">ເພີ່ມຜູ້ສະໝັກໃໝ່</button>
            </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0047FF] via-[#5C24FF] to-[#000000] rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-white/10 group">
          <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-2xl border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-all duration-500">
                  <Sparkles size={34} className="text-blue-100 animate-pulse-slow" />
              </div>
              <div>
                  <h2 className="text-3xl font-black tracking-tighter uppercase leading-none mb-1">
                      {t.menu_register} <span className="text-blue-400 font-normal">ELITE</span>
                  </h2>
                  <p className="text-blue-100 text-[10px] font-black uppercase tracking-[0.4em] opacity-80">
                      Enterprise Management System v3.0
                  </p>
              </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-white/5 to-transparent skew-x-[45deg] translate-x-32"></div>
      </div>

      {/* SECTION 1: JOB SELECTION (FULL WIDTH & LARGE) */}
      <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
             <div className="bg-blue-600 w-2 h-8 rounded-full"></div>
             <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">1. {t.select_job}</h3>
          </div>

          {/* Department Filter Pills */}
          <div className="flex flex-wrap gap-3 pb-2">
              {departments.map(dept => (
                  <button
                      key={dept}
                      onClick={() => setSelectedDept(dept)}
                      className={`px-5 py-3 rounded-xl font-bold text-sm transition-all border flex items-center gap-2 ${
                          selectedDept === dept 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105' 
                          : 'bg-white dark:bg-gemini-surface text-slate-500 dark:text-slate-400 border-slate-200 dark:border-gemini-border hover:bg-slate-100 dark:hover:bg-gemini-hover'
                      }`}
                  >
                      {dept !== 'All' && getDepartmentIcon(dept)}
                      {dept}
                  </button>
              ))}
          </div>

          {/* Large Job Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredJobs.length > 0 ? filteredJobs.map(job => {
                  const isSelected = selectedJobId === job.id;
                  return (
                      <button
                          key={job.id}
                          onClick={() => setSelectedJobId(job.id)}
                          className={`
                              relative p-8 rounded-[2rem] border-2 text-left transition-all duration-300 group
                              ${isSelected 
                                  ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-600/30 -translate-y-1' 
                                  : 'bg-white dark:bg-gemini-surface border-slate-100 dark:border-gemini-border hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-xl'
                              }
                          `}
                      >
                          <div className="flex justify-between items-start mb-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shadow-inner ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400'}`}>
                                  <Briefcase size={28} />
                              </div>
                              {isSelected && <div className="bg-white/20 p-2 rounded-full"><CheckCircle className="text-white" size={24} /></div>}
                          </div>
                          
                          <h4 className={`text-2xl font-black mb-2 leading-tight ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                              {job.title}
                          </h4>
                          <p className={`text-sm font-bold uppercase tracking-wider ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                              {job.department}
                          </p>

                          <div className={`mt-6 pt-6 border-t flex items-center justify-between ${isSelected ? 'border-white/20' : 'border-slate-100 dark:border-slate-700'}`}>
                              <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>Full-Time</span>
                              <ArrowRight className={`transition-transform ${isSelected ? 'text-white translate-x-2' : 'text-slate-300'}`} size={20} />
                          </div>
                      </button>
                  );
              }) : (
                  <div className="col-span-full py-10 text-center text-slate-400">ບໍ່ພົບຕຳແໜ່ງງານໃນພະແນກນີ້</div>
              )}
          </div>
      </div>

      {/* SECTION 2: UPLOAD & FORM (Only visible if Job Selected) */}
      <div ref={uploadSectionRef} className={`transition-all duration-500 ease-in-out ${selectedJobId ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-10 grayscale pointer-events-none'}`}>
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-2 pt-8 border-t border-dashed border-slate-200 dark:border-slate-800">
                <div className="bg-purple-600 w-2 h-8 rounded-full"></div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">2. {t.upload_box_title}</h3>
            </div>

            <div className="bg-white dark:bg-gemini-surface rounded-[3rem] shadow-xl border border-slate-100 dark:border-gemini-border overflow-hidden">
                <div className="flex p-3 bg-slate-50 dark:bg-gemini-bg m-4 md:m-8 rounded-[2rem] border border-slate-100 dark:border-gemini-border">
                    <button onClick={() => setActiveTab('AI')} className={`flex-1 py-5 text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-3 ${activeTab === 'AI' ? 'bg-white dark:bg-gemini-surface text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Zap size={18} className={activeTab === 'AI' ? "text-blue-600" : ""} /> AUTO-EXTRACT (AI)
                    </button>
                    <button onClick={() => setActiveTab('MANUAL')} className={`flex-1 py-5 text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-3 ${activeTab === 'MANUAL' ? 'bg-white dark:bg-gemini-surface text-blue-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>
                        <Monitor size={18} className={activeTab === 'MANUAL' ? "text-blue-600" : ""} /> MANUAL ENTRY
                    </button>
                </div>

                <div className="p-8 md:p-12 pt-4">
                    {activeTab === 'AI' ? (
                        <div className="space-y-10 max-w-3xl mx-auto">
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-4 border-dashed border-slate-100 dark:border-gemini-border rounded-[3rem] p-24 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/10 transition-all text-center group bg-slate-50/50 dark:bg-gemini-bg/30 relative overflow-hidden"
                            >
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                <div className="p-8 bg-white dark:bg-gemini-surface rounded-full shadow-2xl mb-8 group-hover:scale-110 transition-transform duration-500">
                                    <UploadCloud size={64} className="text-blue-500" />
                                </div>
                                <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">{t.upload_box_title}</h4>
                                <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">{t.upload_box_desc}</p>
                            </div>
                            
                            {file && (
                                <div className="p-6 bg-slate-900 text-white rounded-3xl flex items-center justify-between shadow-2xl animate-scale-in border border-slate-700">
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg"><ClipboardCheck size={24}/></div>
                                        <div>
                                            <span className="text-sm font-black truncate block uppercase tracking-wide text-blue-200">Selected File</span>
                                            <span className="text-lg font-bold truncate max-w-md block">{file.name}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setFile(null)} className="p-3 hover:bg-red-500/20 rounded-xl text-red-500 transition-all"><X size={24} /></button>
                                </div>
                            )}
                            
                            <button 
                                onClick={processFile}
                                disabled={!file || !selectedJobId || loading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xl py-8 rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(37,99,235,0.5)] transition-all flex items-center justify-center gap-5 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
                            >
                                {loading ? <Loader2 className="animate-spin w-8 h-8" /> : <Sparkles size={28} />}
                                {loading ? t.analyzing : t.btn_analyze}
                            </button>

                            {error && (
                                <div className="p-6 bg-red-50 text-red-700 border border-red-100 rounded-3xl font-bold flex flex-col gap-3 animate-shake">
                                    <div className="flex items-center gap-3">
                                        <AlertCircle size={24}/>
                                        <span className="uppercase tracking-widest text-sm">System Error</span>
                                    </div>
                                    <p className="text-base font-medium">{error}</p>
                                    {error.includes('RLS') && (
                                        <div className="mt-2 p-4 bg-white/60 rounded-2xl text-xs flex gap-3 items-start border border-red-100">
                                            <Info size={16} className="shrink-0 mt-0.5" />
                                            <span>Hint: Permission denied. Please check Supabase RLS policies.</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-10 animate-fade-in max-w-5xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">{t.name} *</label>
                                    <input className="w-full p-6 border border-slate-100 dark:border-gemini-border rounded-[2rem] bg-slate-50 dark:bg-gemini-bg outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-lg transition-all" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} placeholder="Somsak" />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">{t.email} *</label>
                                    <input className="w-full p-6 border border-slate-100 dark:border-gemini-border rounded-[2rem] bg-slate-50 dark:bg-gemini-bg outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-lg transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@domain.com" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2"><Phone size={14} /> {t.phone}</label>
                                    <input className="w-full p-6 border border-slate-100 dark:border-gemini-border rounded-[2rem] bg-slate-50 dark:bg-gemini-bg outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-lg transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="020 xxxx xxxx" />
                                </div>
                                
                                {/* Age Field Added Here */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2">{t.age} (Years)</label>
                                    <input type="number" className="w-full p-6 border border-slate-100 dark:border-gemini-border rounded-[2rem] bg-slate-50 dark:bg-gemini-bg outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-lg transition-all" value={formData.age} onChange={e => setFormData({...formData, age: parseInt(e.target.value) || 0})} placeholder="25" />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2"><DollarSign size={14} /> Expected Salary</label>
                                    <input className="w-full p-6 border border-slate-100 dark:border-gemini-border rounded-[2rem] bg-slate-50 dark:bg-gemini-bg outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-lg transition-all" value={formData.expected_salary} onChange={e => setFormData({...formData, expected_salary: e.target.value})} placeholder="e.g. 5,000,000" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 flex items-center gap-2"><MapPin size={14} /> Address</label>
                                <input className="w-full p-6 border border-slate-100 dark:border-gemini-border rounded-[2rem] bg-slate-50 dark:bg-gemini-bg outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-lg transition-all" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="House No, Village, District, Province" />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">{t.summary}</label>
                                <textarea className="w-full p-8 border border-slate-100 dark:border-gemini-border rounded-[2.5rem] bg-slate-50 dark:bg-gemini-bg h-64 outline-none focus:ring-4 focus:ring-blue-500/10 font-medium text-base transition-all resize-none leading-relaxed" value={formData.ai_summary} onChange={e => setFormData({...formData, ai_summary: e.target.value})} placeholder="..." />
                            </div>
                            
                            {error && (
                                <div className="p-6 bg-red-50 text-red-600 rounded-3xl font-bold text-sm flex items-center gap-3 border border-red-100">
                                    <AlertCircle size={20}/> {error}
                                </div>
                            )}

                            <div className="flex justify-end gap-6 pt-10 border-t border-slate-100 dark:border-slate-800">
                                <button onClick={resetForm} className="px-12 py-6 font-black text-slate-400 uppercase tracking-[0.3em] hover:text-slate-600 text-xs transition-colors">{t.btn_cancel}</button>
                                <button 
                                    onClick={handleSave} 
                                    disabled={saving} 
                                    className="px-16 py-6 bg-slate-900 hover:bg-black text-white font-black rounded-[2rem] shadow-2xl transition-all flex items-center gap-4 active:scale-95 text-xs tracking-widest disabled:opacity-50 hover:shadow-slate-900/30"
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                                    {saving ? "SAVING..." : t.btn_save}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AddCandidateView;
