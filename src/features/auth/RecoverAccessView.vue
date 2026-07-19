<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import AuthLayout from './AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref(auth.account?.email ?? '')
const password = ref('')
const confirmation = ref('')
const error = ref('')
const success = ref(false)

async function submit() {
  error.value = ''
  success.value = false
  if (!email.value.trim()) {
    error.value = 'Ingresá el correo del acceso local.'
    return
  }
  if (password.value.length < 8) {
    error.value = 'La nueva contraseña debe tener al menos 8 caracteres.'
    return
  }
  if (password.value !== confirmation.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  try {
    await auth.resetPassword(email.value, password.value)
    success.value = true
    window.setTimeout(() => void router.replace('/login'), 1200)
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'No se pudo cambiar la contraseña.'
  }
}
</script>

<template>
  <AuthLayout eyebrow="Recuperación local" title="Restablecé tu contraseña" description="Cambiá el acceso guardado en este dispositivo para volver a ingresar.">
    <Message severity="info" :closable="false" class="auth-message">
      Mientras no haya Supabase, la recuperación solo puede modificar la cuenta local de este navegador.
    </Message>
    <Message v-if="error" severity="error" :closable="false" class="auth-message">{{ error }}</Message>
    <Message v-if="success" severity="success" :closable="false" class="auth-message">Contraseña actualizada. Te estamos llevando al ingreso.</Message>

    <form class="auth-form" @submit.prevent="submit">
      <label class="auth-field">
        <span>Correo del acceso</span>
        <span class="auth-input-wrap"><i class="pi pi-envelope" /><InputText v-model="email" type="email" autocomplete="email" placeholder="nombre@correo.com" /></span>
      </label>
      <label class="auth-field">
        <span>Nueva contraseña</span>
        <Password v-model="password" :feedback="false" toggle-mask autocomplete="new-password" placeholder="Mínimo 8 caracteres" input-class="auth-password-input" />
      </label>
      <label class="auth-field">
        <span>Repetir contraseña</span>
        <Password v-model="confirmation" :feedback="false" toggle-mask autocomplete="new-password" placeholder="Volvé a escribirla" input-class="auth-password-input" />
      </label>
      <Button type="submit" label="Guardar nueva contraseña" icon="pi pi-key" :loading="auth.loading" class="auth-submit" />
    </form>

    <RouterLink to="/login" class="auth-back-link"><i class="pi pi-arrow-left" /> Volver al ingreso</RouterLink>
  </AuthLayout>
</template>
