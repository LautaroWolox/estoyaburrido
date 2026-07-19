<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAppStore } from '@/stores/app'
import type { CalendarEvent, EventKind } from '@/types/domain'
import { createId } from '@/utils/id'

const store=useAppStore();const toast=useToast();const confirm=useConfirm();const month=ref(startOfMonth(new Date()));const selected=ref(new Date());const visible=ref(false);const editingId=ref<string|null>(null)
const kinds=[{label:'Personal',value:'personal'},{label:'Turno',value:'appointment'},{label:'Tarea',value:'task'}];const colors:Record<EventKind,string>={personal:'#8b5cf6',appointment:'#0ea5e9',task:'#f59e0b'}
const form=reactive({title:'',date:format(new Date(),'yyyy-MM-dd'),time:'09:00',kind:'personal' as EventKind,notes:'',color:colors.personal,completed:false})
const labels=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']
const days=computed(()=>eachDayOfInterval({start:startOfWeek(startOfMonth(month.value),{weekStartsOn:1}),end:endOfWeek(endOfMonth(month.value),{weekStartsOn:1})}))
const selectedKey=computed(()=>format(selected.value,'yyyy-MM-dd'))
const events=computed(()=>store.data.calendarEvents.filter((item)=>item.date===selectedKey.value).sort((a,b)=>a.time.localeCompare(b.time)))
const medications=computed(()=>store.data.medications.filter((item)=>item.active&&item.days.includes(selected.value.getDay())).flatMap((item)=>item.times.map((time)=>({...item,time}))).sort((a,b)=>a.time.localeCompare(b.time)))
const routines=computed(()=>store.data.routines.filter((item)=>item.active&&item.days.includes(selected.value.getDay())).sort((a,b)=>a.startTime.localeCompare(b.startTime)))
const eventsFor=(day:Date)=>store.data.calendarEvents.filter((item)=>item.date===format(day,'yyyy-MM-dd'))
const hasMedication=(day:Date)=>store.data.medications.some((item)=>item.active&&item.days.includes(day.getDay()))
const hasRoutine=(day:Date)=>store.data.routines.some((item)=>item.active&&item.days.includes(day.getDay()))
function selectDay(day:Date){selected.value=day;if(day.getMonth()!==month.value.getMonth())month.value=startOfMonth(day)}
function reset(date=selectedKey.value){editingId.value=null;Object.assign(form,{title:'',date,time:'09:00',kind:'personal',notes:'',color:colors.personal,completed:false})}
function create(date=selectedKey.value){reset(date);visible.value=true}
function edit(item:CalendarEvent){editingId.value=item.id;Object.assign(form,item);visible.value=true}
function save(){if(!form.title.trim()||!form.date){toast.add({severity:'warn',summary:'Faltan datos',detail:'Indicá un título y una fecha.',life:3000});return}store.upsertCalendarEvent({id:editingId.value??createId('event'),title:form.title.trim(),date:form.date,time:form.time,kind:form.kind,notes:form.notes.trim(),color:form.color,completed:form.completed});selected.value=new Date(`${form.date}T12:00:00`);month.value=startOfMonth(selected.value);visible.value=false;toast.add({severity:'success',summary:'Evento guardado',detail:'La agenda quedó actualizada.',life:2200})}
function remove(item:CalendarEvent){confirm.require({message:`¿Eliminar “${item.title}”?`,header:'Eliminar evento',icon:'pi pi-exclamation-triangle',rejectProps:{label:'Cancelar',severity:'secondary',outlined:true},acceptProps:{label:'Eliminar',severity:'danger'},accept:()=>store.removeCalendarEvent(item.id)})}
function changeKind(kind:EventKind){form.kind=kind;form.color=colors[kind]}
</script>

<template><section class="page-container">
<PageHeader eyebrow="Agenda unificada" title="Calendario" description="Reuní eventos personales, turnos, tareas, medicación y rutinas en una sola vista."><Button label="Nuevo evento" icon="pi pi-plus" @click="create()"/></PageHeader>
<div class="calendar-layout"><Card class="content-card"><template #title><div class="calendar-toolbar"><div><Button icon="pi pi-chevron-left" text rounded @click="month=subMonths(month,1)"/><Button label="Hoy" severity="secondary" text @click="month=startOfMonth(new Date());selected=new Date()"/><Button icon="pi pi-chevron-right" text rounded @click="month=addMonths(month,1)"/></div><strong>{{format(month,'MMMM yyyy',{locale:es})}}</strong></div></template><template #content><div class="calendar-labels"><span v-for="label in labels" :key="label">{{label}}</span></div><div class="calendar-grid"><button v-for="day in days" :key="day.toISOString()" :class="['calendar-day',{muted:day.getMonth()!==month.getMonth(),selected:isSameDay(day,selected),today:isSameDay(day,new Date())}]" @click="selectDay(day)"><b>{{format(day,'d')}}</b><span><i v-if="hasMedication(day)" class="marker medication"/><i v-if="hasRoutine(day)" class="marker routine"/><i v-for="event in eventsFor(day).slice(0,3)" :key="event.id" class="marker" :style="{background:event.color}"/></span><small v-if="eventsFor(day).length">{{eventsFor(day).length}}</small></button></div><div class="legend"><span><i class="marker medication"/> Medicación</span><span><i class="marker routine"/> Rutinas</span><span><i class="marker"/> Eventos</span></div></template></Card>
<Card class="content-card"><template #title><div class="card-title"><span>{{format(selected,"EEEE d 'de' MMMM",{locale:es})}}</span><Button icon="pi pi-plus" text rounded @click="create()"/></div></template><template #content><div v-if="events.length||medications.length||routines.length" class="agenda-list"><div v-for="item in medications" :key="`${item.id}-${item.time}`"><b>{{item.time}}</b><i class="dot" :style="{background:item.color}"/><span><strong>{{item.name}}</strong><small>{{item.dose}} · Medicación</small></span></div><div v-for="item in routines" :key="item.id"><b>{{item.startTime}}</b><i class="dot" :style="{background:item.color}"/><span><strong>{{item.title}}</strong><small>{{item.durationMinutes}} min · Rutina</small></span></div><div v-for="item in events" :key="item.id" class="editable"><b>{{item.time||'—'}}</b><i class="dot" :style="{background:item.color}"/><span><strong>{{item.title}}</strong><small>{{item.kind==='appointment'?'Turno':item.kind==='task'?'Tarea':'Personal'}}</small></span><div><Button icon="pi pi-pencil" text rounded size="small" @click="edit(item)"/><Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="remove(item)"/></div></div></div><EmptyState v-else icon="pi pi-calendar" title="Día sin actividades" description="Agregá un evento para esta fecha."/></template></Card></div>
<Dialog v-model:visible="visible" modal :header="editingId?'Editar evento':'Nuevo evento'" :style="{width:'min(92vw,34rem)'}"><div class="form-grid"><label class="field full"><span>Título</span><InputText v-model="form.title" placeholder="Ej. Turno odontológico" autofocus/></label><label class="field"><span>Fecha</span><InputText v-model="form.date" type="date"/></label><label class="field"><span>Hora</span><InputText v-model="form.time" type="time"/></label><label class="field full"><span>Tipo</span><Select :model-value="form.kind" :options="kinds" option-label="label" option-value="value" @update:model-value="changeKind"/></label><label class="field full"><span>Notas</span><Textarea v-model="form.notes" rows="3" auto-resize/></label></div><template #footer><Button label="Cancelar" severity="secondary" text @click="visible=false"/><Button label="Guardar" icon="pi pi-check" @click="save"/></template></Dialog>
</section></template>
