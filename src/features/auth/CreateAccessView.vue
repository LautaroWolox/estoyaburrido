<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import AuthLayout from './AuthLayout.vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const appStore = useAppStore()
const router = useRouter()
const displayName = ref(appStore.data.settings.displayName || '')
const email = ref('')
const password = ref('')
const confirmation = ref('')
const error = ref('')

async function submit() {
  error.value = ''
  if (!displayName.value.trim() || !email.value.trim()) {
    error.value = 'Completá tu nombre y correo electrónico.'
    return
  }
  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }
  if (password.value !== confirmation.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  try {
    await auth.createAccount({
      displayName: displayName.value,
      email: email.value,
      password: password.value,
      remember: true
    })
    appStore.data.settings.displayName = displayName.value.trim()
    await router.replace('/')
  } catch (reason) {
    error.value = reason instanceof Error ? reason.message : 'No se pudo crear el acceso.'
  }
}
</script>

<template>
  <AuthLayout eyebrow="Primera configuración" title="Creá tu acceso personal" description="Este acceso protege la aplicación mientras preparamos la autenticación definitiva con Supabase.">
    <Message severity="warn" :closable="false" class="auth-message">
      Es una protección local para esta etapa visual. No reemplaza una autenticación de servidor y no sincroniza la cuenta entre dispositivos.
    </Message>
    <Message v-if="error" severity="error" :closable="false" class="auth-message">{{ error }}</Message>

    <form class="auth-form" @submit.prevent="submit">
      <label class="auth-field">
        <span>Nombre para mostrar</span>
        <span class="auth-input-wrap"><i class="pi pi-user" /><InputText v-model="displayName" autocomplete="name" placeholder="Ej. Lautaro" /></span>
      </label>

      <label class="auth-field">
        <span>Correo electrónico</span>
        <span class="auth-input-wrap"><i class="pi pi-envelope" /><InputText v-model="email" type="email" autocomplete="email" placeholder="nombre@correo.com" /></span>
      </label>

      <label class="auth-field">
        <span>Contraseña</span>
        <Password v-model="password" toggle-mask autocomplete="new-password" placeholder="Mínimo 8 caracteres" input-class="auth-password-input">
          <template #header><div class="auth-password-title">Elegí una contraseña segura</div></template>
          <template #footer><small>Usá una combinación que recuerdes y no compartas.</small></template>
        </Password>
      </label>

      <label class="auth-field">
        <span>Repetir contraseña</span>
        <Password v-model="confirmation" :feedback="false" toggle-mask autocomplete="new-password" placeholder="Volvé a escribirla" input-class="auth-password-input" />
      </label>

      <Button type="submit" label="Crear acceso y continuar" icon="pi pi-check" icon-pos="right" :loading="auth.loading" class="auth-submit" />
    </form>

    <p class="auth-device-note"><i class="pi pi-lock" /> El hash de la contraseña se guarda solamente en este navegador. Al conectar Supabase se migrará a un sistema seguro y multidispositivo.</p>
    <RouterLink to="/login" class="auth-back-link"><i class="pi pi-arrow-left" /> Volver al ingreso</RouterLink>
  </AuthLayout>
</template>
