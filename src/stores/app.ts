import { computed, onScopeDispose, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { AppData, CalendarEvent, Expense, Habit, Medication, Routine } from '@/types/domain'
import { createId } from '@/utils/id'
import { monthKey, todayKey } from '@/utils/date'
import { parseAppData } from '@/utils/appData'

const STORAGE_KEY = 'vida-organizada:v2'
const LEGACY_KEY = 'vida-organizada:v1'

type CollectionKey = Exclude<keyof AppData, 'settings'>
type Identifiable = { id: string }

const defaultData = (): AppData => ({
  medications: [], medicationLogs: [], routines: [], routineLogs: [], expenses: [],
  habits: [
    { id: createId('habit'), title: 'Tomar agua', icon: 'pi pi-bolt', targetPerWeek: 7, color: '#06b6d4', logs: [] },
    { id: createId('habit'), title: 'Mover el cuerpo', icon: 'pi pi-heart', targetPerWeek: 4, color: '#f97316', logs: [] }
  ],
  calendarEvents: [], transactions: [], budgets: [], recurringTransactions: [], subscriptions: [], debts: [],
  savingsGoals: [], installmentPlans: [], tasks: [], focusSessions: [], shoppingLists: [], shoppingItems: [],
  inventoryItems: [], homeTasks: [], maintenanceItems: [], warranties: [], healthProfessionals: [],
  medicalAppointments: [], medicalDocuments: [], vitalRecords: [], symptomLogs: [], emergencyContacts: [],
  settings: { displayName: 'Lautaro', currency: 'ARS', darkMode: false, notificationsEnabled: false }
})

const loadInitialData = (): AppData => {
  const fallback = defaultData()
  try {
    const stored = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY)
    return stored ? parseAppData(JSON.parse(stored), fallback) : fallback
  } catch {
    return fallback
  }
}

