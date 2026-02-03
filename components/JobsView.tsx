
import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import { Plus, Briefcase, MapPin, Building, ChevronRight, X, Sparkles, Loader2, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { addNewJob, seedDefaultJobs, updateJob, deleteJob } from '../services/mockBackend';

interface Props {
  jobs: Job[];
  onJobAdded: () => void;
}

const JobsView: React.FC<Props> = ({ jobs, onJobAdded }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null); // Track which job is being edited

  // Menu Dropdown State
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    description: '',
    requirements: ''
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const openCreateModal = () => {
      setEditingJob(null);
      setFormData({ title: '', department: '', description: '', requirements: '' });
      setIsModalOpen(true);
  };

  const openEditModal = (job: Job) => {
      setEditingJob(job);
      setFormData({
          title: job.title,
          department: job.department,
          description: job.description,
          requirements: job.requirements.join(', ')
      });
      setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const payload = {
            title: formData.title,
            department: formData.department,
            description: formData.description,
            requirements: formData.requirements.split(',').map(r => r.trim()).filter(r => r !== '')
        };

        if (editingJob) {
            // Update Existing Job
            await updateJob(editingJob.id, payload);
            alert('ອັບເດດຂໍ້ມູນສຳເລັດ! (Job Updated)');
        } else {
            // Create New Job
            await addNewJob(payload);
            alert('ປະກາດຮັບສະໝັກງານສຳເລັດ! (Job Posted Successfully)');
        }

        setFormData({ title: '', department: '', description: '', requirements: '' });
        setIsModalOpen(false);
        setEditingJob(null);
        onJobAdded(); // Refresh list
    } catch (error: any) {
        alert("Error: " + error.message);
    }
  };

  const handleDelete = async (jobId: string) => {
      if (!confirm("ທ່ານຕ້ອງການລຶບຕຳແໜ່ງງານນີ້ແທ້ບໍ່? (Are you sure you want to delete?)")) return;
      
      try {
          await deleteJob(jobId);
          onJobAdded(); // Refresh list
      } catch (error: any) {
          alert("Error deleting job: " + error.message);
      }
  };

  const handleRestoreDefault = async () => {
      if (!confirm("ທ່ານຕ້ອງການຕິດຕັ້ງ 35 ຕຳແໜ່ງງານມາດຕະຖານບໍ່? (Install 35 default positions?)")) return;
      
      setIsSeeding(true);
      try {
          await seedDefaultJobs();
          onJobAdded();
          alert("ຕິດຕັ້ງຕຳແໜ່ງງານສຳເລັດ!");
      } catch (error: any) {
          alert(error.message);
      } finally {
          setIsSeeding(false);
      }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-blue-600 text-white p-8 rounded-3xl shadow-lg shadow-blue-900/20 gap-6">
        <div>
            <h2 className="text-2xl font-bold mb-2">ຈັດການຕຳແໜ່ງງານ (Job Management)</h2>
            <p className="text-blue-100">ສ້າງ, ແກ້ໄຂ ແລະ ລຶບ ປະກາດຮັບສະໝັກງານຂອງບໍລິສັດ.</p>
        </div>
        <div className="flex flex-wrap gap-3">
            <button 
                onClick={handleRestoreDefault}
                disabled={isSeeding}
                className="bg-blue-500 hover:bg-blue-400 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition shadow-lg border border-blue-400 disabled:opacity-50"
            >
                {isSeeding ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                ຕິດຕັ້ງ 35 ຕຳແໜ່ງງານ
            </button>
            <button 
                onClick={openCreateModal}
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-50 transition shadow-lg"
            >
                <Plus size={20} /> ສ້າງປະກາດໃໝ່
            </button>
        </div>
      </div>

      {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6">
                  <Briefcase size={40} className="text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">ຍັງບໍ່ມີຕຳແໜ່ງງານ</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 text-center max-w-sm">ກະລຸນາເພີ່ມຕຳແໜ່ງງານໃໝ່ ຫຼື ກົດປຸ່ມ "ຕິດຕັ້ງ 35 ຕຳແໜ່ງງານ" ເພື່ອນຳໃຊ້ຂໍ້ມູນມາດຕະຖານ.</p>
              <button 
                  onClick={handleRestoreDefault}
                  disabled={isSeeding}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
              >
                  {isSeeding ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                  ຕິດຕັ້ງຂໍ້ມູນດຽວນີ້
              </button>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
                <div key={job.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group relative">
                    
                    {/* Header with Menu */}
                    <div className="flex items-start justify-between mb-4 relative">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                <Briefcase size={24} />
                            </div>
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold px-2 py-1 rounded-lg">Active</span>
                        </div>
                        
                        {/* 3 Dots Menu */}
                        <div className="relative" onClick={e => e.stopPropagation()}>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === job.id ? null : job.id);
                                }}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                            >
                                <MoreVertical size={20} />
                            </button>

                            {/* Dropdown Content */}
                            {activeMenuId === job.id && (
                                <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-slate-700 rounded-xl shadow-xl border border-slate-100 dark:border-slate-600 z-20 overflow-hidden animate-scale-in origin-top-right">
                                    <button 
                                        onClick={() => { openEditModal(job); setActiveMenuId(null); }}
                                        className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center gap-2"
                                    >
                                        <Edit size={16} /> ແກ້ໄຂ (Edit)
                                    </button>
                                    <button 
                                        onClick={() => { handleDelete(job.id); setActiveMenuId(null); }}
                                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                        <Trash2 size={16} /> ລຶບ (Delete)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-4">
                        <Building size={14} /> <span>{job.department}</span>
                        <span className="text-slate-300">•</span>
                        <MapPin size={14} /> <span>Vientiane</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-3 mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg min-h-[80px]">
                        {job.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {job.requirements.slice(0, 3).map((req, i) => (
                            <span key={i} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">{req}</span>
                        ))}
                        {job.requirements.length > 3 && <span className="text-xs text-slate-400 px-1 py-1">+{job.requirements.length - 3}</span>}
                    </div>
                </div>
            ))}
          </div>
      )}

      {/* Create/Edit Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-scale-in">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {editingJob ? "ແກ້ໄຂປະກາດ (Edit Job)" : "ສ້າງປະກາດງານໃໝ່ (New Job)"}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">ຫົວຂໍ້ຕຳແໜ່ງ (Job Title)</label>
                        <input 
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                            value={formData.title}
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">ພະແນກ (Department)</label>
                        <input 
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                            value={formData.department}
                            onChange={e => setFormData({...formData, department: e.target.value})}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">ລາຍລະອຽດວຽກ (Job Description)</label>
                        <textarea 
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 h-24" 
                            value={formData.description}
                            onChange={e => setFormData({...formData, description: e.target.value})}
                            required
                            placeholder="ໃຊ້ສຳລັບ AI Matching..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">ເງື່ອນໄຂຜູ້ສະໝັກ (Requirements) - ຄັ່ນດ້ວຍຈຸດ (,)</label>
                        <input 
                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500" 
                            value={formData.requirements}
                            onChange={e => setFormData({...formData, requirements: e.target.value})}
                            placeholder="React, English, Teamwork..."
                            required
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 mt-2">
                        {editingJob ? "ບັນທຶກການແກ້ໄຂ (Update Job)" : "ຢືນຢັນການສ້າງ (Create Job)"}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default JobsView;
