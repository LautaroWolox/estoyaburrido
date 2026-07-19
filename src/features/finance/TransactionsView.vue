<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import EmptyState from '@/components/EmptyState.vue'
import ModuleTabs from '@/components/ModuleTabs.vue'
import PageHeader from '@/components/PageHeader.vue'
import { useAppStore } from '@/stores/app'
import type { FinancialTransaction, TransactionType } from '@/types/domain'
import { formatCurrency, formatDate, todayKey } from '@/utils/date'
import { createId } from '@/utils/id'
import { financeTabs } from './navigation'

const store=useAppStore();const toast=useToast();const confirm=useConfirm();const visible=ref(false);const editingId=ref<string|null>(null)
const search=ref('');const typeFilter=ref<'all'|TransactionType>('all');const categoryFilter=ref('Todas')
const categories=['Alimentos','Transporte','Salud','Hogar','Servicios','Ocio','Educación','Trabajo','Sueldo','Ingresos extra','Otros']
const accounts=['Cuenta principal','Efectivo','Caja de ahorro','Billetera virtual','Tarjeta']
const methods=['Débito','Crédito','Efectivo','Transferencia','Billetera virtual','Débito automático']
const form=reactive({type:'expense' as TransactionType,title:'',amount:0,category:categories[0],date:todayKey(),account:accounts[0],paymentMethod:methods[0],notes:'',tagsText:''})
const filtered=computed(()=>[...store.data.transactions].filter((item)=>typeFilter.value==='all'||item.type===typeFilter.value).filter((item)=>categoryFilter.value==='Todas'||item.category===categoryFilter.value).filter((item)=>`${item.title} ${item.notes} ${item.tags.join(' ')}`.toLowerCase().includes(search.value.toLowerCase())).sort((a,b)=>`${b.date}${b.id}`.localeCompare(`${a.date}${a.id}`)))
const totalFiltered=computed(()=>filtered.value.reduce((sum,item)=>sum+(item.type==='income'?item.amount:-item.amount),0))
function reset(type:TransactionType='expense'){editingId.value=null;Object.assign(form,{type,title:'',amount:0,category:type==='income'?'Sueldo':categories[0],date:todayKey(),account:accounts[0],paymentMethod:methods[0],notes:'',tagsText:''})}
function create(type:TransactionType='expense'){reset(type);visible.value=true}
function edit(item:FinancialTransaction){editingId.value=item.id;Object.assign(form,{...item,tagsText:item.tags.join(', ')});visible.value=true}
function save(){if(!form.title.trim()||form.amount<=0||!form.date){toast.add({severity:'warn',summary:'Revisá los datos',detail:'Indicá concepto, importe y fecha.',life:2800});return}store.upsert('transactions',{id:editingId.value??createId('transaction'),type:form.type,title:form.title.trim(),amount:form.amount,category:form.category,date:form.date,account:form.account,paymentMethod:form.paymentMethod,notes:form.notes.trim(),tags:form.tagsText.split(',').map(x=>x.trim()).filter(Boolean)});visible.value=false;toast.add({severity:'success',summary:'Movimiento guardado',detail:'El balance fue actualizado.',life:2200})}
function remove(item:FinancialTransaction){confirm.require({message:`¿Eliminar “${item.title}”?`,header:'Eliminar movimiento',icon:'pi pi-exclamation-triangle',rejectProps:{label:'Cancelar',severity:'secondary',outlined:true},acceptProps:{label:'Eliminar',severity:'danger'},accept:()=>store.remove('transactions',item.id)})}
</script>

