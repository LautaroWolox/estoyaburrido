<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import MetricCard from '@/components/MetricCard.vue'
import ModuleTabs from '@/components/ModuleTabs.vue'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useAppStore } from '@/stores/app'
import { formatDate } from '@/utils/date'
import { healthTabs } from './navigation'

const store=useAppStore()
const dosesToday=computed(()=>store.data.medications.filter(item=>item.active&&item.days.includes(store.currentDay)).flatMap(item=>item.times.map(time=>({item,time}))));const takenToday=computed(()=>dosesToday.value.filter(({item,time})=>store.isMedicationTaken(item.id,time)).length)
const appointments=computed(()=>[...store.data.medicalAppointments].filter(item=>item.status==='scheduled'&&item.date>=store.today).sort((a,b)=>`${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0,5))
const latestVitals=computed(()=>{const map=new Map<string,typeof store.data.vitalRecords[number]>();[...store.data.vitalRecords].sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).forEach(item=>{if(!map.has(item.type))map.set(item.type,item)});return [...map.values()].slice(0,6)})
const recentSymptoms=computed(()=>[...store.data.symptomLogs].sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)).slice(0,4))
const vitalLabel:Record<string,string>={weight:'Peso',pressure:'Presión',temperature:'Temperatura',glucose:'Glucosa',heartRate:'Pulso',sleep:'Sueño'}
</script>

<template><section class="page-container"><PageHeader eyebrow="Bienestar y seguimiento" title="Salud" description="Tu medicación, turnos, estudios y registros personales en una vista clara."><RouterLink to="/salud/medicacion"><Button label="Registrar medicación" icon="pi pi-plus"/></RouterLink></PageHeader><ModuleTabs :tabs="healthTabs"/>
<div class="metrics-grid"><MetricCard label="Tomas de hoy" :value="`${takenToday}/${dosesToday.length}`" helper="medicaciones programadas" icon="pi pi-check-circle" tone="green"/><MetricCard label="Stock bajo" :value="store.lowStockMedications.length" helper="medicaciones para reponer" icon="pi pi-exclamation-triangle" :tone="store.lowStockMedications.length?'amber':'blue'"/><MetricCard label="Próximos turnos" :value="appointments.length" helper="agendados desde hoy" icon="pi pi-calendar-plus" tone="violet"/><MetricCard label="Registros de síntomas" :value="store.data.symptomLogs.length" helper="historial total" icon="pi pi-chart-line" tone="rose"/></div>
<div class="health-banner"><span class="health-banner__icon"><i class="pi pi-heart-fill"/></span><div><span class="eyebrow">Recordatorio</span><h2>Tu información te ayuda a llegar mejor preparado a una consulta</h2><p>Registrá cambios, dudas y mediciones, pero usá esta aplicación solo como apoyo organizativo.</p></div><RouterLink to="/salud/seguimiento"><Button label="Agregar registro" icon="pi pi-plus" severity="secondary"/></RouterLink></div>
<div class="two-columns"><Card class="content-card"><template #title><div class="card-title"><span>Próximos turnos</span><RouterLink to="/salud/turnos">Administrar</RouterLink></div></template><template #content><div v-if="appointments.length" class="appointment-list"><article v-for="item in appointments" :key="item.id"><span class="date-box"><strong>{{formatDate(item.date,'dd')}}</strong><small>{{formatDate(item.date,'MMM')}}</small></span><div><strong>{{item.title}}</strong><small>{{item.time}} · {{item.center||item.location||'Sin ubicación'}}</small></div><Tag value="Programado" severity="info" rounded/></article></div><EmptyState v-else icon="pi pi-calendar-plus" title="Sin turnos próximos" description="Agendá consultas, controles y estudios."/></template></Card>
<Card class="content-card"><template #title><div class="card-title"><span>Últimas mediciones</span><RouterLink to="/salud/seguimiento">Ver seguimiento</RouterLink></div></template><template #content><div v-if="latestVitals.length" class="vital-grid"><article v-for="item in latestVitals" :key="item.id"><span><i class="pi pi-chart-line"/></span><small>{{vitalLabel[item.type]}}</small><strong>{{item.value}} {{item.unit}}</strong><p>{{formatDate(item.date,'dd MMM')}}</p></article></div><EmptyState v-else icon="pi pi-chart-line" title="Sin mediciones" description="Podés registrar peso, presión, temperatura, sueño y más."/></template></Card></div>
<Card class="content-card"><template #title><div class="card-title"><span>Señales recientes</span><RouterLink to="/salud/seguimiento">Historial</RouterLink></div></template><template #content><div v-if="recentSymptoms.length" class="symptom-strip"><article v-for="item in recentSymptoms" :key="item.id"><span :class="`intensity intensity-${Math.ceil(item.intensity/2)}`">{{item.intensity}}/10</span><div><strong>{{item.symptom}}</strong><small>{{formatDate(item.date,'dd MMM')}} · {{item.time}}</small><p v-if="item.notes">{{item.notes}}</p></div></article></div><EmptyState v-else icon="pi pi-heart" title="No registraste síntomas" description="Usá el seguimiento cuando necesites guardar una observación."/></template></Card>
</section></template>
