export type EventKind = 'personal' | 'appointment' | 'task'

export interface Medication { id: string; name: string; dose: string; times: string[]; days: number[]; notes: string; color: string; active: boolean; createdAt: string }
export interface MedicationLog { id: string; medicationId: string; date: string; time: string; takenAt: string }
export interface Routine { id: string; title: string; category: string; startTime: string; durationMinutes: number; days: number[]; notes: string; color: string; active: boolean }
export interface RoutineLog { id: string; routineId: string; date: string; completedAt: string }
export interface Expense { id: string; title: string; amount: number; category: string; date: string; paymentMethod: string; notes: string }
export interface Habit { id: string; title: string; icon: string; targetPerWeek: number; color: string; logs: string[] }
export interface CalendarEvent { id: string; title: string; date: string; time: string; kind: EventKind; notes: string; color: string; completed: boolean }
export interface AppSettings { displayName: string; currency: string; darkMode: boolean; notificationsEnabled: boolean }
export interface AppData { medications: Medication[]; medicationLogs: MedicationLog[]; routines: Routine[]; routineLogs: RoutineLog[]; expenses: Expense[]; habits: Habit[]; calendarEvents: CalendarEvent[]; settings: AppSettings }
