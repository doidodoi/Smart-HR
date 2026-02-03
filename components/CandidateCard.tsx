
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Application } from '../types';
import { Calendar, Phone, Mail, Award, Edit, Trash2, Sparkles } from 'lucide-react';
import { Language, getNameTitle } from '../utils/translations';

interface Props {
  application: Application;
  onClick: () => void;
  language: Language;
  onEdit?: (e: React.MouseEvent, app: Application) => void;
  onDelete?: (e: React.MouseEvent, id: string) => void;
}

export const CandidateCard: React.FC<Props> = ({ application, onClick, language, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: application.id, data: { ...application } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  const getScoreStyle = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 ring-emerald-100 dark:ring-emerald-900/30';
    if (score >= 60) return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 ring-amber-100 dark:ring-amber-900/30';
    if (score > 0) return 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20 ring-orange-100 dark:ring-orange-900/30';
    // Score 0 or undefined
    return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 ring-red-100 dark:ring-red-900/30';
  };

  const titlePrefix = getNameTitle(application.candidate.gender, language);
  const scoreStyle = getScoreStyle(application.ai_match_score || 0);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`
        bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700
        shadow-sm hover:shadow-lg hover:shadow-blue-900/5 dark:hover:shadow-black/20 hover:border-blue-300 dark:hover:border-blue-600
        cursor-grab active:cursor-grabbing group relative mb-3 transition-all duration-300
        ${isDragging ? 'rotate-2 scale-105 shadow-xl' : ''}
      `}
    >
      {/* Top Section: Name & Info */}
      <div className="flex justify-between items-start mb-3 pr-12 relative">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-600 flex-shrink-0">
                 <img 
                    src={application.candidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${application.candidate.first_name}`} 
                    className="w-full h-full object-cover" 
                    alt="Avatar"
                />
            </div>
            <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-[15px] leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {titlePrefix} {application.candidate.first_name} {application.candidate.last_name}
                </h4>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[150px] flex items-center gap-1">
                   {application.candidate.applied_position}
                </p>
            </div>
        </div>
      </div>

      {/* AI SCORE BADGE - TOP RIGHT (Clean Circle Design) */}
      <div className={`absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full border shadow-sm ring-2 z-10 transition-transform group-hover:scale-110 ${scoreStyle}`}>
        <span className="text-[11px] font-black">{application.ai_match_score || 0}%</span>
      </div>

      {/* ACTION BUTTONS - HIDDEN UNTIL HOVER */}
      <div className="absolute top-14 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-20">
        {onEdit && (
            <button 
                onClick={(e) => onEdit(e, application)}
                onPointerDown={(e) => e.stopPropagation()} 
                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-600 rounded-full shadow-sm hover:shadow-md transition-all"
                title="Edit Candidate"
            >
                <Edit size={14} />
            </button>
        )}
        {onDelete && (
            <button 
                onClick={(e) => onDelete(e, application.id)}
                onPointerDown={(e) => e.stopPropagation()} 
                className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-700 text-slate-400 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-600 rounded-full shadow-sm hover:shadow-md transition-all"
                title="Delete Candidate"
            >
                <Trash2 size={14} />
            </button>
        )}
      </div>
      
      {/* Contact Details */}
      <div className="space-y-1.5 mb-3 ml-1">
        <div className="flex items-center text-xs font-medium text-slate-600 dark:text-slate-300">
           <Phone className="w-3.5 h-3.5 mr-2 text-slate-400 dark:text-slate-500" /> {application.candidate.phone}
        </div>
        <div className="flex items-center text-xs font-medium text-slate-600 dark:text-slate-300">
           <Mail className="w-3.5 h-3.5 mr-2 text-slate-400 dark:text-slate-500" /> <span className="truncate max-w-[180px]">{application.candidate.email}</span>
        </div>
        {application.interview_date && (
            <div className="flex items-center text-xs text-purple-700 dark:text-purple-300 font-bold mt-2 bg-purple-50 dark:bg-purple-900/20 p-2 rounded-lg border border-purple-100 dark:border-purple-800/50">
                <Calendar className="w-3.5 h-3.5 mr-2" /> 
                {new Date(application.interview_date).toLocaleDateString('lo-LA')}
            </div>
        )}
      </div>

      {/* AI Summary Snippet */}
       {application.ai_summary && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/50 mt-3">
            <div className="flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 italic">
                    {application.ai_summary.replace(/Manual Entry Data:|Extra Details:|DOB:.*|Nationality:.*|Family:.*|ID Card:.*/g, '').trim()}
                </p>
            </div>
        </div>
       )}
    </div>
  );
};
