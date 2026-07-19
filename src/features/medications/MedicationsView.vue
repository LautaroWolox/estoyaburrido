<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import MultiSelect from 'primevue/multiselect'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import ToggleSwitch from 'primevue/toggleswitch'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAppStore } from '@/stores/app'
import type { Medication } from '@/types/domain'
import { createId } from '@/utils/id'

const store = useAppStore()
const toast = useToast()
const confirm = useConfirm()
const visible = ref(false)
const editingId = ref<string | null>(null)
const weekdays = [{ label: 'Domingo', value: 0 }, { label: 'Lunes', value: 1 }, { label: 'Martes', value: 2 }, { label: 'Miércoles', value: 3 }, { label: 'Jueves', value: 4 }, { label: 'Viernes', value: 5 }, { label: 'Sábado', value: 6 }]
const colors = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#14b8a6', '#f59e0b', '#6366f1']
const form = reactive({ name: '', dose: '', timesText: '08:00', days: [0,1,2,3,4,5,6] as number[], notes: '', color: colors[0], active: true })
const today = computed(() => store.data.medications.filter((item) => item.active && item.days.includes(store.currentDay)).flatMap((item) => item.times.map((time) => ({ item, time }))).sort((a,b) => a.time.localeCompare(b.time)))
const reset = () => { editingId.value = null; Object.assign(form, { name: '', dose: '', timesText: '08:00', days: [0,1,2,3,4,5,6], notes: '', color: colors[0], active: true }) }
const create = () => { reset(); visible.value = true }
const edit = (item: Medication) => { editingId.value = item.id; Object.assign(form, { ...item, timesText: item.times.join(', ') }); visible.value = true }
function save() {
  const times = [...new Set(form.timesText.split(',').map((value) => value.trim()).filter((value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value)))].sort()
  if (!form.name.trim() || !form.dose.trim() || !times.length || !form.days.length) { toast.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Completá nombre, dosis, horarios y días.', life: 3000 }); return }
  const old = store.data.medications.find((item) => item.id === editingId.value)
  store.upsertMedication({ id: editingId.value ?? createId('medication'), name: form.name.trim(), dose: form.dose.trim(), times, days: [...form.days].sort(), notes: form.notes.trim(), color: form.color, active: form.active, createdAt: old?.createdAt ?? new Date().toISOString() })
  visible.value = false
  toast.add({ severity: 'success', summary: 'Medicación guardada', detail: 'La agenda quedó actualizada.', life: 2200 })
}
function remove(item: Medication) { confirm.require({ message: `¿Eliminar ${item.name} y su historial?`, header: 'Eliminar medicación', icon: 'pi pi-exclamation-triangle', rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true }, acceptProps: { label: 'Eliminar', severity: 'danger' }, accept: () => store.removeMedication(item.id) }) }
const dayText = (days: number[]) => days.length === 7 ? 'Todos los días' : weekdays.filter((day) => days.includes(day.value)).map((day) => day.label.slice(0,3)).join(', ')
</script>

<template>
  <section class="page-container">
    <PageHeader eyebrow="Salud personal" title="Medicación" description="Registrá horarios y marcá cada toma. Esta herramienta organiza información y no reemplaza indicaciones médicas."><Button label="Agregar medicación" icon="pi pi-plus" @click="create"/></PageHeader>

    <Card class="content-card"><template #title><div class="card-title"><span>Tomas de hoy</span><Tag :value="`${today.filter(({ item,time }) => store.isMedicationTaken(item.id,time)).length}/${today.length}`" rounded/></div></template><template #content>
      <div v-if="today.length" class="today-grid"><button v-for="entry in today" :key="`${entry.item.id}-${entry.time}`" :class="['today-item', { done: store.isMedicationTaken(entry.item.id,entry.time) }]" @click="store.toggleMedicationTaken(entry.item.id,entry.time)"><b>{{ entry.time }}</b><span class="color-icon" :style="{ background: entry.item.color }"><i class="pi pi-heart-fill"/></span><span><strong>{{ entry.item.name }}</strong><small>{{ entry.item.dose }}</small></span><i :class="store.isMedicationTaken(entry.item.id,entry.time) ? 'pi pi-check-circle' : 'pi pi-circle'"/></button></div>
      <EmptyState v-else icon="pi pi-heart" title="No hay tomas programadas hoy" description="Agregá una medicación y elegí sus días y horarios."/>
    </template></Card>

    <div v-if="store.data.medications.length" class="entity-grid"><Card v-for="item in store.data.medications" :key="item.id" class="entity-card"><template #content>
      <div class="entity-header"><span class="color-icon" :style="{ background: item.color }"><i class="pi pi-heart-fill"/></span><div><h3>{{ item.name }}</h3><p>{{ item.dose }}</p></div><Tag :value="item.active ? 'Activa' : 'Pausada'" :severity="item.active ? 'success' : 'secondary'" rounded/></div>
      <div class="entity-meta"><span><i class="pi pi-clock"/> {{ item.times.join(' · ') }}</span><span><i class="pi pi-calendar"/> {{ dayText(item.days) }}</span></div><p v-if="item.notes" class="note">{{ item.notes }}</p>
      <div class="entity-actions"><Button label="Editar" icon="pi pi-pencil" severity="secondary" text @click="edit(item)"/><Button label="Eliminar" icon="pi pi-trash" severity="danger" text @click="remove(item)"/></div>
    </template></Card></div>
    <EmptyState v-else icon="pi pi-heart" title="Todavía no cargaste medicaciones" description="Creá tu primera ficha con dosis, días y horarios."><Button label="Agregar medicación" icon="pi pi-plus" @click="create"/></EmptyState>

    <Dialog v-model:visible="visible" modal :header="editingId ? 'Editar medicación' : 'Nueva medicación'" :style="{ width: 'min(92vw, 34rem)' }">
      <div class="form-grid"><label class="field"><span>Nombre</span><InputText v-model="form.name" placeholder="Ej. Vitamina D" autofocus/></label><label class="field"><span>Dosis</span><InputText v-model="form.dose" placeholder="Ej. 1 comprimido · 500 mg"/></label><label class="field full"><span>Horarios separados por coma</span><InputText v-model="form.timesText" placeholder="08:00, 20:00"/><small>Formato de 24 horas.</small></label><label class="field full"><span>Días</span><MultiSelect v-model="form.days" :options="weekdays" option-label="label" option-value="value" display="chip"/></label><label class="field full"><span>Notas</span><Textarea v-model="form.notes" rows="3" auto-resize/></label><div class="field full"><span>Color</span><div class="color-picker"><button v-for="color in colors" :key="color" type="button" :style="{ background: color }" :class="{ selected: form.color === color }" @click="form.color=color"/></div></div><label class="switch-field full"><span><strong>Medicación activa</strong><small>Se incluirá en tu agenda.</small></span><ToggleSwitch v-model="form.active"/></label></div>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="visible=false"/><Button label="Guardar" icon="pi pi-check" @click="save"/></template>
    </Dialog>
  </section>
</template>
