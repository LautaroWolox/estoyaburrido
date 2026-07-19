import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  clearStoredSession,
  createLocalAccount,
  getLocalAccount,
  getStoredSession,
  resetLocalPassword,
  signInLocal,
  verifyLocalPassword
} from '@/services/auth/localAuth'
import type { CreateAccountInput, SignInInput } from '@/services/auth/auth.types'

export const useAuthStore = defineStore('auth', () => {
  const account = ref(getLocalAccount())
  const session = ref(getStoredSession())
  const loading = ref(false)

  const isAuthenticated = computed(() => session.value !== null)
  const hasAccount = computed(() => account.value !== null)
  const currentUser = computed(() => session.value ? {
    id: session.value.userId,
    email: session.value.email,
    displayName: session.value.displayName
  } : null)

  function restoreSession() {
    account.value = getLocalAccount()
    session.value = getStoredSession()
  }

  async function createAccount(input: CreateAccountInput) {
    loading.value = true
    try {
      const result = await createLocalAccount(input)
      account.value = result.account
      session.value = result.session
    } finally {
      loading.value = false
    }
  }

  async function signIn(input: SignInInput) {
    loading.value = true
    try {
      session.value = await signInLocal(input)
      account.value = getLocalAccount()
    } finally {
      loading.value = false
    }
  }

  function signOut() {
    clearStoredSession()
    session.value = null
  }

  async function resetPassword(email: string, password: string) {
    loading.value = true
    try {
      account.value = await resetLocalPassword(email, password)
      session.value = null
    } finally {
      loading.value = false
    }
  }

  async function verifyPassword(password: string) {
    loading.value = true
    try {
      return await verifyLocalPassword(password)
    } finally {
      loading.value = false
    }
  }

  return {
    account,
    session,
    loading,
    isAuthenticated,
    hasAccount,
    currentUser,
    restoreSession,
    createAccount,
    signIn,
    signOut,
    resetPassword,
    verifyPassword
  }
})
