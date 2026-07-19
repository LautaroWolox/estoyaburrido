<script setup lang="ts">
import { useRoute } from 'vue-router'

export interface ModuleTab { label: string; icon: string; to: string; badge?: string | number }
defineProps<{ tabs: ModuleTab[] }>()
const route = useRoute()
const active = (to: string) => route.path === to || (to !== '/' && route.path.startsWith(`${to}/`))
</script>

<template>
  <nav class="module-tabs" aria-label="Secciones del módulo">
    <RouterLink v-for="tab in tabs" :key="tab.to" :to="tab.to" :class="['module-tab', { active: active(tab.to) }]">
      <i :class="tab.icon" />
      <span>{{ tab.label }}</span>
      <b v-if="tab.badge !== undefined">{{ tab.badge }}</b>
    </RouterLink>
  </nav>
</template>
