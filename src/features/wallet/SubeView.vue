<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import EmptyState from '@/components/EmptyState.vue'
import PageHeader from '@/components/PageHeader.vue'
import WalletTabs from './WalletTabs.vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import type { SubeCard, SubeMovement } from '@/types/domain'
import { createId } from '@/utils/id'
import { formatMoney } from '@/utils/money'

const store = useAppStore()
const auth = useAuthStore()
const toast = useToast()
const confirm = useConfirm()
const hidden = computed(() => store.data.settings.walletHideAmounts)
const cardVisible = ref(false)
const movementVisible = ref(false)
const useVisible = ref(false)
const passwordVisible = ref(false)
const editingCardId = ref<string | null>(null)
const editingMovementId = ref<string | null>(null)
const selectedUseCard = ref<SubeCard | null>(null)
const pendingRevealCard = ref<SubeCard | null>(null)
const password = ref('')
const passwordError = ref('')
const revealedCards = ref<string[]>([])
const registerFinance = ref(true)
const colors = ['#0066b3', '#0284c7', '#0f766e', '#4f46e5', '#7c3aed', '#475569']
const cardTypes = [{ label: 'SUBE física', value: 'physical' }, { label: 'SUBE Digital', value: 'digital' }]
const movementTypes = [{ label: 'Carga', value: 'topup' }, { label: 'Viaje', value: 'trip' }, { label: 'Ajuste manual', value: 'adjustment' }]
const statuses = [{ label: 'Pendiente de acreditar', value: 'pending' }, { label: 'Acreditada', value: 'credited' }, { label: 'Completada', value: 'completed' }]
const cards = computed(() => [...store.data.subeCards].sort((a, b) => Number(b.active) - Number(a.active) || a.nickname.localeCompare(b.nickname)))
const movements = computed(() => [...store.data.subeMovements].sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)))
const monthTrips = computed(() => movements.value.filter((item) => item.type === 'trip' && item.date.startsWith(store.currentMonth)))
const monthSpent = computed(() => monthTrips.value.reduce((sum, item) => sum + item.amount, 0))
const cardForm = reactive({ nickname: '', number: '', type: 'physical' as SubeCard['type'], balance: 0, lowBalanceAlert: 1500, benefit: '', registeredTo: '', active: true, officialUrl: 'https://www.argentina.gob.ar/sube', color: colors[0], notes: '' })
const movementForm = reactive({ subeCardId: '', type: 'topup' as SubeMovement['type'], amount: 0, date: store.today, time: new Date().toTimeString().slice(0, 5), transport: '', line: '', origin: '', destination: '', status: 'completed' as SubeMovement['status'], notes: '' })

function resetCard() {
  editingCardId.value = null
  Object.assign(cardForm, { nickname: '', number: '', type: 'physical', balance: 0, lowBalanceAlert: 1500, benefit: '', registeredTo: '', active: true, officialUrl: 'https://www.argentina.gob.ar/sube', color: colors[0], notes: '' })
}
function createCard() { resetCard(); cardVisible.value = true }
function editCard(card: SubeCard) { editingCardId.value = card.id; Object.assign(cardForm, card); cardVisible.value = true }

function saveCard() {
  const digits = cardForm.number.replace(/\D/g, '')
  if (!cardForm.nickname.trim() || digits.length < 8) {
    toast.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Indicá un nombre y un número SUBE válido.', life: 3000 })
    return
  }
  if (cardForm.officialUrl && !/^https?:\/\//i.test(cardForm.officialUrl)) {
    toast.add({ severity: 'warn', summary: 'Enlace inválido', detail: 'El enlace oficial debe comenzar con http:// o https://.', life: 3000 })
    return
  }
  const previous = store.data.subeCards.find((item) => item.id === editingCardId.value)
  store.upsert('subeCards', {
    id: editingCardId.value ?? createId('sube'),
    nickname: cardForm.nickname.trim(),
    number: digits,
    type: cardForm.type,
    balance: cardForm.balance,
    lowBalanceAlert: cardForm.lowBalanceAlert,
    lastUpdated: previous?.lastUpdated ?? new Date().toISOString(),
    benefit: cardForm.benefit.trim(),
    registeredTo: cardForm.registeredTo.trim(),
    active: cardForm.active,
    officialUrl: cardForm.officialUrl.trim(),
    color: cardForm.color,
    notes: cardForm.notes.trim()
  })
  cardVisible.value = false
  toast.add({ severity: 'success', summary: 'SUBE guardada', detail: 'Ya podés registrar cargas, viajes y alertas de saldo.', life: 2500 })
}

