import React, { useState } from 'react';
import { HealthLog, HealthLogType } from '../types';
import { Plus, Trash2, Calendar as CalendarIcon, Activity, Syringe, Bug, Scale, Clock, Repeat, List, ChevronLeft, ChevronRight, Scissors, PartyPopper, CheckCircle } from 'lucide-react';

interface HealthManagerProps {
  logs: HealthLog[];
  onAddLog: (log: HealthLog) => void;
  onDeleteLog: (id: string) => void;
}

const LOG_TYPES: { label: string; value: HealthLogType; icon: any; colorClass: string; bgClass: string }[] = [
  { label: '就診', value: 'Vet', icon: Activity, colorClass: 'text-blue-500', bgClass: 'bg-blue-50 dark:bg-blue-900/20' },
  { label: '驅蟲', value: 'ParasiteControl', icon: Bug, colorClass: 'text-red-500', bgClass: 'bg-red-50 dark:bg-red-900/20' },
  { label: '疫苗', value: 'Vaccine', icon: Syringe, colorClass: 'text-purple-500', bgClass: 'bg-purple-50 dark:bg-purple-900/20' },
  { label: '美容', value: 'Grooming', icon: Scissors, colorClass: 'text-pink-500', bgClass: 'bg-pink-50 dark:bg-pink-900/20' },
  { label: '出遊', value: 'Play', icon: PartyPopper, colorClass: 'text-yellow-500', bgClass: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { label: '體重', value: 'Weight', icon: Scale, colorClass: 'text-green-500', bgClass: 'bg-green-50 dark:bg-green-900/20' },
  { label: '症狀', value: 'Symptom', icon: Activity, colorClass: 'text-orange-500', bgClass: 'bg-orange-50 dark:bg-orange-900/20' },
  { label: '其他', value: 'Other', icon: CheckCircle, colorClass: 'text-slate-500', bgClass: 'bg-slate-50 dark:bg-slate-800' },
];

const RECURRENCE_OPTIONS = [
  { label: '不重複', value: 'None' },
  { label: '每天', value: 'Daily' },
  { label: '每週', value: 'Weekly' },
  { label: '每月', value: 'Monthly' },
];

const HealthManager: React.FC<HealthManagerProps> = ({ logs, onAddLog, onDeleteLog }) => {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [type, setType] = useState<HealthLogType>('Vet');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [hasReminder, setHasReminder] = useState(false);
  const [nextDueDate, setNextDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('09:00');
  const [isAllDay, setIsAllDay] = useState(true);
  const [recurrence, setRecurrence] = useState<'None' | 'Daily' | 'Weekly' | 'Monthly'>('None');

  const handleTypeChange = (t: HealthLogType) => {
    setType(t);
    if (t === 'ParasiteControl') {
       setTitle('每月驅蟲');
       setHasReminder(true);
       setRecurrence('Monthly');
    } else if (t === 'Vaccine') {
       setTitle('年度疫苗');
       setHasReminder(true);
       setRecurrence('None');
    } else if (t === 'Weight') {
       setTitle('體重記錄');
       setHasReminder(false);
    } else {
       setTitle('');
       setHasReminder(false);
    }
  };

  const handleAddClick = (dateStr?: string) => {
      setDate(dateStr || new Date().toISOString().split('T')[0]);
      setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newLog: HealthLog = {
      id: Date.now().toString(),
      petId: '', 
      type,
      title,
      description,
      date,
      nextDueDate: hasReminder ? nextDueDate : undefined,
      reminderTime: hasReminder ? (isAllDay ? '09:00' : reminderTime) : undefined,
      isAllDay: hasReminder ? isAllDay : undefined,
      recurrence: hasReminder ? recurrence : undefined,
    };

    onAddLog(newLog);
    setTitle('');
    setDescription('');
    setNextDueDate('');
    setHasReminder(false);
    setRecurrence('None');
    setIsAllDay(true);
    setReminderTime('09:00');
    setShowForm(false);
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-14"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayLogs = logs.filter(l => l.date === dateStr || (l.nextDueDate === dateStr));
        const isToday = new Date().toISOString().split('T')[0] === dateStr;

        days.push(
            <div 
                key={day} 
                onClick={() => handleAddClick(dateStr)}
                className={`h-14 relative flex flex-col items-center justify-center cursor-pointer rounded-2xl transition-all ${isToday ? 'bg-indigo-500 text-white shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
            >
                <span className={`text-sm font-medium ${isToday ? 'font-bold' : ''}`}>
                    {day}
                </span>
                <div className="flex flex-wrap gap-1 mt-1 justify-center">
                    {dayLogs.map((log, idx) => {
                        let dotColor = 'bg-slate-400';
                        if (log.type === 'Vet') dotColor = 'bg-blue-400';
                        if (log.type === 'ParasiteControl') dotColor = 'bg-red-400';
                        if (log.type === 'Vaccine') dotColor = 'bg-purple-400';
                        if (log.type === 'Grooming') dotColor = 'bg-pink-400';
                        if (log.type === 'Play') dotColor = 'bg-yellow-400';
                        if (log.type === 'Weight') dotColor = 'bg-green-400';
                        if (log.type === 'Symptom') dotColor = 'bg-orange-400';
                        
                        if (isToday) dotColor = 'bg-white';

                        return (
                            <div key={idx} className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                        );
                    })}
                </div>
            </div>
        );
    }
    return days;
  };

  const changeMonth = (delta: number) => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + delta);
      setSelectedDate(newDate);
  };

  const sortedLogs = logs.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="pb-24 space-y-6 animate-fade-in">
      {/* Header with Toggle */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">行事曆</h2>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button 
                onClick={() => setView('calendar')}
                className={`p-2 rounded-xl transition-all ${view === 'calendar' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
                <CalendarIcon className="w-5 h-5" />
            </button>
            <button 
                onClick={() => setView('list')}
                className={`p-2 rounded-xl transition-all ${view === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
                <List className="w-5 h-5" />
            </button>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowForm(false)}>
            <div 
                className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2rem] p-6 shadow-2xl max-h-[85vh] overflow-y-auto pb-10" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">新增事件</h3>
                    <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">取消</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">事件類型</label>
                    <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
                        {LOG_TYPES.map(t => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => handleTypeChange(t.value)}
                            className={`flex-shrink-0 px-5 py-3 rounded-2xl text-sm font-bold transition-all flex items-center shadow-sm ${
                            type === t.value 
                                ? 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-none' 
                                : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600'
                            }`}
                        >
                            <t.icon className="w-4 h-4 mr-2" />
                            {t.label}
                        </button>
                        ))}
                    </div>
                    </div>

                    <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">標題</label>
                    <input 
                        type="text" 
                        required
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full p-4 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 outline-none placeholder-slate-400"
                        placeholder="例如：美容預約"
                    />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">日期</label>
                        <input 
                        type="date"
                        required
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full p-4 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>

                    {/* Reminder Section */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-300">
                                <Clock className="w-4 h-4 mr-2 text-indigo-500" />
                                設定提醒
                            </label>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={hasReminder} 
                                    onChange={e => setHasReminder(e.target.checked)} 
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                            </label>
                        </div>

                        {hasReminder && (
                            <div className="space-y-4 pt-2 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">下次日期</label>
                                    <input 
                                        type="date"
                                        required={hasReminder}
                                        value={nextDueDate}
                                        onChange={e => setNextDueDate(e.target.value)}
                                        className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border-none text-sm text-slate-800 dark:text-white outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">循環</label>
                                        <select 
                                            value={recurrence}
                                            onChange={e => setRecurrence(e.target.value as any)}
                                            className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border-none text-sm text-slate-800 dark:text-white outline-none"
                                        >
                                            {RECURRENCE_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {!isAllDay && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">時間</label>
                                            <input 
                                                type="time"
                                                value={reminderTime}
                                                onChange={e => setReminderTime(e.target.value)}
                                                className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl border-none text-sm text-slate-800 dark:text-white outline-none"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center pl-1">
                                    <input 
                                        type="checkbox" 
                                        id="allDay" 
                                        checked={isAllDay}
                                        onChange={e => setIsAllDay(e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="allDay" className="ml-2 text-sm text-slate-600 dark:text-slate-400 font-medium">
                                        全天 (09:00 通知)
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">備註</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full p-4 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 outline-none h-24 placeholder-slate-400 resize-none"
                            placeholder="選填..."
                        />
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none active:scale-[0.98] transition-all">
                        新增紀錄
                    </button>
                </form>
            </div>
        </div>
      )}

      {view === 'calendar' ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700/50 animate-fade-in">
           <div className="flex justify-between items-center mb-6">
               <button onClick={() => changeMonth(-1)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                   <ChevronLeft className="w-5 h-5 text-slate-400" />
               </button>
               <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                   {selectedDate.getFullYear()}年 {selectedDate.getMonth() + 1}月
               </h3>
               <button onClick={() => changeMonth(1)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                   <ChevronRight className="w-5 h-5 text-slate-400" />
               </button>
           </div>
           
           <div className="grid grid-cols-7 mb-2 text-center">
               {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                   <div key={d} className="text-xs text-slate-400 font-bold py-2 uppercase tracking-wide">{d}</div>
               ))}
           </div>
           
           <div className="grid grid-cols-7 gap-y-2 gap-x-1">
               {renderCalendar()}
           </div>
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in">
           {sortedLogs.map(log => {
               const typeConfig = LOG_TYPES.find(t => t.value === log.type) || LOG_TYPES[0];
               return (
                   <div key={log.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl flex items-start space-x-4 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700/50 hover:border-indigo-100 dark:hover:border-slate-600 transition-all relative overflow-hidden">
                       <div className={`p-3.5 rounded-2xl shrink-0 ${typeConfig.bgClass} ${typeConfig.colorClass} flex items-center justify-center`}>
                           <typeConfig.icon className="w-6 h-6" />
                       </div>
                       <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-start">
                               <h4 className="font-bold text-slate-800 dark:text-white text-lg truncate">{log.title}</h4>
                               <button onClick={() => onDeleteLog(log.id)} className="text-slate-300 hover:text-red-500 p-1">
                                   <Trash2 className="w-4 h-4" />
                               </button>
                           </div>
                           <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{log.date} {log.description && `• ${log.description}`}</p>
                           {log.nextDueDate && (
                               <div className="mt-3 inline-flex items-center text-xs bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-lg font-medium">
                                   <Clock className="w-3 h-3 mr-1.5" />
                                   提醒: {log.nextDueDate} {log.reminderTime}
                               </div>
                           )}
                       </div>
                   </div>
               );
           })}
           {sortedLogs.length === 0 && (
               <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                   <Activity className="w-10 h-10 mx-auto mb-3 opacity-20" />
                   尚無健康紀錄
               </div>
           )}
        </div>
      )}
    </div>
  );
};

export default HealthManager;