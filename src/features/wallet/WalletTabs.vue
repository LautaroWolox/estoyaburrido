<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
const tabs = [
  { label: 'Resumen', icon: 'pi pi-wallet', to: '/billetera' },
  { label: 'Tarjetas', icon: 'pi pi-credit-card', to: '/billetera/tarjetas' },
  { label: 'SUBE y transporte', icon: 'pi pi-ticket', to: '/billetera/sube' },
  { label: 'Seguridad', icon: 'pi pi-shield', to: '/billetera/seguridad' }
]
const active = (to: string) => to === '/billetera' ? route.path === to : route.path.startsWith(to)
</script>

<template>
  <nav class="module-tabs wallet-tabs" aria-label="Secciones de billetera">
    <RouterLink v-for="item in tabs" :key="item.to" :to="item.to" :class="['module-tab', { active: active(item.to) }]">
      <i :class="item.icon" /><span>{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>
