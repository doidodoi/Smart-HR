
import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, CheckCircle, MapPin, Loader2, AlertCircle, Send, X, ChevronDown, Paperclip, ArrowLeft, User, BookOpen, Clock, Plus, Trash2, Building, Sparkles } from 'lucide-react';
import { Job } from '../types';
import { getPublicJobs, submitPublicApplication } from '../services/mockBackend';
import { Language } from '../utils/translations';

interface Props {
    onBack?: () => void;
}

// Complex Data Types for the Form
interface EducationItem {
    id: number;
    level: string;
    institution: string;
    year: string;
    major: string;
}

interface EmploymentItem {
    id: number;
    company: string;
    position: string;
    period: string;
    salary: string;
}

// Local Translations for this specific form
const FORM_TEXT = {
    lo: {
        title: "ແບບຟອມສະໝັກວຽກ",
        subtitle: "Senglao Group Recruitment",
        step1: "ຂໍ້ມູນທົ່ວໄປ (General)",
        step2: "ຂໍ້ມູນສ່ວນຕົວ (Personal)",
        step3: "ປະຫວັດ (History)",
        step4: "ທັກສະ & ເອກະສານ (Skills & CV)",

        label_job: "ຕຳແໜ່ງທີ່ສະໝັກ *",
        label_firstname: "ຊື່ *",
        label_lastname: "ນາມສະກຸນ",
        label_phone: "ເບີໂທ *",
        label_email: "ອີເມວ *",
        label_salary: "ເງິນເດືອນທີ່ຕ້ອງການ",
        label_address: "ທີ່ຢູ່ປັດຈຸບັນ",
        ph_village: "ບ້ານ",
        ph_district: "ເມືອງ",
        ph_province: "ແຂວງ",

        label_dob: "ວັນເດືອນປີເກີດ",
        label_age: "ອາຍຸ (ປີ)",
        label_nationality: "ສັນຊາດ",
        label_idcard: "ເລກບັດປະຈຳຕົວ / Passport",
        label_family: "ສະຖານະຄອບຄົວ",
        opt_single: "ໂສດ",
        opt_married: "ແຕ່ງງານ",
        opt_divorced: "ຢ່າຮ້າງ",
        label_gender: "ເພດ",
        opt_male: "ຊາຍ",
        opt_female: "ຍິງ",

        title_edu: "ປະຫວັດການສຶກສາ",
        btn_add: "ເພີ່ມແຖວ",
        th_level: "ລະດັບ (ຈົບຊັ້ນ)",
        th_school: "ຊື່ໂຮງຮຽນ/ສະຖາບັນ",
        th_year: "ປີທີ່ຈົບ",
        th_major: "ສາຂາວິຊາ",

        title_work: "ປະຫວັດການເຮັດວຽກ",
        th_company: "ຊື່ບໍລິສັດ",
        th_position: "ຕຳແໜ່ງ",
        th_period: "ໄລຍະເວລາ",
        th_salary: "ເງິນເດືອນ",

        label_skills: "ຄວາມສາມາດພິເສດ (ພາສາ, ຄອມພິວເຕີ, ອື່ນໆ)",
        ph_skills: "ພາສາອັງກິດ (ດີ), Microsoft Office, ຂັບລົດໄດ້...",
        label_attach: "ແນບໄຟລ໌ CV / Resume (PDF) *",
        click_upload: "ຄິກເພື່ອແນບໄຟລ໌",
        
        btn_submit: "ສົ່ງໃບສະໝັກ",
        submitting: "ກຳລັງສົ່ງຂໍ້ມູນ... (ກະລຸນາລໍຖ້າ)",
        success_title: "ສົ່ງໃບສະໝັກສຳເລັດ!",
        success_desc: "ເຈົ້າໄດ້ຝາກ CV ໄວ້ສໍາເລັດແລ້ວ! ທາງບໍລິສັດຈະຕິດຕໍ່ຫາທ່ານໄວໆນີ້",
        
        err_cv: "ກະລຸນາອັບໂຫຼດ CV (ໃນພາກສ່ວນທີ 4)",
        err_job: "ກະລຸນາເລືອກຕຳແໜ່ງງານ",
        err_req: "ກະລຸນາປ້ອນ ຊື່ ແລະ ເບີໂທ"
    },
    en: {
        title: "Application Form",
        subtitle: "Senglao Group Recruitment",
        step1: "General Info",
        step2: "Personal Details",
        step3: "History",
        step4: "Skills & Attachments",

        label_job: "Applying For *",
        label_firstname: "First Name *",
        label_lastname: "Last Name",
        label_phone: "Phone Number *",
        label_email: "Email *",
        label_salary: "Expected Salary",
        label_address: "Current Address",
        ph_village: "Village",
        ph_district: "District",
        ph_province: "Province",

        label_dob: "Date of Birth",
        label_age: "Age (Years)",
        label_nationality: "Nationality",
        label_idcard: "ID Card / Passport No.",
        label_family: "Family Status",
        opt_single: "Single",
        opt_married: "Married",
        opt_divorced: "Divorced",
        label_gender: "Gender",
        opt_male: "Male",
        opt_female: "Female",

        title_edu: "Education History",
        btn_add: "Add Row",
        th_level: "Level",
        th_school: "Institute",
        th_year: "Year",
        th_major: "Major",

        title_work: "Employment History",
        th_company: "Company",
        th_position: "Position",
        th_period: "Period",
        th_salary: "Salary",

        label_skills: "Special Skills (Language, Computer, etc.)",
        ph_skills: "English (Fluent), Microsoft Office, Driving License...",
        label_attach: "Attach CV / Resume (PDF) *",
        click_upload: "Click to upload",

        btn_submit: "Submit Application",
        submitting: "Submitting... (Please Wait)",
        success_title: "Application Sent!",
        success_desc: "Your CV has been submitted successfully! The company will contact you soon.",

        err_cv: "Please upload your CV (Section 4)",
        err_job: "Please select a job position",
        err_req: "Name and Phone are required"
    },
    th: {
        title: "แบบฟอร์มสมัครงาน",
        subtitle: "Senglao Group Recruitment",
        step1: "ข้อมูลทั่วไป",
        step2: "ข้อมูลส่วนตัว",
        step3: "ประวัติ",
        step4: "ทักษะ & เอกสาร",

        label_job: "ตำแหน่งที่สมัคร *",
        label_firstname: "ชื่อ *",
        label_lastname: "นามสกุล",
        label_phone: "เบอร์โทร *",
        label_email: "อีเมล *",
        label_salary: "เงินเดือนที่ต้องการ",
        label_address: "ที่อยู่ปัจจุบัน",
        ph_village: "หมู่บ้าน",
        ph_district: "เมือง/เขต",
        ph_province: "แขวง/จังหวัด",

        label_dob: "วันเดือนปีเกิด",
        label_age: "อายุ (ปี)",
        label_nationality: "สัญชาติ",
        label_idcard: "เลขบัตรประชาชน / Passport",
        label_family: "สถานภาพ",
        opt_single: "โสด",
        opt_married: "แต่งงาน",
        opt_divorced: "หย่าร้าง",
        label_gender: "เพศ",
        opt_male: "ชาย",
        opt_female: "หญิง",

        title_edu: "ประวัติการศึกษา",
        btn_add: "เพิ่มแถว",
        th_level: "ระดับ",
        th_school: "สถานศึกษา",
        th_year: "ปีที่จบ",
        th_major: "สาขาวิชา",

        title_work: "ประวัติการทำงาน",
        th_company: "บริษัท",
        th_position: "ตำแหน่ง",
        th_period: "ระยะเวลา",
        th_salary: "เงินเดือน",

        label_skills: "ความสามารถพิเศษ",
        ph_skills: "ภาษาอังกฤษ, คอมพิวเตอร์...",
        label_attach: "แนบไฟล์ CV / Resume (PDF) *",
        click_upload: "คลิกเพื่อแนบไฟล์",

        btn_submit: "ส่งใบสมัคร",
        submitting: "กำลังส่งข้อมูล... (กรุณารอสักครู่)",
        success_title: "ส่งใบสมัครเรียบร้อย!",
        success_desc: "คุณได้ฝาก CV ไว้สำเร็จแล้ว! ทางบริษัทจะติดต่อกลับหาคุณในเร็วๆ นี้",

        err_cv: "กรุณาอัปโหลด CV (ส่วนที่ 4)",
        err_job: "กรุณาเลือกตำแหน่งงาน",
        err_req: "กรุณากรอกชื่อและเบอร์โทร"
    }
};

