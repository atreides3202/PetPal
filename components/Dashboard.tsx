import React, { useState } from 'react';
import { PetProfile, Expense, HealthLog } from '../types';
import { GeminiService } from '../services/geminiService';
import { Calendar, AlertCircle, DollarSign, Sparkles, ChevronDown, Plus, Clock, Repeat, ArrowRight } from 'lucide-react';

interface DashboardProps {
  currentProfile: PetProfile;
  allProfiles: PetProfile[];
  expenses: Expense[];
  healthLogs: HealthLog[];
  onSwitchPet: (id: string) => void;
  onNavigateSettings: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  currentProfile, 
  allProfiles, 
  expenses, 
  healthLogs, 
  onSwitchPet,
  onNavigateSettings
}) => {
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPetMenu, setShowPetMenu] = useState(false);

  // Calculate Age
  const calculateAge = (birthday: string) => {
    if (!birthday) return '年齡未知';
    const birthDate = new Date(birthday);
    const now = new Date();
    let years = now.getFullYear() - birthDate.getFullYear();
    let months = now.getMonth() - birthDate.getMonth();
    if (months < 0) {
        years--;
        months += 12;
    }
    if (years === 0) return `${months} 個月大`;
    return `${years} 歲 ${months} 個月`;
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyTotal = expenses
    .filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, e) => sum + e.amount, 0);

  const now = new Date();
  const upcomingReminders = healthLogs
    .filter(log => log.nextDueDate && new Date(log.nextDueDate) >= new Date(now.setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime());
  
  const nextReminder = upcomingReminders.length > 0 ? upcomingReminders[0] : null;

  const handleGetAdvice = async () => {
    setLoading(true);
    const advice = await GeminiService.analyzeHealth(healthLogs, currentProfile);
    setAiAdvice(advice || "無法取得建議");
    setLoading(false);
  };

  const getRecurrenceLabel = (r?: string) => {
      if (!r || r === 'None') return null;
      if (r === 'Daily') return '每天';
      if (r === 'Weekly') return '每週';
      if (r === 'Monthly') return '每月';
      return r;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Pet Card (Gradient) */}
      <div className="relative z-20">
        <div 
            onClick={() => setShowPetMenu(!showPetMenu)}
            className="bg-gradient-to-br from-[#5C66BD] to-[#77A9E8] p-6 rounded-3xl shadow-[0_10px_40px_-10px_rgba(92,102,189,0.4)] cursor-pointer transition-all active:scale-[0.99] group text-white relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center space-x-5">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                        {currentProfile.photo ? (
                            <img src={currentProfile.photo} alt={currentProfile.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl">{currentProfile.type === 'Cat' ? '🐱' : '🐶'}</span>
                        )}
                    </div>
                    
                    <div>
                        <div className="flex items-center space-x-2">
                            <h1 className="text-3xl font-bold tracking-tight">{currentProfile.name}</h1>
                            <ChevronDown className={`w-5 h-5 text-white/70 transition-transform ${showPetMenu ? 'rotate-180' : ''}`} />
                        </div>
                        <p className="text-indigo-100 font-medium text-sm mt-1">
                            {currentProfile.type === 'Dog' ? '狗狗' : currentProfile.type === 'Cat' ? '貓咪' : '寵物'} 
                            • {calculateAge(currentProfile.birthday)}
                        </p>
                    </div>
                </div>
                
                <div className="bg-white/20 p-2.5 rounded-full border border-white/20 backdrop-blur-md">
                   <ArrowRight className="w-5 h-5 text-white" />
                </div>
            </div>
            
            {/* Info Badges */}
            <div className="flex gap-2 mt-6 relative z-10">
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                    {currentProfile.weight} kg
                </div>
                {currentProfile.bio && (
                     <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10 max-w-[150px] truncate">
                        {currentProfile.bio}
                    </div>
                )}
            </div>
        </div>

        {/* Dropdown Menu */}
        {showPetMenu && (
            <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-3 animate-fade-in-down z-30 ring-1 ring-slate-100 dark:ring-slate-700">
                {allProfiles.map(pet => (
                    <button
                        key={pet.id}
                        onClick={() => {
                            onSwitchPet(pet.id);
                            setShowPetMenu(false);
                        }}
                        className={`w-full flex items-center p-3 rounded-2xl mb-1 transition-colors ${
                            currentProfile.id === pet.id 
                            ? 'bg-indigo-50 dark:bg-slate-700/50 text-indigo-600 dark:text-indigo-300' 
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                        }`}
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 mr-4 overflow-hidden flex items-center justify-center border border-slate-200 dark:border-slate-600">
                            {pet.photo ? <img src={pet.photo} className="w-full h-full object-cover" /> : <span>🐾</span>}
                        </div>
                        <span className="font-bold flex-1 text-left text-base">{pet.name}</span>
                        {currentProfile.id === pet.id && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>}
                    </button>
                ))}
                <div className="border-t border-slate-100 dark:border-slate-700 mt-2 pt-2">
                    <button 
                        onClick={onNavigateSettings}
                        className="w-full flex items-center p-3 text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-colors font-medium"
                    >
                        <div className="w-10 h-10 flex items-center justify-center mr-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-full">
                            <Plus className="w-5 h-5" />
                        </div>
                        新增寵物
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700/50 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 dark:bg-green-900/10 rounded-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2 z-10">
            <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full text-green-600 dark:text-green-400">
                <DollarSign className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider">本月花費</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight z-10">${monthlyTotal.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700/50 flex flex-col justify-between h-32 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-50 dark:bg-orange-900/10 rounded-full -mr-8 -mt-8 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 mb-2 z-10">
             <div className="bg-orange-100 dark:bg-orange-900/30 p-1.5 rounded-full text-orange-600 dark:text-orange-400">
                <Calendar className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs uppercase tracking-wider">下次提醒</span>
          </div>
          {nextReminder ? (
            <div className="z-10">
              <p className="text-lg font-bold text-slate-800 dark:text-white truncate">{nextReminder.title}</p>
              <div className="flex items-center text-xs text-slate-400 dark:text-slate-500 mt-1">
                 <span className="mr-2 font-medium text-slate-500 dark:text-slate-400">{new Date(nextReminder.nextDueDate!).toLocaleDateString()}</span>
                 {nextReminder.isAllDay ? '全天' : nextReminder.reminderTime}
              </div>
            </div>
          ) : (
            <p className="text-slate-400 dark:text-slate-600 text-sm z-10">暫無提醒</p>
          )}
        </div>
      </div>

      {/* AI Health Insight */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-10 -mt-10 blur-3xl opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center">
              <Sparkles className="w-5 h-5 text-indigo-500 mr-2 fill-indigo-100" />
              AI 健康助理
            </h3>
            <button 
              onClick={handleGetAdvice}
              disabled={loading}
              className="text-xs bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-slate-600 text-indigo-600 dark:text-indigo-300 px-4 py-2 rounded-full font-bold transition-all"
            >
              {loading ? '分析中...' : '健康分析'}
            </button>
          </div>
          
          <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl text-sm text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-700/50">
            {aiAdvice ? (
              aiAdvice
            ) : (
              <p className="text-slate-400 dark:text-slate-500 italic text-center py-2">
                {currentProfile.bio 
                  ? `AI 已經知道 ${currentProfile.name} 是「${currentProfile.bio}」。點擊分析獲得建議。` 
                  : `點擊按鈕，讓 AI 根據 ${currentProfile.name} 的紀錄提供建議。`}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      {upcomingReminders.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">即將到來</h3>
          {upcomingReminders.slice(0, 3).map(rem => (
            <div key={rem.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl flex items-center space-x-4 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700/50 group hover:scale-[1.01] transition-transform">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <p className="font-bold text-slate-800 dark:text-white truncate text-base">{rem.title}</p>
                    {rem.recurrence && rem.recurrence !== 'None' && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full flex items-center shrink-0">
                            <Repeat className="w-3 h-3 mr-1" />
                            {getRecurrenceLabel(rem.recurrence)}
                        </span>
                    )}
                </div>
                <div className="flex items-center mt-1 space-x-3 text-sm">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {new Date(rem.nextDueDate!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <span className="flex items-center text-xs text-slate-400 dark:text-slate-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {rem.isAllDay ? '全天' : rem.reminderTime}
                    </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;