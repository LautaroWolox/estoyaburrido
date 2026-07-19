<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAppStore } from '@/stores/app'
import type { Habit } from '@/types/domain'
import { createId } from '@/utils/id'
import { weekDays } from '@/utils/date'

const store=useAppStore();const toast=useToast();const confirm=useConfirm();const visible=ref(false);const editingId=ref<string|null>(null)
const colors=['#06b6d4','#f97316','#8b5cf6','#22c55e','#f43f5e','#3b82f6'];const icons=[{label:'Energía',value:'pi pi-bolt'},{label:'Corazón',value:'pi pi-heart'},{label:'Estrella',value:'pi pi-star'},{label:'Libro',value:'pi pi-book'},{label:'Casa',value:'pi pi-home'},{label:'Sol',value:'pi pi-sun'}]
const form=reactive({title:'',icon:icons[0].value,targetPerWeek:5,color:colors[0]});const days=computed(()=>weekDays(store.now));const keys=computed(()=>days.value.map((day)=>format(day,'yyyy-MM-dd')))
const completed=computed(()=>store.data.habits.reduce((sum,habit)=>sum+habit.logs.filter((date)=>keys.value.includes(date)).length,0));const target=computed(()=>store.data.habits.reduce((sum,habit)=>sum+habit.targetPerWeek,0));const progress=computed(()=>target.value?Math.min(100,Math.round(completed.value/target.value*100)):0)
const reset=()=>{editingId.value=null;Object.assign(form,{title:'',icon:icons[0].value,targetPerWeek:5,color:colors[0]})};const create=()=>{reset();visible.value=true};const edit=(item:Habit)=>{editingId.value=item.id;Object.assign(form,item);visible.value=true};const count=(item:Habit)=>item.logs.filter((date)=>keys.value.includes(date)).length
function save(){if(!form.title.trim()||form.targetPerWeek<1){toast.add({severity:'warn',summary:'Faltan datos',detail:'Indicá un nombre y una meta semanal.',life:3000});return}const old=store.data.habits.find((item)=>item.id===editingId.value);store.upsertHabit({id:editingId.value??createId('habit'),title:form.title.trim(),icon:form.icon,targetPerWeek:form.targetPerWeek,color:form.color,logs:old?.logs??[]});visible.value=false;toast.add({severity:'success',summary:'Hábito guardado',detail:'Ya podés registrar tu progreso.',life:2200})}
function remove(item:Habit){confirm.require({message:`¿Eliminar el hábito “${item.title}” y su historial?`,header:'Eliminar hábito',icon:'pi pi-exclamation-triangle',rejectProps:{label:'Cancelar',severity:'secondary',outlined:true},acceptProps:{label:'Eliminar',severity:'danger'},accept:()=>store.removeHabit(item.id)})}
</script>

<template><section class="page-container">
<PageHeader eyebrow="Progreso personal" title="Hábitos" description="Marcá pequeñas acciones, visualizá constancia semanal y construí cambios sostenibles."><Button label="Nuevo hábito" icon="pi pi-plus" @click="create"/></PageHeader>
<Card class="habit-summary"><template #content><div><span>Progreso semanal general</span><strong>{{completed}} de {{target}} registros</strong></div><div><ProgressBar :value="progress"/><small>{{progress}}% de la meta conjunta</small></div></template></Card>
<div v-if="store.data.habits.length" class="habit-grid"><Card v-for="item in store.data.habits" :key="item.id" class="habit-card"><template #content><div class="entity-header"><span class="color-icon" :style="{background:item.color}"><i :class="item.icon"/></span><div><h3>{{item.title}}</h3><p>Meta: {{item.targetPerWeek}} veces por semana</p></div><Tag :value="`${count(item)}/${item.targetPerWeek}`" rounded/></div><div class="habit-week"><button v-for="day in days" :key="day.toISOString()" :class="{done:item.logs.includes(format(day,'yyyy-MM-dd'))}" :style="item.logs.includes(format(day,'yyyy-MM-dd'))?{background:item.color,borderColor:item.color}:undefined" @click="store.toggleHabit(item.id,format(day,'yyyy-MM-dd'))"><span>{{format(day,'EEEEE',{locale:es})}}</span><strong>{{format(day,'d')}}</strong><i :class="item.logs.includes(format(day,'yyyy-MM-dd'))?'pi pi-check':'pi pi-plus'"/></button></div><div class="entity-actions"><Button label="Editar" icon="pi pi-pencil" severity="secondary" text @click="edit(item)"/><Button label="Eliminar" icon="pi pi-trash" severity="danger" text @click="remove(item)"/></div></template></Card></div><EmptyState v-else icon="pi pi-chart-line" title="Todavía no creaste hábitos" description="Elegí una acción sencilla y definí una meta semanal realista."/>
<Dialog v-model:visible="visible" modal :header="editingId?'Editar hábito':'Nuevo hábito'" :style="{width:'min(92vw,32rem)'}"><div class="form-grid"><label class="field full"><span>Nombre</span><InputText v-model="form.title" placeholder="Ej. Leer 20 minutos" autofocus/></label><label class="field"><span>Meta semanal</span><InputNumber v-model="form.targetPerWeek" suffix=" veces" :min="1" :max="7"/></label><div class="field"><span>Ícono</span><div class="icon-picker"><button v-for="icon in icons" :key="icon.value" type="button" :class="{selected:form.icon===icon.value}" :title="icon.label" @click="form.icon=icon.value"><i :class="icon.value"/></button></div></div><div class="field full"><span>Color</span><div class="color-picker"><button v-for="color in colors" :key="color" type="button" :style="{background:color}" :class="{selected:form.color===color}" @click="form.color=color"/></div></div></div><template #footer><Button label="Cancelar" severity="secondary" text @click="visible=false"/><Button label="Guardar" icon="pi pi-check" @click="save"/></template></Dialog>
</section></template>
