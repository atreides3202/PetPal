import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory, PetProfile } from '../types';
import { Plus, Trash2, PieChart as PieChartIcon, TrendingUp, Cloud, CloudOff, RefreshCw, Edit2, Check, X, Calendar, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { GeminiService } from '../services/geminiService';
import { StorageService } from '../services/storageService';

interface ExpenseManagerProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onSyncExpenses: (expenses: Expense[]) => void;
}

const CATEGORIES: { label: string; value: ExpenseCategory; color: string }[] = [
  { label: '食物', value: 'Food', color: '#10B981' },
  { label: '零食', value: 'Treats', color: '#F59E0B' },
  { label: '保健', value: 'HealthCare', color: '#3B82F6' },
  { label: '醫療', value: 'Medical', color: '#EF4444' },
  { label: '玩具', value: 'Toys', color: '#8B5CF6' },
  { label: '美容', value: 'Grooming', color: '#EC4899' },
  { label: '其他', value: 'Other', color: '#6B7280' },
];

const ExpenseManager: React.FC<ExpenseManagerProps> = ({ expenses: initialExpenses, onAddExpense, onDeleteExpense, onSyncExpenses }) => {
  const [localExpenses, setLocalExpenses] = useState<Expense[]>(initialExpenses);
  const [showForm, setShowForm] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (initialExpenses.length > 0 && localExpenses.length === 0) {
        setLocalExpenses(initialExpenses);
    }
  }, [initialExpenses]);

  const fetchExpenses = async () => {
    setStatus('loading');
    setStatusMsg('讀取中...');
    try {
      const res = await StorageService.syncExpensesCRUD('read');
      if (res && res.status === 'success' && Array.isArray(res.data)) {
        const mapped: Expense[] = res.data.map((item: any) => ({
            id: item.id,
            petId: 'default_pet_1', 
            amount: Number(item.amount),
            category: (Object.values(CATEGORIES).find(c => c.label === item.category)?.value || 'Other') as ExpenseCategory,
            description: item.description,
            date: item.date
        }));
        
        setLocalExpenses(mapped);
        onSyncExpenses(mapped);
        setStatus('success');
        setStatusMsg('同步完成');
      } else {
        throw new Error(res.message || 'Unknown Error');
      }
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      const msg = typeof e.message === 'string' ? e.message : '讀取失敗';
      setStatusMsg(msg);
    }
    setTimeout(() => setStatus('idle'), 3000);
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setCategory('Food');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditClick = (expense: Expense) => {
    setEditingId(expense.id);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDescription(expense.description);
    setDate(expense.date);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setStatus('loading');
    setStatusMsg(editingId ? '更新中...' : '新增中...');

    const activePetId = StorageService.getActivePetId();
    const categoryLabel = CATEGORIES.find(c => c.value === category)?.label || category;

    const payload = {
        date,
        category: categoryLabel,
        amount: Number(amount),
        description,
        id: editingId || Date.now().toString()
    };

    try {
        const action = editingId ? 'update' : 'create';
        const res = await StorageService.syncExpensesCRUD(action, payload);

        if (res.status === 'success') {
            const newExp: Expense = {
                id: payload.id,
                petId: activePetId,
                amount: payload.amount,
                category,
                description: payload.description,
                date: payload.date
            };

            let updatedList = [];
            if (editingId) {
                updatedList = localExpenses.map(exp => exp.id === editingId ? newExp : exp);
                setLocalExpenses(updatedList);
            } else {
                updatedList = [...localExpenses, newExp];
                setLocalExpenses(updatedList);
            }
            
            onSyncExpenses(updatedList);

            setStatus('success');
            setStatusMsg(editingId ? '更新成功' : '新增成功');
            resetForm();
        } else {
            throw new Error(res.message);
        }
    } catch (error: any) {
        console.error(error);
        setStatus('error');
        setStatusMsg(error.message || '操作失敗，請重試');
    }
    setTimeout(() => setStatus('idle'), 3000);
  };

  const handleDelete = async (id: string) => {
    if(!confirm('確定要刪除這筆紀錄嗎？')) return;

    setStatus('loading');
    setStatusMsg('刪除中...');
    
    try {
        const res = await StorageService.syncExpensesCRUD('delete', { id });
        if (res.status === 'success') {
            const updatedList = localExpenses.filter(e => e.id !== id);
            setLocalExpenses(updatedList);
            onSyncExpenses(updatedList); 
            setStatus('success');
            setStatusMsg('已刪除');
        } else {
            throw new Error(res.message);
        }
    } catch (error: any) {
        console.error(error);
        setStatus('error');
        setStatusMsg(error.message || '刪除失敗');
    }
    setTimeout(() => setStatus('idle'), 2000);
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    const dummyProfile: PetProfile = { id: 'temp', name: '您的寵物', type: 'Pet', weight: 0, birthday: '' };
    const analysisTarget = currentMonthExpenses.length > 0 ? currentMonthExpenses : localExpenses;
    const result = await GeminiService.analyzeSpending(analysisTarget, dummyProfile);
    setAiAnalysis(result || "分析失敗");
    setAnalyzing(false);
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthExpenses = localExpenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  });

  const currentMonthTotal = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const data = CATEGORIES.map(cat => ({
    name: cat.label,
    value: currentMonthExpenses.filter(e => e.category === cat.value).reduce((acc, curr) => acc + curr.amount, 0),
    color: cat.color
  })).filter(d => d.value > 0);

  return (
    <div className="pb-24 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">支出紀錄</h2>
        <div className="flex gap-3">
            <button 
            onClick={fetchExpenses}
            className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-300 p-2.5 rounded-full shadow-sm active:scale-95 transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
            >
            <RefreshCw className={`w-5 h-5 ${status === 'loading' ? 'animate-spin' : ''}`} />
            </button>
            <button 
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="bg-indigo-600 text-white p-2.5 rounded-full shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-all hover:bg-indigo-700"
            >
            <Plus className="w-5 h-5" />
            </button>
        </div>
      </div>

      {status !== 'idle' && (
          <div className={`text-xs px-4 py-2.5 rounded-xl flex items-center shadow-sm animate-fade-in ${
              status === 'loading' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
              status === 'success' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
              'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
          }`}>
              <Cloud className="w-4 h-4 mr-2" />
              {statusMsg}
          </div>
      )}

      {/* Summary Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-700 dark:to-slate-800 text-white p-6 rounded-3xl shadow-xl shadow-slate-200 dark:shadow-none relative overflow-hidden">
          <div className="absolute right-0 top-0 w-40 h-40 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
              <span className="text-slate-300 text-sm font-medium mb-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-1.5 opacity-70" />
                  {currentYear}年 {currentMonth + 1}月總支出
              </span>
              <div className="flex items-center justify-center mt-2">
                  <span className="text-4xl font-bold tracking-tight">${currentMonthTotal.toLocaleString()}</span>
              </div>
          </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] border border-slate-50 dark:border-slate-700 animate-fade-in-down">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-slate-800 dark:text-white">{editingId ? '編輯支出' : '新增支出'}</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">金額 ($)</label>
              <input 
                type="number" 
                required
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full p-4 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500/20 text-lg font-bold"
                placeholder="0"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">類別</label>
                <div className="relative">
                    <select 
                    value={category}
                    onChange={e => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full p-4 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                    >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">日期</label>
                <input 
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full p-4 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">備註</label>
              <input 
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-4 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400"
                placeholder="選填"
              />
            </div>

            <button type="submit" disabled={status === 'loading'} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none active:scale-[0.98] transition-transform hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {editingId ? '更新儲存' : '確認新增'}
            </button>
          </form>
        </div>
      )}

      {/* Chart Section */}
      {data.length > 0 ? (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700/50">
           <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2 text-indigo-500" />
              本月花費分佈
            </h3>
            <button onClick={handleAnalyze} className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900 px-3 py-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors font-bold">
              {analyzing ? '分析中...' : 'AI 分析'}
            </button>
          </div>
          
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {data.map(d => (
              <div key={d.name} className="flex items-center text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-md">
                <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: d.color }}></span>
                {d.name} ${d.value}
              </div>
            ))}
          </div>

          {aiAnalysis && (
            <div className="mt-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-sm text-slate-600 dark:text-slate-300 animate-fade-in">
              <div className="flex items-start">
                 <TrendingUp className="w-5 h-5 mr-3 mt-0.5 text-indigo-500 shrink-0" />
                 <p className="leading-relaxed">{aiAnalysis}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
            {status === 'loading' ? (
                <p className="text-slate-400">正在下載紀錄...</p>
            ) : (
                <p className="text-slate-400 dark:text-slate-500">本月尚無支出紀錄</p>
            )}
        </div>
      )}

      {/* List Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
            近期明細 ({localExpenses.length})
        </h3>
        {localExpenses.slice().sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
          <div key={expense.id} className="bg-white dark:bg-slate-800 p-4 rounded-3xl flex justify-between items-center shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700/50 group hover:border-indigo-100 dark:hover:border-slate-600 transition-all">
            <div className="flex items-center space-x-4 overflow-hidden">
              <div className="w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center font-bold text-lg bg-slate-50 dark:bg-slate-700/50">
                 <span style={{ color: CATEGORIES.find(c => c.value === expense.category)?.color || '#999' }}>
                    {expense.category === 'HealthCare' ? '健' : (CATEGORIES.find(c => c.value === expense.category)?.label?.[0] || '其')}
                 </span>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-white truncate text-base">{CATEGORIES.find(c => c.value === expense.category)?.label}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{expense.date} {expense.description && `• ${expense.description}`}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 pl-2 shrink-0">
              <span className="font-bold text-slate-800 dark:text-white text-lg">${expense.amount}</span>
              <div className="flex flex-col gap-1">
                  <button 
                    onClick={() => handleEditClick(expense)}
                    className="text-slate-300 hover:text-indigo-500 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(expense.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper for select arrow
function ChevronDown({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
    )
}

export default ExpenseManager;