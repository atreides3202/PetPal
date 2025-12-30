import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storageService';
import { Expense, HealthLog, PetProfile, ShoppingItem, Tab } from './types';
import Dashboard from './components/Dashboard';
import ExpenseManager from './components/ExpenseManager';
import HealthManager from './components/HealthManager';
import ShoppingList from './components/ShoppingList';
import Settings from './components/Settings';
import { LayoutDashboard, Wallet, HeartPulse, ShoppingCart, Settings as SettingsIcon, Sun, Moon, PawPrint } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // App State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [profiles, setProfiles] = useState<PetProfile[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [activePetId, setActivePetId] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load data on mount
  useEffect(() => {
    const loadedExpenses = StorageService.getExpenses();
    const loadedLogs = StorageService.getHealthLogs();
    const loadedShopping = StorageService.getShoppingList();
    const loadedProfiles = StorageService.getProfiles();
    
    setProfiles(loadedProfiles);
    
    let lastActiveId = StorageService.getActivePetId();
    if (!loadedProfiles.find(p => p.id === lastActiveId)) {
        lastActiveId = loadedProfiles[0]?.id || '';
    }
    setActivePetId(lastActiveId);
    
    // Migration Logic
    const firstPetId = loadedProfiles[0]?.id;
    let dataChanged = false;
    const fixedExpenses = loadedExpenses.map(e => {
        if (!e.petId) { dataChanged = true; return { ...e, petId: firstPetId }; }
        return e;
    });
    const fixedLogs = loadedLogs.map(l => {
        if (!l.petId) { dataChanged = true; return { ...l, petId: firstPetId }; }
        return l;
    });

    if (dataChanged) {
        StorageService.saveExpenses(fixedExpenses);
        StorageService.saveHealthLogs(fixedLogs);
    }
    
    setExpenses(fixedExpenses);
    setHealthLogs(fixedLogs);
    setShoppingList(loadedShopping);

    const savedTheme = StorageService.getThemeMode();
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
    } else {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
    }
  }, []);

  const getCurrentProfile = () => profiles.find(p => p.id === activePetId) || profiles[0];
  
  const switchPet = (id: string) => {
    setActivePetId(id);
    StorageService.saveActivePetId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
        document.documentElement.classList.add('dark');
        StorageService.saveThemeMode('dark');
    } else {
        document.documentElement.classList.remove('dark');
        StorageService.saveThemeMode('light');
    }
  };

  // Handlers
  const addExpense = (expense: Expense) => {
    const newExpense = { ...expense, petId: activePetId };
    const updated = [...expenses, newExpense];
    setExpenses(updated);
    StorageService.saveExpenses(updated);
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    StorageService.saveExpenses(updated);
  };
  
  const syncExpenses = (newExpenses: Expense[]) => {
      setExpenses(newExpenses);
      StorageService.saveExpenses(newExpenses);
  };

  const addHealthLog = (log: HealthLog) => {
    const newLog = { ...log, petId: activePetId };
    const updated = [...healthLogs, newLog];
    setHealthLogs(updated);
    StorageService.saveHealthLogs(updated);
    
    if (log.type === 'Weight' && log.description) {
      const w = parseFloat(log.description);
      if (!isNaN(w)) {
        updateProfiles(profiles.map(p => 
            p.id === activePetId ? { ...p, weight: w } : p
        ));
      }
    }
  };

  const deleteHealthLog = (id: string) => {
    const updated = healthLogs.filter(h => h.id !== id);
    setHealthLogs(updated);
    StorageService.saveHealthLogs(updated);
  };

  const updateShoppingList = (items: ShoppingItem[]) => {
    setShoppingList(items);
    StorageService.saveShoppingList(items);
  };

  const updateProfiles = (newProfiles: PetProfile[]) => {
    setProfiles(newProfiles);
    StorageService.saveProfiles(newProfiles);
    if (!newProfiles.find(p => p.id === activePetId) && newProfiles.length > 0) {
        switchPet(newProfiles[0].id);
    }
  };

  const currentPetExpenses = expenses.filter(e => e.petId === activePetId);
  const currentPetLogs = healthLogs.filter(l => l.petId === activePetId);
  const currentProfile = getCurrentProfile();

  if (!currentProfile) return <div className="h-screen flex items-center justify-center text-slate-400">Loading...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
                  currentProfile={currentProfile} 
                  allProfiles={profiles}
                  expenses={currentPetExpenses} 
                  healthLogs={currentPetLogs}
                  onSwitchPet={switchPet}
                  onNavigateSettings={() => setActiveTab('settings')}
               />;
      case 'expenses':
        return <ExpenseManager 
                  expenses={expenses.filter(e => e.petId === activePetId)} 
                  onAddExpense={addExpense} 
                  onDeleteExpense={deleteExpense}
                  onSyncExpenses={syncExpenses}
               />;
      case 'health':
        return <HealthManager 
                  logs={healthLogs.filter(l => l.petId === activePetId)} 
                  onAddLog={addHealthLog} 
                  onDeleteLog={deleteHealthLog} 
               />;
      case 'shopping':
        return <ShoppingList
                  items={shoppingList}
                  onUpdateItems={updateShoppingList}
               />;
      case 'settings':
        return <Settings 
                  profiles={profiles} 
                  onUpdateProfiles={updateProfiles} 
                  healthLogs={healthLogs}
                  isDarkMode={isDarkMode}
                  onAddLog={addHealthLog}
               />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex justify-center text-slate-800 dark:text-slate-100 font-sans">
      
      {/* Ambient Background Blobs */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none animate-float"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-200/40 dark:bg-blue-900/20 rounded-full blur-[120px] pointer-events-none animate-float" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md h-full min-h-screen relative z-10">
        
        {/* Header */}
        <header className="fixed top-0 w-full max-w-md z-40 px-6 py-5 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-500">
             <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-[#5C66BD] to-[#77A9E8] text-white p-2 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
                  <PawPrint className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">PetPal</h1>
             </div>
             <button 
                onClick={toggleTheme}
                className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all shadow-sm shadow-slate-200 dark:shadow-none"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
        </header>

        {/* Main Content Area */}
        <main className="px-6 pt-24 h-full pb-32">
          {renderContent()}
        </main>

        {/* Bottom Navigation (Floating Dock) */}
        <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-3xl flex justify-around items-center px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-none w-full max-w-xs transition-colors duration-500">
                <button 
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'dashboard' ? 'text-indigo-500 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <LayoutDashboard className="w-6 h-6" strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
                </button>
                <button 
                    onClick={() => setActiveTab('expenses')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'expenses' ? 'text-indigo-500 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <Wallet className="w-6 h-6" strokeWidth={activeTab === 'expenses' ? 2.5 : 2} />
                </button>
                <button 
                    onClick={() => setActiveTab('health')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'health' ? 'text-indigo-500 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <HeartPulse className="w-6 h-6" strokeWidth={activeTab === 'health' ? 2.5 : 2} />
                </button>
                <button 
                    onClick={() => setActiveTab('shopping')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'shopping' ? 'text-indigo-500 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <ShoppingCart className="w-6 h-6" strokeWidth={activeTab === 'shopping' ? 2.5 : 2} />
                </button>
                <button 
                    onClick={() => setActiveTab('settings')}
                    className={`flex flex-col items-center transition-all duration-300 ${activeTab === 'settings' ? 'text-indigo-500 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                    <SettingsIcon className="w-6 h-6" strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
                </button>
            </div>
        </nav>
      </div>
    </div>
  );
};

export default App;