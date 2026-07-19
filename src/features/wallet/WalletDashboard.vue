<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import WalletTabs from './WalletTabs.vue'
import { useAppStore } from '@/stores/app'
import type { CardStatement, PaymentCard } from '@/types/domain'
import { createId } from '@/utils/id'
import { formatMoney } from '@/utils/money'

const store = useAppStore()
const selectedCard = ref<PaymentCard | null>(null)
const useDialog = ref(false)
const hidden = computed(() => store.data.settings.walletHideAmounts)
const cards = computed(() => [...store.data.paymentCards].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)))
const recentPurchases = computed(() => [...store.data.cardPurchases].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6))
const upcomingStatements = computed(() => store.data.cardStatements.filter((item) => item.status !== 'paid').sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 4))
const activeSube = computed(() => store.data.subeCards.filter((item) => item.active))
const monthTransport = computed(() => store.data.subeMovements.filter((item) => item.type === 'trip' && item.date.startsWith(store.currentMonth)).reduce((sum, item) => sum + item.amount, 0))

const cardName = (id: string) => store.data.paymentCards.find((item) => item.id === id)?.nickname ?? 'Tarjeta eliminada'
const cardNetwork = (value: string) => value === 'amex' ? 'American Express' : value.charAt(0).toUpperCase() + value.slice(1)

function startUsing(card: PaymentCard) {
  selectedCard.value = card
  useDialog.value = true
}

function safeOpen(url: string) {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return
    window.open(parsed.toString(), '_blank', 'noopener,noreferrer')
  } catch {
    // El enlace se valida antes de abrirlo.
  }
}

function addStatementReminder(statement: CardStatement) {
  const card = store.data.paymentCards.find((item) => item.id === statement.cardId)
  store.upsertCalendarEvent({
    id: createId('event'),
    title: `Pagar ${card?.nickname ?? 'tarjeta'}`,
    date: statement.dueDate,
    time: '09:00',
    kind: 'task',
    notes: `Resumen ${statement.period} · ${formatMoney(statement.totalAmount, store.data.settings.currency)}`,
    color: card?.color ?? '#6d5dfc',
    completed: false,
    allDay: false,
    recurrence: 'none',
    reminderMinutes: [1440, 180],
    calendarId: 'finanzas'
  })
}
</script>