const PublicApplyView: React.FC<Props> = ({ onBack }) => {
  const [lang, setLang] = useState<Language>('lo'); // Default to Lao
  const t = FORM_TEXT[lang];

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [jobId, setJobId] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  
  // Step 1: General & Address
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [addrVillage, setAddrVillage] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrProvince, setAddrProvince] = useState('');

  // Step 2: Personal Details
  const [dob, setDob] = useState('');
  const [age, setAge] = useState<number>(0);
  const [nationality, setNationality] = useState('Lao');
  const [gender, setGender] = useState('Male');
  const [familyStatus, setFamilyStatus] = useState('Single');
  const [idCard, setIdCard] = useState('');

  // Step 3: History Arrays
  const [educationList, setEducationList] = useState<EducationItem[]>([
      { id: 1, level: '', institution: '', year: '', major: '' }
  ]);
  const [employmentList, setEmploymentList] = useState<EmploymentItem[]>([
      { id: 1, company: '', position: '', period: '', salary: '' }
  ]);

  // Step 4: Skills
  const [skills, setSkills] = useState(''); // Comma separated

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await getPublicJobs();
      setJobs(data);
    } catch (e) {
      console.error("Failed to load jobs", e);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setCvFile(e.target.files[0]);
      }
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
    if(val) {
        const birth = new Date(val);
        const now = new Date();
        let diff = now.getFullYear() - birth.getFullYear();
        // Adjust if birthday hasn't happened yet this year
        if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
            diff--;
        }
        setAge(diff > 0 ? diff : 0);
    }
  };

  const addEducationRow = () => {
      setEducationList([...educationList, { id: Date.now(), level: '', institution: '', year: '', major: '' }]);
  };
  const removeEducationRow = (id: number) => {
      setEducationList(educationList.filter(i => i.id !== id));
  };
  const updateEducation = (id: number, field: keyof EducationItem, value: string) => {
      setEducationList(educationList.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const addEmploymentRow = () => {
      setEmploymentList([...employmentList, { id: Date.now(), company: '', position: '', period: '', salary: '' }]);
  };
  const removeEmploymentRow = (id: number) => {
      setEmploymentList(employmentList.filter(i => i.id !== id));
  };
  const updateEmployment = (id: number, field: keyof EmploymentItem, value: string) => {
      setEmploymentList(employmentList.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSubmit = async () => {
    if (!cvFile) { setError(t.err_cv); window.scrollTo(0, document.body.scrollHeight); return; }
    if (!jobId) { setError(t.err_job); window.scrollTo(0, 0); return; }
    if (!firstName || !phone) { setError(t.err_req); window.scrollTo(0, 0); return; }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Format the complex data into strings for the existing backend
      const fullAddress = `B. ${addrVillage}, M. ${addrDistrict}, P. ${addrProvince}`;
      
      // Use double newlines to ensure clean separation when displaying later
      const educationString = educationList.map(e => 
        `• ${e.year}: ${e.level} in ${e.major} at ${e.institution}`
      ).join('\n\n'); 

      const workHistoryString = employmentList.map(e => 
        `• ${e.period}: ${e.position} at ${e.company} (Salary: ${e.salary})`
      ).join('\n\n'); 

      // Append extra details to AI Summary to ensure they are saved in database
      const extraDetails = `Manual Entry Data:\nDOB: ${dob}\nNationality: ${nationality}\nFamily: ${familyStatus}\nID Card: ${idCard}`;

      const submissionData = {
          firstName,
          lastName,
          email,
          phone,
          address: fullAddress,
          village: addrVillage,
          district: addrDistrict,
          province: addrProvince,
          expectedSalary: expectedSalary,
          jobId,
          // Mapping fields to backend expectation
          skills: skills.split(',').map(s => s.trim()),
          education: educationString,
          work_history: workHistoryString,
          experience_years: employmentList.length, // rough estimate
          age,
          gender,
          ai_summary: extraDetails, // This will trigger the AI to re-analyze later
          match_score: 0 // No score since AI is off
      };

      await submitPublicApplication(submissionData, cvFile);
      setSuccess(true);
      window.scrollTo(0,0);
    } catch (err: any) {
      setError(err.message || "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
      return (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center p-6 font-sans animate-fade-in">
            <div className="text-center max-w-lg">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce-short shadow-xl shadow-green-100">
                    <CheckCircle size={48} className="text-green-600" strokeWidth={3} />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 tracking-tight">{t.success_title}</h2>
                <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12">
                    {t.success_desc}
                </p>
                <div className="flex items-center justify-center gap-2 opacity-50">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse delay-200"></div>
                </div>
                <div className="mt-20">
                     <button 
                        onClick={() => window.location.reload()} 
                        className="text-sm font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
                     >
                        Submit New Application
                     </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
           <div className="flex items-center gap-4">
               {/* Senglao Group Logo Placeholder */}
               <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-xs leading-none text-center shadow-lg shadow-red-600/20">
                   SL<br/>GRP
               </div>
               <div>
                   <h1 className="text-xl font-black text-slate-900 leading-none tracking-tight">{t.title}</h1>
                   <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">{t.subtitle}</p>
               </div>
           </div>
           
           <div className="flex items-center gap-4">
               {/* Language Switcher */}
               <div className="hidden md:flex bg-slate-100 rounded-lg p-1">
                   {(['lo', 'en', 'th'] as Language[]).map((l) => (
                       <button
                           key={l}
                           onClick={() => setLang(l)}
                           className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${lang === l ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                       >
                           {l === 'lo' ? 'ລາວ' : l === 'en' ? 'ENG' : 'ไทย'}
                       </button>
                   ))}
               </div>
               
               {onBack && (
                   <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-2 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors">
                       <ArrowLeft size={16}/> <span className="hidden sm:inline">Back (Admin)</span>
                   </button>
               )}
           </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <input type="file" ref={fileInputRef} className="hidden" accept="application/pdf,image/*" onChange={handleFileUpload} />

        {/* SINGLE PAGE SCROLLING FORM */}
        <div className="space-y-12 animate-fade-in">
            
            {/* SECTION 1: GENERAL INFO */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 md:p-10 relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-black text-lg">1</div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t.step1}</h2>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2 col-span-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.label_job}</label>
                            <div className="relative">
                                <select 
                                    value={jobId} onChange={e => setJobId(e.target.value)}
                                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-red-500 appearance-none transition-all"
                                >
                                    <option value="">-- Select Position --</option>
                                    {jobs.map(j => <option key={j.id} value={j.id}>{j.title} ({j.department})</option>)}
                                </select>
                                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.label_firstname}</label>
                            <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="e.g. Somchai" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.label_lastname}</label>
                            <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="e.g. Phomvihane" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.label_phone}</label>
                            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="020 xxxx xxxx" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.label_salary}</label>
                            <input value={expectedSalary} onChange={e => setExpectedSalary(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="e.g. 5,000,000 LAK" />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                         <div className="flex items-center gap-2 mb-2">
                            <MapPin size={18} className="text-red-500"/>
                            <span className="font-bold text-slate-700">{t.label_address}</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <input value={addrVillage} onChange={e => setAddrVillage(e.target.value)} className="p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:border-red-500 outline-none" placeholder={t.ph_village} />
                             <input value={addrDistrict} onChange={e => setAddrDistrict(e.target.value)} className="p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:border-red-500 outline-none" placeholder={t.ph_district} />
                             <input value={addrProvince} onChange={e => setAddrProvince(e.target.value)} className="p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:border-red-500 outline-none" placeholder={t.ph_province} />
                         </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: PERSONAL */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 md:p-10 relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
                 <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-black text-lg">2</div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t.step2}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.label_dob}</label>
                        <input type="date" value={dob} onChange={handleDobChange} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-red-500 focus:bg-white transition-all" />
                    </div>
                    {/* ADDED AGE INPUT */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.label_age}</label>
                        <input type="number" value={age} onChange={e => setAge(parseInt(e.target.value) || 0)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="25" />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.label_nationality}</label>
                        <input value={nationality} onChange={e => setNationality(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-red-500 focus:bg-white transition-all" placeholder="Lao" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.label_idcard}</label>
                        <input value={idCard} onChange={e => setIdCard(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-red-500 focus:bg-white transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.label_family}</label>
                        <div className="relative">
                            <select value={familyStatus} onChange={e => setFamilyStatus(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-red-500 appearance-none">
                                <option value="Single">{t.opt_single}</option>
                                <option value="Married">{t.opt_married}</option>
                                <option value="Divorced">{t.opt_divorced}</option>
                            </select>
                             <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.label_email}</label>
                        <input value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-red-500 focus:bg-white transition-all" />
                    </div>
                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.label_gender}</label>
                        <div className="relative">
                            <select value={gender} onChange={e => setGender(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-red-500 appearance-none">
                                <option value="Male">{t.opt_male}</option>
                                <option value="Female">{t.opt_female}</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 3: HISTORY */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 md:p-10 relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
                 <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-black text-lg">3</div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t.step3}</h2>
                </div>

                <div className="space-y-12">
                     {/* Education Table */}
                     <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><BookOpen size={18} className="text-blue-500"/> {t.title_edu}</h3>
                            <button onClick={addEducationRow} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Plus size={14}/> {t.btn_add}</button>
                        </div>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                            <table className="w-full text-sm text-left min-w-[600px]">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="p-3 w-1/5">{t.th_level}</th>
                                        <th className="p-3 w-1/3">{t.th_school}</th>
                                        <th className="p-3 w-1/6">{t.th_year}</th>
                                        <th className="p-3 w-1/4">{t.th_major}</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {educationList.map(item => (
                                        <tr key={item.id} className="bg-white">
                                            <td className="p-2"><input value={item.level} onChange={e => updateEducation(item.id, 'level', e.target.value)} className="w-full p-2 bg-slate-50 rounded border-transparent focus:border-red-300 outline-none transition-colors" placeholder="Bachelor" /></td>
                                            <td className="p-2"><input value={item.institution} onChange={e => updateEducation(item.id, 'institution', e.target.value)} className="w-full p-2 bg-slate-50 rounded border-transparent focus:border-red-300 outline-none transition-colors" placeholder="NUOL" /></td>
                                            <td className="p-2"><input value={item.year} onChange={e => updateEducation(item.id, 'year', e.target.value)} className="w-full p-2 bg-slate-50 rounded border-transparent focus:border-red-300 outline-none transition-colors" placeholder="2015-2019" /></td>
                                            <td className="p-2"><input value={item.major} onChange={e => updateEducation(item.id, 'major', e.target.value)} className="w-full p-2 bg-slate-50 rounded border-transparent focus:border-red-300 outline-none transition-colors" placeholder="IT" /></td>
                                            <td className="p-2 text-center"><button onClick={() => removeEducationRow(item.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>

                     {/* Employment Table */}
                     <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock size={18} className="text-blue-500"/> {t.title_work}</h3>
                            <button onClick={addEmploymentRow} className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 transition-colors"><Plus size={14}/> {t.btn_add}</button>
                        </div>
                        <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                            <table className="w-full text-sm text-left min-w-[600px]">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="p-3 w-1/4">{t.th_company}</th>
                                        <th className="p-3 w-1/4">{t.th_position}</th>
                                        <th className="p-3 w-1/4">{t.th_period}</th>
                                        <th className="p-3 w-1/4">{t.th_salary}</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {employmentList.map(item => (
                                        <tr key={item.id} className="bg-white">
                                            <td className="p-2"><input value={item.company} onChange={e => updateEmployment(item.id, 'company', e.target.value)} className="w-full p-2 bg-slate-50 rounded border-transparent focus:border-red-300 outline-none transition-colors" placeholder="Company A" /></td>
                                            <td className="p-2"><input value={item.position} onChange={e => updateEmployment(item.id, 'position', e.target.value)} className="w-full p-2 bg-slate-50 rounded border-transparent focus:border-red-300 outline-none transition-colors" placeholder="Manager" /></td>
                                            <td className="p-2"><input value={item.period} onChange={e => updateEmployment(item.id, 'period', e.target.value)} className="w-full p-2 bg-slate-50 rounded border-transparent focus:border-red-300 outline-none transition-colors" placeholder="2020-2022" /></td>
                                            <td className="p-2"><input value={item.salary} onChange={e => updateEmployment(item.id, 'salary', e.target.value)} className="w-full p-2 bg-slate-50 rounded border-transparent focus:border-red-300 outline-none transition-colors" placeholder="5,000,000" /></td>
                                            <td className="p-2 text-center"><button onClick={() => removeEmploymentRow(item.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16}/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                </div>
            </div>

            {/* SECTION 4: FINISH */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 md:p-10 relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600"></div>
                 <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-black text-lg">4</div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t.step4}</h2>
                </div>

                <div className="space-y-8">
                     <div className="space-y-4">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block">{t.label_skills}</label>
                        <textarea 
                            value={skills} 
                            onChange={e => setSkills(e.target.value)}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-red-500 h-32 focus:bg-white transition-all" 
                            placeholder={t.ph_skills}
                        />
                    </div>

                    <div className="border-t border-slate-100 pt-8">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4 flex items-center gap-2"><Sparkles size={14} className="text-yellow-500"/> {t.label_attach}</label>
                        
                        {cvFile ? (
                            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl animate-fade-in">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm">
                                        <Paperclip className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-blue-900 text-sm">{cvFile.name}</p>
                                        <p className="text-blue-500 text-xs">{(cvFile.size/1024/1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button onClick={() => setCvFile(null)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                            </div>
                        ) : (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-red-500 hover:bg-red-50 transition-all bg-slate-50 group"
                            >
                                <UploadCloud size={32} className="text-slate-400 mb-2 group-hover:scale-110 transition-transform" />
                                <p className="font-bold text-slate-600">{t.click_upload}</p>
                                <p className="text-xs text-slate-400">PDF only (Max 5MB)</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ERROR & SUBMIT */}
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-sm font-bold border border-red-100 animate-shake">
                    <AlertCircle size={18} /> {error}
                </div>
            )}

            <button 
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full px-8 py-5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-black text-xl rounded-2xl transition-all shadow-xl shadow-red-600/30 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 disabled:shadow-none"
            >
                {submitting ? <Loader2 className="animate-spin" /> : <Send size={24} />}
                {submitting ? t.submitting : t.btn_submit}
            </button>

            <div className="text-center pt-8">
                <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">© 2024 SENGLAO GROUP RECRUITMENT SYSTEM</p>
            </div>
        </div>
      </main>
    </div>
  );
};

export default PublicApplyView;
