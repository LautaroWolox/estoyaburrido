import { onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const activityEvents: Array<keyof WindowEventMap> = ['pointerdown', 'keydown', 'touchstart', 'scroll']

export function useAutoLock() {
  const store = useAppStore()
  const auth = useAuthStore()
  const router = useRouter()
  let lastActivity = Date.now()
  let timer: number | undefined
  let locking = false

  const touch = () => { lastActivity = Date.now() }

  async function lock(reason: 'timeout' | 'background') {
    if (locking || !auth.isAuthenticated) return
    locking = true
    auth.signOut()
    await router.replace({ path: '/login', query: { reason } })
    locking = false
  }

  function check() {
    const minutes = store.data.settings.walletAutoLockMinutes
    if (!auth.isAuthenticated || minutes <= 0) return
    if (Date.now() - lastActivity >= minutes * 60_000) void lock('timeout')
  }

  function visibilityChanged() {
    if (document.hidden && store.data.settings.walletLockOnBackground) {
      void lock('background')
      return
    }
    if (!document.hidden) touch()
  }

  onMounted(() => {
    activityEvents.forEach((event) => window.addEventListener(event, touch, { passive: true }))
    document.addEventListener('visibilitychange', visibilityChanged)
    timer = window.setInterval(check, 15_000)
  })

  onUnmounted(() => {
    activityEvents.forEach((event) => window.removeEventListener(event, touch))
    document.removeEventListener('visibilitychange', visibilityChanged)
    if (timer !== undefined) window.clearInterval(timer)
  })
}