<template>
  <section class="page-container wallet-page">
    <PageHeader eyebrow="Dinero y transporte" title="Billetera" description="Administrá tarjetas, resúmenes, consumos, límites y SUBE desde un único lugar seguro.">
      <RouterLink to="/billetera/tarjetas"><Button label="Agregar tarjeta" icon="pi pi-plus" /></RouterLink>
    </PageHeader>
    <WalletTabs />

    <Message severity="info" :closable="false" class="wallet-safety-message">
      La app guarda únicamente datos de administración. Nunca solicita ni almacena CVV, PIN o el número completo de tarjetas bancarias. Los pagos se realizan en la billetera o aplicación oficial.
    </Message>

    <div class="metrics-grid wallet-metrics">
      <article class="metric-card"><span class="metric-card__icon violet"><i class="pi pi-credit-card" /></span><div><small>Límite total</small><strong>{{ formatMoney(store.walletCreditLimit, store.data.settings.currency, hidden) }}</strong><p>Tarjetas de crédito activas</p></div></article>
      <article class="metric-card"><span class="metric-card__icon green"><i class="pi pi-check-circle" /></span><div><small>Disponible</small><strong>{{ formatMoney(store.walletAvailableLimit, store.data.settings.currency, hidden) }}</strong><p>Disponible estimado</p></div></article>
      <article class="metric-card"><span class="metric-card__icon rose"><i class="pi pi-chart-line" /></span><div><small>Consumo registrado</small><strong>{{ formatMoney(store.walletCurrentDebt, store.data.settings.currency, hidden) }}</strong><p>Según consumos cargados</p></div></article>
      <article class="metric-card"><span class="metric-card__icon blue"><i class="pi pi-ticket" /></span><div><small>Saldo SUBE</small><strong>{{ formatMoney(store.totalSubeBalance, store.data.settings.currency, hidden) }}</strong><p>{{ activeSube.length }} tarjeta{{ activeSube.length === 1 ? '' : 's' }} activa{{ activeSube.length === 1 ? '' : 's' }}</p></div></article>
    </div>

    <Card class="content-card wallet-cards-panel">
      <template #title><div class="card-title"><span>Mis tarjetas</span><RouterLink to="/billetera/tarjetas">Administrar</RouterLink></div></template>
      <template #content>
        <div v-if="cards.length" class="wallet-card-carousel">
          <article v-for="card in cards" :key="card.id" class="payment-card" :style="{ '--card-color': card.color }">
            <div class="payment-card__top"><span>{{ card.issuer }}</span><Tag v-if="card.isDefault" value="Principal" severity="contrast" rounded /></div>
            <div class="payment-card__chip"><i class="pi pi-credit-card" /></div>
            <strong>{{ card.nickname }}</strong>
            <div class="payment-card__number"><span>••••</span><span>••••</span><span>••••</span><b>{{ card.last4 }}</b></div>
            <div class="payment-card__bottom"><span><small>Titular</small>{{ card.holderName || 'Sin indicar' }}</span><span><small>Vence</small>{{ String(card.expiryMonth).padStart(2, '0') }}/{{ String(card.expiryYear).slice(-2) }}</span><b>{{ cardNetwork(card.network) }}</b></div>
            <div class="payment-card__actions"><RouterLink :to="`/billetera/tarjetas/${card.id}`"><Button label="Ver detalle" icon="pi pi-eye" size="small" severity="secondary" /></RouterLink><Button label="Usar tarjeta" icon="pi pi-mobile" size="small" @click="startUsing(card)" /></div>
          </article>
        </div>
        <EmptyState v-else icon="pi pi-credit-card" title="Todavía no agregaste tarjetas" description="Guardá los datos administrativos y vinculá cada tarjeta con sus consumos, cuotas y vencimientos."><RouterLink to="/billetera/tarjetas"><Button label="Agregar primera tarjeta" icon="pi pi-plus" /></RouterLink></EmptyState>
      </template>
    </Card>

    <div class="two-columns wide-left wallet-dashboard-columns">
      <Card class="content-card">
        <template #title><div class="card-title"><span>Últimos consumos</span><RouterLink to="/billetera/tarjetas">Ver todos</RouterLink></div></template>
        <template #content>
          <div v-if="recentPurchases.length" class="smart-list">
            <article v-for="purchase in recentPurchases" :key="purchase.id" class="smart-row">
              <span class="row-icon violet"><i class="pi pi-shopping-bag" /></span>
              <div><strong>{{ purchase.title }}</strong><small>{{ cardName(purchase.cardId) }} · {{ purchase.date }}<template v-if="purchase.installments > 1"> · {{ purchase.currentInstallment }}/{{ purchase.installments }}</template></small></div>
              <b>{{ formatMoney(purchase.amount, store.data.settings.currency, hidden) }}</b>
            </article>
          </div>
          <EmptyState v-else icon="pi pi-shopping-bag" title="Sin consumos registrados" description="Los consumos cargados en tus tarjetas aparecerán acá." />
        </template>
      </Card>

      <div class="wallet-side-stack">
        <Card class="content-card">
          <template #title>Próximos vencimientos</template>
          <template #content>
            <div v-if="upcomingStatements.length" class="smart-list">
              <article v-for="statement in upcomingStatements" :key="statement.id" class="smart-row compact-row">
                <span class="row-icon amber"><i class="pi pi-calendar-clock" /></span>
                <div><strong>{{ cardName(statement.cardId) }}</strong><small>Vence {{ statement.dueDate }}</small></div>
                <Button icon="pi pi-bell" text rounded aria-label="Crear recordatorio" @click="addStatementReminder(statement)" />
              </article>
            </div>
            <p v-else class="wallet-muted-copy">No hay resúmenes pendientes.</p>
          </template>
        </Card>

        <Card class="content-card">
          <template #title>Transporte este mes</template>
          <template #content><div class="wallet-transport-summary"><span><i class="pi pi-ticket" /></span><div><strong>{{ formatMoney(monthTransport, store.data.settings.currency, hidden) }}</strong><small>{{ store.data.subeMovements.filter((item) => item.type === 'trip' && item.date.startsWith(store.currentMonth)).length }} viajes registrados</small></div><RouterLink to="/billetera/sube"><Button icon="pi pi-arrow-right" text rounded /></RouterLink></div></template>
        </Card>
      </div>
    </div>

    <Dialog v-model:visible="useDialog" modal header="Usar tarjeta de forma segura" :style="{ width: 'min(92vw, 34rem)' }">
      <div v-if="selectedCard" class="wallet-use-dialog">
        <span class="wallet-use-icon"><i class="pi pi-shield" /></span>
        <h3>{{ selectedCard.nickname }} •••• {{ selectedCard.last4 }}</h3>
        <p>Vida Organizada no emula tarjetas ni transmite credenciales NFC. La operación se completa mediante el sistema seguro del teléfono o la aplicación oficial del emisor.</p>
        <div class="wallet-use-steps">
          <article v-if="selectedCard.walletProvider === 'apple'"><i class="pi pi-apple" /><span><strong>Apple Pay</strong><small>Presioná dos veces el botón lateral y elegí esta tarjeta en Wallet.</small></span></article>
          <article v-else-if="selectedCard.walletProvider === 'google'"><i class="pi pi-mobile" /><span><strong>Google Wallet</strong><small>Desbloqueá el teléfono, elegí la tarjeta y acercalo al lector compatible.</small></span></article>
          <article v-else><i class="pi pi-building-columns" /><span><strong>Aplicación del emisor</strong><small>Abrí la app del banco o billetera para operar con esta tarjeta.</small></span></article>
        </div>
      </div>
      <template #footer><Button label="Cerrar" severity="secondary" text @click="useDialog = false" /><Button v-if="selectedCard?.issuerUrl" label="Abrir app o sitio del emisor" icon="pi pi-external-link" @click="safeOpen(selectedCard.issuerUrl)" /></template>
    </Dialog>
  </section>
</template>
