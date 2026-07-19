import type {
  AppData,
  AppSettings,
  CalendarEvent,
  Expense,
  Habit,
  Medication,
  MedicationLog,
  Routine,
  RoutineLog
} from '@/types/domain'

type JsonRecord = Record<string, unknown>
type Guard<T> = (value: unknown) => value is T

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'
const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every(isString)
const isNumberArray = (value: unknown): value is number[] => Array.isArray(value) && value.every(isNumber)

const isMedication: Guard<Medication> = (value): value is Medication =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.name) &&
  isString(value.dose) &&
  isStringArray(value.times) &&
  isNumberArray(value.days) &&
  isString(value.notes) &&
  isString(value.color) &&
  isBoolean(value.active) &&
  isString(value.createdAt)

const isMedicationLog: Guard<MedicationLog> = (value): value is MedicationLog =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.medicationId) &&
  isString(value.date) &&
  isString(value.time) &&
  isString(value.takenAt)

const isRoutine: Guard<Routine> = (value): value is Routine =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.title) &&
  isString(value.category) &&
  isString(value.startTime) &&
  isNumber(value.durationMinutes) &&
  isNumberArray(value.days) &&
  isString(value.notes) &&
  isString(value.color) &&
  isBoolean(value.active)

const isRoutineLog: Guard<RoutineLog> = (value): value is RoutineLog =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.routineId) &&
  isString(value.date) &&
  isString(value.completedAt)

const isExpense: Guard<Expense> = (value): value is Expense =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.title) &&
  isNumber(value.amount) &&
  isString(value.category) &&
  isString(value.date) &&
  isString(value.paymentMethod) &&
  isString(value.notes)

const isHabit: Guard<Habit> = (value): value is Habit =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.title) &&
  isString(value.icon) &&
  isNumber(value.targetPerWeek) &&
  isString(value.color) &&
  isStringArray(value.logs)

const isCalendarEvent: Guard<CalendarEvent> = (value): value is CalendarEvent =>
  isRecord(value) &&
  isString(value.id) &&
  isString(value.title) &&
  isString(value.date) &&
  isString(value.time) &&
  (value.kind === 'personal' || value.kind === 'appointment' || value.kind === 'task') &&
  isString(value.notes) &&
  isString(value.color) &&
  isBoolean(value.completed)

function readCollection<T>(raw: JsonRecord, key: string, guard: Guard<T>, fallback: T[]): T[] {
  const value = raw[key]
  if (value === undefined) return fallback
  if (!Array.isArray(value) || !value.every(guard)) throw new Error(`Colección inválida: ${key}`)
  return value
}

function readSettings(raw: unknown, fallback: AppSettings): AppSettings {
  if (raw === undefined) return fallback
  if (!isRecord(raw)) throw new Error('Configuración inválida')

  return {
    displayName: isString(raw.displayName) ? raw.displayName : fallback.displayName,
    currency: raw.currency === 'ARS' || raw.currency === 'USD' || raw.currency === 'EUR' ? raw.currency : fallback.currency,
    darkMode: isBoolean(raw.darkMode) ? raw.darkMode : fallback.darkMode,
    notificationsEnabled: isBoolean(raw.notificationsEnabled) ? raw.notificationsEnabled : fallback.notificationsEnabled
  }
}

export function parseAppData(value: unknown, fallback: AppData): AppData {
  if (!isRecord(value)) throw new Error('El respaldo no contiene un objeto válido')

  const knownKeys = ['medications', 'medicationLogs', 'routines', 'routineLogs', 'expenses', 'habits', 'calendarEvents', 'settings']
  if (!knownKeys.some((key) => key in value)) throw new Error('El archivo no parece pertenecer a Vida Organizada')

  return {
    medications: readCollection(value, 'medications', isMedication, fallback.medications),
    medicationLogs: readCollection(value, 'medicationLogs', isMedicationLog, fallback.medicationLogs),
    routines: readCollection(value, 'routines', isRoutine, fallback.routines),
    routineLogs: readCollection(value, 'routineLogs', isRoutineLog, fallback.routineLogs),
    expenses: readCollection(value, 'expenses', isExpense, fallback.expenses),
    habits: readCollection(value, 'habits', isHabit, fallback.habits),
    calendarEvents: readCollection(value, 'calendarEvents', isCalendarEvent, fallback.calendarEvents),
    settings: readSettings(value.settings, fallback.settings)
  }
}
