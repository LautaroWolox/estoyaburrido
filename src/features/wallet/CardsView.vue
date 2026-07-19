<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import WalletTabs from './WalletTabs.vue'
import { useAppStore } from '@/stores/app'
import type { PaymentCard, WalletCardNetwork, WalletCardStatus, WalletCardType, WalletProvider } from '@/types/domain'
import { createId } from '@/utils/id'
import { formatMoney } from '@/utils/money'

const store = useAppStore()
const toast = useToast()
const confirm = useConfirm()
const visible = ref(false)
const editingId = ref<string | null>(null)
const hidden = computed(() => store.data.settings.walletHideAmounts)
const currentYear = new Date().getFullYear()
const colors = ['#111827', '#4f46e5', '#7c3aed', '#0f766e', '#be123c', '#b45309', '#0369a1', '#475569']
const types = [{ label: 'Crédito', value: 'credit' }, { label: 'Débito', value: 'debit' }, { label: 'Prepaga', value: 'prepaid' }]
const networks = [{ label: 'Visa', value: 'visa' }, { label: 'Mastercard', value: 'mastercard' }, { label: 'American Express', value: 'amex' }, { label: 'Cabal', value: 'cabal' }, { label: 'Otra', value: 'other' }]
const providers = [{ label: 'Apple Wallet', value: 'apple' }, { label: 'Google Wallet', value: 'google' }, { label: 'Sin billetera vinculada', value: 'none' }]
const statuses = [{ label: 'Activa', value: 'active' }, { label: 'Pausada', value: 'paused' }, { label: 'Vencida', value: 'expired' }, { label: 'Reemplazada', value: 'replaced' }]
const form = reactive({ nickname: '', issuer: '', type: 'credit' as WalletCardType, network: 'visa' as WalletCardNetwork, last4: '', holderName: '', expiryMonth: new Date().getMonth() + 1, expiryYear: currentYear + 3, closingDay: 20, dueDay: 5, creditLimit: 0, availableLimit: 0, account: '', color: colors[1], isDefault: false, status: 'active' as WalletCardStatus, issuerUrl: '', walletProvider: 'none' as WalletProvider, notes: '' })
const cards = computed(() => [...store.data.paymentCards].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.nickname.localeCompare(b.nickname)))

function reset() {
  editingId.value = null
  Object.assign(form, { nickname: '', issuer: '', type: 'credit', network: 'visa', last4: '', holderName: '', expiryMonth: new Date().getMonth() + 1, expiryYear: currentYear + 3, closingDay: 20, dueDay: 5, creditLimit: 0, availableLimit: 0, account: '', color: colors[1], isDefault: store.data.paymentCards.length === 0, status: 'active', issuerUrl: '', walletProvider: 'none', notes: '' })
}

function create() { reset(); visible.value = true }
function edit(card: PaymentCard) { editingId.value = card.id; Object.assign(form, card); visible.value = true }

function save() {
  if (!form.nickname.trim() || !form.issuer.trim() || !/^\d{4}$/.test(form.last4)) {
    toast.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Indicá nombre, emisor y exactamente los últimos cuatro números.', life: 3500 })
    return
  }
  if (form.expiryMonth < 1 || form.expiryMonth > 12 || form.expiryYear < currentYear) {
    toast.add({ severity: 'warn', summary: 'Vencimiento inválido', detail: 'Revisá el mes y año de vencimiento.', life: 3000 })
    return
  }
  if (form.issuerUrl && !/^https?:\/\//i.test(form.issuerUrl)) {
    toast.add({ severity: 'warn', summary: 'Enlace inválido', detail: 'El enlace del emisor debe comenzar con http:// o https://.', life: 3000 })
    return
  }

  if (form.isDefault) store.data.paymentCards.forEach((item) => { item.isDefault = false })
  const previous = store.data.paymentCards.find((item) => item.id === editingId.value)
  const limit = form.type === 'credit' ? Math.max(0, form.creditLimit) : 0
  const available = form.type === 'credit'
    ? Math.min(limit, previous ? Math.max(0, previous.availableLimit + (limit - previous.creditLimit)) : (form.availableLimit || limit))
    : 0

  store.upsert('paymentCards', {
    id: editingId.value ?? createId('card'),
    nickname: form.nickname.trim(),
    issuer: form.issuer.trim(),
    type: form.type,
    network: form.network,
    last4: form.last4,
    holderName: form.holderName.trim(),
    expiryMonth: form.expiryMonth,
    expiryYear: form.expiryYear,
    closingDay: form.closingDay,
    dueDay: form.dueDay,
    creditLimit: limit,
    availableLimit: available,
    account: form.account.trim(),
    color: form.color,
    isDefault: form.isDefault,
    status: form.status,
    issuerUrl: form.issuerUrl.trim(),
    walletProvider: form.walletProvider,
    notes: form.notes.trim(),
    createdAt: previous?.createdAt ?? new Date().toISOString()
  })
  visible.value = false
  toast.add({ severity: 'success', summary: 'Tarjeta guardada', detail: 'Ya podés registrar consumos, resúmenes y vencimientos.', life: 2500 })
}

