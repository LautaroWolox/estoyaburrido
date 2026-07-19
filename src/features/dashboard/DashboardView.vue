<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAppStore } from '@/stores/app'
import { formatCurrency, formatDate, weekDays } from '@/utils/date'

const store = useAppStore()
const day = new Date().getDay()
const medications = computed(() => store.data.medications.filter((item) => item.active && item.days.includes(day)).flatMap((item) => item.times.map((time) => ({ item, time }))).sort((a, b) => a.time.localeCompare(b.time)))
const routines = computed(() => store.data.routines.filter((item) => item.active && item.days.includes(day)).sort((a, b) => a.startTime.localeCompare(b.startTime)))
const completed = computed(() => medications.value.filter(({ item, time }) => store.isMedicationTaken(item.id, time)).length + routines.value.filter((item) => store.isRoutineDone(item.id)).length)
const total = computed(() => medications.value.length + routines.value.length)
const progress = computed(() => total.value ? Math.round(completed.value / total.value * 100) : 0)
const events = computed(() => [...store.data.calendarEvents].filter((item) => item.date >= store.today).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 5))
const weekKeys = computed(() => weekDays().map((date) => date.toISOString().slice(0, 10)))
const habitLogs = computed(() => store.data.habits.reduce((sum, habit) => sum + habit.logs.filter((date) => weekKeys.value.includes(date)).length, 0))
</script>

<template>
  <section class="page-container">
    <PageHeader eyebrow="Resumen de hoy" :title="`Hola, ${store.data.settings.displayName || 'bienvenido'}`" description="Todo lo importante de tu día, en un solo lugar.">
      <RouterLink to="/calendario"><Button label="Ver calendario" icon="pi pi-calendar" /></RouterLink>
    </PageHeader>

    <div class="hero-card">
      <div><span>{{ formatDate(store.today, "EEEE d 'de' MMMM") }}</span><h2>{{ progress === 100 && total ? '¡Día completado!' : 'Avanzá a tu ritmo' }}</h2><p>{{ completed }} de {{ total }} actividades principales completadas.</p></div>
      <div class="hero-progress"><strong>{{ progress }}%</strong><ProgressBar :value="progress" :show-value="false" /></div>
    </div>

    <div class="stats-grid">
      <Card class="stat-card"><template #content><i class="pi pi-heart-fill rose"/><span>Medicaciones</span><strong>{{ medications.filter(({ item, time }) => store.isMedicationTaken(item.id, time)).length }}/{{ medications.length }}</strong><small>tomas de hoy</small></template></Card>
      <Card class="stat-card"><template #content><i class="pi pi-list-check violet"/><span>Rutinas</span><strong>{{ routines.filter((item) => store.isRoutineDone(item.id)).length }}/{{ routines.length }}</strong><small>completadas hoy</small></template></Card>
      <Card class="stat-card"><template #content><i class="pi pi-wallet green"/><span>Gastos del mes</span><strong>{{ formatCurrency(store.monthlyExpenses, store.data.settings.currency) }}</strong><small>hoy: {{ formatCurrency(store.todayExpenses, store.data.settings.currency) }}</small></template></Card>
      <Card class="stat-card"><template #content><i class="pi pi-chart-line blue"/><span>Hábitos</span><strong>{{ habitLogs }}</strong><small>registros semanales</small></template></Card>
    </div>

    <div class="two-columns">
      <Card class="content-card"><template #title><div class="card-title"><span>Plan de hoy</span><RouterLink to="/rutinas">Ver todo</RouterLink></div></template><template #content>
        <div v-if="medications.length || routines.length" class="timeline-list">
          <button v-for="entry in medications" :key="`${entry.item.id}-${entry.time}`" :class="['timeline-item', { done: store.isMedicationTaken(entry.item.id, entry.time) }]" @click="store.toggleMedicationTaken(entry.item.id, entry.time)"><b>{{ entry.time }}</b><i class="dot" :style="{ background: entry.item.color }"/><span><strong>{{ entry.item.name }}</strong><small>{{ entry.item.dose }}</small></span><i :class="store.isMedicationTaken(entry.item.id, entry.time) ? 'pi pi-check-circle' : 'pi pi-circle'"/></button>
          <button v-for="routine in routines" :key="routine.id" :class="['timeline-item', { done: store.isRoutineDone(routine.id) }]" @click="store.toggleRoutineDone(routine.id)"><b>{{ routine.startTime }}</b><i class="dot" :style="{ background: routine.color }"/><span><strong>{{ routine.title }}</strong><small>{{ routine.durationMinutes }} min · {{ routine.category }}</small></span><i :class="store.isRoutineDone(routine.id) ? 'pi pi-check-circle' : 'pi pi-circle'"/></button>
        </div>
        <EmptyState v-else icon="pi pi-sun" title="Tu día está libre" description="Agregá medicaciones o rutinas para verlas acá."/>
      </template></Card>

      <Card class="content-card"><template #title><div class="card-title"><span>Próximos eventos</span><RouterLink to="/calendario">Agenda</RouterLink></div></template><template #content>
        <div v-if="events.length" class="event-list"><div v-for="event in events" :key="event.id" class="event-row"><span class="date-box"><strong>{{ formatDate(event.date, 'dd') }}</strong><small>{{ formatDate(event.date, 'MMM') }}</small></span><span><strong>{{ event.title }}</strong><small>{{ event.time || 'Todo el día' }}</small></span><Tag :value="event.kind === 'appointment' ? 'Turno' : event.kind === 'task' ? 'Tarea' : 'Personal'" rounded/></div></div>
        <EmptyState v-else icon="pi pi-calendar-plus" title="Sin eventos próximos" description="Usá el calendario para registrar turnos, tareas y compromisos."/>
      </template></Card>
    </div>
  </section>
</template>
