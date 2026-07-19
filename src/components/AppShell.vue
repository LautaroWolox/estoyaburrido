<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import Avatar from 'primevue/avatar'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import { bottomNavigation, navigationSections } from '@/app/navigation'
import { useAutoLock } from '@/composables/useAutoLock'
import { useMedicationReminders } from '@/composables/useMedicationReminders'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const confirm = useConfirm()
const store = useAppStore()
const auth = useAuthStore()
const mobileMenuVisible = ref(false)
const displayName = computed(() => auth.currentUser?.displayName || store.data.settings.displayName || 'Mi perfil')
const email = computed(() => auth.currentUser?.email || 'Sesión local')
const initials = computed(() => displayName.value.trim().slice(0, 2).toUpperCase() || 'VO')
const isActive = (to: string) => to === '/' ? route.path === '/' : route.path === to || route.path.startsWith(`${to}/`)
useMedicationReminders()
useAutoLock()

function logout() {
  confirm.require({
    message: 'Vas a cerrar la sesión de este dispositivo. Tus datos locales no se borrarán.',
    header: 'Cerrar sesión',
    icon: 'pi pi-sign-out',
    rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Cerrar sesión', severity: 'danger' },
    accept: async () => {
      mobileMenuVisible.value = false
      auth.signOut()
      await router.replace('/login')
    }
  })
}
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink to="/" class="brand">
        <span class="brand__mark"><i class="pi pi-sparkles" /></span>
        <span><strong>Vida Organizada</strong><small>Todo tu día, en orden</small></span>
      </RouterLink>

      <div class="sidebar-scroll">
        <section v-for="section in navigationSections" :key="section.label" class="nav-section">
          <span class="nav-section__label">{{ section.label }}</span>
          <nav>
            <RouterLink v-for="item in section.items" :key="item.to" :to="item.to" :class="['nav-link', { 'nav-link--active': isActive(item.to) }]">
              <i :class="item.icon" /><span>{{ item.label }}</span>
            </RouterLink>
          </nav>
        </section>
      </div>

      <div class="sidebar__profile">
        <Avatar :label="initials" shape="circle" />
        <div><strong>{{ displayName }}</strong><small>{{ email }}</small></div>
        <Button icon="pi pi-sign-out" text rounded severity="secondary" aria-label="Cerrar sesión" @click="logout" />
      </div>
    </aside>

    <header class="mobile-header">
      <Button icon="pi pi-bars" text rounded aria-label="Abrir menú" @click="mobileMenuVisible = true" />
      <RouterLink to="/" class="mobile-brand"><i class="pi pi-sparkles" /><strong>Vida</strong></RouterLink>
      <RouterLink to="/configuracion" aria-label="Abrir configuración"><Avatar :label="initials" shape="circle" size="small" /></RouterLink>
    </header>

    <main class="app-main"><RouterView /></main>

    <nav class="bottom-nav" aria-label="Navegación móvil">
      <RouterLink v-for="item in bottomNavigation" :key="item.to" :to="item.to" :class="['bottom-nav__item', { 'bottom-nav__item--active': isActive(item.to) }]">
        <i :class="item.icon" /><span>{{ item.shortLabel }}</span>
      </RouterLink>
    </nav>

    <Drawer v-model:visible="mobileMenuVisible" header="Vida Organizada" position="left" class="mobile-drawer">
      <div class="drawer-account">
        <Avatar :label="initials" shape="circle" />
        <div><strong>{{ displayName }}</strong><small>{{ email }}</small></div>
      </div>
      <section v-for="section in navigationSections" :key="section.label" class="nav-section">
        <span class="nav-section__label">{{ section.label }}</span>
        <nav>
          <RouterLink v-for="item in section.items" :key="item.to" :to="item.to" :class="['nav-link', { 'nav-link--active': isActive(item.to) }]" @click="mobileMenuVisible = false">
            <i :class="item.icon" /><span>{{ item.label }}</span>
          </RouterLink>
        </nav>
      </section>
      <Button label="Cerrar sesión" icon="pi pi-sign-out" severity="danger" outlined class="drawer-logout" @click="logout" />
    </Drawer>
  </div>
</template>
