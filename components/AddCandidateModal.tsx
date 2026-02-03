
import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, X, Loader2, FileText, Check, AlertCircle, PenTool, Sparkles, User, Briefcase, Mail, Phone, GraduationCap } from 'lucide-react';
import { Job } from '../types';
import { parseAndScoreCV } from '../services/gemini';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  job: Job;
}

const AddCandidateModal: React.FC<Props> = ({ isOpen, onClose, onSave, job }) => {
  const [activeTab, setActiveTab] = useState<'AI' | 'MANUAL'>('AI');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Data State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    experience_years: 0,
    education: '',
    work_history: '',
    gender: 'Male',
    skills: '',
    ai_summary: '',
    match_score: 0
  });

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
        setFormData({
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            experience_years: 0,
            education: '',
            work_history: '',
            gender: 'Male',
            skills: '',
            ai_summary: '',
            match_score: 0
        });
        setFile(null);
        setError(null);
        setActiveTab('AI');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const processFile = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        try {
            const result = await parseAndScoreCV(base64Data, file.type, job);
            // Populate form with AI results
            setFormData({
                first_name: result.first_name || '',
                last_name: result.last_name || '',
                email: result.email || '',
                phone: result.phone || '',
                experience_years: result.experience_years || 0,
                education: result.education || '',
                work_history: result.work_history || '',
                gender: result.gender || 'Male',
                skills: Array.isArray(result.skills) ? result.skills.join(', ') : result.skills || '',
                ai_summary: result.ai_summary || '',
                match_score: result.match_score || 0
            });
            // Switch to manual view (which is now filled) to let user review/edit
            setActiveTab('MANUAL');
        } catch (err: any) {
            setError(err.message || "ການວິເຄາະຜິດພາດ ກະລຸນາກວດສອບ API Key");
        } finally {
            setLoading(false);
        }
      };
    } catch (err) {
      console.error(err);
      setLoading(false);
      setError("ບໍ່ສາມາດປະມວນຜົນໄຟລ໌ໄດ້");
    }
  };

  const handleSubmit = () => {
    // Basic validation
    if (!formData.first_name || !formData.email) {
        setError("ກະລຸນາປ້ອນຊື່ ແລະ ອີເມວ");
        return;
    }

    const submissionData = {
        ...formData,
        skills: typeof formData.skills === 'string' ? formData.skills.split(',').map(s => s.trim()).filter(s => s) : formData.skills
    };

    onSave(submissionData);
    onClose();
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col border border-slate-100 dark:border-slate-700 animate-scale-in">
        
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 p-6 flex justify-between items-center flex-shrink-0">
          <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">ເພີ່ມຜູ້ສະໝັກໃໝ່ (Add Candidate)</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{job.title}</p>
          </div>
          <button onClick={onClose} className="bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-700">
            <button 
                onClick={() => setActiveTab('AI')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'AI' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
                <Sparkles size={16} /> ໃຊ້ AI ດຶງຂໍ້ມູນ (Upload CV)
            </button>
            <button 
                onClick={() => setActiveTab('MANUAL')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'MANUAL' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
            >
                <PenTool size={16} /> ປ້ອນຂໍ້ມູນເອງ (Manual Entry)
            </button>
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 flex-1">
          
          {/* TAB 1: AI UPLOAD */}
          {activeTab === 'AI' && (
            <div className="space-y-6 h-full flex flex-col justify-center">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all duration-200 bg-white dark:bg-slate-800"
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                    />
                    <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900 transition-colors">
                        <UploadCloud className="w-8 h-8 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                    </div>
                    <p className="text-slate-900 dark:text-white font-bold text-lg">ຄິກເພື່ອອັບໂຫຼດ CV</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">AI ຈະອ່ານຂໍ້ມູນ ແລະ ປະເມີນຄະແນນໃຫ້ອັດຕະໂນມັດ</p>
                </div>

                {file && (
                    <div className="flex items-center p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm animate-fade-in">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg mr-3">
                            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{file.name}</span>
                        <button onClick={() => setFile(null)} className="ml-auto text-slate-400 hover:text-red-500 p-1">
                            <X size={18} />
                        </button>
                    </div>
                )}

                <button 
                    onClick={processFile}
                    disabled={!file || loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><Loader2 className="animate-spin" /> ກຳລັງວິເຄາະ CV ດ້ວຍ AI...</>
                    ) : (
                        'ເລີ່ມຕົ້ນວິເຄາະ (Analyze & Autofill)'
                    )}
                </button>
                
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-2 animate-shake">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}
            </div>
          )}

          {/* TAB 2: MANUAL ENTRY (Used for editing AI results too) */}
          {activeTab === 'MANUAL' && (
            <div className="space-y-6 animate-fade-in">
                {formData.match_score > 0 && (
                     <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800 flex items-center gap-3">
                        <Sparkles className="text-green-600 w-5 h-5" />
                        <span className="text-green-800 dark:text-green-300 font-medium text-sm">ຂໍ້ມູນຖືກດຶງມາຈາກ AI ແລ້ວ (Match Score: {formData.match_score}%)</span>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                        <User size={18}/> ຂໍ້ມູນສ່ວນຕົວ (Personal Info)
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">ຊື່ (First Name) *</label>
                            <input 
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                value={formData.first_name} 
                                onChange={(e) => handleChange('first_name', e.target.value)}
                                placeholder="e.g. Somsak"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">ນາມສະກຸນ (Last Name)</label>
                            <input 
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                value={formData.last_name} 
                                onChange={(e) => handleChange('last_name', e.target.value)}
                                placeholder="e.g. Phomvihane"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">ອີເມວ (Email) *</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                                <input 
                                    className="w-full p-3 pl-10 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                    value={formData.email} 
                                    onChange={(e) => handleChange('email', e.target.value)}
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">ເບີໂທ (Phone)</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                                <input 
                                    className="w-full p-3 pl-10 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                    value={formData.phone} 
                                    onChange={(e) => handleChange('phone', e.target.value)}
                                    placeholder="020 xxxx xxxx"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
                    <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                        <Briefcase size={18}/> ປະສົບການ & ການສຶກສາ
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                             <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">ປະສົບການ (ປີ)</label>
                             <input 
                                type="number"
                                className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                value={formData.experience_years} 
                                onChange={(e) => handleChange('experience_years', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">ວຸດທິການສຶກສາ</label>
                            <div className="relative">
                                <GraduationCap className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                                <input 
                                    className="w-full p-3 pl-10 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                                    value={formData.education} 
                                    onChange={(e) => handleChange('education', e.target.value)}
                                    placeholder="e.g. Bachelor Degree"
                                />
                            </div>
                        </div>
                    </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">ທັກສະ (Skills) - ຄັ່ນດ້ວຍຈຸດ (,)</label>
                        <input 
                            className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                            value={formData.skills} 
                            onChange={(e) => handleChange('skills', e.target.value)}
                            placeholder="React, Node.js, English..."
                        />
                    </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">ປະຫວັດການເຮັດວຽກ (Work History)</label>
                        <textarea 
                            className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition h-24" 
                            value={formData.work_history} 
                            onChange={(e) => handleChange('work_history', e.target.value)}
                            placeholder="ປະຫວັດການເຮັດວຽກ..."
                        />
                    </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">ໝາຍເຫດ / ສະຫຼຸບ (Summary)</label>
                        <textarea 
                            className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition h-24" 
                            value={formData.ai_summary} 
                            onChange={(e) => handleChange('ai_summary', e.target.value)}
                            placeholder="ບົດສະຫຼຸບກ່ຽວກັບຜູ້ສະໝັກ..."
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <div className="flex gap-4 pt-2">
                    <button onClick={onClose} className="flex-1 py-3.5 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                        ຍົກເລີກ (Cancel)
                    </button>
                    <button onClick={handleSubmit} className="flex-1 py-3.5 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition">
                        ບັນທຶກຜູ້ສະໝັກ (Save Candidate)
                    </button>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddCandidateModal;
