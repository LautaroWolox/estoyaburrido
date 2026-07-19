<script setup lang="ts">
import { computed } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import ProgressBar from 'primevue/progressbar'
import Tag from 'primevue/tag'
import MetricCard from '@/components/MetricCard.vue'
import ModuleTabs from '@/components/ModuleTabs.vue'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useAppStore } from '@/stores/app'
import { formatCurrency, formatDate, percentage } from '@/utils/date'
import { financeTabs } from './navigation'

const store = useAppStore()
const currency = computed(() => store.data.settings.currency)
const recent = computed(() => [...store.data.transactions].sort((a,b) => `${b.date}${b.id}`.localeCompare(`${a.date}${a.id}`)).slice(0,6))
const monthlyExpenses = computed(() => store.data.transactions.filter((item) => item.type === 'expense' && item.date.startsWith(store.currentMonth)))
const categories = computed(() => {
  const map = new Map<string, number>()
  monthlyExpenses.value.forEach((item) => map.set(item.category, (map.get(item.category) ?? 0) + item.amount))
  return [...map.entries()].map(([category,total]) => ({ category,total })).sort((a,b) => b.total-a.total).slice(0,5)
})
const fixedMonthly = computed(() => store.data.recurringTransactions.filter((item) => item.active && item.type === 'expense').reduce((sum,item) => sum+item.amount,0) + store.data.subscriptions.filter((item)=>item.active && item.frequency==='monthly').reduce((sum,item)=>sum+item.amount,0))
const upcoming = computed(() => [
  ...store.data.recurringTransactions.filter((item)=>item.active).map((item)=>({ id:item.id,title:item.title,date:item.nextDate,amount:item.amount,type:item.type,label:'Recurrente' })),
  ...store.data.subscriptions.filter((item)=>item.active).map((item)=>({ id:item.id,title:item.name,date:item.nextBilling,amount:item.amount,type:'expense' as const,label:'Suscripción' })),
  ...store.data.installmentPlans.filter((item)=>item.paidInstallments<item.installments).map((item)=>({ id:item.id,title:item.title,date:item.nextDueDate,amount:item.installmentAmount,type:'expense' as const,label:`Cuota ${item.paidInstallments+1}/${item.installments}` }))
].filter((item)=>item.date).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6))
const savings = computed(() => store.data.savingsGoals.reduce((sum,item)=>sum+item.currentAmount,0))
</script>

<template>
  <section class="page-container">
    <PageHeader eyebrow="Control y planificación" title="Finanzas" description="Entendé cuánto entra, cuánto sale y qué compromisos se acercan.">
      <div class="header-actions"><RouterLink to="/finanzas/movimientos"><Button label="Nuevo movimiento" icon="pi pi-plus" /></RouterLink></div>
    </PageHeader>
    <ModuleTabs :tabs="financeTabs" />

    <div class="metrics-grid">
      <MetricCard label="Ingresos del mes" :value="formatCurrency(store.monthlyIncome,currency)" helper="movimientos confirmados" icon="pi pi-arrow-down-left" tone="green" />
      <MetricCard label="Gastos del mes" :value="formatCurrency(store.monthlyExpenses,currency)" helper="incluye gastos anteriores" icon="pi pi-arrow-up-right" tone="rose" />
      <MetricCard label="Balance disponible" :value="formatCurrency(store.monthlyBalance,currency)" :helper="store.monthlyBalance >= 0 ? 'saldo positivo' : 'revisá tus gastos'" icon="pi pi-wallet" :tone="store.monthlyBalance >= 0 ? 'blue' : 'amber'" />
      <MetricCard label="Ahorro acumulado" :value="formatCurrency(savings,currency)" helper="en todas tus metas" icon="pi pi-flag" tone="violet" />
    </div>

    <div class="finance-hero">
      <div>
        <span class="eyebrow">Panorama mensual</span>
        <h2>{{ store.monthlyBalance >= 0 ? 'Tus finanzas están bajo control' : 'Este mes necesita un ajuste' }}</h2>
        <p>Tenés {{ formatCurrency(fixedMonthly,currency) }} en compromisos fijos mensuales registrados.</p>
      </div>
      <div class="finance-ring" :style="{ '--ring': `${percentage(store.monthlyExpenses,Math.max(store.monthlyIncome,store.monthlyExpenses)) * 3.6}deg` }">
        <strong>{{ percentage(store.monthlyExpenses,Math.max(store.monthlyIncome,store.monthlyExpenses)) }}%</strong><span>consumido</span>
      </div>
    </div>

    <div class="two-columns wide-left">
      <Card class="content-card">
        <template #title><div class="card-title"><span>Movimientos recientes</span><RouterLink to="/finanzas/movimientos">Ver todos</RouterLink></div></template>
        <template #content>
          <div v-if="recent.length" class="smart-list">
            <article v-for="item in recent" :key="item.id" class="smart-row">
              <span :class="['row-icon',item.type==='income'?'green':'rose']"><i :class="item.type==='income'?'pi pi-arrow-down-left':'pi pi-arrow-up-right'" /></span>
              <div><strong>{{ item.title }}</strong><small>{{ formatDate(item.date,'dd MMM') }} · {{ item.category }} · {{ item.account }}</small></div>
              <b :class="item.type">{{ item.type==='income'?'+':'−' }}{{ formatCurrency(item.amount,currency) }}</b>
            </article>
          </div>
          <EmptyState v-else icon="pi pi-wallet" title="Todavía no hay movimientos" description="Registrá ingresos y gastos para ver el panorama mensual."><RouterLink to="/finanzas/movimientos"><Button label="Registrar movimiento" icon="pi pi-plus" /></RouterLink></EmptyState>
        </template>
      </Card>

      <Card class="content-card">
        <template #title><div class="card-title"><span>Distribución de gastos</span><RouterLink to="/finanzas/presupuestos">Presupuestos</RouterLink></div></template>
        <template #content>
          <div v-if="categories.length" class="category-bars">
            <div v-for="item in categories" :key="item.category"><p><span>{{ item.category }}</span><strong>{{ formatCurrency(item.total,currency) }}</strong></p><div><i :style="{width:`${percentage(item.total,monthlyExpenses.reduce((s,x)=>s+x.amount,0))}%`}" /></div></div>
          </div>
          <EmptyState v-else icon="pi pi-chart-bar" title="Sin gastos para analizar" description="La distribución aparecerá con tus primeros registros." />
        </template>
      </Card>
    </div>

    <Card class="content-card">
      <template #title><div class="card-title"><span>Próximos compromisos</span><RouterLink to="/finanzas/compromisos">Administrar</RouterLink></div></template>
      <template #content>
        <div v-if="upcoming.length" class="commitment-grid">
          <article v-for="item in upcoming" :key="`${item.label}-${item.id}`"><span><i class="pi pi-calendar-clock" /></span><div><Tag :value="item.label" severity="secondary" rounded/><strong>{{ item.title }}</strong><small>{{ formatDate(item.date,'dd MMMM') }}</small></div><b>{{ formatCurrency(item.amount,currency) }}</b></article>
        </div>
        <EmptyState v-else icon="pi pi-calendar-clock" title="No hay pagos programados" description="Agregá servicios, suscripciones o cuotas para anticiparte." />
      </template>
    </Card>
  </section>
</template>
