
import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, ArrowRight, Sparkles, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { loginUser } from '../services/mockBackend';

interface AuthProps {
  onLoginSuccess: (role: 'ADMIN' | 'USER') => void;
}

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານ (Username & Password required)');
      return;
    }

    setLoading(true);
    try {
        // Now returns { role: 'ADMIN' | 'USER', ... }
        const userData = await loginUser(username, password);
        
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('smart_hr_session', 'true');
        storage.setItem('smart_hr_role', userData.role);

        onLoginSuccess(userData.role as 'ADMIN' | 'USER');
    } catch (err: any) {
        setError(err.message || "ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans">
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600 to-slate-50 opacity-10"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

        <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 animate-scale-in">
            <div className="bg-white p-8 pt-10 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-6 shadow-lg shadow-blue-500/30 transform hover:scale-105 transition-transform duration-300">
                   <Sparkles size={40} className="text-white" strokeWidth={2} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Smart <span className="text-blue-600">HR</span></h1>
                <p className="text-slate-500 font-medium">Intelligent Recruitment Platform</p>
            </div>

            <div className="p-8 pt-0">
                <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                    
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">ຊື່ຜູ້ໃຊ້ (Username)</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type="text" 
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium focus:bg-white"
                                placeholder="Enter Username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">ລະຫັດຜ່ານ (Password)</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input 
                                type={showPassword ? "text" : "password"}
                                className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium focus:bg-white"
                                placeholder="Enter Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <button 
                            type="button"
                            onClick={() => setRememberMe(!rememberMe)}
                            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            {rememberMe ? (
                                <CheckSquare className="text-blue-600 w-5 h-5" />
                            ) : (
                                <Square className="text-slate-300 w-5 h-5" />
                            )}
                            <span className="font-semibold">ຈົດຈໍາຂ້ອຍໄວ້ໃນລະບົບ (Remember Me)</span>
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 animate-shake">
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:shadow-none hover:-translate-y-0.5 mt-2"
                    >
                        {loading ? 'Checking...' : 'ເຂົ້າສູ່ລະບົບ (Login)'} 
                        {!loading && <ArrowRight size={18} />}
                    </button>
                </form>

                <div className="text-center pt-8 mt-4 border-t border-slate-100">
                     <p className="text-xs text-slate-400">
                        ລະບົບສະຫງວນສິດໃຫ້ສະເພາະເຈົ້າໜ້າທີ່ ແລະ ພະນັກງານເທົ່ານັ້ນ. <br/>
                        (Restricted Access: Authorized Personnel Only)
                     </p>
                </div>
            </div>
            
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                <p className="text-xs text-slate-400 font-medium">Version 2.3.0 • Smart HR Platform</p>
            </div>
        </div>
    </div>
  );
};

export default Auth;