export const useAppStore = defineStore('app', () => {
  const data = ref<AppData>(loadInitialData())
  const now = ref(new Date())
  const refreshClock = () => { now.value = new Date() }
  const handleVisibility = () => { if (!document.hidden) refreshClock() }
  const clockId = window.setInterval(refreshClock, 60_000)
  window.addEventListener('focus', refreshClock)
  document.addEventListener('visibilitychange', handleVisibility)

  onScopeDispose(() => {
    window.clearInterval(clockId)
    window.removeEventListener('focus', refreshClock)
    document.removeEventListener('visibilitychange', handleVisibility)
  })

  watch(data, (value) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) }
    catch (error) { console.error('No se pudieron guardar los datos localmente.', error) }
  }, { deep: true })

  watch(() => data.value.settings.darkMode, (enabled) => document.documentElement.classList.toggle('app-dark', enabled), { immediate: true })

  const today = computed(() => todayKey(now.value))
  const currentDay = computed(() => now.value.getDay())
  const currentMonth = computed(() => monthKey(now.value))
  const monthTransactions = computed(() => data.value.transactions.filter((item) => item.date.startsWith(currentMonth.value)))
  const monthlyIncome = computed(() => monthTransactions.value.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0))
  const monthlyExpenseTransactions = computed(() => monthTransactions.value.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0))
  const legacyMonthlyExpenses = computed(() => data.value.expenses.filter((item) => item.date.startsWith(currentMonth.value)).reduce((sum, item) => sum + item.amount, 0))
  const monthlyExpenses = computed(() => monthlyExpenseTransactions.value + legacyMonthlyExpenses.value)
  const monthlyBalance = computed(() => monthlyIncome.value - monthlyExpenses.value)
  const todayExpenses = computed(() => data.value.transactions.filter((item) => item.type === 'expense' && item.date === today.value).reduce((sum, item) => sum + item.amount, 0) + data.value.expenses.filter((item) => item.date === today.value).reduce((sum, item) => sum + item.amount, 0))
  const openTasks = computed(() => data.value.tasks.filter((item) => item.status !== 'done'))
  const lowStockItems = computed(() => data.value.inventoryItems.filter((item) => item.quantity <= item.minStock))
  const lowStockMedications = computed(() => data.value.medications.filter((item) => item.stock !== undefined && item.stockAlert !== undefined && item.stock <= item.stockAlert))

  function upsert<T extends Identifiable>(collection: CollectionKey, item: T) {
    const list = data.value[collection] as unknown as Identifiable[]
    const index = list.findIndex((entry) => entry.id === item.id)
    if (index >= 0) list[index] = item
    else list.push(item)
  }

  function remove(collection: CollectionKey, id: string) {
    const list = data.value[collection] as unknown as Identifiable[]
    ;(data.value as unknown as Record<CollectionKey, Identifiable[]>)[collection] = list.filter((item) => item.id !== id)
  }

  function upsertMedication(item: Medication) { upsert('medications', item) }
  function removeMedication(id: string) {
    remove('medications', id)
    data.value.medicationLogs = data.value.medicationLogs.filter((item) => item.medicationId !== id)
  }
  function toggleMedicationTaken(medicationId: string, time: string, date = today.value, status: 'taken' | 'late' | 'missed' | 'skipped' = 'taken') {
    const index = data.value.medicationLogs.findIndex((item) => item.medicationId === medicationId && item.time === time && item.date === date)
    if (index >= 0) data.value.medicationLogs.splice(index, 1)
    else data.value.medicationLogs.push({ id: createId('medlog'), medicationId, time, date, takenAt: new Date().toISOString(), status })
  }
  function isMedicationTaken(medicationId: string, time: string, date = today.value) {
    return data.value.medicationLogs.some((item) => item.medicationId === medicationId && item.time === time && item.date === date && item.status !== 'missed' && item.status !== 'skipped')
  }
  function updateMedicationStock(medicationId: string, delta: number) {
    const medication = data.value.medications.find((item) => item.id === medicationId)
    if (medication && medication.stock !== undefined) medication.stock = Math.max(0, medication.stock + delta)
  }

  function upsertRoutine(item: Routine) { upsert('routines', item) }
  function removeRoutine(id: string) { remove('routines', id); data.value.routineLogs = data.value.routineLogs.filter((item) => item.routineId !== id) }
  function toggleRoutineDone(routineId: string, date = today.value) {
    const index = data.value.routineLogs.findIndex((item) => item.routineId === routineId && item.date === date)
    if (index >= 0) data.value.routineLogs.splice(index, 1)
    else data.value.routineLogs.push({ id: createId('routine-log'), routineId, date, completedAt: new Date().toISOString() })
  }
  function isRoutineDone(routineId: string, date = today.value) { return data.value.routineLogs.some((item) => item.routineId === routineId && item.date === date) }

  function upsertExpense(item: Expense) { upsert('expenses', item) }
  function removeExpense(id: string) { remove('expenses', id) }
  function upsertHabit(item: Habit) { upsert('habits', item) }
  function removeHabit(id: string) { remove('habits', id) }
  function toggleHabit(habitId: string, date = today.value) {
    const habit = data.value.habits.find((item) => item.id === habitId)
    if (habit) habit.logs = habit.logs.includes(date) ? habit.logs.filter((item) => item !== date) : [...habit.logs, date]
  }

  function upsertCalendarEvent(item: CalendarEvent) { upsert('calendarEvents', item) }
  function removeCalendarEvent(id: string) { remove('calendarEvents', id) }

  function exportData() {
    const payload = { app: 'Vida Organizada', version: 2, exportedAt: new Date().toISOString(), data: data.value }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `vida-organizada-${today.value}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  async function importData(file: File) {
    const parsed = JSON.parse(await file.text()) as unknown
    const raw = typeof parsed === 'object' && parsed !== null && 'data' in parsed ? (parsed as { data: unknown }).data : parsed
    data.value = parseAppData(raw, defaultData())
  }
  function resetData() { data.value = defaultData() }

  return {
    data, now, today, currentDay, currentMonth, monthlyIncome, monthlyExpenses, monthlyBalance, todayExpenses,
    openTasks, lowStockItems, lowStockMedications, upsert, remove, upsertMedication, removeMedication,
    toggleMedicationTaken, isMedicationTaken, updateMedicationStock, upsertRoutine, removeRoutine,
    toggleRoutineDone, isRoutineDone, upsertExpense, removeExpense, upsertHabit, removeHabit, toggleHabit,
    upsertCalendarEvent, removeCalendarEvent, exportData, importData, resetData
  }
})
