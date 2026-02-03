
import React, { useState, useEffect, useMemo } from 'react';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { KanbanBoard } from './components/KanbanBoard';
import SearchView from './components/SearchView'; 
import SettingsView from './components/SettingsView';
import AddCandidateView from './components/AddCandidateView'; 
import CandidateDetailsModal from './components/CandidateDetailsModal'; 
import EditCandidateModal from './components/EditCandidateModal';
import { InterviewModal } from './components/InterviewModal';
import PublicApplyView from './components/PublicApplyView'; // Import Public View
import { Application, ApplicationStatus, Job } from './types';
import { getApplications, updateApplicationStatus, getJobs, addApplication, updateInterviewDate, sendNotification, updateApplicationAI, deleteApplication, updateCandidateProfile } from './services/mockBackend';
import { Language } from './utils/translations';

const App: React.FC = () => {
  const [user, setUser] = useState<boolean>(() => !!localStorage.getItem('smart_hr_session') || !!sessionStorage.getItem('smart_hr_session'));
  const [userRole, setUserRole] = useState<'ADMIN' | 'USER'>(() => {
      const storedRole = localStorage.getItem('smart_hr_role') || sessionStorage.getItem('smart_hr_role');
      return (storedRole === 'USER') ? 'USER' : 'ADMIN';
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'KANBAN' | 'ADD_CANDIDATE' | 'SEARCH' | 'SETTINGS'>('DASHBOARD');
  
  // New State for toggling Public View Preview
  const [showPublicView, setShowPublicView] = useState(false);

  const [rawApplications, setRawApplications] = useState<Application[]>([]);
  const [jobsList, setJobsList] = useState<Job[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('lo');
  const [interviewModal, setInterviewModal] = useState<{ isOpen: boolean, appId: string | null }>({ isOpen: false, appId: null });
  const [candidateDetailsModal, setCandidateDetailsModal] = useState<{ isOpen: boolean, app: Application | null }>({ isOpen: false, app: null });
  const [editModal, setEditModal] = useState<{ isOpen: boolean, app: Application | null }>({ isOpen: false, app: null });

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Force USER to Add Candidate tab
  useEffect(() => {
      if (user && userRole === 'USER' && activeTab !== 'ADD_CANDIDATE') {
          setActiveTab('ADD_CANDIDATE');
      }
  }, [user, userRole]);

  useEffect(() => { if (user) loadData(); }, [user]);

  const handleLoginSuccess = (role: 'ADMIN' | 'USER') => {
      setUserRole(role);
      setUser(true);
      if (role === 'USER') setActiveTab('ADD_CANDIDATE');
      else setActiveTab('DASHBOARD');
  };

  const loadData = async () => {
    setLoading(true);
    try {
        // Load data regardless of role, although USER might only need Jobs
        // getApplications() is now updated to filter out is_hidden items automatically
        const [appsData, jobsData] = await Promise.all([getApplications(), getJobs()]);
        setRawApplications(appsData);
        setJobsList(jobsData);
    } catch (e) { 
        console.error("Load Data Error:", e); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('smart_hr_session');
    sessionStorage.removeItem('smart_hr_session');
    localStorage.removeItem('smart_hr_role');
    sessionStorage.removeItem('smart_hr_role');
    setUser(false);
    setUserRole('ADMIN'); // Reset to default
  };

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    setRawApplications(apps => apps.map(app => app.id === id ? { ...app, status: newStatus } : app));
    await updateApplicationStatus(id, newStatus);
    if (newStatus === ApplicationStatus.INTERVIEW) setInterviewModal({ isOpen: true, appId: id });
    else if (newStatus === ApplicationStatus.REJECTED) sendNotification(id, 'REJECT');
  };

  const handleAddCandidate = async (parsedData: any, jobId: string, file?: File) => {
    try {
        const newApp = await addApplication(parsedData, jobId, file);
        setRawApplications(prev => [newApp, ...prev]);
        return Promise.resolve();
    } catch (e: any) {
        alert("Error: " + (e.message || "Failed to save"));
        return Promise.reject(e);
    }
  };

  const handleDeleteCandidate = async (id: string) => {
      // 1. Optimistic UI Update: Remove immediately from screen
      setRawApplications(prev => prev.filter(app => app.id !== id));
      
      // Close modal if deleting the currently viewed candidate
      if (candidateDetailsModal.app?.id === id) {
        setCandidateDetailsModal({ isOpen: false, app: null });
      }

      // 2. Call Backend to perform Soft Delete (is_hidden = true)
      // This ensures data is consistent across all admins/devices
      await deleteApplication(id);

      console.log(`Candidate ${id} soft-deleted via Database.`);
  };

  // 1. If in Public View Mode, render the form full screen
  if (showPublicView) {
    return <PublicApplyView onBack={() => {
        setShowPublicView(false);
        loadData(); // Refresh data when coming back from public view
    }} />;
  }

  // 2. If not logged in, show Auth
  if (!user) return <Auth onLoginSuccess={handleLoginSuccess} />;

  // 3. Normal Admin/User Layout
  return (
    <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onLogout={handleLogout} 
        isDarkMode={isDarkMode} 
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
        language={language} 
        userRole={userRole}
        onOpenPublicView={() => setShowPublicView(true)}
    >
      {loading ? (
        <div className="flex h-[80vh] items-center justify-center text-slate-400 font-medium">
            <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ກຳລັງໂຫຼດຂໍ້ມູນ...
            </div>
        </div>
      ) : (
        <>
            {/* Admin only views */}
            {userRole === 'ADMIN' && activeTab === 'DASHBOARD' && <Dashboard applications={rawApplications} onViewAll={() => setActiveTab('SEARCH')} language={language} isDarkMode={isDarkMode} />}
            {userRole === 'ADMIN' && activeTab === 'KANBAN' && (
                <KanbanBoard 
                    applications={rawApplications} 
                    onStatusChange={handleStatusChange} 
                    onCandidateClick={(app) => setCandidateDetailsModal({ isOpen: true, app })} 
                    onEditCandidate={(app) => setEditModal({ isOpen: true, app })}
                    onDeleteCandidate={handleDeleteCandidate}
                    language={language} 
                />
            )}
            {userRole === 'ADMIN' && activeTab === 'SEARCH' && <SearchView applications={rawApplications} jobs={jobsList} onViewCandidate={(app) => setCandidateDetailsModal({ isOpen: true, app })} onDeleteCandidate={handleDeleteCandidate} onEditCandidate={(app) => setEditModal({ isOpen: true, app })} language={language} />}
            {userRole === 'ADMIN' && activeTab === 'SETTINGS' && <SettingsView isDarkMode={isDarkMode} toggleDarkMode={() => setIsDarkMode(!isDarkMode)} language={language} setLanguage={setLanguage} />}
            
            {/* View available to both */}
            {activeTab === 'ADD_CANDIDATE' && <AddCandidateView jobs={jobsList} loadingJobs={false} errorJobs={null} onReloadJobs={loadData} onSave={handleAddCandidate} language={language} />}
        </>
      )}

      {/* Modals - Only rendered if Admin (or if logic permits) */}
      {userRole === 'ADMIN' && (
          <>
            <InterviewModal 
                isOpen={interviewModal.isOpen} 
                onClose={() => setInterviewModal({ isOpen: false, appId: null })} 
                onSubmit={async (date, type, location) => { 
                    await updateInterviewDate(interviewModal.appId!, date, type, location); 
                    setRawApplications(p => p.map(a => a.id === interviewModal.appId ? { ...a, interview_date: date, interview_type: type, interview_location: location } : a)); 
                }} 
                application={rawApplications.find(a => a.id === interviewModal.appId) || null}
                language={language} 
            />
            
            <CandidateDetailsModal 
                isOpen={candidateDetailsModal.isOpen} 
                onClose={() => setCandidateDetailsModal({ isOpen: false, app: null })} 
                application={candidateDetailsModal.app} 
                job={jobsList.find(j => j.id === candidateDetailsModal.app?.job_id)} 
                allJobs={jobsList} // Pass all jobs for AI Comparison
                onUpdateApplication={async (id, s, sum, suggestions) => { 
                    await updateApplicationAI(id, s, sum, suggestions); 
                    setRawApplications(p => p.map(a => a.id === id ? { ...a, ai_match_score: s, ai_summary: sum, ai_job_suggestions: suggestions } : a)); 
                }} 
                onDeleteCandidate={handleDeleteCandidate}
                language={language} 
            />

            <EditCandidateModal isOpen={editModal.isOpen} onClose={() => setEditModal({ isOpen: false, app: null })} onSave={async (id, d) => { const u = await updateCandidateProfile(id, d); setRawApplications(p => p.map(a => a.id === id ? u : a)); }} application={editModal.app} language={language} />
          </>
      )}
    </Layout>
  );
};

export default App;
