
import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Briefcase, GraduationCap, History, AlertCircle, CalendarDays, MapPin, DollarSign } from 'lucide-react';
import { Application } from '../types';
import { Language, TRANSLATIONS } from '../utils/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: any) => void;
  application: Application | null;
  language: Language;
}

const EditCandidateModal: React.FC<Props> = ({ isOpen, onClose, onSave, application, language }) => {
  const t = TRANSLATIONS[language];
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (application) {
      setFormData({
        first_name: application.candidate.first_name,
        last_name: application.candidate.last_name,
        email: application.candidate.email,
        phone: application.candidate.phone,
        address: application.candidate.address || '',
        expected_salary: application.candidate.expected_salary || '',
        gender: application.candidate.gender,
        age: application.candidate.age || 25,
        experience_years: application.candidate.experience_years,
        work_history: application.candidate.work_history,
        education: application.candidate.education,
        skills: application.candidate.skills.join(', '),
        ai_summary: application.ai_summary
      });
    }
  }, [application]);

  if (!isOpen || !application) return null;

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.first_name || !formData.email) {
      setError("Name and Email are required");
      return;
    }

    const updatedData = {
      ai_summary: formData.ai_summary,
      candidate: {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        expected_salary: formData.expected_salary,
        gender: formData.gender,
        age: parseInt(formData.age) || 0,
        experience_years: parseInt(formData.experience_years) || 0,
        work_history: formData.work_history,
        education: formData.education,
        skills: typeof formData.skills === 'string' ? formData.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s) : formData.skills,
      }
    };

    onSave(application.id, updatedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col animate-scale-in">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.edit_candidate}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 flex-1 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
             <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                <User size={18}/> {t.general_info}
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.name} *</label>
                    <input className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.first_name} onChange={(e) => handleChange('first_name', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.lastname}</label>
                    <input className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.last_name} onChange={(e) => handleChange('last_name', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.gender}</label>
                    <select className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.gender} onChange={(e) => handleChange('gender', e.target.value)}>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.age}</label>
                    <input type="number" className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.age} onChange={(e) => handleChange('age', e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.email} *</label>
                    <input className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.phone}</label>
                    <input className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} />
                </div>
                
                {/* Salary Field */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1"><DollarSign size={10} /> Salary</label>
                    <input className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.expected_salary} onChange={(e) => handleChange('expected_salary', e.target.value)} />
                </div>

                {/* Address Field */}
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1"><MapPin size={10} /> Address</label>
                    <input className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.address} onChange={(e) => handleChange('address', e.target.value)} />
                </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
             <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                <Briefcase size={18}/> {t.experience} & {t.education}
            </h3>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.experience}</label>
                <input type="number" className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.experience_years} onChange={(e) => handleChange('experience_years', e.target.value)} />
            </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.skills}</label>
                <input className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.skills} onChange={(e) => handleChange('skills', e.target.value)} />
            </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.history}</label>
                <textarea className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none h-24" value={formData.work_history} onChange={(e) => handleChange('work_history', e.target.value)} />
            </div>
             <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">{t.education}</label>
                <textarea className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none h-24" value={formData.education} onChange={(e) => handleChange('education', e.target.value)} />
            </div>
          </div>

           {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle size={16} /> {error}
                </div>
            )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
            <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                {t.btn_cancel}
            </button>
            <button onClick={handleSubmit} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">
                {t.btn_update}
            </button>
        </div>
      </div>
    </div>
  );
};

export default EditCandidateModal;
