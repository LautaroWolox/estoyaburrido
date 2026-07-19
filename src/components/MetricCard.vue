<script setup lang="ts">
defineProps<{ label: string; value: string | number; helper?: string; icon: string; tone?: 'violet' | 'blue' | 'green' | 'amber' | 'rose' }>()
</script>

<template>
  <article class="metric-card">
    <span :class="['metric-card__icon', tone ?? 'violet']"><i :class="icon" /></span>
    <div><small>{{ label }}</small><strong>{{ value }}</strong><p v-if="helper">{{ helper }}</p></div>
  </article>
</template>
