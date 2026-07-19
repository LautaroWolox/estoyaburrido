<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAppStore } from '@/stores/app'
import type { Routine } from '@/types/domain'
import { createId } from '@/utils/id'

const store = useAppStore()
const toast = useToast()
const confirm = useConfirm()
const visible = ref(false)
const editingId = ref<string | null>(null)
const weekdays = [{ label: 'Domingo', value: 0 }, { label: 'Lunes', value: 1 }, { label: 'Martes', value: 2 }, { label: 'Miércoles', value: 3 }, { label: 'Jueves', value: 4 }, { label: 'Viernes', value: 5 }, { label: 'Sábado', value: 6 }]
const categories = ['Bienestar', 'Casa', 'Trabajo', 'Estudio', 'Ejercicio', 'Personal', 'Descanso']
const colors = ['#8b5cf6', '#0ea5e9', '#14b8a6', '#f59e0b', '#f43f5e', '#6366f1']
const form = reactive({ title: '', category: categories[0], startTime: '09:00', durationMinutes: 30, days: [1,2,3,4,5] as number[], notes: '', color: colors[0], active: true })
const today = computed(() => store.data.routines.filter((item) => item.active && item.days.includes(store.currentDay)).sort((a,b) => a.startTime.localeCompare(b.startTime)))
const reset = () => { editingId.value=null; Object.assign(form,{ title:'', category:categories[0], startTime:'09:00', durationMinutes:30, days:[1,2,3,4,5], notes:'', color:colors[0], active:true }) }
const create = () => { reset(); visible.value=true }
const edit = (item: Routine) => { editingId.value=item.id; Object.assign(form,item); visible.value=true }
function save(){ if(!form.title.trim()||!form.startTime||!form.durationMinutes||!form.days.length){ toast.add({severity:'warn',summary:'Faltan datos',detail:'Completá nombre, horario, duración y días.',life:3000}); return } store.upsertRoutine({ id:editingId.value??createId('routine'), title:form.title.trim(), category:form.category, startTime:form.startTime, durationMinutes:form.durationMinutes, days:[...form.days].sort(), notes:form.notes.trim(), color:form.color, active:form.active }); visible.value=false; toast.add({severity:'success',summary:'Rutina guardada',detail:'Ya forma parte de tu planificación.',life:2200}) }
function remove(item:Routine){ confirm.require({message:`¿Eliminar la rutina “${item.title}”?`,header:'Eliminar rutina',icon:'pi pi-exclamation-triangle',rejectProps:{label:'Cancelar',severity:'secondary',outlined:true},acceptProps:{label:'Eliminar',severity:'danger'},accept:()=>store.removeRoutine(item.id)}) }
const dayText=(days:number[])=>days.length===7?'Todos los días':weekdays.filter((day)=>days.includes(day.value)).map((day)=>day.label.slice(0,3)).join(', ')
</script>

<template>
<section class="page-container">
  <PageHeader eyebrow="Organización diaria" title="Rutinas" description="Construí bloques repetibles para trabajo, descanso, estudio, ejercicio y tareas de la casa."><Button label="Nueva rutina" icon="pi pi-plus" @click="create"/></PageHeader>
  <Card class="content-card"><template #title><div class="card-title"><span>Rutinas de hoy</span><Tag :value="`${today.filter((item)=>store.isRoutineDone(item.id)).length}/${today.length}`" rounded/></div></template><template #content><div v-if="today.length" class="today-list"><button v-for="item in today" :key="item.id" :class="['today-item',{done:store.isRoutineDone(item.id)}]" @click="store.toggleRoutineDone(item.id)"><b>{{item.startTime}}</b><span class="color-icon" :style="{background:item.color}"><i class="pi pi-list-check"/></span><span><strong>{{item.title}}</strong><small>{{item.durationMinutes}} min · {{item.category}}</small></span><i :class="store.isRoutineDone(item.id)?'pi pi-check-circle':'pi pi-circle'"/></button></div><EmptyState v-else icon="pi pi-list-check" title="No tenés rutinas para hoy" description="Creá una rutina y elegí en qué días se repite."/></template></Card>
  <div v-if="store.data.routines.length" class="entity-grid"><Card v-for="item in store.data.routines" :key="item.id" class="entity-card"><template #content><div class="entity-header"><span class="color-icon" :style="{background:item.color}"><i class="pi pi-list-check"/></span><div><h3>{{item.title}}</h3><p>{{item.category}}</p></div><Tag :value="item.active?'Activa':'Pausada'" :severity="item.active?'success':'secondary'" rounded/></div><div class="entity-meta"><span><i class="pi pi-clock"/> {{item.startTime}} · {{item.durationMinutes}} min</span><span><i class="pi pi-calendar"/> {{dayText(item.days)}}</span></div><p v-if="item.notes" class="note">{{item.notes}}</p><div class="entity-actions"><Button label="Editar" icon="pi pi-pencil" severity="secondary" text @click="edit(item)"/><Button label="Eliminar" icon="pi pi-trash" severity="danger" text @click="remove(item)"/></div></template></Card></div>
  <EmptyState v-else icon="pi pi-list-check" title="Todavía no creaste rutinas" description="Empezá por una acción simple que quieras repetir cada semana."><Button label="Crear primera rutina" icon="pi pi-plus" @click="create"/></EmptyState>
  <Dialog v-model:visible="visible" modal :header="editingId?'Editar rutina':'Nueva rutina'" :style="{width:'min(92vw,36rem)'}"><div class="form-grid"><label class="field full"><span>Nombre</span><InputText v-model="form.title" placeholder="Ej. Preparar el día" autofocus/></label><label class="field"><span>Categoría</span><Select v-model="form.category" :options="categories"/></label><label class="field"><span>Hora</span><InputText v-model="form.startTime" type="time"/></label><label class="field"><span>Duración</span><InputNumber v-model="form.durationMinutes" suffix=" min" :min="5" :max="480"/></label><label class="field full"><span>Días</span><MultiSelect v-model="form.days" :options="weekdays" option-label="label" option-value="value" display="chip"/></label><label class="field full"><span>Notas</span><Textarea v-model="form.notes" rows="3" auto-resize/></label><div class="field full"><span>Color</span><div class="color-picker"><button v-for="color in colors" :key="color" type="button" :style="{background:color}" :class="{selected:form.color===color}" @click="form.color=color"/></div></div><label class="switch-field full"><span><strong>Rutina activa</strong><small>Se incluirá en tu plan diario.</small></span><ToggleSwitch v-model="form.active"/></label></div><template #footer><Button label="Cancelar" severity="secondary" text @click="visible=false"/><Button label="Guardar" icon="pi pi-check" @click="save"/></template></Dialog>
</section>
</template>
