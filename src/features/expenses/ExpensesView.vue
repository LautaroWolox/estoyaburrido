<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAppStore } from '@/stores/app'
import type { Expense } from '@/types/domain'
import { createId } from '@/utils/id'
import { formatCurrency, formatDate, monthKey, todayKey } from '@/utils/date'

const store=useAppStore(); const toast=useToast(); const confirm=useConfirm(); const visible=ref(false); const editingId=ref<string|null>(null)
const categories=['Alimentos','Transporte','Salud','Hogar','Servicios','Ocio','Educación','Otros']; const methods=['Débito','Crédito','Efectivo','Transferencia','Billetera virtual']
const form=reactive({title:'',amount:0,category:categories[0],date:todayKey(),paymentMethod:methods[0],notes:''})
const monthExpenses=computed(()=>[...store.data.expenses].filter((item)=>item.date.startsWith(monthKey())).sort((a,b)=>b.date.localeCompare(a.date)))
const totals=computed(()=>categories.map((category)=>({category,total:monthExpenses.value.filter((item)=>item.category===category).reduce((sum,item)=>sum+item.amount,0)})).filter((item)=>item.total>0).sort((a,b)=>b.total-a.total))
const average=computed(()=>store.monthlyExpenses/Math.max(1,new Date().getDate()))
const reset=()=>{editingId.value=null;Object.assign(form,{title:'',amount:0,category:categories[0],date:todayKey(),paymentMethod:methods[0],notes:''})}; const create=()=>{reset();visible.value=true}; const edit=(item:Expense)=>{editingId.value=item.id;Object.assign(form,item);visible.value=true}
function save(){if(!form.title.trim()||form.amount<=0||!form.date){toast.add({severity:'warn',summary:'Revisá el gasto',detail:'Indicá concepto, importe y fecha.',life:3000});return}store.upsertExpense({id:editingId.value??createId('expense'),title:form.title.trim(),amount:form.amount,category:form.category,date:form.date,paymentMethod:form.paymentMethod,notes:form.notes.trim()});visible.value=false;toast.add({severity:'success',summary:'Gasto guardado',detail:'El movimiento fue registrado.',life:2200})}
function remove(item:Expense){confirm.require({message:`¿Eliminar el gasto “${item.title}”?`,header:'Eliminar gasto',icon:'pi pi-exclamation-triangle',rejectProps:{label:'Cancelar',severity:'secondary',outlined:true},acceptProps:{label:'Eliminar',severity:'danger'},accept:()=>store.removeExpense(item.id)})}
</script>

<template><section class="page-container">
<PageHeader eyebrow="Finanzas personales" title="Gastos" description="Registrá movimientos cotidianos y entendé cómo se distribuye tu dinero durante el mes."><Button label="Registrar gasto" icon="pi pi-plus" @click="create"/></PageHeader>
<div class="stats-grid three"><Card class="stat-card"><template #content><i class="pi pi-wallet green"/><span>Total del mes</span><strong>{{formatCurrency(store.monthlyExpenses,store.data.settings.currency)}}</strong><small>{{monthExpenses.length}} movimientos</small></template></Card><Card class="stat-card"><template #content><i class="pi pi-chart-line blue"/><span>Promedio diario</span><strong>{{formatCurrency(average,store.data.settings.currency)}}</strong><small>hasta el día de hoy</small></template></Card><Card class="stat-card"><template #content><i class="pi pi-calendar rose"/><span>Gastos de hoy</span><strong>{{formatCurrency(store.todayExpenses,store.data.settings.currency)}}</strong><small>movimientos del día</small></template></Card></div>
<div class="two-columns"><Card class="content-card"><template #title><div class="card-title"><span>Movimientos del mes</span><Tag :value="String(monthExpenses.length)" rounded/></div></template><template #content><div v-if="monthExpenses.length" class="expense-list"><div v-for="item in monthExpenses" :key="item.id" class="expense-row"><span class="receipt"><i class="pi pi-receipt"/></span><span><strong>{{item.title}}</strong><small>{{formatDate(item.date,'dd/MM/yyyy')}} · {{item.category}} · {{item.paymentMethod}}</small></span><b>{{formatCurrency(item.amount,store.data.settings.currency)}}</b><div><Button icon="pi pi-pencil" text rounded severity="secondary" @click="edit(item)"/><Button icon="pi pi-trash" text rounded severity="danger" @click="remove(item)"/></div></div></div><EmptyState v-else icon="pi pi-wallet" title="No hay gastos este mes" description="Registrá tu primer movimiento para comenzar el seguimiento."/></template></Card>
<Card class="content-card"><template #title>Por categoría</template><template #content><div v-if="totals.length" class="breakdown"><div v-for="item in totals" :key="item.category"><p><span>{{item.category}}</span><strong>{{formatCurrency(item.total,store.data.settings.currency)}}</strong></p><div><i :style="{width:`${Math.round(item.total/store.monthlyExpenses*100)}%`}"/></div></div></div><EmptyState v-else icon="pi pi-chart-bar" title="Sin datos para comparar" description="La distribución aparecerá cuando cargues gastos."/></template></Card></div>
<Dialog v-model:visible="visible" modal :header="editingId?'Editar gasto':'Registrar gasto'" :style="{width:'min(92vw,34rem)'}"><div class="form-grid"><label class="field full"><span>Concepto</span><InputText v-model="form.title" placeholder="Ej. Supermercado" autofocus/></label><label class="field"><span>Importe</span><InputNumber v-model="form.amount" mode="currency" :currency="store.data.settings.currency" locale="es-AR" :min="0"/></label><label class="field"><span>Fecha</span><InputText v-model="form.date" type="date"/></label><label class="field"><span>Categoría</span><Select v-model="form.category" :options="categories"/></label><label class="field"><span>Forma de pago</span><Select v-model="form.paymentMethod" :options="methods"/></label><label class="field full"><span>Notas</span><Textarea v-model="form.notes" rows="3" auto-resize/></label></div><template #footer><Button label="Cancelar" severity="secondary" text @click="visible=false"/><Button label="Guardar gasto" icon="pi pi-check" @click="save"/></template></Dialog>
</section></template>