function removeCard(card: SubeCard) {
  confirm.require({ message: `Se eliminarán “${card.nickname}” y todos sus movimientos asociados.`, header: 'Eliminar SUBE', icon: 'pi pi-trash', rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true }, acceptProps: { label: 'Eliminar', severity: 'danger' }, accept: () => store.removeSubeCard(card.id) })
}

function resetMovement(cardId = cards.value[0]?.id ?? '') {
  editingMovementId.value = null
  Object.assign(movementForm, { subeCardId: cardId, type: 'topup', amount: 0, date: store.today, time: new Date().toTimeString().slice(0, 5), transport: '', line: '', origin: '', destination: '', status: 'completed', notes: '' })
  registerFinance.value = true
}
function createMovement(cardId?: string) { resetMovement(cardId); movementVisible.value = true }
function editMovement(item: SubeMovement) { editingMovementId.value = item.id; Object.assign(movementForm, item); registerFinance.value = Boolean(item.financeTransactionId); movementVisible.value = true }

function saveMovement() {
  if (!movementForm.subeCardId || movementForm.amount <= 0 || !movementForm.date) {
    toast.add({ severity: 'warn', summary: 'Faltan datos', detail: 'Elegí una SUBE e indicá importe y fecha.', life: 3000 })
    return
  }
  store.recordSubeMovement({
    id: editingMovementId.value ?? createId('sube-movement'),
    subeCardId: movementForm.subeCardId,
    type: movementForm.type,
    amount: movementForm.amount,
    date: movementForm.date,
    time: movementForm.time,
    transport: movementForm.transport.trim(),
    line: movementForm.line.trim(),
    origin: movementForm.origin.trim(),
    destination: movementForm.destination.trim(),
    balanceAfter: 0,
    status: movementForm.status,
    notes: movementForm.notes.trim()
  }, registerFinance.value)
  movementVisible.value = false
  toast.add({ severity: 'success', summary: 'Movimiento guardado', detail: registerFinance.value ? 'También se reflejó en Finanzas.' : 'Se actualizó el saldo de la SUBE.', life: 2500 })
}

function removeMovement(item: SubeMovement) {
  confirm.require({ message: 'Se recalculará el saldo y se quitará el movimiento asociado de Finanzas.', header: 'Eliminar movimiento', icon: 'pi pi-trash', rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true }, acceptProps: { label: 'Eliminar', severity: 'danger' }, accept: () => store.removeSubeMovement(item.id) })
}

function maskedNumber(card: SubeCard) {
  if (!store.data.settings.walletMaskSubeNumber || revealedCards.value.includes(card.id)) return card.number.replace(/(.{4})/g, '$1 ').trim()
  return `${'•'.repeat(Math.max(0, card.number.length - 4))}${card.number.slice(-4)}`.replace(/(.{4})/g, '$1 ').trim()
}

function requestReveal(card: SubeCard) {
  if (!store.data.settings.walletMaskSubeNumber || revealedCards.value.includes(card.id)) {
    revealedCards.value = revealedCards.value.filter((id) => id !== card.id)
    return
  }
  if (!store.data.settings.walletRequirePassword) {
    revealedCards.value.push(card.id)
    return
  }
  pendingRevealCard.value = card
  password.value = ''
  passwordError.value = ''
  passwordVisible.value = true
}

async function verifyAndReveal() {
  passwordError.value = ''
  if (!await auth.verifyPassword(password.value)) {
    passwordError.value = 'La contraseña no es correcta.'
    return
  }
  if (pendingRevealCard.value) revealedCards.value.push(pendingRevealCard.value.id)
  passwordVisible.value = false
}

function startUsing(card: SubeCard) { selectedUseCard.value = card; useVisible.value = true }
function safeOpen(url: string) { try { const parsed = new URL(url); if (['http:', 'https:'].includes(parsed.protocol)) window.open(parsed.toString(), '_blank', 'noopener,noreferrer') } catch { /* URL inválida */ } }

