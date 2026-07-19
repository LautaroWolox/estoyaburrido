<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import WalletTabs from './WalletTabs.vue'
import { useAppStore } from '@/stores/app'
import type { CardPurchase, CardStatement } from '@/types/domain'
import { createId } from '@/utils/id'
import { formatMoney } from '@/utils/money'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const toast = useToast()
const confirm = useConfirm()
const card = computed(() => store.data.paymentCards.find((item) => item.id === String(route.params.id)))
const hidden = computed(() => store.data.settings.walletHideAmounts)
const purchases = computed(() => store.data.cardPurchases.filter((item) => item.cardId === card.value?.id).sort((a, b) => b.date.localeCompare(a.date)))
const statements = computed(() => store.data.cardStatements.filter((item) => item.cardId === card.value?.id).sort((a, b) => b.period.localeCompare(a.period)))
const consumed = computed(() => card.value?.type === 'credit' ? Math.max(0, card.value.creditLimit - card.value.availableLimit) : purchases.value.filter((item) => item.status !== 'refunded').reduce((sum, item) => sum + item.amount, 0))
const usage = computed(() => card.value?.creditLimit ? Math.min(100, Math.round(consumed.value / card.value.creditLimit * 100)) : 0)

const purchaseVisible = ref(false)
const statementVisible = ref(false)
const paymentVisible = ref(false)
const editingPurchaseId = ref<string | null>(null)
const editingStatementId = ref<string | null>(null)
const selectedStatement = ref<CardStatement | null>(null)
const registerFinance = ref(true)
const paymentAmount = ref(0)
const categories = ['Alimentos', 'Servicios', 'Transporte', 'Salud', 'Hogar', 'Ropa', 'Tecnología', 'Ocio', 'Educación', 'Otros']
const purchaseStatuses = [{ label: 'Confirmado', value: 'posted' }, { label: 'Pendiente', value: 'pending' }, { label: 'Reintegrado', value: 'refunded' }]
const statementStatuses = [{ label: 'Abierto', value: 'open' }, { label: 'Cerrado', value: 'closed' }, { label: 'Pagado', value: 'paid' }, { label: 'Vencido', value: 'overdue' }]
const purchaseForm = reactive({ title: '', merchant: '', amount: 0, date: store.today, category: categories[0], installments: 1, currentInstallment: 1, status: 'posted' as CardPurchase['status'], notes: '' })
const statementForm = reactive({ period: store.currentMonth, closingDate: store.today, dueDate: store.today, totalAmount: 0, minimumPayment: 0, paidAmount: 0, status: 'open' as CardStatement['status'], notes: '' })

function newPurchase() {
  editingPurchaseId.value = null
  Object.assign(purchaseForm, { title: '', merchant: '', amount: 0, date: store.today, category: categories[0], installments: 1, currentInstallment: 1, status: 'posted', notes: '' })
  registerFinance.value = true
  purchaseVisible.value = true
}

function editPurchase(item: CardPurchase) {
  editingPurchaseId.value = item.id
  Object.assign(purchaseForm, item)
  registerFinance.value = Boolean(item.financeTransactionId)
  purchaseVisible.value = true
}

function savePurchase() {
  if (!card.value || !purchaseForm.title.trim() || purchaseForm.amount <= 0 || !purchaseForm.date) {
    toast.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Completá descripción, importe y fecha.', life: 3000 })
    return
  }
  if (purchaseForm.currentInstallment > purchaseForm.installments) purchaseForm.currentInstallment = purchaseForm.installments
  store.recordCardPurchase({
    id: editingPurchaseId.value ?? createId('card-purchase'),
    cardId: card.value.id,
    title: purchaseForm.title.trim(),
    merchant: purchaseForm.merchant.trim(),
    amount: purchaseForm.amount,
    date: purchaseForm.date,
    category: purchaseForm.category,
    installments: purchaseForm.installments,
    currentInstallment: purchaseForm.currentInstallment,
    status: purchaseForm.status,
    notes: purchaseForm.notes.trim()
  }, registerFinance.value)
  purchaseVisible.value = false
  toast.add({ severity: 'success', summary: 'Consumo guardado', detail: registerFinance.value ? 'También se reflejó en Finanzas.' : 'Se guardó solamente en la tarjeta.', life: 2500 })
}

