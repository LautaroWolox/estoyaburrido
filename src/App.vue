<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import AppShell from '@/components/AppShell.vue'
import { useAppStore } from '@/stores/app'

const route = useRoute()
useAppStore()
const usesAuthLayout = computed(() => route.meta.layout === 'auth')
</script>

<template>
  <Toast position="top-right" />
  <ConfirmDialog />
  <RouterView v-if="usesAuthLayout" />
  <AppShell v-else />
</template>
