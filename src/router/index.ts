import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: () => import('@/features/dashboard/DashboardView.vue'), meta: { title: 'Inicio' } },
    { path: '/calendario', name: 'calendar', component: () => import('@/features/calendar/CalendarView.vue'), meta: { title: 'Calendario' } },
    { path: '/medicacion', name: 'medications', component: () => import('@/features/medications/MedicationsView.vue'), meta: { title: 'Medicación' } },
    { path: '/rutinas', name: 'routines', component: () => import('@/features/routines/RoutinesView.vue'), meta: { title: 'Rutinas' } },
    { path: '/gastos', name: 'expenses', component: () => import('@/features/expenses/ExpensesView.vue'), meta: { title: 'Gastos' } },
    { path: '/habitos', name: 'habits', component: () => import('@/features/habits/HabitsView.vue'), meta: { title: 'Hábitos' } },
    { path: '/configuracion', name: 'settings', component: () => import('@/features/settings/SettingsView.vue'), meta: { title: 'Configuración' } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
})

router.afterEach((to) => {
  document.title = `${String(to.meta.title ?? 'Vida Organizada')} · Vida Organizada`
})

export default router