function removePurchase(item: CardPurchase) {
  confirm.require({ message: `¿Eliminar el consumo “${item.title}”?`, header: 'Eliminar consumo', icon: 'pi pi-trash', rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true }, acceptProps: { label: 'Eliminar', severity: 'danger' }, accept: () => store.removeCardPurchase(item.id) })
}

function refundPurchase(item: CardPurchase) {
  confirm.require({ message: 'Se marcará como reintegrado y se quitará el gasto asociado de Finanzas.', header: 'Registrar reintegro', icon: 'pi pi-replay', rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true }, acceptProps: { label: 'Confirmar reintegro', severity: 'success' }, accept: () => {
    store.removeCardPurchase(item.id)
    store.upsert('cardPurchases', { ...item, status: 'refunded', financeTransactionId: undefined })
  } })
}

function newStatement() {
  editingStatementId.value = null
  Object.assign(statementForm, { period: store.currentMonth, closingDate: store.today, dueDate: store.today, totalAmount: 0, minimumPayment: 0, paidAmount: 0, status: 'open', notes: '' })
  statementVisible.value = true
}

function editStatement(item: CardStatement) {
  editingStatementId.value = item.id
  Object.assign(statementForm, item)
  statementVisible.value = true
}

function saveStatement() {
  if (!card.value || !statementForm.period || !statementForm.dueDate || statementForm.totalAmount < 0) {
    toast.add({ severity: 'warn', summary: 'Datos inválidos', detail: 'Revisá período, vencimiento e importe.', life: 3000 })
    return
  }
  store.upsert('cardStatements', {
    id: editingStatementId.value ?? createId('statement'),
    cardId: card.value.id,
    period: statementForm.period,
    closingDate: statementForm.closingDate,
    dueDate: statementForm.dueDate,
    totalAmount: statementForm.totalAmount,
    minimumPayment: statementForm.minimumPayment,
    paidAmount: Math.min(statementForm.totalAmount, statementForm.paidAmount),
    status: statementForm.paidAmount >= statementForm.totalAmount && statementForm.totalAmount > 0 ? 'paid' : statementForm.status,
    notes: statementForm.notes.trim()
  })
  statementVisible.value = false
  toast.add({ severity: 'success', summary: 'Resumen guardado', detail: 'El vencimiento ya puede convertirse en recordatorio.', life: 2200 })
}

function removeStatement(item: CardStatement) {
  confirm.require({ message: `¿Eliminar el resumen ${item.period}?`, header: 'Eliminar resumen', icon: 'pi pi-trash', rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true }, acceptProps: { label: 'Eliminar', severity: 'danger' }, accept: () => store.remove('cardStatements', item.id) })
}

function openPayment(item: CardStatement) {
  selectedStatement.value = item
  paymentAmount.value = Math.max(0, item.totalAmount - item.paidAmount)
  paymentVisible.value = true
}

function pay() {
  if (!selectedStatement.value || paymentAmount.value <= 0) return
  store.payCardStatement(selectedStatement.value.id, paymentAmount.value)
  paymentVisible.value = false
  toast.add({ severity: 'success', summary: 'Pago registrado', detail: 'Se actualizó el saldo del resumen sin duplicar el gasto en Finanzas.', life: 2600 })
}

