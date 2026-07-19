import type { AppData, AppSettings } from '@/types/domain'

type JsonRecord = Record<string, unknown>

const collectionKeys: Array<Exclude<keyof AppData, 'settings'>> = [
  'medications', 'medicationLogs', 'routines', 'routineLogs', 'expenses', 'habits', 'calendarEvents',
  'transactions', 'budgets', 'recurringTransactions', 'subscriptions', 'debts', 'savingsGoals', 'installmentPlans',
  'tasks', 'focusSessions', 'shoppingLists', 'shoppingItems', 'inventoryItems', 'homeTasks', 'maintenanceItems',
  'warranties', 'healthProfessionals', 'medicalAppointments', 'medicalDocuments', 'vitalRecords', 'symptomLogs',
  'emergencyContacts'
]

const isRecord = (value: unknown): value is JsonRecord => typeof value === 'object' && value !== null && !Array.isArray(value)
const hasId = (value: unknown): value is { id: string } => isRecord(value) && typeof value.id === 'string' && value.id.length > 0

function readSettings(raw: unknown, fallback: AppSettings): AppSettings {
  if (!isRecord(raw)) return fallback
  return {
    displayName: typeof raw.displayName === 'string' ? raw.displayName : fallback.displayName,
    currency: raw.currency === 'ARS' || raw.currency === 'USD' || raw.currency === 'EUR' ? raw.currency : fallback.currency,
    darkMode: typeof raw.darkMode === 'boolean' ? raw.darkMode : fallback.darkMode,
    notificationsEnabled: typeof raw.notificationsEnabled === 'boolean' ? raw.notificationsEnabled : fallback.notificationsEnabled
  }
}

export function parseAppData(value: unknown, fallback: AppData): AppData {
  if (!isRecord(value)) throw new Error('El respaldo no contiene un objeto válido')
  if (![...collectionKeys, 'settings'].some((key) => key in value)) throw new Error('El archivo no parece pertenecer a Vida Organizada')

  const result = { ...fallback } as AppData
  for (const key of collectionKeys) {
    const raw = value[key]
    if (raw === undefined) continue
    if (!Array.isArray(raw) || !raw.every(hasId)) throw new Error(`Colección inválida: ${key}`)
    ;(result as unknown as Record<Exclude<keyof AppData, 'settings'>, unknown[]>)[key] = raw
  }
  result.settings = readSettings(value.settings, fallback.settings)
  return result
}
