import { onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { todayKey } from '@/utils/date'

const NOTIFIED_KEY = 'vida-organizada:medication-reminders:v1'

function readNotified(today: string): Set<string> {
  try {
    const stored = JSON.parse(localStorage.getItem(NOTIFIED_KEY) ?? '[]')
    if (!Array.isArray(stored)) return new Set()
    return new Set(stored.filter((value): value is string => typeof value === 'string' && value.startsWith(`${today}:`)))
  } catch {
    return new Set()
  }
}

function saveNotified(values: Set<string>) {
  try {
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify([...values]))
  } catch {
    // El recordatorio puede repetirse si el navegador bloquea el almacenamiento.
  }
}

async function showReminder(title: string, body: string, tag: string) {
  const options: NotificationOptions = {
    body,
    tag,
    icon: `${import.meta.env.BASE_URL}pwa-icon.svg`,
    badge: `${import.meta.env.BASE_URL}favicon.svg`
  }

  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.showNotification(title, options)
      return
    }
  }

  new Notification(title, options)
}

export function useMedicationReminders() {
  const store = useAppStore()
  let timer: number | undefined

  async function checkReminders() {
    if (!store.data.settings.notificationsEnabled || !('Notification' in window) || Notification.permission !== 'granted') return

    const now = new Date()
    const date = todayKey(now)
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const notified = readNotified(date)

    const due = store.data.medications.filter((medication) =>
      medication.active &&
      medication.days.includes(now.getDay()) &&
      medication.times.includes(time) &&
      !store.isMedicationTaken(medication.id, time, date)
    )

    for (const medication of due) {
      const reminderId = `${date}:${medication.id}:${time}`
      if (notified.has(reminderId)) continue

      try {
        await showReminder(`Es hora de ${medication.name}`, `${medication.dose}${medication.notes ? ` · ${medication.notes}` : ''}`, reminderId)
        notified.add(reminderId)
      } catch (error) {
        console.error('No se pudo mostrar el recordatorio de medicación.', error)
      }
    }

    saveNotified(notified)
  }

  onMounted(() => {
    void checkReminders()
    timer = window.setInterval(() => void checkReminders(), 30_000)
  })

  onUnmounted(() => {
    if (timer !== undefined) window.clearInterval(timer)
  })

  watch(
    () => store.data.settings.notificationsEnabled,
    (enabled) => { if (enabled) void checkReminders() }
  )
}
