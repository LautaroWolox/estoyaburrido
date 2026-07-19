<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import AuthLayout from './AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const email = ref(auth.account?.email ?? '')
const password = ref('')
const remember = ref(true)
const error = ref('')

async function submit() {
  error.value = ''
  if (!email.value.trim() || !password.value) {
    error.value = 'Completá el correo y la contraseña.'
    return
  }

  try {
    await auth.signIn({ email: email.value, password: password.value, remember: remember.value })
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/') ? route.query.redirect : '/'
    await router.replace(redirect)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'No se pudo iniciar sesión.'
  }
}
</script>

<template>
  <AuthLayout eyebrow="Bienvenido de nuevo" title="Ingresá a tu espacio" description="Continuá con tu organización personal desde este dispositivo.">
    <Message v-if="!auth.hasAccount" severity="info" :closable="false" class="auth-message">
      Todavía no existe un acceso local. Crealo una sola vez para proteger la aplicación en este dispositivo.
    </Message>
    <Message v-if="error" severity="error" :closable="false" class="auth-message">{{ error }}</Message>

    <form class="auth-form" @submit.prevent="submit">
      <label class="auth-field">
        <span>Correo electrónico</span>
        <span class="auth-input-wrap"><i class="pi pi-envelope" /><InputText v-model="email" type="email" autocomplete="email" placeholder="nombre@correo.com" /></span>
      </label>

      <label class="auth-field">
        <span>Contraseña</span>
        <Password v-model="password" :feedback="false" toggle-mask autocomplete="current-password" placeholder="Ingresá tu contraseña" input-class="auth-password-input" />
      </label>

      <div class="auth-form-options">
        <label><Checkbox v-model="remember" binary input-id="remember" /><span>Recordarme por 30 días</span></label>
        <RouterLink to="/recuperar-acceso">Olvidé mi contraseña</RouterLink>
      </div>

      <Button type="submit" label="Ingresar" icon="pi pi-arrow-right" icon-pos="right" :loading="auth.loading" class="auth-submit" />
    </form>

    <div class="auth-separator"><span>Acceso del dispositivo</span></div>

    <RouterLink v-if="!auth.hasAccount" to="/crear-acceso" class="auth-secondary-action">
      <i class="pi pi-user-plus" /><span><strong>Crear mi acceso</strong><small>Configurá tu nombre, correo y contraseña local.</small></span><i class="pi pi-chevron-right" />
    </RouterLink>
    <p v-else class="auth-device-note"><i class="pi pi-shield" /> La contraseña se verifica únicamente en este dispositivo hasta conectar Supabase.</p>
  </AuthLayout>
</template>
