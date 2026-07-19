import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'dashboard', component: () => import('@/features/dashboard/DashboardView.vue'), meta: { title: 'Inicio' } },
    { path: '/calendario', name: 'calendar', component: () => import('@/features/calendar/CalendarView.vue'), meta: { title: 'Calendario' } },
    { path: '/tareas', name: 'tasks', component: () => import('@/features/tasks/TasksView.vue'), meta: { title: 'Tareas' } },
    { path: '/enfoque', name: 'focus', component: () => import('@/features/tasks/FocusView.vue'), meta: { title: 'Enfoque' } },
    { path: '/salud', name: 'health', component: () => import('@/features/health/HealthDashboard.vue'), meta: { title: 'Salud' } },
    { path: '/salud/medicacion', name: 'medications', component: () => import('@/features/health/MedicationsView.vue'), meta: { title: 'Medicación' } },
    { path: '/salud/turnos', name: 'medical-records', component: () => import('@/features/health/MedicalRecordsView.vue'), meta: { title: 'Turnos y documentos' } },
    { path: '/salud/seguimiento', name: 'wellbeing', component: () => import('@/features/health/WellbeingView.vue'), meta: { title: 'Seguimiento de salud' } },
    { path: '/medicacion', redirect: '/salud/medicacion' },
    { path: '/finanzas', name: 'finance', component: () => import('@/features/finance/FinanceDashboard.vue'), meta: { title: 'Finanzas' } },
    { path: '/finanzas/movimientos', name: 'transactions', component: () => import('@/features/finance/TransactionsView.vue'), meta: { title: 'Movimientos' } },
    { path: '/finanzas/presupuestos', name: 'budgets', component: () => import('@/features/finance/BudgetsView.vue'), meta: { title: 'Presupuestos' } },
    { path: '/finanzas/compromisos', name: 'commitments', component: () => import('@/features/finance/CommitmentsView.vue'), meta: { title: 'Compromisos' } },
    { path: '/finanzas/metas', name: 'goals-debts', component: () => import('@/features/finance/GoalsDebtsView.vue'), meta: { title: 'Metas y deudas' } },
    { path: '/gastos', redirect: '/finanzas/movimientos' },
    { path: '/hogar', name: 'home', component: () => import('@/features/home/HomeDashboard.vue'), meta: { title: 'Hogar' } },
    { path: '/hogar/compras', name: 'shopping', component: () => import('@/features/home/ShoppingView.vue'), meta: { title: 'Compras' } },
    { path: '/hogar/inventario', name: 'inventory', component: () => import('@/features/home/InventoryView.vue'), meta: { title: 'Inventario' } },
    { path: '/hogar/mantenimiento', name: 'maintenance', component: () => import('@/features/home/MaintenanceView.vue'), meta: { title: 'Mantenimiento' } },
    { path: '/rutinas', name: 'routines', component: () => import('@/features/routines/RoutinesView.vue'), meta: { title: 'Rutinas' } },
    { path: '/habitos', name: 'habits', component: () => import('@/features/habits/HabitsView.vue'), meta: { title: 'Hábitos' } },
    { path: '/configuracion', name: 'settings', component: () => import('@/features/settings/SettingsView.vue'), meta: { title: 'Configuración' } },
    { path: '/:pathMatch(.*)*', redirect: '/' }
  ],
  scrollBehavior: () => ({ top: 0 })
})

router.afterEach((to) => { document.title = `${String(to.meta.title ?? 'Vida Organizada')} · Vida Organizada` })
export default router
