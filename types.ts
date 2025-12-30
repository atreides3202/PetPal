
export type ExpenseCategory = 'Food' | 'Treats' | 'HealthCare' | 'Medical' | 'Toys' | 'Grooming' | 'Other';

export interface Expense {
  id: string;
  petId: string; // Link to specific pet
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string; // ISO date string
}

export type HealthLogType = 'Vet' | 'Symptom' | 'Weight' | 'Vaccine' | 'ParasiteControl' | 'Grooming' | 'Play' | 'Other';

export interface HealthLog {
  id: string;
  petId: string; // Link to specific pet
  type: HealthLogType;
  title: string;
  description: string;
  date: string;
  nextDueDate?: string; // For reminders
  reminderTime?: string; // HH:mm
  isAllDay?: boolean;
  recurrence?: 'None' | 'Daily' | 'Weekly' | 'Monthly';
}

export interface PetProfile {
  id: string;
  name: string;
  type: string; // Dog, Cat, etc.
  birthday: string;
  weight: number;
  bio?: string; // Personality description
  photo?: string; // Base64 string for image
}

export interface ShoppingItem {
  id: string;
  text: string;
  isUrgent: boolean;
  isCompleted: boolean;
}

export type Tab = 'dashboard' | 'health' | 'expenses' | 'shopping' | 'settings';
