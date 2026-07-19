import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { AppData, CalendarEvent, Expense, Habit, Medication, Routine } from '@/types/domain'
import { createId } from '@/utils/id'
import { monthKey, todayKey } from '@/utils/date'

const STORAGE_KEY = 'vida-organizada:v1'

const defaultData = (): AppData => ({
  medications: [],
  medicationLogs: [],
  routines: [],
  routineLogs: [],
  expenses: [],
  habits: [
    { id: createId('habit'), title: 'Tomar agua', icon: 'pi pi-bolt', targetPerWeek: 7, color: '#06b6d4', logs: [] },
    { id: createId('habit'), title: 'Mover el cuerpo', icon: 'pi pi-heart', targetPerWeek: 4, color: '#f97316', logs: [] }
  ],
  calendarEvents: [],
  settings: { displayName: 'Lautaro', currency: 'ARS', darkMode: false, notificationsEnabled: false }
})

const loadInitialData = (): AppData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? { ...defaultData(), ...JSON.parse(stored) } : defaultData()
  } catch {
    return defaultData()
  }
}

export const useAppStore = defineStore('app', () => {
  const data = ref<AppData>(loadInitialData())
  watch(data, (value) => localStorage.setItem(STORAGE_KEY, JSON.stringify(value)), { deep: true })
  watch(() => data.value.settings.darkMode, (enabled) => document.documentElement.classList.toggle('app-dark', enabled), { immediate: true })

  const today = computed(todayKey)
  const monthlyExpenses = computed(() => data.value.expenses.filter((item) => item.date.startsWith(monthKey())).reduce((sum, item) => sum + item.amount, 0))
  const todayExpenses = computed(() => data.value.expenses.filter((item) => item.date === today.value).reduce((sum, item) => sum + item.amount, 0))

  function upsertMedication(item: Medication) {
    const index = data.value.medications.findIndex((entry) => entry.id === item.id)
    if (index >= 0) data.value.medications[index] = item
    else data.value.medications.push(item)
  }
  function removeMedication(id: string) {
    data.value.medications = data.value.medications.filter((item) => item.id !== id)
    data.value.medicationLogs = data.value.medicationLogs.filter((item) => item.medicationId !== id)
  }
  function toggleMedicationTaken(medicationId: string, time: string, date = today.value) {
    const index = data.value.medicationLogs.findIndex((item) => item.medicationId === medicationId && item.time === time && item.date === date)
    if (index >= 0) data.value.medicationLogs.splice(index, 1)
    else data.value.medicationLogs.push({ id: createId('medlog'), medicationId, time, date, takenAt: new Date().toISOString() })
  }
  function isMedicationTaken(medicationId: string, time: string, date = today.value) {
    return data.value.medicationLogs.some((item) => item.medicationId === medicationId && item.time === time && item.date === date)
  }

  function upsertRoutine(item: Routine) {
    const index = data.value.routines.findIndex((entry) => entry.id === item.id)
    if (index >= 0) data.value.routines[index] = item
    else data.value.routines.push(item)
  }
  function removeRoutine(id: string) {
    data.value.routines = data.value.routines.filter((item) => item.id !== id)
    data.value.routineLogs = data.value.routineLogs.filter((item) => item.routineId !== id)
  }
  function toggleRoutineDone(routineId: string, date = today.value) {
    const index = data.value.routineLogs.findIndex((item) => item.routineId === routineId && item.date === date)
    if (index >= 0) data.value.routineLogs.splice(index, 1)
    else data.value.routineLogs.push({ id: createId('routine-log'), routineId, date, completedAt: new Date().toISOString() })
  }
  function isRoutineDone(routineId: string, date = today.value) {
    return data.value.routineLogs.some((item) => item.routineId === routineId && item.date === date)
  }

  function upsertExpense(item: Expense) {
    const index = data.value.expenses.findIndex((entry) => entry.id === item.id)
    if (index >= 0) data.value.expenses[index] = item
    else data.value.expenses.push(item)
  }
  function removeExpense(id: string) { data.value.expenses = data.value.expenses.filter((item) => item.id !== id) }

  function upsertHabit(item: Habit) {
    const index = data.value.habits.findIndex((entry) => entry.id === item.id)
    if (index >= 0) data.value.habits[index] = item
    else data.value.habits.push(item)
  }
  function removeHabit(id: string) { data.value.habits = data.value.habits.filter((item) => item.id !== id) }
  function toggleHabit(habitId: string, date = today.value) {
    const habit = data.value.habits.find((item) => item.id === habitId)
    if (!habit) return
    habit.logs = habit.logs.includes(date) ? habit.logs.filter((item) => item !== date) : [...habit.logs, date]
  }

  function upsertCalendarEvent(item: CalendarEvent) {
    const index = data.value.calendarEvents.findIndex((entry) => entry.id === item.id)
    if (index >= 0) data.value.calendarEvents[index] = item
    else data.value.calendarEvents.push(item)
  }
  function removeCalendarEvent(id: string) { data.value.calendarEvents = data.value.calendarEvents.filter((item) => item.id !== id) }

  function exportData() {
    const blob = new Blob([JSON.stringify(data.value, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `vida-organizada-${today.value}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  async function importData(file: File) { data.value = { ...defaultData(), ...(JSON.parse(await file.text()) as AppData) } }
  function resetData() { data.value = defaultData() }

  return { data, today, monthlyExpenses, todayExpenses, upsertMedication, removeMedication, toggleMedicationTaken, isMedicationTaken, upsertRoutine, removeRoutine, toggleRoutineDone, isRoutineDone, upsertExpense, removeExpense, upsertHabit, removeHabit, toggleHabit, upsertCalendarEvent, removeCalendarEvent, exportData, importData, resetData }
})
