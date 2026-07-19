<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import EmptyState from '@/components/EmptyState.vue'
import ModuleTabs from '@/components/ModuleTabs.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAppStore } from '@/stores/app'
import type { Budget } from '@/types/domain'
import { formatCurrency, percentage } from '@/utils/date'
import { createId } from '@/utils/id'
import { financeTabs } from './navigation'

const store=useAppStore();const toast=useToast();const confirm=useConfirm();const visible=ref(false);const editingId=ref<string|null>(null)
const categories=['Alimentos','Transporte','Salud','Hogar','Servicios','Ocio','Educación','Trabajo','Otros']
const form=reactive({category:categories[0],limit:0,month:store.currentMonth,alertAt:80})
const month=ref(store.currentMonth)
const budgets=computed(()=>store.data.budgets.filter((item)=>item.month===month.value).map((item)=>({...item,spent:store.data.transactions.filter((tx)=>tx.type==='expense'&&tx.category===item.category&&tx.date.startsWith(month.value)).reduce((s,x)=>s+x.amount,0)+store.data.expenses.filter((tx)=>tx.category===item.category&&tx.date.startsWith(month.value)).reduce((s,x)=>s+x.amount,0)})))
const totalLimit=computed(()=>budgets.value.reduce((s,x)=>s+x.limit,0));const totalSpent=computed(()=>budgets.value.reduce((s,x)=>s+x.spent,0))
function create(){editingId.value=null;Object.assign(form,{category:categories[0],limit:0,month:month.value,alertAt:80});visible.value=true}
function edit(item:Budget){editingId.value=item.id;Object.assign(form,item);visible.value=true}
function save(){if(!form.category||form.limit<=0){toast.add({severity:'warn',summary:'Presupuesto incompleto',detail:'Elegí una categoría y un límite mayor a cero.',life:2800});return}store.upsert('budgets',{id:editingId.value??createId('budget'),category:form.category,limit:form.limit,month:form.month,alertAt:form.alertAt});month.value=form.month;visible.value=false;toast.add({severity:'success',summary:'Presupuesto guardado',detail:'Vas a poder seguir el consumo en tiempo real.',life:2200})}
function remove(item:Budget){confirm.require({message:`¿Eliminar el presupuesto de ${item.category}?`,header:'Eliminar presupuesto',icon:'pi pi-exclamation-triangle',rejectProps:{label:'Cancelar',severity:'secondary',outlined:true},acceptProps:{label:'Eliminar',severity:'danger'},accept:()=>store.remove('budgets',item.id)})}
const severity=(value:number)=>value>=100?'danger':value>=80?'warn':'success'
</script>

<template><section class="page-container">
<PageHeader eyebrow="Límites inteligentes" title="Presupuestos" description="Definí cuánto querés gastar por categoría y recibí señales antes de pasarte."><Button label="Nuevo presupuesto" icon="pi pi-plus" @click="create"/></PageHeader>
<ModuleTabs :tabs="financeTabs" />
<div class="budget-toolbar"><label class="field compact"><span>Mes analizado</span><InputText v-model="month" type="month"/></label><div><small>Presupuesto total</small><strong>{{formatCurrency(totalLimit,store.data.settings.currency)}}</strong></div><div><small>Consumido</small><strong>{{formatCurrency(totalSpent,store.data.settings.currency)}}</strong></div><div><small>Disponible</small><strong :class="totalLimit-totalSpent>=0?'income':'expense'">{{formatCurrency(totalLimit-totalSpent,store.data.settings.currency)}}</strong></div></div>
<div v-if="budgets.length" class="budget-grid"><Card v-for="item in budgets" :key="item.id" class="budget-card"><template #content><div class="budget-head"><span class="row-icon violet"><i class="pi pi-wallet"/></span><div><strong>{{item.category}}</strong><small>Alerta al {{item.alertAt}}%</small></div><Tag :value="`${percentage(item.spent,item.limit)}%`" :severity="severity(percentage(item.spent,item.limit))" rounded/></div><div class="budget-numbers"><strong>{{formatCurrency(item.spent,store.data.settings.currency)}}</strong><span>de {{formatCurrency(item.limit,store.data.settings.currency)}}</span></div><ProgressBar :value="percentage(item.spent,item.limit)" :show-value="false"/><p :class="item.spent>item.limit?'expense':''">{{item.spent>item.limit?`Superaste el límite por ${formatCurrency(item.spent-item.limit,store.data.settings.currency)}`:`Quedan ${formatCurrency(item.limit-item.spent,store.data.settings.currency)}`}}</p><div class="entity-actions"><Button label="Editar" icon="pi pi-pencil" text severity="secondary" @click="edit(item)"/><Button label="Eliminar" icon="pi pi-trash" text severity="danger" @click="remove(item)"/></div></template></Card></div>
<EmptyState v-else icon="pi pi-sliders-h" title="No hay presupuestos para este mes" description="Creá límites por categoría para saber cuánto te queda disponible."><Button label="Crear presupuesto" icon="pi pi-plus" @click="create"/></EmptyState>
<Dialog v-model:visible="visible" modal :header="editingId?'Editar presupuesto':'Nuevo presupuesto'" :style="{width:'min(92vw,34rem)'}"><div class="form-grid"><label class="field full"><span>Categoría</span><Select v-model="form.category" :options="categories" editable/></label><label class="field"><span>Límite</span><InputNumber v-model="form.limit" mode="currency" :currency="store.data.settings.currency" locale="es-AR" :min="0"/></label><label class="field"><span>Mes</span><InputText v-model="form.month" type="month"/></label><label class="field full"><span>Alertar al alcanzar</span><InputNumber v-model="form.alertAt" suffix=" %" :min="1" :max="100"/></label></div><template #footer><Button label="Cancelar" text severity="secondary" @click="visible=false"/><Button label="Guardar" icon="pi pi-check" @click="save"/></template></Dialog>
</section></template>
