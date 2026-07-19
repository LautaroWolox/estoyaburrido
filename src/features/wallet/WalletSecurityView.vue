<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import Password from 'primevue/password'
import Select from 'primevue/select'
import ToggleSwitch from 'primevue/toggleswitch'
import PageHeader from '@/components/PageHeader.vue'
import WalletTabs from './WalletTabs.vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const store = useAppStore()
const auth = useAuthStore()
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const verifyVisible = ref(false)
const password = ref('')
const verifyResult = ref<'success' | 'error' | null>(null)
const lockOptions = [
  { label: 'No bloquear por inactividad', value: 0 },
  { label: 'Después de 1 minuto', value: 1 },
  { label: 'Después de 5 minutos', value: 5 },
  { label: 'Después de 15 minutos', value: 15 },
  { label: 'Después de 30 minutos', value: 30 },
  { label: 'Después de 1 hora', value: 60 }
]

async function lockNow() {
  auth.signOut()
  await router.replace({ path: '/login', query: { reason: 'manual-lock' } })
}

function exportWallet() {
  const payload = {
    app: 'Vida Organizada',
    module: 'wallet',
    version: 1,
    exportedAt: new Date().toISOString(),
    paymentCards: store.data.paymentCards,
    cardPurchases: store.data.cardPurchases,
    cardStatements: store.data.cardStatements,
    subeCards: store.data.subeCards,
    subeMovements: store.data.subeMovements
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `vida-organizada-billetera-${store.today}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

function clearWallet() {
  confirm.require({
    message: 'Se eliminarán tarjetas, consumos, resúmenes, SUBE y movimientos. Los gastos vinculados también se quitarán de Finanzas.',
    header: 'Vaciar billetera',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancelar', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Eliminar datos', severity: 'danger' },
    accept: () => {
      const transactionIds = [
        ...store.data.cardPurchases.map((item) => item.financeTransactionId),
        ...store.data.subeMovements.map((item) => item.financeTransactionId)
      ].filter((value): value is string => Boolean(value))
      store.data.transactions = store.data.transactions.filter((item) => !transactionIds.includes(item.id))
      store.data.paymentCards = []
      store.data.cardPurchases = []
      store.data.cardStatements = []
      store.data.subeCards = []
      store.data.subeMovements = []
      toast.add({ severity: 'success', summary: 'Billetera vacía', detail: 'Se eliminaron los datos locales del módulo.', life: 2500 })
    }
  })
}

function openVerify() {
  password.value = ''
  verifyResult.value = null
  verifyVisible.value = true
}

async function testPassword() {
  verifyResult.value = await auth.verifyPassword(password.value) ? 'success' : 'error'
}
</script>

<template>
  <section class="page-container wallet-page">
    <PageHeader eyebrow="Billetera" title="Seguridad y privacidad" description="Controlá qué información se muestra y cuándo debe bloquearse la sesión.">
      <Button label="Bloquear ahora" icon="pi pi-lock" severity="secondary" outlined @click="lockNow" />
    </PageHeader>
    <WalletTabs />

    <div class="two-columns wallet-security-grid">
      <Card class="content-card">
        <template #title>Privacidad visual</template>
        <template #content>
          <div class="wallet-settings-list">
            <label class="switch-field"><span><strong>Ocultar importes</strong><small>Reemplaza saldos, límites y consumos por puntos en todo el módulo.</small></span><ToggleSwitch v-model="store.data.settings.walletHideAmounts" /></label>
            <label class="switch-field"><span><strong>Ocultar número SUBE</strong><small>Muestra únicamente los últimos cuatro dígitos hasta confirmar identidad.</small></span><ToggleSwitch v-model="store.data.settings.walletMaskSubeNumber" /></label>
            <label class="switch-field"><span><strong>Pedir contraseña para datos sensibles</strong><small>Protege la visualización del número completo de SUBE.</small></span><ToggleSwitch v-model="store.data.settings.walletRequirePassword" /></label>
          </div>
        </template>
      </Card>

      <Card class="content-card">
        <template #title>Bloqueo de sesión</template>
        <template #content>
          <div class="wallet-settings-list">
            <label class="field"><span>Bloqueo automático</span><Select v-model="store.data.settings.walletAutoLockMinutes" :options="lockOptions" option-label="label" option-value="value" /></label>
            <label class="switch-field"><span><strong>Bloquear al cambiar de aplicación</strong><small>Cierra la sesión cuando la pestaña o PWA pasa a segundo plano.</small></span><ToggleSwitch v-model="store.data.settings.walletLockOnBackground" /></label>
            <Button label="Probar contraseña" icon="pi pi-key" severity="secondary" outlined @click="openVerify" />
          </div>
        </template>
      </Card>
    </div>

    <div class="two-columns wallet-security-grid">
      <Card class="content-card">
        <template #title>Almacenamiento actual</template>
        <template #content>
          <Message severity="warn" :closable="false">En esta etapa, los datos se guardan en el navegador. El login local evita accesos casuales, pero no reemplaza cifrado de servidor, políticas por usuario ni protección remota.</Message>
          <div class="wallet-security-facts">
            <article><i class="pi pi-check-circle" /><span><strong>No se guarda CVV, PIN ni número bancario completo</strong><small>Las tarjetas bancarias se identifican únicamente por sus últimos cuatro números.</small></span></article>
            <article><i class="pi pi-check-circle" /><span><strong>Revalidación de contraseña</strong><small>El número SUBE puede quedar protegido detrás del acceso local.</small></span></article>
            <article><i class="pi pi-clock" /><span><strong>Cifrado y biometría pendientes</strong><small>Se incorporarán con Supabase, WebAuthn o una aplicación nativa según el despliegue definitivo.</small></span></article>
          </div>
        </template>
      </Card>

      <Card class="content-card">
        <template #title>Datos de la billetera</template>
        <template #content>
          <div class="wallet-data-actions">
            <Button label="Exportar billetera" icon="pi pi-download" severity="secondary" outlined @click="exportWallet" />
            <RouterLink to="/configuracion"><Button label="Respaldo completo" icon="pi pi-cloud-download" severity="secondary" text /></RouterLink>
            <Button label="Eliminar datos de billetera" icon="pi pi-trash" severity="danger" text @click="clearWallet" />
          </div>
          <small class="wallet-data-note">El archivo exportado contiene datos personales. Guardalo en una ubicación privada y no lo compartas.</small>
        </template>
      </Card>
    </div>

    <Card class="content-card wallet-payment-boundary">
      <template #title>Qué puede y qué no puede hacer la app</template>
      <template #content>
        <div class="wallet-boundary-grid">
          <article class="allowed"><i class="pi pi-check" /><div><strong>Administrar</strong><p>Tarjetas, límites, resúmenes, consumos, cuotas, SUBE, cargas, viajes, beneficios y recordatorios.</p></div></article>
          <article class="allowed"><i class="pi pi-check" /><div><strong>Derivar de forma segura</strong><p>Abrir el sitio o aplicación oficial del banco, Apple Wallet, Google Wallet o SUBE.</p></div></article>
          <article class="blocked"><i class="pi pi-times" /><div><strong>No emular credenciales</strong><p>Una PWA no puede copiar una tarjeta bancaria ni una SUBE para transmitirla por NFC.</p></div></article>
          <article class="blocked"><i class="pi pi-times" /><div><strong>No procesar pagos</strong><p>Los pagos reales requieren tokenización, emisores autorizados y certificaciones externas.</p></div></article>
        </div>
      </template>
    </Card>

    <Dialog v-model:visible="verifyVisible" modal header="Probar contraseña" :style="{ width: 'min(92vw, 28rem)' }">
      <p class="wallet-muted-copy">Esta prueba usa la misma revalidación que protege la información sensible.</p>
      <Message v-if="verifyResult === 'success'" severity="success" :closable="false">La contraseña es correcta.</Message>
      <Message v-if="verifyResult === 'error'" severity="error" :closable="false">La contraseña no es correcta.</Message>
      <label class="field"><span>Contraseña</span><Password v-model="password" :feedback="false" toggle-mask autofocus @keyup.enter="testPassword" /></label>
      <template #footer><Button label="Cerrar" severity="secondary" text @click="verifyVisible = false" /><Button label="Verificar" icon="pi pi-check" :loading="auth.loading" @click="testPassword" /></template>
    </Dialog>
  </section>
</template>
