export type EventKind = 'personal' | 'appointment' | 'task'
export type TransactionType = 'income' | 'expense'
export type TaskStatus = 'inbox' | 'todo' | 'doing' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface Medication {
  id: string
  name: string
  dose: string
  times: string[]
  days: number[]
  notes: string
  color: string
  active: boolean
  createdAt: string
  treatmentType?: 'continuous' | 'temporary' | 'asNeeded'
  startDate?: string
  endDate?: string
  stock?: number
  stockAlert?: number
  unit?: string
  doctor?: string
}

export interface MedicationLog {
  id: string
  medicationId: string
  date: string
  time: string
  takenAt: string
  status?: 'taken' | 'late' | 'missed' | 'skipped'
  notes?: string
}

export interface Routine { id: string; title: string; category: string; startTime: string; durationMinutes: number; days: number[]; notes: string; color: string; active: boolean }
export interface RoutineLog { id: string; routineId: string; date: string; completedAt: string }
export interface Expense { id: string; title: string; amount: number; category: string; date: string; paymentMethod: string; notes: string }
export interface Habit { id: string; title: string; icon: string; targetPerWeek: number; color: string; logs: string[] }

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  kind: EventKind
  notes: string
  color: string
  completed: boolean
  endTime?: string
  allDay?: boolean
  recurrence?: Recurrence
  recurrenceUntil?: string
  reminderMinutes?: number[]
  location?: string
  link?: string
  participants?: string[]
  calendarId?: string
}

export interface FinancialTransaction {
  id: string
  type: TransactionType
  title: string
  amount: number
  category: string
  date: string
  account: string
  paymentMethod: string
  notes: string
  tags: string[]
  recurringId?: string
  installmentPlanId?: string
}

export interface Budget { id: string; category: string; limit: number; month: string; alertAt: number }
export interface RecurringTransaction { id: string; type: TransactionType; title: string; amount: number; category: string; frequency: 'weekly' | 'monthly' | 'yearly'; dayOfMonth: number; nextDate: string; active: boolean; paymentMethod: string }
export interface Subscription { id: string; name: string; amount: number; frequency: 'monthly' | 'yearly'; nextBilling: string; category: string; active: boolean; url: string }
export interface Debt { id: string; name: string; totalAmount: number; remainingAmount: number; interestRate: number; minimumPayment: number; dueDay: number; type: 'card' | 'loan' | 'personal'; status: 'active' | 'paid' }
export interface SavingsGoal { id: string; title: string; targetAmount: number; currentAmount: number; targetDate: string; color: string }
export interface InstallmentPlan { id: string; title: string; totalAmount: number; installments: number; paidInstallments: number; installmentAmount: number; nextDueDate: string; card: string }

export interface TaskSubtask { id: string; title: string; completed: boolean }
export interface PersonalTask {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueDate: string
  dueTime: string
  tags: string[]
  subtasks: TaskSubtask[]
  recurrence: Recurrence
  reminderMinutes: number
  estimatedMinutes: number
  project: string
  createdAt: string
  completedAt?: string
}
export interface FocusSession { id: string; taskId?: string; startedAt: string; durationMinutes: number; completed: boolean }

export interface ShoppingList { id: string; title: string; store: string; budget: number; status: 'active' | 'completed'; createdAt: string }
export interface ShoppingItem { id: string; listId: string; name: string; quantity: number; unit: string; category: string; estimatedPrice: number; actualPrice: number; checked: boolean; frequent: boolean }
export interface InventoryItem { id: string; name: string; quantity: number; unit: string; category: string; location: string; minStock: number; expiresAt: string; notes: string }
export interface HomeTask { id: string; title: string; room: string; frequency: 'once' | 'weekly' | 'monthly'; nextDueDate: string; assignedTo: string; completed: boolean }
export interface MaintenanceItem { id: string; title: string; asset: string; category: string; lastService: string; nextService: string; cost: number; provider: string; notes: string; status: 'ok' | 'dueSoon' | 'overdue' }
export interface Warranty { id: string; item: string; purchaseDate: string; expiresAt: string; store: string; serial: string; notes: string }

export interface HealthProfessional { id: string; name: string; specialty: string; phone: string; email: string; center: string; address: string; notes: string }
export interface MedicalAppointment { id: string; title: string; date: string; time: string; professionalId: string; center: string; location: string; notes: string; status: 'scheduled' | 'completed' | 'cancelled' }
export interface MedicalDocument { id: string; title: string; type: 'study' | 'prescription' | 'certificate' | 'other'; date: string; professionalId: string; notes: string }
export interface VitalRecord { id: string; type: 'weight' | 'pressure' | 'temperature' | 'glucose' | 'heartRate' | 'sleep'; value: string; unit: string; date: string; time: string; notes: string }
export interface SymptomLog { id: string; symptom: string; intensity: number; date: string; time: string; notes: string; medicationIds: string[] }
export interface EmergencyContact { id: string; name: string; relation: string; phone: string; notes: string }

export interface AppSettings { displayName: string; currency: string; darkMode: boolean; notificationsEnabled: boolean }

export interface AppData {
  medications: Medication[]
  medicationLogs: MedicationLog[]
  routines: Routine[]
  routineLogs: RoutineLog[]
  expenses: Expense[]
  habits: Habit[]
  calendarEvents: CalendarEvent[]
  transactions: FinancialTransaction[]
  budgets: Budget[]
  recurringTransactions: RecurringTransaction[]
  subscriptions: Subscription[]
  debts: Debt[]
  savingsGoals: SavingsGoal[]
  installmentPlans: InstallmentPlan[]
  tasks: PersonalTask[]
  focusSessions: FocusSession[]
  shoppingLists: ShoppingList[]
  shoppingItems: ShoppingItem[]
  inventoryItems: InventoryItem[]
  homeTasks: HomeTask[]
  maintenanceItems: MaintenanceItem[]
  warranties: Warranty[]
  healthProfessionals: HealthProfessional[]
  medicalAppointments: MedicalAppointment[]
  medicalDocuments: MedicalDocument[]
  vitalRecords: VitalRecord[]
  symptomLogs: SymptomLog[]
  emergencyContacts: EmergencyContact[]
  settings: AppSettings
}
