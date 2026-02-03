
import React from 'react';
import { Application, ApplicationStatus, STATUS_LABELS } from '../types';
import { Users, FileCheck, UserCheck, XCircle, ArrowRight, Download, FileSpreadsheet, ListFilter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Language, TRANSLATIONS, getNameTitle } from '../utils/translations';

interface DashboardProps {
  applications: Application[];
  onViewAll: () => void;
  language: Language;
  isDarkMode: boolean;
}

const StatCard: React.FC<{ 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    colorClass: string;
}> = ({ title, value, icon, colorClass }) => (
  <div className="bg-white dark:bg-gemini-surface p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-gemini-border relative overflow-hidden group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
    <div className={`absolute top-0 right-0 p-4 rounded-bl-3xl opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}>
        {icon}
    </div>
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colorClass} bg-opacity-10 text-opacity-100`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: "w-6 h-6" })}
      </div>
      <h3 className="text-4xl font-bold text-slate-900 dark:text-gemini-text tracking-tight mb-1">{value}</h3>
      <p className="text-sm font-medium text-slate-500 dark:text-gemini-muted">{title}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ applications = [], onViewAll, language, isDarkMode }) => {
  const t = TRANSLATIONS[language];
  const total = applications.length;
  const interviews = applications.filter(a => a.status === ApplicationStatus.INTERVIEW).length;
  const hired = applications.filter(a => a.status === ApplicationStatus.HIRED).length;
  const rejected = applications.filter(a => a.status === ApplicationStatus.REJECTED).length;

  const getStatusLabel = (status: ApplicationStatus) => {
    // @ts-ignore
    return t[`status_${status.toLowerCase()}`] || status;
  };

  const chartData = [
    { name: getStatusLabel(ApplicationStatus.NEW), count: applications.filter(a => a.status === ApplicationStatus.NEW).length, color: '#3b82f6' },
    { name: getStatusLabel(ApplicationStatus.SCREENING), count: applications.filter(a => a.status === ApplicationStatus.SCREENING).length, color: '#f59e0b' },
    { name: getStatusLabel(ApplicationStatus.INTERVIEW), count: interviews, color: '#a855f7' },
    { name: getStatusLabel(ApplicationStatus.HIRED), count: hired, color: '#22c55e' },
    { name: getStatusLabel(ApplicationStatus.REJECTED), count: rejected, color: '#ef4444' },
  ];

  const exportToExcel = () => {
    if (applications.length === 0) return;
    
    const headers = [t.table_name, t.table_position, t.table_score, t.table_status, t.table_date, t.phone, t.email];
    const rows = applications.map(app => [
        `${getNameTitle(app.candidate.gender, language)} ${app.candidate?.first_name || ''} ${app.candidate?.last_name || ''}`,
        app.candidate?.applied_position || '',
        `${app.ai_match_score || 0}%`,
        getStatusLabel(app.status),
        app.applied_at ? new Date(app.applied_at).toLocaleDateString('lo-LA') : '',
        app.candidate?.phone || '',
        app.candidate?.email || ''
    ]);

    const csvContent = "\uFEFF" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Recruitment_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const recentApplications = [...applications]
    .filter(a => a && a.applied_at)
    .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t.total_candidates}
          value={total} 
          icon={<Users />} 
          colorClass="bg-blue-500 text-blue-600 dark:text-blue-400"
        />
        <StatCard 
          title={getStatusLabel(ApplicationStatus.INTERVIEW)}
          value={interviews} 
          icon={<FileCheck />} 
          colorClass="bg-purple-500 text-purple-600 dark:text-purple-400"
        />
        <StatCard 
          title={getStatusLabel(ApplicationStatus.HIRED)} 
          value={hired} 
          icon={<UserCheck />} 
          colorClass="bg-green-500 text-green-600 dark:text-green-400"
        />
        <StatCard 
          title={getStatusLabel(ApplicationStatus.REJECTED)} 
          value={rejected} 
          icon={<XCircle />} 
          colorClass="bg-red-500 text-red-600 dark:text-red-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-gemini-surface p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-gemini-border">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-gemini-text">{t.recruit_stats}</h3>
                    <p className="text-sm text-slate-500 dark:text-gemini-muted">Recruitment Pipeline Overview</p>
                </div>
            </div>
            <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#333537" : "#e2e8f0"} opacity={0.5} />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: isDarkMode ? '#c4c7c5' : '#64748b', fontSize: 10, fontWeight: 600}} 
                        dy={10}
                        interval={0}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: isDarkMode ? '#c4c7c5' : '#64748b', fontSize: 12}} 
                    />
                    <Tooltip 
                        cursor={{fill: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}}
                        contentStyle={{
                            borderRadius: '16px', 
                            border: '1px solid #333537', 
                            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.5)',
                            padding: '12px 20px',
                            backgroundColor: '#1e1f20',
                            color: '#e3e3e3'
                        }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={40}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white dark:bg-gemini-surface p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-gemini-border flex flex-col">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 dark:text-gemini-text">{t.latest_candidates}</h3>
                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg font-bold">Latest 5</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {recentApplications.length > 0 ? (
                    recentApplications.map((app) => (
                        <div key={app.id} className="flex items-center p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-gemini-hover transition-colors border border-transparent hover:border-slate-100 dark:hover:border-gemini-border">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gemini-bg flex items-center justify-center text-slate-500 dark:text-gemini-muted font-bold text-sm mr-3 overflow-hidden border border-slate-200 dark:border-slate-700">
                                <img 
                                    src={app.candidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.candidate.first_name}`} 
                                    className="w-full h-full object-cover" 
                                    alt="Avatar"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 dark:text-gemini-text text-sm truncate">
                                    {getNameTitle(app.candidate.gender, language)} {app.candidate?.first_name || ''} {app.candidate?.last_name || ''}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-gemini-muted truncate">
                                    {app.candidate?.applied_position || ''}
                                </p>
                            </div>
                            <div className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${STATUS_LABELS[app.status]?.color || ''}`}>
                                {getStatusLabel(app.status)}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-slate-400 dark:text-gemini-muted text-sm">
                        {t.no_data}
                    </div>
                )}
            </div>

            <button 
                onClick={onViewAll}
                className="w-full mt-6 py-3 border border-slate-200 dark:border-gemini-border rounded-xl text-sm font-bold text-slate-600 dark:text-gemini-text hover:bg-slate-50 dark:hover:bg-gemini-hover transition flex items-center justify-center gap-2 group"
            >
                {t.view_all} ({total}) <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gemini-surface rounded-3xl shadow-sm border border-slate-100 dark:border-gemini-border overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-gemini-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50 dark:bg-gemini-bg/50">
              <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-gemini-text flex items-center gap-2">
                      <FileSpreadsheet className="text-green-600" /> {t.report_title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-gemini-muted mt-1">{t.report_desc}</p>
              </div>
              <button 
                  onClick={exportToExcel}
                  disabled={applications.length === 0}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all active:scale-95 disabled:opacity-50"
              >
                  <Download size={20} />
                  {t.btn_export_excel}
              </button>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-gemini-bg text-slate-500 dark:text-gemini-muted text-xs font-bold uppercase tracking-wider">
                      <tr>
                          <th className="px-8 py-4">{t.table_name}</th>
                          <th className="px-8 py-4">{t.table_position}</th>
                          <th className="px-8 py-4 text-center">{t.table_score}</th>
                          <th className="px-8 py-4">{t.table_status}</th>
                          <th className="px-8 py-4">{t.table_date}</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-gemini-border">
                      {applications.slice(0, 10).map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-gemini-hover transition-colors">
                              <td className="px-8 py-4 font-bold text-slate-900 dark:text-gemini-text flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gemini-bg flex items-center justify-center text-xs font-black overflow-hidden border border-slate-200 dark:border-slate-700">
                                      <img 
                                          src={app.candidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.candidate.first_name}`} 
                                          className="w-full h-full object-cover" 
                                          alt="Avatar"
                                      />
                                  </div>
                                  <div className="min-w-0">
                                      <div className="truncate">{getNameTitle(app.candidate.gender, language)} {app.candidate?.first_name || ''} {app.candidate?.last_name || ''}</div>
                                  </div>
                              </td>
                              <td className="px-8 py-4 text-slate-600 dark:text-gemini-muted">
                                  {app.candidate?.applied_position || ''}
                              </td>
                              <td className="px-8 py-4 text-center">
                                  <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${app.ai_match_score >= 80 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                      {app.ai_match_score || 0}%
                                  </span>
                              </td>
                              <td className="px-8 py-4 whitespace-nowrap">
                                  <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${STATUS_LABELS[app.status]?.color || ''}`}>
                                      {getStatusLabel(app.status)}
                                  </span>
                              </td>
                              <td className="px-8 py-4 text-slate-500 dark:text-gemini-muted text-sm whitespace-nowrap">
                                  {app.applied_at ? new Date(app.applied_at).toLocaleDateString('lo-LA') : ''}
                              </td>
                          </tr>
                      ))}
                      {applications.length === 0 && (
                          <tr>
                              <td colSpan={5} className="px-8 py-12 text-center text-slate-400 dark:text-gemini-muted">
                                  {t.no_data}
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
