import React, { useState } from 'react';
import { ShoppingItem } from '../types';
import { Plus, Trash2, Check, AlertTriangle, ShoppingCart } from 'lucide-react';

interface ShoppingListProps {
  items: ShoppingItem[];
  onUpdateItems: (items: ShoppingItem[]) => void;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ items, onUpdateItems }) => {
  const [text, setText] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      text,
      isUrgent,
      isCompleted: false
    };

    onUpdateItems([...items, newItem]);
    setText('');
    setIsUrgent(false);
  };

  const toggleComplete = (id: string) => {
    const updated = items.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    onUpdateItems(updated);
  };

  const deleteItem = (id: string) => {
    const updated = items.filter(item => item.id !== id);
    onUpdateItems(updated);
  };

  const urgentItems = items.filter(i => i.isUrgent);
  const normalItems = items.filter(i => !i.isUrgent);

  const renderItem = (item: ShoppingItem) => (
    <div 
      key={item.id} 
      className={`flex items-center justify-between p-4 rounded-2xl mb-3 transition-all ${
        item.isCompleted 
            ? 'bg-slate-100 dark:bg-slate-800/50 opacity-60' 
            : 'bg-white dark:bg-slate-800 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700/50'
      } ${item.isUrgent && !item.isCompleted ? 'ring-1 ring-red-100 dark:ring-red-900/30 bg-red-50/30 dark:bg-red-900/10' : ''}`}
    >
      <div className="flex items-center space-x-4 flex-1">
        <button 
          onClick={() => toggleComplete(item.id)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            item.isCompleted 
              ? 'bg-slate-400 border-slate-400 text-white' 
              : 'border-slate-300 dark:border-slate-500 hover:border-indigo-500 text-transparent'
          }`}
        >
          <Check className="w-3.5 h-3.5" strokeWidth={3} />
        </button>
        <span className={`text-base ${item.isCompleted ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'} ${item.isUrgent && !item.isCompleted ? 'font-bold' : 'font-medium'}`}>
          {item.text}
        </span>
      </div>
      <button 
        onClick={() => deleteItem(item.id)}
        className="text-slate-300 hover:text-red-500 p-2 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="pb-24 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">購物清單</h2>
        <div className="bg-white dark:bg-slate-800 p-2.5 rounded-full text-indigo-500 shadow-sm border border-slate-50 dark:border-slate-700">
          <ShoppingCart className="w-6 h-6" />
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAddItem} className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-700">
        <div className="flex space-x-3 mb-4">
           <input 
             type="text" 
             value={text}
             onChange={e => setText(e.target.value)}
             placeholder="需要買什麼？"
             className="flex-1 p-4 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white rounded-2xl border-none outline-none placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/20"
           />
           <button 
             type="submit"
             disabled={!text.trim()}
             className="bg-indigo-600 text-white w-14 rounded-2xl font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center"
           >
             <Plus className="w-6 h-6" />
           </button>
        </div>
        <div className="flex items-center">
            <label className={`flex items-center px-4 py-2 rounded-xl cursor-pointer text-sm font-bold transition-all select-none ${isUrgent ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:bg-slate-100'}`}>
                <input 
                    type="checkbox"
                    checked={isUrgent}
                    onChange={e => setIsUrgent(e.target.checked)}
                    className="hidden"
                />
                <AlertTriangle className={`w-4 h-4 mr-2 ${isUrgent ? 'fill-red-500' : ''}`} />
                {isUrgent ? '標記為緊急' : '設為緊急項目'}
            </label>
        </div>
      </form>

      {/* Urgent List */}
      {urgentItems.length > 0 && (
        <div>
           <h3 className="text-red-500 font-bold mb-4 flex items-center text-xs uppercase tracking-wider px-2">
             <AlertTriangle className="w-4 h-4 mr-2" />
             緊急購買
           </h3>
           <div>
             {urgentItems.map(renderItem)}
           </div>
        </div>
      )}

      {/* Normal List */}
      <div>
         <h3 className="text-slate-400 font-bold mb-4 text-xs uppercase tracking-wider px-2">一般清單</h3>
         {normalItems.length > 0 ? (
           <div>
             {normalItems.map(renderItem)}
           </div>
         ) : (
             !urgentItems.length && (
                <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    清單是空的
                </div>
             )
         )}
      </div>
    </div>
  );
};

export default ShoppingList;