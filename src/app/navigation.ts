export interface NavigationItem {
  label: string
  icon: string
  to: string
  shortLabel?: string
}

export const navigation: NavigationItem[] = [
  { label: 'Inicio', shortLabel: 'Inicio', icon: 'pi pi-home', to: '/' },
  { label: 'Calendario', shortLabel: 'Agenda', icon: 'pi pi-calendar', to: '/calendario' },
  { label: 'Medicación', shortLabel: 'Pastillas', icon: 'pi pi-heart-fill', to: '/medicacion' },
  { label: 'Rutinas', shortLabel: 'Rutinas', icon: 'pi pi-list-check', to: '/rutinas' },
  { label: 'Gastos', shortLabel: 'Gastos', icon: 'pi pi-wallet', to: '/gastos' },
  { label: 'Hábitos', shortLabel: 'Hábitos', icon: 'pi pi-chart-line', to: '/habitos' },
  { label: 'Configuración', shortLabel: 'Ajustes', icon: 'pi pi-cog', to: '/configuracion' }
]
