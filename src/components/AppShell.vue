<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import Avatar from 'primevue/avatar'
import { navigation } from '@/app/navigation'
import { useMedicationReminders } from '@/composables/useMedicationReminders'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const store = useAppStore()
const mobileMenuVisible = ref(false)
const visibleBottomItems = navigation.slice(0, 5)
const initials = computed(() => store.data.settings.displayName.trim().slice(0, 2).toUpperCase() || 'VO')
const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

useMedicationReminders()
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink to="/" class="brand">
        <span class="brand__mark"><i class="pi pi-sparkles" /></span>
        <span><strong>Vida Organizada</strong><small>Tu centro personal</small></span>
      </RouterLink>
      <nav class="sidebar__nav" aria-label="Navegación principal">
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" :class="['nav-link', { 'nav-link--active': isActive(item.to) }]">
          <i :class="item.icon" /><span>{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="sidebar__profile">
        <Avatar :label="initials" shape="circle" />
        <div><strong>{{ store.data.settings.displayName || 'Mi perfil' }}</strong><small>Datos guardados localmente</small></div>
      </div>
    </aside>

    <header class="mobile-header">
      <Button icon="pi pi-bars" text rounded aria-label="Abrir menú" @click="mobileMenuVisible = true" />
      <RouterLink to="/" class="mobile-brand"><i class="pi pi-sparkles" /><strong>Vida Organizada</strong></RouterLink>
      <Avatar :label="initials" shape="circle" size="small" />
    </header>

    <main class="app-main"><RouterView /></main>

    <nav class="bottom-nav" aria-label="Navegación móvil">
      <RouterLink v-for="item in visibleBottomItems" :key="item.to" :to="item.to" :class="['bottom-nav__item', { 'bottom-nav__item--active': isActive(item.to) }]">
        <i :class="item.icon" /><span>{{ item.shortLabel }}</span>
      </RouterLink>
    </nav>

    <Drawer v-model:visible="mobileMenuVisible" header="Vida Organizada" position="left" class="mobile-drawer">
      <nav class="drawer-nav">
        <RouterLink v-for="item in navigation" :key="item.to" :to="item.to" :class="['nav-link', { 'nav-link--active': isActive(item.to) }]" @click="mobileMenuVisible = false">
          <i :class="item.icon" /><span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </Drawer>
  </div>
</template>