function removeCard(card: PaymentCard) {
  confirm.require({
    message: `Se eliminarán “${card.nickname}”, sus consumos y resúmenes asociados.`,
    header: 'Eliminar tarjeta',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Eliminar', severity: 'danger' },
    accept: () => store.removePaymentCard(card.id)
  })
}

const typeText = (value: WalletCardType) => types.find((item) => item.value === value)?.label ?? value
const statusSeverity = (value: WalletCardStatus) => value === 'active' ? 'success' : value === 'paused' ? 'warn' : 'danger'
</script>

<template>
  <section class="page-container wallet-page">
    <PageHeader eyebrow="Billetera" title="Tarjetas" description="Administrá tarjetas de crédito, débito y prepagas sin guardar credenciales sensibles.">
      <Button label="Nueva tarjeta" icon="pi pi-plus" @click="create" />
    </PageHeader>
    <WalletTabs />

    <Message severity="warn" :closable="false" class="wallet-safety-message">
      Guardá solamente los últimos cuatro números. Nunca ingreses el número completo, CVV, PIN, claves bancarias ni códigos de verificación.
    </Message>

    <div v-if="cards.length" class="wallet-card-management-grid">
      <Card v-for="card in cards" :key="card.id" class="wallet-card-management">
        <template #content>
          <article class="payment-card compact-card" :style="{ '--card-color': card.color }">
            <div class="payment-card__top"><span>{{ card.issuer }}</span><Tag :value="typeText(card.type)" severity="contrast" rounded /></div>
            <div class="payment-card__chip"><i class="pi pi-credit-card" /></div>
            <strong>{{ card.nickname }}</strong>
            <div class="payment-card__number"><span>••••</span><span>••••</span><span>••••</span><b>{{ card.last4 }}</b></div>
            <div class="payment-card__bottom"><span><small>Vence</small>{{ String(card.expiryMonth).padStart(2, '0') }}/{{ String(card.expiryYear).slice(-2) }}</span><span><small>Estado</small>{{ statuses.find((item) => item.value === card.status)?.label }}</span><b>{{ networks.find((item) => item.value === card.network)?.label }}</b></div>
          </article>

          <div class="wallet-card-stats">
            <span v-if="card.type === 'credit'"><small>Límite</small><strong>{{ formatMoney(card.creditLimit, store.data.settings.currency, hidden) }}</strong></span>
            <span v-if="card.type === 'credit'"><small>Disponible</small><strong>{{ formatMoney(card.availableLimit, store.data.settings.currency, hidden) }}</strong></span>
            <span><small>Cierre</small><strong>{{ card.closingDay ? `Día ${card.closingDay}` : '—' }}</strong></span>
            <span><small>Vencimiento</small><strong>{{ card.dueDay ? `Día ${card.dueDay}` : '—' }}</strong></span>
          </div>

          <div class="wallet-card-tags"><Tag v-if="card.isDefault" value="Principal" icon="pi pi-star-fill" rounded /><Tag :value="statuses.find((item) => item.value === card.status)?.label" :severity="statusSeverity(card.status)" rounded /><Tag :value="providers.find((item) => item.value === card.walletProvider)?.label" severity="secondary" rounded /></div>
          <div class="entity-actions wallet-card-actions"><RouterLink :to="`/billetera/tarjetas/${card.id}`"><Button label="Detalle" icon="pi pi-eye" text /></RouterLink><Button label="Editar" icon="pi pi-pencil" severity="secondary" text @click="edit(card)" /><Button label="Eliminar" icon="pi pi-trash" severity="danger" text @click="removeCard(card)" /></div>
        </template>
      </Card>
    </div>
    <EmptyState v-else icon="pi pi-credit-card" title="No hay tarjetas guardadas" description="Agregá una tarjeta para controlar límites, consumos, resúmenes y cuotas."><Button label="Agregar tarjeta" icon="pi pi-plus" @click="create" /></EmptyState>

    <Dialog v-model:visible="visible" modal :header="editingId ? 'Editar tarjeta' : 'Nueva tarjeta'" :style="{ width: 'min(95vw, 48rem)' }">
      <div class="form-grid wallet-card-form">
        <label class="field"><span>Nombre personalizado</span><InputText v-model="form.nickname" placeholder="Ej. Visa sueldo" autofocus /></label>
        <label class="field"><span>Banco o emisor</span><InputText v-model="form.issuer" placeholder="Ej. Galicia" /></label>
        <label class="field"><span>Tipo</span><Select v-model="form.type" :options="types" option-label="label" option-value="value" /></label>
        <label class="field"><span>Red</span><Select v-model="form.network" :options="networks" option-label="label" option-value="value" /></label>
        <label class="field"><span>Últimos cuatro números</span><InputText v-model="form.last4" maxlength="4" inputmode="numeric" placeholder="4582" /></label>
        <label class="field"><span>Nombre del titular</span><InputText v-model="form.holderName" autocomplete="name" /></label>
        <label class="field"><span>Mes de vencimiento</span><InputNumber v-model="form.expiryMonth" :min="1" :max="12" :use-grouping="false" /></label>
        <label class="field"><span>Año de vencimiento</span><InputNumber v-model="form.expiryYear" :min="currentYear" :max="currentYear + 20" :use-grouping="false" /></label>
        <label v-if="form.type === 'credit'" class="field"><span>Día de cierre</span><InputNumber v-model="form.closingDay" :min="1" :max="31" :use-grouping="false" /></label>
        <label v-if="form.type === 'credit'" class="field"><span>Día de vencimiento</span><InputNumber v-model="form.dueDay" :min="1" :max="31" :use-grouping="false" /></label>
        <label v-if="form.type === 'credit'" class="field"><span>Límite total</span><InputNumber v-model="form.creditLimit" mode="currency" :currency="store.data.settings.currency" locale="es-AR" :min="0" /></label>
        <label class="field"><span>Cuenta asociada</span><InputText v-model="form.account" placeholder="Ej. Caja de ahorro" /></label>
        <label class="field"><span>Billetera oficial</span><Select v-model="form.walletProvider" :options="providers" option-label="label" option-value="value" /></label>
        <label class="field"><span>Estado</span><Select v-model="form.status" :options="statuses" option-label="label" option-value="value" /></label>
        <label class="field full"><span>Enlace oficial del banco o emisor</span><InputText v-model="form.issuerUrl" type="url" placeholder="https://..." /><small>Se usará para el botón “Abrir app o sitio del emisor”.</small></label>
        <label class="field full"><span>Notas</span><Textarea v-model="form.notes" rows="3" auto-resize /></label>
        <div class="field full"><span>Color</span><div class="color-picker"><button v-for="color in colors" :key="color" type="button" :style="{ background: color }" :class="{ selected: form.color === color }" @click="form.color = color" /></div></div>
        <label class="switch-field full"><span><strong>Tarjeta principal</strong><small>Se mostrará primero en la billetera.</small></span><ToggleSwitch v-model="form.isDefault" /></label>
      </div>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="visible = false" /><Button label="Guardar tarjeta" icon="pi pi-check" @click="save" /></template>
    </Dialog>
  </section>
</template>
