import { onMounted, onUnmounted, watch } from 'vue'
import { differenceInCalendarMonths, differenceInCalendarWeeks, format, parseISO } from 'date-fns'
import { useAppStore } from '@/stores/app'
import type { CalendarEvent } from '@/types/domain'
import { todayKey } from '@/utils/date'

const NOTIFIED_KEY = 'vida-organizada:reminders:v2'

function readNotified(today: string): Set<string> {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '[]')
    return Array.isArray(stored) ? new Set(stored.filter((value): value is string => typeof value === 'string' && value.startsWith(`${today}:`))) : new Set()
  } catch { return new Set() }
}
function saveNotified(values: Set<string>) { try { localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...values])) } catch { /* sin almacenamiento, el navegador puede repetir */ } }

async function showReminder(title: string, body: string, tag: string) {
  const options: NotificationOptions = { body, tag, icon: `${import.meta.env.BASE_URL}pwa-icon.svg`, badge: `${import.meta.env.BASE_URL}favicon.svg` }
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) { await registration.showNotification(title, options); return }
  }
  new Notification(title, options)
}

function minutesOf(time: string) { const [hours, minutes] = time.split(':').map(Number); return hours * 60 + minutes }
function isOccurrenceToday(event: CalendarEvent, today: Date) {
  const start = parseISO(event.date)
  if (today < start) return false
  if (event.recurrenceUntil && today > parseISO(event.recurrenceUntil)) return false
  const recurrence = event.recurrence ?? 'none'
  if (recurrence === 'none') return format(start, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  if (recurrence === 'daily') return true
  if (recurrence === 'weekly') return differenceInCalendarWeeks(today, start, { weekStartsOn: 1 }) >= 0 && today.getDay() === start.getDay()
  if (recurrence === 'monthly') return differenceInCalendarMonths(today, start) >= 0 && today.getDate() === start.getDate()
  return today.getMonth() === start.getMonth() && today.getDate() === start.getDate()
}

export function useMedicationReminders() {
  const store = useAppStore()
  let timer: number | undefined

  async function notifyOnce(notified: Set<string>, id: string, title: string, body: string) {
    if (notified.has(id)) return
    try { await showReminder(title, body, id); notified.add(id) }
    catch (error) { console.error('No se pudo mostrar un recordatorio.', error) }
  }

  async function checkReminders() {
    if (!store.data.settings.notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') return
    const now = new Date(); const date = todayKey(now); const currentMinutes = now.getHours() * 60 + now.getMinutes(); const notified = readNotified(date)

    for (const medication of store.data.medications.filter(item => item.active && item.days.includes(now.getDay()))) {
      for (const time of medication.times) {
        if (minutesOf(time) !== currentMinutes || store.isMedicationTaken(medication.id, time, date)) continue
        await notifyOnce(notified, `${date}:medication:${medication.id}:${time}`, `Es hora de ${medication.name}`, `${medication.dose}${medication.notes ? ` · ${medication.notes}` : ''}`)
      }
    }

    for (const event of store.data.calendarEvents.filter(item => !item.allDay && item.time && isOccurrenceToday(item, now))) {
      for (const reminder of event.reminderMinutes ?? []) {
        if (minutesOf(event.time) - currentMinutes !== reminder) continue
        const when = reminder === 0 ? 'Ahora' : `En ${reminder < 60 ? `${reminder} minutos` : reminder === 60 ? '1 hora' : '1 día'}`
        await notifyOnce(notified, `${date}:event:${event.id}:${reminder}`, event.title, `${when}${event.location ? ` · ${event.location}` : ''}`)
      }
    }

    for (const task of store.data.tasks.filter(item => item.status !== 'done' && item.dueDate === date && item.dueTime)) {
      const reminder = task.reminderMinutes ?? 0
      if (minutesOf(task.dueTime) - currentMinutes !== reminder) continue
      await notifyOnce(notified, `${date}:task:${task.id}:${reminder}`, `Tarea: ${task.title}`, reminder ? `Vence en ${reminder} minutos` : 'Es momento de hacerla')
    }

    saveNotified(notified)
  }

  onMounted(() => { void checkReminders(); timer = window.setInterval(() => void checkReminders(), 30_000) })
  onUnmounted(() => { if (timer !== undefined) window.clearInterval(timer) })
  watch(() => store.data.settings.notificationsEnabled, enabled => { if (enabled) void checkReminders() })
}
