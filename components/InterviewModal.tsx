
import React, { useState, useEffect } from 'react';
import { Application } from '../types';
import { X, CalendarCheck, MapPin, Video, Monitor, Building, Calendar, Clock, ChevronRight, MessageSquare, Mail, Sparkles, RefreshCw, Copy, Check, CalendarDays } from 'lucide-react';
import { generateInterviewMessage } from '../services/gemini';
import { Language } from '../utils/translations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (date: string, type: 'ONLINE' | 'ONSITE', location: string) => void;
  application: Application | null;
  language: Language;
}

export const InterviewModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, application, language }) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [type, setType] = useState<'ONLINE' | 'ONSITE'>('ONSITE');
  const [location, setLocation] = useState('Senglao Group HQ (Office)');
  
  // Messaging States
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
      if (isOpen) {
          setDate('');
          setTime('');
          setType('ONSITE');
          setLocation('Senglao Group HQ (Office)');
          setMessage('');
      }
  }, [isOpen]);

  useEffect(() => {
      if (type === 'ONLINE') setLocation('Google Meet Link: ...');
      else setLocation('Senglao Group HQ (Office)');
  }, [type]);

  if (!isOpen || !application) return null;

  const generateDraft = async () => {
      if (!date || !time) return;
      setIsGenerating(true);
      try {
          const dateTime = `${date}T${time}:00`;
          const msg = await generateInterviewMessage(
              `${application.candidate.first_name} ${application.candidate.last_name}`,
              application.candidate.applied_position,
              dateTime,
              type,
              location,
              language // Pass the current system language
          );
          setMessage(msg);
      } catch (e) {
          console.error(e);
      } finally {
          setIsGenerating(false);
      }
  };

  const handleCopy = () => {
      navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const formatLaoPhone = (phone: string) => {
      // Remove spaces, dashes, and non-numeric chars
      let clean = phone.replace(/\D/g, '');
      
      // If starts with 020, remove 0 -> 20... then add 856 -> 85620...
      if (clean.startsWith('020')) {
          return '856' + clean.substring(1);
      }
      // If starts with 20..., add 856
      if (clean.startsWith('20')) {
          return '856' + clean;
      }
      return clean;
  };

  const handleAction = (action: 'SAVE' | 'WHATSAPP' | 'EMAIL') => {
    if (date && time) {
      // 1. Save to DB
      onSubmit(`${date}T${time}:00`, type, location);

      // 2. Perform External Action
      if (action === 'WHATSAPP') {
          const phoneNumber = formatLaoPhone(application.candidate.phone);
          const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
          window.open(url, '_blank');
      } else if (action === 'EMAIL') {
          const subject = `Interview Invitation: ${application.candidate.applied_position} - Senglao Group`;
          const url = `mailto:${application.candidate.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
          window.open(url, '_blank');
      }

      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md transition-all">
      <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-scale-in border border-white/20 flex flex-col md:flex-row">
        
        {/* Left Side: Form */}
        <div className="flex-1 p-6 space-y-6">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <CalendarCheck size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">ນັດສຳພາດ</h2>
                        <p className="text-purple-500 text-[10px] font-bold uppercase tracking-widest">Interview Schedule</p>
                    </div>
                </div>
                <button onClick={onClose} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition">
                    <X size={20} />
                </button>
            </div>

            {/* Candidate Mini Profile */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-700/30 p-3 rounded-2xl border border-slate-100 dark:border-slate-600">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-600 flex items-center justify-center text-purple-700 dark:text-purple-300 font-black text-sm shadow-sm">
                    {application.candidate.first_name[0]}
                </div>
                <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{application.candidate.first_name} {application.candidate.last_name}</p>
                    <p className="text-left text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase">{application.candidate.applied_position}</p>
                </div>
            </div>

             {/* 1. Type Selection */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">ຮູບແບບ (Type)</label>
                <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-2xl">
                    <button 
                        type="button"
                        onClick={() => setType('ONSITE')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${type === 'ONSITE' ? 'bg-white dark:bg-slate-600 shadow-sm text-purple-700 dark:text-purple-300 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        <Building size={16} /> On-site
                    </button>
                    <button 
                        type="button"
                        onClick={() => setType('ONLINE')}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${type === 'ONLINE' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-300 scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        <Monitor size={16} /> Online
                    </button>
                </div>
            </div>

            {/* 2. Date & Time (IMPROVED UI) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ວັນທີ (Date)</label>
                    <div className="relative group">
                        <div className={`w-full p-4 bg-white dark:bg-slate-700/50 border-2 rounded-2xl flex items-center gap-3 transition-all cursor-pointer hover:border-purple-300 dark:hover:border-purple-500/50 ${date ? 'border-purple-500 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-900/20' : 'border-slate-100 dark:border-slate-600 text-slate-400'}`}>
                            <CalendarDays size={20} className={date ? "text-purple-600 dark:text-purple-400" : "text-slate-300"} />
                            <span className="text-sm font-bold">
                                {date ? new Date(date).toLocaleDateString('lo-LA') : 'ກົດເລືອກວັນທີ'}
                            </span>
                        </div>
                        <input 
                            type="date" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            required 
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">ເວລາ (Time)</label>
                    <div className="relative group">
                        <div className={`w-full p-4 bg-white dark:bg-slate-700/50 border-2 rounded-2xl flex items-center gap-3 transition-all cursor-pointer hover:border-purple-300 dark:hover:border-purple-500/50 ${time ? 'border-purple-500 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-900/20' : 'border-slate-100 dark:border-slate-600 text-slate-400'}`}>
                             <Clock size={20} className={time ? "text-purple-600 dark:text-purple-400" : "text-slate-300"} />
                             <span className="text-sm font-bold">
                                {time || 'ກົດເລືອກເວລາ'}
                            </span>
                        </div>
                        <input 
                            type="time" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                            value={time} 
                            onChange={e => setTime(e.target.value)} 
                            required 
                        />
                    </div>
                </div>
            </div>

            {/* 3. Location */}
            <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                    {type === 'ONLINE' ? 'ລິ້ງປະຊຸມ (Meeting Link)' : 'ສະຖານທີ່ (Location)'}
                </label>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        {type === 'ONLINE' ? <Video size={18} className="text-blue-500"/> : <MapPin size={18} className="text-red-500"/>}
                    </div>
                    <input 
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-sm text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
                    />
                </div>
            </div>
        </div>

        {/* Right Side: Communication */}
        <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-6 flex flex-col border-l border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={14} className="text-blue-500"/> ຂໍ້ຄວາມເຊີນ (Message)
                </h3>
                {message && (
                    <button onClick={handleCopy} className="text-[10px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
                        {copied ? <Check size={12}/> : <Copy size={12}/>} {copied ? 'Copied' : 'Copy'}
                    </button>
                )}
            </div>

            <div className="flex-1 relative mb-4">
                <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={date && time ? "ກົດປຸ່ມສ້າງຂໍ້ຄວາມ..." : "ກະລຸນາເລືອກວັນ ແລະ ເວລາກ່ອນ..."}
                    className="w-full h-full min-h-[180px] p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm leading-relaxed outline-none focus:border-purple-500 resize-none font-medium text-slate-700 dark:text-slate-300"
                />
                {!message && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <button 
                            type="button"
                            onClick={generateDraft}
                            disabled={!date || !time || isGenerating}
                            className="pointer-events-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:shadow-none"
                        >
                            {isGenerating ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                            {isGenerating ? 'Generating...' : 'ສ້າງຂໍ້ຄວາມດ້ວຍ AI'}
                        </button>
                    </div>
                )}
                {message && !isGenerating && (
                    <button 
                        onClick={generateDraft}
                        className="absolute bottom-3 right-3 p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-blue-600 rounded-lg transition-colors"
                        title="Regenerate Message"
                    >
                        <RefreshCw size={14} />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleAction('WHATSAPP')}
                    disabled={!message}
                    className="col-span-1 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20 active:scale-95 disabled:opacity-50 disabled:shadow-none"
                >
                    <MessageSquare size={16} /> Save & WhatsApp
                </button>
                <button 
                    onClick={() => handleAction('EMAIL')}
                    disabled={!message}
                    className="col-span-1 bg-sky-500 hover:bg-sky-600 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/20 active:scale-95 disabled:opacity-50 disabled:shadow-none"
                >
                    <Mail size={16} /> Save & Email
                </button>
                <button 
                    onClick={() => handleAction('SAVE')}
                    className="col-span-2 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition-all"
                >
                    ບັນທຶກຢ່າງດຽວ (Save Only)
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