function addReminder(item: CardStatement) {
  if (!card.value) return
  store.upsertCalendarEvent({ id: createId('event'), title: `Pagar ${card.value.nickname}`, date: item.dueDate, time: '09:00', kind: 'task', notes: `Resumen ${item.period} · ${formatMoney(item.totalAmount, store.data.settings.currency)}`, color: card.value.color, completed: false, allDay: false, recurrence: 'none', reminderMinutes: [1440, 180], calendarId: 'finanzas' })
  toast.add({ severity: 'success', summary: 'Recordatorio creado', detail: 'Se agregó al calendario con avisos 24 horas y 3 horas antes.', life: 2500 })
}

function safeOpen(url: string) {
  try { const parsed = new URL(url); if (['http:', 'https:'].includes(parsed.protocol)) window.open(parsed.toString(), '_blank', 'noopener,noreferrer') } catch { /* URL inválida */ }
}

const statementSeverity = (status: CardStatement['status']) => status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : status === 'closed' ? 'warn' : 'info'
const purchaseSeverity = (status: CardPurchase['status']) => status === 'refunded' ? 'success' : status === 'pending' ? 'warn' : 'info'
</script>

<template>
  <section class="page-container wallet-page">
    <template v-if="card">
      <PageHeader eyebrow="Detalle de tarjeta" :title="card.nickname" :description="`${card.issuer} · •••• ${card.last4}`">
        <Button v-if="card.issuerUrl" label="Abrir emisor" icon="pi pi-external-link" severity="secondary" outlined @click="safeOpen(card.issuerUrl)" />
        <Button label="Nuevo consumo" icon="pi pi-plus" @click="newPurchase" />
      </PageHeader>
      <WalletTabs />

      <div class="wallet-detail-hero">
        <article class="payment-card detail-card" :style="{ '--card-color': card.color }">
          <div class="payment-card__top"><span>{{ card.issuer }}</span><Tag v-if="card.isDefault" value="Principal" severity="contrast" rounded /></div>
          <div class="payment-card__chip"><i class="pi pi-credit-card" /></div>
          <strong>{{ card.nickname }}</strong>
          <div class="payment-card__number"><span>••••</span><span>••••</span><span>••••</span><b>{{ card.last4 }}</b></div>
          <div class="payment-card__bottom"><span><small>Titular</small>{{ card.holderName || 'Sin indicar' }}</span><span><small>Vence</small>{{ String(card.expiryMonth).padStart(2, '0') }}/{{ String(card.expiryYear).slice(-2) }}</span><b>{{ card.network.toUpperCase() }}</b></div>
        </article>
        <div class="wallet-detail-stats">
          <article><span><i class="pi pi-chart-pie" /></span><div><small>Consumo</small><strong>{{ formatMoney(consumed, store.data.settings.currency, hidden) }}</strong></div></article>
          <article><span><i class="pi pi-check-circle" /></span><div><small>Disponible</small><strong>{{ formatMoney(card.availableLimit, store.data.settings.currency, hidden) }}</strong></div></article>
          <article><span><i class="pi pi-calendar" /></span><div><small>Cierre / vencimiento</small><strong>Día {{ card.closingDay }} / {{ card.dueDay }}</strong></div></article>
          <div v-if="card.type === 'credit'" class="wallet-limit-progress"><div><span>Uso del límite</span><b>{{ usage }}%</b></div><ProgressBar :value="usage" :show-value="false" /></div>
        </div>
      </div>

      <div class="two-columns wide-left wallet-detail-columns">
        <Card class="content-card">
          <template #title><div class="card-title"><span>Consumos y cuotas</span><Button label="Agregar" icon="pi pi-plus" size="small" @click="newPurchase" /></div></template>
          <template #content>
            <div v-if="purchases.length" class="wallet-purchase-list">
              <article v-for="item in purchases" :key="item.id" class="wallet-purchase-row">
                <span class="row-icon violet"><i class="pi pi-shopping-bag" /></span>
                <div><strong>{{ item.title }}</strong><small>{{ item.merchant || item.category }} · {{ item.date }}<template v-if="item.installments > 1"> · cuota {{ item.currentInstallment }}/{{ item.installments }}</template></small></div>
                <Tag :value="purchaseStatuses.find((option) => option.value === item.status)?.label" :severity="purchaseSeverity(item.status)" rounded />
                <b>{{ formatMoney(item.amount, store.data.settings.currency, hidden) }}</b>
                <div class="wallet-row-actions"><Button icon="pi pi-pencil" text rounded severity="secondary" aria-label="Editar" @click="editPurchase(item)" /><Button v-if="item.status !== 'refunded'" icon="pi pi-replay" text rounded severity="success" aria-label="Reintegrar" @click="refundPurchase(item)" /><Button icon="pi pi-trash" text rounded severity="danger" aria-label="Eliminar" @click="removePurchase(item)" /></div>
              </article>
            </div>
            <EmptyState v-else icon="pi pi-shopping-bag" title="Sin consumos" description="Registrá compras, cuotas y comercios para conocer el uso real de la tarjeta."><Button label="Agregar consumo" icon="pi pi-plus" @click="newPurchase" /></EmptyState>
          </template>
        </Card>

        <Card class="content-card">
          <template #title><div class="card-title"><span>Resúmenes</span><Button icon="pi pi-plus" rounded text aria-label="Nuevo resumen" @click="newStatement" /></div></template>
          <template #content>
            <div v-if="statements.length" class="wallet-statement-list">
              <article v-for="item in statements" :key="item.id" class="wallet-statement-card">
                <div><span>{{ item.period }}</span><Tag :value="statementStatuses.find((option) => option.value === item.status)?.label" :severity="statementSeverity(item.status)" rounded /></div>
                <strong>{{ formatMoney(item.totalAmount, store.data.settings.currency, hidden) }}</strong>
                <small>Vence {{ item.dueDate }} · pagado {{ formatMoney(item.paidAmount, store.data.settings.currency, hidden) }}</small>
                <ProgressBar :value="item.totalAmount ? Math.min(100, Math.round(item.paidAmount / item.totalAmount * 100)) : 0" :show-value="false" />
                <div class="wallet-statement-actions"><Button icon="pi pi-bell" text rounded aria-label="Recordar" @click="addReminder(item)" /><Button v-if="item.status !== 'paid'" label="Registrar pago" size="small" text @click="openPayment(item)" /><Button icon="pi pi-pencil" text rounded severity="secondary" aria-label="Editar" @click="editStatement(item)" /><Button icon="pi pi-trash" text rounded severity="danger" aria-label="Eliminar" @click="removeStatement(item)" /></div>
              </article>
            </div>
            <EmptyState v-else icon="pi pi-file" title="Sin resúmenes" description="Guardá cierres, vencimientos, totales y pagos mínimos."><Button label="Agregar resumen" icon="pi pi-plus" @click="newStatement" /></EmptyState>
          </template>
        </Card>
      </div>

      <Message severity="info" :closable="false">Pagar un resumen no genera un gasto nuevo porque los consumos ya se registran en Finanzas. De esta manera se evita contabilizar dos veces el mismo dinero.</Message>
    </template>

    <template v-else>
      <PageHeader eyebrow="Billetera" title="Tarjeta no encontrada" description="La tarjeta pudo haber sido eliminada o el enlace ya no es válido." />
      <EmptyState icon="pi pi-credit-card" title="No encontramos esta tarjeta" description="Volvé al listado para seleccionar una tarjeta disponible."><Button label="Volver a tarjetas" icon="pi pi-arrow-left" @click="router.replace('/billetera/tarjetas')" /></EmptyState>
    </template>

    <Dialog v-model:visible="purchaseVisible" modal :header="editingPurchaseId ? 'Editar consumo' : 'Nuevo consumo'" :style="{ width: 'min(95vw, 44rem)' }">
      <div class="form-grid">
        <label class="field"><span>Descripción</span><InputText v-model="purchaseForm.title" placeholder="Ej. Supermercado" autofocus /></label>
        <label class="field"><span>Comercio</span><InputText v-model="purchaseForm.merchant" /></label>
        <label class="field"><span>Importe total</span><InputNumber v-model="purchaseForm.amount" mode="currency" :currency="store.data.settings.currency" locale="es-AR" :min="0" /></label>
        <label class="field"><span>Fecha</span><InputText v-model="purchaseForm.date" type="date" /></label>
        <label class="field"><span>Categoría</span><Select v-model="purchaseForm.category" :options="categories" /></label>
        <label class="field"><span>Estado</span><Select v-model="purchaseForm.status" :options="purchaseStatuses" option-label="label" option-value="value" /></label>
        <label class="field"><span>Cantidad de cuotas</span><InputNumber v-model="purchaseForm.installments" :min="1" :max="60" :use-grouping="false" /></label>
        <label class="field"><span>Cuota actual</span><InputNumber v-model="purchaseForm.currentInstallment" :min="1" :max="purchaseForm.installments" :use-grouping="false" /></label>
        <label class="field full"><span>Notas</span><Textarea v-model="purchaseForm.notes" rows="3" auto-resize /></label>
        <label class="wallet-checkbox full"><Checkbox v-model="registerFinance" binary /><span><strong>Reflejar en Finanzas</strong><small>En compras en cuotas se registra el importe de la cuota actual.</small></span></label>
      </div>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="purchaseVisible = false" /><Button label="Guardar consumo" icon="pi pi-check" @click="savePurchase" /></template>
    </Dialog>

    <Dialog v-model:visible="statementVisible" modal :header="editingStatementId ? 'Editar resumen' : 'Nuevo resumen'" :style="{ width: 'min(95vw, 42rem)' }">
      <div class="form-grid">
        <label class="field"><span>Período</span><InputText v-model="statementForm.period" type="month" /></label>
        <label class="field"><span>Estado</span><Select v-model="statementForm.status" :options="statementStatuses" option-label="label" option-value="value" /></label>
        <label class="field"><span>Fecha de cierre</span><InputText v-model="statementForm.closingDate" type="date" /></label>
        <label class="field"><span>Fecha de vencimiento</span><InputText v-model="statementForm.dueDate" type="date" /></label>
        <label class="field"><span>Total</span><InputNumber v-model="statementForm.totalAmount" mode="currency" :currency="store.data.settings.currency" locale="es-AR" :min="0" /></label>
        <label class="field"><span>Pago mínimo</span><InputNumber v-model="statementForm.minimumPayment" mode="currency" :currency="store.data.settings.currency" locale="es-AR" :min="0" /></label>
        <label class="field"><span>Importe ya pagado</span><InputNumber v-model="statementForm.paidAmount" mode="currency" :currency="store.data.settings.currency" locale="es-AR" :min="0" /></label>
        <label class="field full"><span>Notas</span><Textarea v-model="statementForm.notes" rows="3" auto-resize /></label>
      </div>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="statementVisible = false" /><Button label="Guardar resumen" icon="pi pi-check" @click="saveStatement" /></template>
    </Dialog>

    <Dialog v-model:visible="paymentVisible" modal header="Registrar pago del resumen" :style="{ width: 'min(92vw, 28rem)' }">
      <div v-if="selectedStatement" class="wallet-payment-dialog"><p>Total pendiente: <strong>{{ formatMoney(Math.max(0, selectedStatement.totalAmount - selectedStatement.paidAmount), store.data.settings.currency) }}</strong></p><label class="field"><span>Importe pagado</span><InputNumber v-model="paymentAmount" mode="currency" :currency="store.data.settings.currency" locale="es-AR" :min="0" /></label></div>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="paymentVisible = false" /><Button label="Registrar pago" icon="pi pi-check" @click="pay" /></template>
    </Dialog>
  </section>
</template>