<template><section class="page-container">
<PageHeader eyebrow="Ingresos y gastos" title="Movimientos" description="Registrá cada entrada y salida con cuenta, categoría, forma de pago y etiquetas."><div class="header-actions"><Button label="Ingreso" icon="pi pi-arrow-down-left" severity="success" outlined @click="create('income')"/><Button label="Gasto" icon="pi pi-arrow-up-right" @click="create('expense')"/></div></PageHeader>
<ModuleTabs :tabs="financeTabs" />
<div class="filter-bar"><span class="search-box"><i class="pi pi-search"/><InputText v-model="search" placeholder="Buscar movimientos..."/></span><Select v-model="typeFilter" :options="[{label:'Todos',value:'all'},{label:'Ingresos',value:'income'},{label:'Gastos',value:'expense'}]" option-label="label" option-value="value"/><Select v-model="categoryFilter" :options="['Todas',...categories]"/><div class="filter-total"><small>Balance filtrado</small><strong :class="totalFiltered>=0?'income':'expense'">{{formatCurrency(totalFiltered,store.data.settings.currency)}}</strong></div></div>
<Card class="content-card"><template #title><div class="card-title"><span>Historial</span><Tag :value="`${filtered.length} movimientos`" rounded/></div></template><template #content>
<div v-if="filtered.length" class="transaction-table"><div class="transaction-head"><span>Movimiento</span><span>Fecha</span><span>Cuenta</span><span>Importe</span><span></span></div><article v-for="item in filtered" :key="item.id"><span class="transaction-main"><i :class="['row-icon',item.type==='income'?'green':'rose']"><i :class="item.type==='income'?'pi pi-arrow-down-left':'pi pi-arrow-up-right'"/></i><span><strong>{{item.title}}</strong><small>{{item.category}}<template v-if="item.tags.length"> · {{item.tags.join(' · ')}}</template></small></span></span><span>{{formatDate(item.date,'dd/MM/yyyy')}}</span><span>{{item.account}}<small>{{item.paymentMethod}}</small></span><b :class="item.type">{{item.type==='income'?'+':'−'}}{{formatCurrency(item.amount,store.data.settings.currency)}}</b><span><Button icon="pi pi-pencil" text rounded @click="edit(item)"/><Button icon="pi pi-trash" text rounded severity="danger" @click="remove(item)"/></span></article></div>
<EmptyState v-else icon="pi pi-arrow-right-arrow-left" title="No encontramos movimientos" description="Cambiá los filtros o registrá una nueva operación."/>
</template></Card>
<Dialog v-model:visible="visible" modal :header="editingId?'Editar movimiento':form.type==='income'?'Nuevo ingreso':'Nuevo gasto'" :style="{width:'min(94vw,42rem)'}"><div class="type-switch"><button type="button" :class="{active:form.type==='expense'}" @click="form.type='expense'"><i class="pi pi-arrow-up-right"/> Gasto</button><button type="button" :class="{active:form.type==='income'}" @click="form.type='income'"><i class="pi pi-arrow-down-left"/> Ingreso</button></div><div class="form-grid"><label class="field full"><span>Concepto</span><InputText v-model="form.title" placeholder="Ej. Supermercado, sueldo o reintegro" autofocus/></label><label class="field"><span>Importe</span><InputNumber v-model="form.amount" mode="currency" :currency="store.data.settings.currency" locale="es-AR" :min="0"/></label><label class="field"><span>Fecha</span><InputText v-model="form.date" type="date"/></label><label class="field"><span>Categoría</span><Select v-model="form.category" :options="categories" editable/></label><label class="field"><span>Cuenta</span><Select v-model="form.account" :options="accounts" editable/></label><label class="field"><span>Forma de pago</span><Select v-model="form.paymentMethod" :options="methods"/></label><label class="field"><span>Etiquetas</span><InputText v-model="form.tagsText" placeholder="trabajo, mensual, importante"/></label><label class="field full"><span>Notas</span><Textarea v-model="form.notes" rows="3" auto-resize/></label></div><template #footer><Button label="Cancelar" severity="secondary" text @click="visible=false"/><Button label="Guardar movimiento" icon="pi pi-check" @click="save"/></template></Dialog>
</section></template>
