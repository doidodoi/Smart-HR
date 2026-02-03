
import React, { useState } from 'react';
import { Application, ApplicationStatus, STATUS_LABELS } from '../types';
import { DndContext, DragOverlay, useSensor, useSensors, MouseSensor, TouchSensor, DragEndEvent, DragStartEvent, closestCorners, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CandidateCard } from './CandidateCard';
import { createPortal } from 'react-dom';
import { Language, TRANSLATIONS } from '../utils/translations';

interface Props {
  applications: Application[];
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
  onCandidateClick: (app: Application) => void;
  onEditCandidate?: (app: Application) => void;
  onDeleteCandidate?: (id: string) => void;
  language: Language;
}

interface ColumnProps {
  id: string;
  title: string;
  count: number;
  color: string;
  applications: Application[];
  onCandidateClick: (app: Application) => void;
  onEditCandidate?: (app: Application) => void;
  onDeleteCandidate?: (id: string) => void;
  language: Language;
}

const Column: React.FC<ColumnProps> = ({ id, title, count, color, applications, onCandidateClick, onEditCandidate, onDeleteCandidate, language }) => {
  // Make the entire column droppable
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  const handleEdit = (e: React.MouseEvent, app: Application) => {
      e.stopPropagation();
      if(onEditCandidate) onEditCandidate(app);
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if(onDeleteCandidate) onDeleteCandidate(id);
  }

  return (
    <div 
      ref={setNodeRef}
      className={`
        flex flex-col h-full min-w-[320px] w-[320px] rounded-2xl border 
        transition-all duration-300
        ${isOver 
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-500 shadow-md ring-2 ring-blue-400/20 scale-[1.01]' 
            : 'bg-slate-100/50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60 shadow-sm'}
      `}
    >
      <div className={`p-4 rounded-t-2xl border-b border-slate-200 dark:border-slate-700 ${isOver ? 'bg-blue-100/50 dark:bg-blue-900/40' : 'bg-white dark:bg-slate-800'} transition-colors sticky top-0 z-10`}>
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${color.replace('bg-', 'bg-').replace('100', '500').split(' ')[0]}`}></div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm uppercase tracking-wide">{title}</h3>
            </div>
            <span className="bg-slate-200 dark:bg-slate-700 px-2.5 py-0.5 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 min-w-[24px] text-center">{count}</span>
        </div>
      </div>
      
      <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
        <SortableContext 
            id={id} 
            items={applications.map(app => app.id)} 
            strategy={verticalListSortingStrategy}
        >
            <div className="space-y-3 min-h-[100px] pb-4">
                {applications.map(app => (
                    <CandidateCard 
                        key={app.id} 
                        application={app} 
                        onClick={() => onCandidateClick(app)} 
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        language={language}
                    />
                ))}
                {/* Visual placeholder for empty columns */}
                {applications.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-sm border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/20">
                        <p>No Candidates</p>
                    </div>
                )}
            </div>
        </SortableContext>
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<Props> = ({ applications, onStatusChange, onCandidateClick, onEditCandidate, onDeleteCandidate, language }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const t = TRANSLATIONS[language];

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Needs 8px movement to start drag (prevents accidental drags on click)
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
        setActiveId(null);
        return;
    }

    const activeApp = applications.find(a => a.id === active.id);
    if (!activeApp) {
        setActiveId(null);
        return;
    }

    // 1. Dropped directly onto a Column (Status)
    if (Object.values(ApplicationStatus).includes(over.id as ApplicationStatus)) {
        const newStatus = over.id as ApplicationStatus;
        if (activeApp.status !== newStatus) {
            onStatusChange(activeApp.id, newStatus);
        }
    } 
    // 2. Dropped onto another Card (inherit that card's status)
    else {
        const overApp = applications.find(a => a.id === over.id);
        if (overApp && activeApp.status !== overApp.status) {
            onStatusChange(activeApp.id, overApp.status);
        }
    }

    setActiveId(null);
  };

  const columns = Object.values(ApplicationStatus);
  const activeApplication = activeId ? applications.find(a => a.id === activeId) : null;

  // Helper to get translated status label
  const getStatusLabel = (status: ApplicationStatus) => {
      // @ts-ignore
      return t[`status_${status.toLowerCase()}`] || status;
  };

  return (
    <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        collisionDetection={closestCorners}
    >
      <div className="flex h-full gap-6 overflow-x-auto overflow-y-hidden items-start px-6 pt-6 pb-2 box-border">
        {columns.map((status) => (
          <Column 
            key={status} 
            id={status} 
            title={getStatusLabel(status)}
            color={STATUS_LABELS[status].color}
            count={applications.filter(a => a.status === status).length}
            applications={applications.filter(a => a.status === status)}
            onCandidateClick={onCandidateClick}
            onEditCandidate={onEditCandidate}
            onDeleteCandidate={onDeleteCandidate}
            language={language}
          />
        ))}
         {/* Spacer to allow scrolling past the last column a bit */}
         <div className="min-w-[20px] h-full flex-shrink-0" />
      </div>

      {createPortal(
        <DragOverlay dropAnimation={{
            duration: 250,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
          {activeApplication ? (
            <div className="transform rotate-3 opacity-90 cursor-grabbing scale-105">
                 <CandidateCard application={activeApplication} onClick={() => {}} language={language} />
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};
