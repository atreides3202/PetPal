import React, { useState } from 'react';
import { HealthLog, PetProfile } from '../types';
import { Plus, Camera, Trash2, X, Edit2, Activity, ChefHat } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GeminiService } from '../services/geminiService';

interface SettingsProps {
  profiles: PetProfile[];
  onUpdateProfiles: (profiles: PetProfile[]) => void;
  healthLogs: HealthLog[];
  isDarkMode: boolean;
  onAddLog: (log: HealthLog) => void;
}

const Settings: React.FC<SettingsProps> = ({ profiles, onUpdateProfiles, healthLogs, isDarkMode, onAddLog }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'basic' | 'growth'>('basic');
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState('Dog');
  const [birthday, setBirthday] = useState('');
  const [weight, setWeight] = useState(0);
  const [bio, setBio] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  
  const [nutritionAdvice, setNutritionAdvice] = useState<string | null>(null);
  const [loadingNutrition, setLoadingNutrition] = useState(false);

  const resetForm = () => {
    setName('');
    setType('Dog');
    setBirthday('');
    setWeight(0);
    setBio('');
    setPhoto(undefined);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (p: PetProfile) => {
    setEditingId(p.id);
    setName(p.name);
    setType(p.type);
    setBirthday(p.birthday);
    setWeight(p.weight);
    setBio(p.bio || '');
    setPhoto(p.photo);
    setShowForm(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const newProfile: PetProfile = {
      id: editingId || Date.now().toString(),
      name,
      type,
      birthday,
      weight,
      bio,
      photo
    };

    if (editingId) {
       // Check if weight changed for existing profile
       const oldProfile = profiles.find(p => p.id === editingId);
       if (oldProfile && oldProfile.weight !== weight) {
           onAddLog({
               id: Date.now().toString(),
               petId: editingId,
               type: 'Weight',
               title: '體重記錄',
               description: weight.toString(),
               date: new Date().toISOString().split('T')[0]
           });
       }
      onUpdateProfiles(profiles.map(p => p.id === editingId ? newProfile : p));
    } else {
       // New profile
      onUpdateProfiles([...profiles, newProfile]);
      if (weight > 0) {
           onAddLog({
               id: Date.now().toString(),
               petId: newProfile.id,
               type: 'Weight',
               title: '體重記錄',
               description: weight.toString(),
               date: new Date().toISOString().split('T')[0]
           });
      }
    }
    resetForm();
  };

  const handleDeleteProfile = (id: string) => {
    if (confirm('確定要刪除這個寵物資料嗎？')) {
      onUpdateProfiles(profiles.filter(p => p.id !== id));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetNutrition = async () => {
    setLoadingNutrition(true);
    const targetProfile = profiles[0];
    if (targetProfile) {
        const advice = await GeminiService.analyzeNutrition(targetProfile);
        setNutritionAdvice(advice);
    }
    setLoadingNutrition(false);
  };

  const weightData = healthLogs
    .filter(h => h.type === 'Weight')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(h => ({
      date: h.date,
      weight: parseFloat(h.description),
    }));

  return (
    <div className="pb-24 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">設定 & 管理</h2>
      </div>

      {/* Tabs */}
      <div className="flex p-1.5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-50 dark:border-slate-700/50 shadow-sm">
        <button 
          onClick={() => setActiveTab('basic')}
          className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all duration-300 ${activeTab === 'basic' ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          基本設定
        </button>
        <button 
          onClick={() => setActiveTab('growth')}
          className={`flex-1 py-3 text-sm font-bold rounded-2xl transition-all duration-300 ${activeTab === 'growth' ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
        >
          成長與分析
        </button>
      </div>

      {activeTab === 'basic' ? (
        <div className="space-y-6 animate-fade-in">
          <div className="space-y-4">
             <div className="flex justify-between items-center px-1">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center">
                    寵物資料 ({profiles.length})
                </h3>
                {!showForm && (
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-full font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors flex items-center">
                        <Plus className="w-3 h-3 mr-1" /> 新增
                    </button>
                )}
             </div>

             {showForm && (
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_20px_50px_-10px_rgba(0,0,0,0.1)] border border-slate-50 dark:border-slate-700 animate-fade-in-down">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-xl text-slate-800 dark:text-white">{editingId ? '編輯寵物' : '新增寵物'}</h4>
                        <button onClick={resetForm} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
                    </div>
                    <form onSubmit={handleSaveProfile} className="space-y-5">
                        <div className="flex justify-center mb-6">
                            <label className="relative w-28 h-28 rounded-full bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer overflow-hidden group hover:border-indigo-400 transition-colors">
                                {photo ? (
                                    <img src={photo} className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="w-8 h-8 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                )}
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-bold">更換照片</span>
                                </div>
                            </label>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">寵物名稱</label>
                          <input value={name} onChange={e => setName(e.target.value)} placeholder="名字" required className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border-none text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                             <div>
                               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">寵物屬性</label>
                               <div className="relative">
                                    <select value={type} onChange={e => setType(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border-none text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none">
                                        <option value="Dog">狗狗</option>
                                        <option value="Cat">貓咪</option>
                                        <option value="Other">其他</option>
                                    </select>
                               </div>
                             </div>
                             <div>
                               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">體重 (kg)</label>
                               <input type="number" step="0.1" value={weight} onChange={e => setWeight(parseFloat(e.target.value))} placeholder="0.0" className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border-none text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                             </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">出生年月日</label>
                          <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border-none text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">個性描述 (AI 參考用)</label>
                          <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="例如：貪吃、活潑、怕生..." className="w-full p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border-none text-slate-800 dark:text-white outline-none h-24 resize-none focus:ring-2 focus:ring-indigo-500/20" />
                        </div>

                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none active:scale-[0.98] transition-all">
                            {editingId ? '儲存變更' : '新增寵物'}
                        </button>
                    </form>
                 </div>
             )}

             <div className="space-y-4">
                 {profiles.map(p => (
                     <div key={p.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700/50 hover:border-indigo-100 dark:hover:border-slate-600 transition-all">
                         <div className="flex items-center space-x-4">
                             <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-700/50 overflow-hidden border border-slate-100 dark:border-slate-700">
                                 {p.photo ? <img src={p.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">🐶</div>}
                             </div>
                             <div>
                                 <p className="font-bold text-lg text-slate-800 dark:text-white">{p.name}</p>
                                 <div className="flex items-center space-x-2 mt-1">
                                     <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">{p.type === 'Dog' ? '狗狗' : p.type === 'Cat' ? '貓咪' : p.type}</span>
                                     <span className="text-xs text-slate-400">{p.weight}kg</span>
                                 </div>
                             </div>
                         </div>
                         <div className="flex gap-2">
                             <button onClick={() => handleEditClick(p)} className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                             {profiles.length > 1 && (
                                <button onClick={() => handleDeleteProfile(p.id)} className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-4 h-4" /></button>
                             )}
                         </div>
                     </div>
                 ))}
             </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
           {/* Chart */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700/50">
              <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center">
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl mr-3">
                    <Activity className="w-5 h-5 text-green-500" />
                  </div>
                  體重變化趨勢
              </h3>
              {weightData.length > 0 ? (
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={weightData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#334155" : "#f1f5f9"} />
                              <XAxis 
                                dataKey="date" 
                                stroke={isDarkMode ? "#64748b" : "#94a3b8"} 
                                fontSize={11} 
                                tickFormatter={(v) => v.slice(5)} 
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                              />
                              <YAxis 
                                stroke={isDarkMode ? "#64748b" : "#94a3b8"} 
                                fontSize={11} 
                                domain={['dataMin - 1', 'dataMax + 1']} 
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                                    border: 'none', 
                                    borderRadius: '16px', 
                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                                    color: isDarkMode ? '#fff' : '#000' 
                                }}
                                itemStyle={{ color: isDarkMode ? '#e2e8f0' : '#475569' }}
                                labelStyle={{ color: isDarkMode ? '#94a3b8' : '#94a3b8', marginBottom: '8px', fontSize: '12px' }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="weight" 
                                stroke="#10b981" 
                                strokeWidth={3} 
                                dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: isDarkMode ? '#1e293b' : '#fff'}} 
                                activeDot={{r: 6}}
                              />
                          </LineChart>
                      </ResponsiveContainer>
                  </div>
              ) : (
                  <div className="text-center py-16 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-700 rounded-2xl">
                      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                          <Activity className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                      </div>
                      <p className="text-slate-400 text-sm font-medium">尚無體重紀錄</p>
                  </div>
              )}
           </div>

           {/* AI Nutrition */}
           <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl border border-orange-100 dark:border-slate-700/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200/40 dark:bg-orange-900/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center text-lg">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl mr-3">
                                    <ChefHat className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                AI 營養師
                            </h3>
                            <p className="text-xs text-slate-500 mt-2 pl-12 max-w-[200px]">根據目前體重、年齡與活動量計算每日熱量需求</p>
                        </div>
                        <button 
                            onClick={handleGetNutrition}
                            disabled={loadingNutrition}
                            className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-orange-200 dark:shadow-none active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loadingNutrition ? '計算中...' : '開始分析'}
                        </button>
                    </div>

                    {nutritionAdvice && (
                        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl text-sm text-slate-700 dark:text-slate-300 leading-relaxed border border-orange-100/50 dark:border-slate-800 whitespace-pre-line animate-fade-in shadow-sm">
                            {nutritionAdvice}
                        </div>
                    )}
                </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Settings;