function lowBalanceReminder(card: SubeCard) {
  store.upsertCalendarEvent({ id: createId('event'), title: `Cargar ${card.nickname}`, date: store.today, time: '18:00', kind: 'task', notes: `Saldo registrado: ${formatMoney(card.balance, store.data.settings.currency)}`, color: card.color, completed: false, recurrence: 'none', reminderMinutes: [60], calendarId: 'transporte' })
  toast.add({ severity: 'success', summary: 'Recordatorio creado', detail: 'Se agregó la carga de SUBE al calendario.', life: 2300 })
}

const cardName = (id: string) => store.data.subeCards.find((item) => item.id === id)?.nickname ?? 'SUBE eliminada'
const typeIcon = (type: SubeMovement['type']) => type === 'topup' ? 'pi pi-plus' : type === 'trip' ? 'pi pi-directions' : 'pi pi-sliders-h'
const movementLabel = (type: SubeMovement['type']) => movementTypes.find((item) => item.value === type)?.label ?? type
</script>

<template>
  <section class="page-container wallet-page">
    <PageHeader eyebrow="Billetera" title="SUBE y transporte" description="Controlá tarjetas físicas o digitales, saldos, cargas, viajes y beneficios.">
      <Button label="Registrar movimiento" icon="pi pi-plus" severity="secondary" outlined :disabled="!cards.length" @click="createMovement()" />
      <Button label="Agregar SUBE" icon="pi pi-ticket" @click="createCard" />
    </PageHeader>
    <WalletTabs />

    <Message severity="info" :closable="false" class="wallet-safety-message">
      El número SUBE se guarda localmente y puede ocultarse con contraseña. Para pagar por NFC se abre o utiliza la aplicación oficial: Vida Organizada no copia ni emula la credencial de transporte.
    </Message>

    <div class="metrics-grid wallet-metrics">
      <article class="metric-card"><span class="metric-card__icon blue"><i class="pi pi-ticket" /></span><div><small>Saldo total</small><strong>{{ formatMoney(store.totalSubeBalance, store.data.settings.currency, hidden) }}</strong><p>{{ cards.filter((item) => item.active).length }} activas</p></div></article>
      <article class="metric-card"><span class="metric-card__icon rose"><i class="pi pi-exclamation-triangle" /></span><div><small>Saldo bajo</small><strong>{{ store.lowBalanceSubeCards.length }}</strong><p>Requieren una carga</p></div></article>
      <article class="metric-card"><span class="metric-card__icon violet"><i class="pi pi-directions" /></span><div><small>Viajes del mes</small><strong>{{ monthTrips.length }}</strong><p>Movimientos registrados</p></div></article>
      <article class="metric-card"><span class="metric-card__icon amber"><i class="pi pi-wallet" /></span><div><small>Transporte mensual</small><strong>{{ formatMoney(monthSpent, store.data.settings.currency, hidden) }}</strong><p>Consumo por viajes</p></div></article>
    </div>

    <div v-if="cards.length" class="sube-card-grid">
      <Card v-for="card in cards" :key="card.id" class="sube-management-card">
        <template #content>
          <article class="sube-visual" :style="{ '--sube-color': card.color }">
            <div class="sube-visual__top"><span><i class="pi pi-wifi" /> SUBE</span><Tag :value="card.type === 'digital' ? 'Digital' : 'Física'" severity="contrast" rounded /></div>
            <strong>{{ card.nickname }}</strong>
            <button class="sube-number" type="button" @click="requestReveal(card)">{{ maskedNumber(card) }} <i :class="revealedCards.includes(card.id) ? 'pi pi-eye-slash' : 'pi pi-eye'" /></button>
            <div class="sube-balance"><small>Saldo registrado</small><b>{{ formatMoney(card.balance, store.data.settings.currency, hidden) }}</b></div>
            <div class="sube-visual__bottom"><span>{{ card.registeredTo || 'Sin titular indicado' }}</span><span>{{ card.benefit || 'Sin beneficio' }}</span></div>
          </article>
          <div v-if="card.balance <= card.lowBalanceAlert" class="sube-low-alert"><i class="pi pi-exclamation-circle" /><span><strong>Saldo bajo</strong><small>El aviso está configurado en {{ formatMoney(card.lowBalanceAlert, store.data.settings.currency) }}.</small></span><Button icon="pi pi-bell" text rounded @click="lowBalanceReminder(card)" /></div>
          <div class="entity-actions sube-actions"><Button label="Usar SUBE" icon="pi pi-mobile" @click="startUsing(card)" /><Button label="Cargar" icon="pi pi-plus" severity="secondary" outlined @click="createMovement(card.id)" /><Button label="Editar" icon="pi pi-pencil" severity="secondary" text @click="editCard(card)" /><Button icon="pi pi-trash" severity="danger" text rounded aria-label="Eliminar" @click="removeCard(card)" /></div>
        </template>
      </Card>
    </div>
    <EmptyState v-else icon="pi pi-ticket" title="No hay tarjetas SUBE" description="Agregá una SUBE física o digital para registrar su saldo, cargas y viajes."><Button label="Agregar SUBE" icon="pi pi-plus" @click="createCard" /></EmptyState>

    <Card class="content-card wallet-movements-card">
      <template #title><div class="card-title"><span>Movimientos de transporte</span><Button label="Nuevo" icon="pi pi-plus" size="small" :disabled="!cards.length" @click="createMovement()" /></div></template>
      <template #content>
        <div v-if="movements.length" class="wallet-purchase-list">
          <article v-for="item in movements" :key="item.id" class="wallet-purchase-row">
            <span :class="['row-icon', item.type === 'topup' ? 'green' : item.type === 'trip' ? 'blue' : 'amber']"><i :class="typeIcon(item.type)" /></span>
            <div><strong>{{ movementLabel(item.type) }}<template v-if="item.line"> · {{ item.line }}</template></strong><small>{{ cardName(item.subeCardId) }} · {{ item.date }} {{ item.time }}<template v-if="item.origin || item.destination"> · {{ item.origin }} → {{ item.destination }}</template></small></div>
            <Tag :value="statuses.find((status) => status.value === item.status)?.label" severity="secondary" rounded />
            <b :class="item.type === 'topup' ? 'income' : 'expense'">{{ item.type === 'topup' ? '+' : item.type === 'trip' ? '-' : '' }}{{ formatMoney(item.amount, store.data.settings.currency, hidden) }}</b>
            <div class="wallet-row-actions"><Button icon="pi pi-pencil" text rounded severity="secondary" aria-label="Editar" @click="editMovement(item)" /><Button icon="pi pi-trash" text rounded severity="danger" aria-label="Eliminar" @click="removeMovement(item)" /></div>
          </article>
        </div>
        <EmptyState v-else icon="pi pi-directions" title="Sin movimientos" description="Las cargas, viajes y ajustes manuales aparecerán en este historial." />
      </template>
    </Card>

    <Dialog v-model:visible="cardVisible" modal :header="editingCardId ? 'Editar SUBE' : 'Agregar SUBE'" :style="{ width: 'min(95vw, 44rem)' }">
      <div class="form-grid">
        <label class="field"><span>Nombre personalizado</span><InputText v-model="cardForm.nickname" placeholder="Ej. SUBE personal" autofocus /></label>
        <label class="field"><span>Tipo</span><Select v-model="cardForm.type" :options="cardTypes" option-label="label" option-value="value" /></label>
        <label class="field full"><span>Número SUBE</span><InputText v-model="cardForm.number" inputmode="numeric" autocomplete="off" placeholder="Número impreso en la tarjeta" /><small>No se comparte con terceros. Se migrará a almacenamiento cifrado al conectar Supabase.</small></label>
        <label class="field"><span>Saldo inicial o corregido</span><InputNumber v-model="cardForm.balance" mode="currency" :currency="store.data.settings.currency" locale="es-AR" :min="0" /></label>
        <label class="field"><span>Avisar cuando quede menos de</span><InputNumber v-model="cardForm.lowBalanceAlert" mode="currency" :currency="store.data.settings.currency" locale="es-AR" :min="0" /></label>
        <label class="field"><span>Titular registrado</span><InputText v-model="cardForm.registeredTo" /></label>
        <label class="field"><span>Beneficio</span><InputText v-model="cardForm.benefit" placeholder="Ej. Tarifa Social" /></label>
        <label class="field full"><span>Enlace oficial</span><InputText v-model="cardForm.officialUrl" type="url" placeholder="https://..." /></label>
        <label class="field full"><span>Notas</span><Textarea v-model="cardForm.notes" rows="3" auto-resize /></label>
        <div class="field full"><span>Color</span><div class="color-picker"><button v-for="color in colors" :key="color" type="button" :style="{ background: color }" :class="{ selected: cardForm.color === color }" @click="cardForm.color = color" /></div></div>
        <label class="switch-field full"><span><strong>SUBE activa</strong><small>Se incluye en el saldo total y las alertas.</small></span><ToggleSwitch v-model="cardForm.active" /></label>
      </div>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="cardVisible = false" /><Button label="Guardar SUBE" icon="pi pi-check" @click="saveCard" /></template>
    </Dialog>

    <Dialog v-model:visible="movementVisible" modal :header="editingMovementId ? 'Editar movimiento' : 'Nuevo movimiento'" :style="{ width: 'min(95vw, 46rem)' }">
      <div class="form-grid">
        <label class="field"><span>Tarjeta SUBE</span><Select v-model="movementForm.subeCardId" :options="cards" option-label="nickname" option-value="id" /></label>
        <label class="field"><span>Tipo de movimiento</span><Select v-model="movementForm.type" :options="movementTypes" option-label="label" option-value="value" @change="registerFinance = movementForm.type === 'topup'" /></label>
        <label class="field"><span>Importe</span><InputNumber v-model="movementForm.amount" mode="currency" :currency="store.data.settings.currency" locale="es-AR" :min="0" /></label>
        <label class="field"><span>Estado</span><Select v-model="movementForm.status" :options="statuses" option-label="label" option-value="value" /></label>
        <label class="field"><span>Fecha</span><InputText v-model="movementForm.date" type="date" /></label>
        <label class="field"><span>Hora</span><InputText v-model="movementForm.time" type="time" /></label>
        <label v-if="movementForm.type === 'trip'" class="field"><span>Medio de transporte</span><InputText v-model="movementForm.transport" placeholder="Colectivo, tren, subte" /></label>
        <label v-if="movementForm.type === 'trip'" class="field"><span>Línea</span><InputText v-model="movementForm.line" placeholder="Ej. 60" /></label>
        <label v-if="movementForm.type === 'trip'" class="field"><span>Origen</span><InputText v-model="movementForm.origin" /></label>
        <label v-if="movementForm.type === 'trip'" class="field"><span>Destino</span><InputText v-model="movementForm.destination" /></label>
        <label class="field full"><span>Notas</span><Textarea v-model="movementForm.notes" rows="3" auto-resize /></label>
        <label class="wallet-checkbox full"><Checkbox v-model="registerFinance" binary /><span><strong>Reflejar en Finanzas</strong><small>Para evitar duplicados, normalmente se registra la carga y no cada viaje.</small></span></label>
      </div>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="movementVisible = false" /><Button label="Guardar movimiento" icon="pi pi-check" @click="saveMovement" /></template>
    </Dialog>

    <Dialog v-model:visible="passwordVisible" modal header="Confirmar identidad" :style="{ width: 'min(92vw, 28rem)' }">
      <p class="wallet-muted-copy">Ingresá la contraseña de la aplicación para mostrar el número completo de la SUBE.</p>
      <Message v-if="passwordError" severity="error" :closable="false">{{ passwordError }}</Message>
      <label class="field"><span>Contraseña</span><Password v-model="password" :feedback="false" toggle-mask autofocus @keyup.enter="verifyAndReveal" /></label>
      <template #footer><Button label="Cancelar" severity="secondary" text @click="passwordVisible = false" /><Button label="Mostrar número" icon="pi pi-eye" :loading="auth.loading" @click="verifyAndReveal" /></template>
    </Dialog>

    <Dialog v-model:visible="useVisible" modal header="Usar SUBE de forma segura" :style="{ width: 'min(92vw, 34rem)' }">
      <div v-if="selectedUseCard" class="wallet-use-dialog"><span class="wallet-use-icon"><i class="pi pi-ticket" /></span><h3>{{ selectedUseCard.nickname }}</h3><p v-if="selectedUseCard.type === 'digital'">Abrí la aplicación oficial SUBE en un Android compatible con NFC y seleccioná SUBE Digital. El pago se realiza con la credencial segura oficial, no con los datos guardados en Vida Organizada.</p><p v-else>Usá la tarjeta física en el validador. Desde Vida Organizada podés controlar saldo, cargas y viajes, y abrir el sitio o aplicación oficial para acreditar una carga.</p></div>
      <template #footer><Button label="Cerrar" severity="secondary" text @click="useVisible = false" /><Button v-if="selectedUseCard?.officialUrl" label="Abrir SUBE oficial" icon="pi pi-external-link" @click="safeOpen(selectedUseCard.officialUrl)" /></template>
    </Dialog>
  </section>
</template>
