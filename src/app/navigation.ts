export interface NavigationItem {
  label: string
  icon: string
  to: string
  shortLabel?: string
}

export interface NavigationSection {
  label: string
  items: NavigationItem[]
}

export const navigationSections: NavigationSection[] = [
  {
    label: 'Principal',
    items: [
      { label: 'Inicio', shortLabel: 'Inicio', icon: 'pi pi-home', to: '/' },
      { label: 'Calendario', shortLabel: 'Agenda', icon: 'pi pi-calendar', to: '/calendario' },
      { label: 'Tareas', shortLabel: 'Tareas', icon: 'pi pi-check-square', to: '/tareas' }
    ]
  },
  {
    label: 'Vida personal',
    items: [
      { label: 'Salud', shortLabel: 'Salud', icon: 'pi pi-heart', to: '/salud' },
      { label: 'Billetera', shortLabel: 'Billetera', icon: 'pi pi-credit-card', to: '/billetera' },
      { label: 'Finanzas', shortLabel: 'Dinero', icon: 'pi pi-wallet', to: '/finanzas' },
      { label: 'Hogar', shortLabel: 'Hogar', icon: 'pi pi-home', to: '/hogar' }
    ]
  },
  {
    label: 'Constancia',
    items: [
      { label: 'Rutinas', icon: 'pi pi-list-check', to: '/rutinas' },
      { label: 'Hábitos', icon: 'pi pi-chart-line', to: '/habitos' },
      { label: 'Enfoque', icon: 'pi pi-stopwatch', to: '/enfoque' }
    ]
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Configuración', icon: 'pi pi-cog', to: '/configuracion' }
    ]
  }
]

export const navigation = navigationSections.flatMap((section) => section.items)
export const bottomNavigation = navigation.filter((item) => ['/', '/calendario', '/tareas', '/salud', '/billetera'].includes(item.to))
