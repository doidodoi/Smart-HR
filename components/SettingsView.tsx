
import React from 'react';
import { Moon, Sun, Globe } from 'lucide-react';
import { Language, TRANSLATIONS } from '../utils/translations';

interface Props {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const SettingsView: React.FC<Props> = ({ isDarkMode, toggleDarkMode, language, setLanguage }) => {
  const t = TRANSLATIONS[language];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-gemini-text">{t.settings_title}</h2>
        <p className="text-slate-500 dark:text-gemini-muted">{t.settings_desc}</p>
      </div>

      <div className="bg-white dark:bg-gemini-surface rounded-2xl border border-slate-200 dark:border-gemini-border overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-gemini-border">
            <h3 className="font-bold text-lg text-slate-900 dark:text-gemini-text flex items-center gap-2">
                <Sun className="text-blue-500" size={20} /> {t.appearance}
            </h3>
        </div>
        <div className="p-6 flex items-center justify-between">
            <div>
                <p className="font-bold text-slate-800 dark:text-gemini-text">{t.dark_mode}</p>
            </div>
            <button 
                onClick={toggleDarkMode}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${isDarkMode ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
                <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gemini-surface rounded-2xl border border-slate-200 dark:border-gemini-border overflow-hidden">
         <div className="p-6 border-b border-slate-100 dark:border-gemini-border">
            <h3 className="font-bold text-lg text-slate-900 dark:text-gemini-text flex items-center gap-2">
                <Globe className="text-purple-500" size={20} /> {t.language}
            </h3>
        </div>
        <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={() => setLanguage('lo')}
                    className={`flex-1 py-3 border-2 font-bold rounded-xl transition-all ${language === 'lo' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-gemini-border text-slate-500 dark:text-gemini-muted'}`}
                >
                    {t.lang_lao}
                </button>
                <button 
                    onClick={() => setLanguage('en')}
                    className={`flex-1 py-3 border-2 font-bold rounded-xl transition-all ${language === 'en' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-gemini-border text-slate-500 dark:text-gemini-muted'}`}
                >
                    {t.lang_eng}
                </button>
                <button 
                    onClick={() => setLanguage('th')}
                    className={`flex-1 py-3 border-2 font-bold rounded-xl transition-all ${language === 'th' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-gemini-border text-slate-500 dark:text-gemini-muted'}`}
                >
                    {t.lang_thai}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
