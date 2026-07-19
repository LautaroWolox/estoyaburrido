import { computed, onScopeDispose, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type {
  AppData,
  CalendarEvent,
  CardPurchase,
  Expense,
  Habit,
  Medication,
  Routine,
  SubeMovement
} from '@/types/domain'
import { createId } from '@/utils/id'
import { monthKey, todayKey } from '@/utils/date'
import { parseAppData } from '@/utils/appData'

const STORAGE_KEY = 'vida-organizada:v3'
const LEGACY_KEYS = ['vida-organizada:v2', 'vida-organizada:v1']

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
  paymentCards: [], cardPurchases: [], cardStatements: [], subeCards: [], subeMovements: [],
  settings: {
    displayName: 'Lautaro',
    currency: 'ARS',
    darkMode: false,
    notificationsEnabled: false,
    walletHideAmounts: false,
    walletAutoLockMinutes: 15,
    walletLockOnBackground: false,
    walletRequirePassword: true,
    walletMaskSubeNumber: true
  }
})

const loadInitialData = (): AppData => {
  const fallback = defaultData()
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
      ?? LEGACY_KEYS.map((key) => localStorage.getItem(key)).find((value) => value !== null)
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
  const walletCreditLimit = computed(() => data.value.paymentCards.filter((item) => item.type === 'credit' && item.status === 'active').reduce((sum, item) => sum + item.creditLimit, 0))
  const walletAvailableLimit = computed(() => data.value.paymentCards.filter((item) => item.type === 'credit' && item.status === 'active').reduce((sum, item) => sum + item.availableLimit, 0))
  const walletCurrentDebt = computed(() => Math.max(0, walletCreditLimit.value - walletAvailableLimit.value))
  const totalSubeBalance = computed(() => data.value.subeCards.filter((item) => item.active).reduce((sum, item) => sum + item.balance, 0))
  const lowBalanceSubeCards = computed(() => data.value.subeCards.filter((item) => item.active && item.balance <= item.lowBalanceAlert))

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

  function recalculateCardLimit(cardId: string) {
    const card = data.value.paymentCards.find((item) => item.id === cardId)
    if (!card || card.type !== 'credit') return
    const consumed = data.value.cardPurchases
      .filter((item) => item.cardId === cardId && item.status !== 'refunded')
      .reduce((sum, item) => sum + item.amount, 0)
    card.availableLimit = Math.max(0, card.creditLimit - consumed)
  }

  function recordCardPurchase(purchase: CardPurchase, registerInFinance: boolean) {
    const previous = data.value.cardPurchases.find((item) => item.id === purchase.id)
    const financeId = previous?.financeTransactionId ?? purchase.financeTransactionId ?? (registerInFinance ? createId('transaction') : undefined)
    const saved = { ...purchase, financeTransactionId: financeId }
    upsert('cardPurchases', saved)
    recalculateCardLimit(saved.cardId)

    if (registerInFinance && financeId) {
      const card = data.value.paymentCards.find((item) => item.id === saved.cardId)
      const installmentAmount = saved.installments > 1 ? saved.amount / saved.installments : saved.amount
      upsert('transactions', {
        id: financeId,
        type: 'expense',
        title: saved.title,
        amount: installmentAmount,
        category: saved.category,
        date: saved.date,
        account: card?.account || card?.issuer || 'Billetera',
        paymentMethod: `${card?.network ?? 'Tarjeta'} •••• ${card?.last4 ?? ''}`.trim(),
        notes: saved.installments > 1 ? `${saved.currentInstallment}/${saved.installments} cuotas · ${saved.notes}`.trim() : saved.notes,
        tags: ['billetera', 'tarjeta'],
        cardId: saved.cardId
      })
    }
  }

  function removeCardPurchase(id: string) {
    const purchase = data.value.cardPurchases.find((item) => item.id === id)
    if (!purchase) return
    if (purchase.financeTransactionId) remove('transactions', purchase.financeTransactionId)
    remove('cardPurchases', id)
    recalculateCardLimit(purchase.cardId)
  }

  function removePaymentCard(id: string) {
    const transactionIds = data.value.cardPurchases.filter((item) => item.cardId === id).map((item) => item.financeTransactionId).filter((value): value is string => Boolean(value))
    data.value.transactions = data.value.transactions.filter((item) => !transactionIds.includes(item.id))
    data.value.cardPurchases = data.value.cardPurchases.filter((item) => item.cardId !== id)
    data.value.cardStatements = data.value.cardStatements.filter((item) => item.cardId !== id)
    remove('paymentCards', id)
  }

  function payCardStatement(statementId: string, amount: number) {
    const statement = data.value.cardStatements.find((item) => item.id === statementId)
    if (!statement) return
    statement.paidAmount = Math.min(statement.totalAmount, statement.paidAmount + Math.max(0, amount))
    if (statement.paidAmount >= statement.totalAmount) statement.status = 'paid'
  }

  function recordSubeMovement(movement: SubeMovement, registerInFinance: boolean) {
    const previous = data.value.subeMovements.find((item) => item.id === movement.id)
    const financeId = previous?.financeTransactionId ?? movement.financeTransactionId ?? (registerInFinance ? createId('transaction') : undefined)
    const card = data.value.subeCards.find((item) => item.id === movement.subeCardId)
    if (!card) return

    const previousDelta = previous ? (previous.type === 'topup' ? previous.amount : previous.type === 'trip' ? -previous.amount : previous.amount) : 0
    const nextDelta = movement.type === 'topup' ? movement.amount : movement.type === 'trip' ? -movement.amount : movement.amount
    card.balance = Math.max(0, card.balance - previousDelta + nextDelta)
    card.lastUpdated = `${movement.date}T${movement.time || '00:00'}:00`

    const saved = { ...movement, balanceAfter: card.balance, financeTransactionId: financeId }
    upsert('subeMovements', saved)

    if (registerInFinance && financeId) {
      upsert('transactions', {
        id: financeId,
        type: 'expense',
        title: movement.type === 'topup' ? `Carga ${card.nickname}` : `Viaje ${movement.line || movement.transport}`,
        amount: movement.amount,
        category: 'Transporte',
        date: movement.date,
        account: 'SUBE',
        paymentMethod: card.nickname,
        notes: movement.notes,
        tags: ['sube', 'transporte'],
        subeCardId: card.id
      })
    }
  }

  function removeSubeMovement(id: string) {
    const movement = data.value.subeMovements.find((item) => item.id === id)
    if (!movement) return
    const card = data.value.subeCards.find((item) => item.id === movement.subeCardId)
    if (card) {
      const delta = movement.type === 'topup' ? movement.amount : movement.type === 'trip' ? -movement.amount : movement.amount
      card.balance = Math.max(0, card.balance - delta)
    }
    if (movement.financeTransactionId) remove('transactions', movement.financeTransactionId)
    remove('subeMovements', id)
  }

  function removeSubeCard(id: string) {
    const transactionIds = data.value.subeMovements.filter((item) => item.subeCardId === id).map((item) => item.financeTransactionId).filter((value): value is string => Boolean(value))
    data.value.transactions = data.value.transactions.filter((item) => !transactionIds.includes(item.id))
    data.value.subeMovements = data.value.subeMovements.filter((item) => item.subeCardId !== id)
    remove('subeCards', id)
  }

  function exportData() {
    const payload = { app: 'Vida Organizada', version: 3, exportedAt: new Date().toISOString(), data: data.value }
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
    openTasks, lowStockItems, lowStockMedications, walletCreditLimit, walletAvailableLimit, walletCurrentDebt,
    totalSubeBalance, lowBalanceSubeCards, upsert, remove, upsertMedication, removeMedication,
    toggleMedicationTaken, isMedicationTaken, updateMedicationStock, upsertRoutine, removeRoutine,
    toggleRoutineDone, isRoutineDone, upsertExpense, removeExpense, upsertHabit, removeHabit, toggleHabit,
    upsertCalendarEvent, removeCalendarEvent, recordCardPurchase, removeCardPurchase, removePaymentCard,
    payCardStatement, recordSubeMovement, removeSubeMovement, removeSubeCard, exportData, importData, resetData
  }
})
