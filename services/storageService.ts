
import { Expense, HealthLog, PetProfile, ShoppingItem } from '../types';

const STORAGE_KEYS = {
  EXPENSES: 'petpal_expenses',
  HEALTH_LOGS: 'petpal_health_logs',
  PROFILES: 'petpal_profiles', 
  ACTIVE_PET_ID: 'petpal_active_pet_id',
  GOOGLE_SHEET_URL: 'petpal_gsheet_url',
  SHOPPING_LIST: 'petpal_shopping_list',
  THEME: 'petpal_theme',
};

// Helper to generate a default profile if none exists
const DEFAULT_PROFILE: PetProfile = {
  id: 'default_pet_1',
  name: '毛小孩',
  type: 'Dog',
  birthday: new Date().toISOString().split('T')[0],
  weight: 0,
  bio: '一隻可愛的寵物'
};

const DEFAULT_GSHEET_URL = 'https://script.google.com/macros/s/AKfycbyhruwbJo1tJlnTjB-S6ya7i6R9FMD7sCRQpVBsBGxwsqSCwVfzg8znJeWqOJZQpY_PTA/exec';

export const StorageService = {
  getExpenses: (): Expense[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  },

  saveExpenses: (expenses: Expense[]) => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  },

  // --- Google Sheet API Wrapper ---
  // action: 'read' | 'create' | 'update' | 'delete'
  async syncExpensesCRUD(action: string, data?: any): Promise<any> {
    const url = localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_URL) || DEFAULT_GSHEET_URL;
    
    // We use POST for ALL actions (including read) to ensure consistency.
    // Using POST with text/plain prevents the browser from sending a CORS Preflight (OPTIONS) request,
    // which Google Apps Script does not handle automatically.
    const payload = {
      action: action,
      ...data
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        // IMPORTANT: 'text/plain' is required to skip CORS preflight checks in standard fetch
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      
      // Get text first to debug if JSON parse fails (e.g. if GAS returns an HTML error page)
      const text = await response.text();
      
      try {
        return JSON.parse(text);
      } catch (parseError) {
        console.error("GS Parse Error. Raw response:", text);
        return { status: 'error', message: 'Format Error: Google Sheet 回傳了非 JSON 格式的資料。請檢查 Apps Script URL 是否正確。' };
      }

    } catch (networkError) {
       console.error(`GS ${action} Network Error:`, networkError);
       return { status: 'error', message: 'Network Error: 無法連接。請檢查網路或 URL 設定。' };
    }
  },
  // --------------------------------

  getHealthLogs: (): HealthLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.HEALTH_LOGS);
    return data ? JSON.parse(data) : [];
  },

  saveHealthLogs: (logs: HealthLog[]) => {
    localStorage.setItem(STORAGE_KEYS.HEALTH_LOGS, JSON.stringify(logs));
  },

  getProfiles: (): PetProfile[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILES);
    if (data) {
      return JSON.parse(data);
    }
    
    // Migration: If no profiles list, check for old single profile
    const oldProfileStr = localStorage.getItem('petpal_profile');
    if (oldProfileStr) {
      const oldProfile = JSON.parse(oldProfileStr);
      const newProfile = { ...DEFAULT_PROFILE, ...oldProfile, id: 'default_pet_1' };
      localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify([newProfile]));
      return [newProfile];
    }

    // Default initialization
    return [DEFAULT_PROFILE];
  },

  saveProfiles: (profiles: PetProfile[]) => {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));
  },

  getActivePetId: (): string => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PET_ID) || 'default_pet_1';
  },

  saveActivePetId: (id: string) => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PET_ID, id);
  },

  // Google Sheet URL methods
  getGoogleSheetUrl: (): string => {
    return localStorage.getItem(STORAGE_KEYS.GOOGLE_SHEET_URL) || DEFAULT_GSHEET_URL;
  },

  saveGoogleSheetUrl: (url: string) => {
    localStorage.setItem(STORAGE_KEYS.GOOGLE_SHEET_URL, url);
  },

  // Shopping List methods
  getShoppingList: (): ShoppingItem[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SHOPPING_LIST);
    return data ? JSON.parse(data) : [];
  },

  saveShoppingList: (items: ShoppingItem[]) => {
    localStorage.setItem(STORAGE_KEYS.SHOPPING_LIST, JSON.stringify(items));
  },

  // Theme methods
  getThemeMode: (): 'light' | 'dark' | null => {
    const theme = localStorage.getItem(STORAGE_KEYS.THEME);
    return theme === 'light' || theme === 'dark' ? theme : null;
  },

  saveThemeMode: (mode: 'light' | 'dark') => {
    localStorage.setItem(STORAGE_KEYS.THEME, mode);
  }
};
