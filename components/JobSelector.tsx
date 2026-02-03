import React, { useState, useRef, useEffect } from 'react';
import { Job } from '../types';
import { ChevronDown, Check, Briefcase } from 'lucide-react';

interface Props {
  jobs: Job[];
  currentJob: Job;
  onSelect: (job: Job) => void;
}

const JobSelector: React.FC<Props> = ({ jobs, currentJob, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative group min-w-[280px]" ref={dropdownRef}>
        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
            ຕຳແໜ່ງທີ່ເປີດຮັບ (Current Job)
        </label>
        
        <button 
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-between gap-3 bg-white dark:bg-slate-800 border-2 ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-600'} rounded-2xl p-3 transition-all duration-200`}
        >
            <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                    <Briefcase size={20} />
                </div>
                <div className="text-left truncate">
                    <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{currentJob.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{currentJob.department}</p>
                </div>
            </div>
            <ChevronDown size={20} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden z-50 animate-scale-in origin-top">
                <div className="max-h-[300px] overflow-y-auto p-1.5 custom-scrollbar">
                    {jobs.map((job) => (
                        <button
                            key={job.id}
                            onClick={() => {
                                onSelect(job);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-xl mb-1 transition-all ${
                                currentJob.id === job.id 
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <div className="text-left">
                                <p className="font-bold text-sm">{job.title}</p>
                                <p className="text-xs opacity-70">{job.department}</p>
                            </div>
                            {currentJob.id === job.id && <Check size={18} className="text-blue-600 dark:text-blue-400" />}
                        </button>
                    ))}
                </div>
                <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">ມີທັງໝົດ {jobs.length} ຕຳແໜ່ງ</p>
                </div>
            </div>
        )}
    </div>
  );
};

export default JobSelector;