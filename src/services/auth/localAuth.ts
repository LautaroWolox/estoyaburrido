import type { AuthSession, CreateAccountInput, LocalAccount, SignInInput } from './auth.types'

const ACCOUNT_KEY = 'vida-organizada:local-account:v1'
const PERSISTENT_SESSION_KEY = 'vida-organizada:auth-session:persistent:v1'
const TEMPORARY_SESSION_KEY = 'vida-organizada:auth-session:temporary:v1'

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function readJson<T>(storage: Storage, key: string): T | null {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) as T : null
  } catch {
    return null
  }
}

function writeJson(storage: Storage, key: string, value: unknown) {
  storage.setItem(key, JSON.stringify(value))
}

async function hashPassword(password: string) {
  const payload = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', payload)
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, '0')).join('')
}

function buildSession(account: LocalAccount, remember: boolean): AuthSession {
  const issuedAt = new Date()
  const expiresAt = new Date(issuedAt)
  expiresAt.setHours(expiresAt.getHours() + (remember ? 24 * 30 : 12))

  return {
    userId: account.id,
    email: account.email,
    displayName: account.displayName,
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    remember
  }
}

function persistSession(session: AuthSession) {
  localStorage.removeItem(PERSISTENT_SESSION_KEY)
  sessionStorage.removeItem(TEMPORARY_SESSION_KEY)
  writeJson(session.remember ? localStorage : sessionStorage, session.remember ? PERSISTENT_SESSION_KEY : TEMPORARY_SESSION_KEY, session)
}

export function getLocalAccount() {
  return readJson<LocalAccount>(localStorage, ACCOUNT_KEY)
}

export function hasLocalAccount() {
  return getLocalAccount() !== null
}

export async function createLocalAccount(input: CreateAccountInput) {
  if (hasLocalAccount()) throw new Error('Ya existe un acceso local en este dispositivo.')

  const now = new Date().toISOString()
  const account: LocalAccount = {
    id: crypto.randomUUID(),
    email: normalizeEmail(input.email),
    displayName: input.displayName.trim(),
    passwordHash: await hashPassword(input.password),
    createdAt: now,
    updatedAt: now
  }

  writeJson(localStorage, ACCOUNT_KEY, account)
  const session = buildSession(account, input.remember)
  persistSession(session)
  return { account, session }
}

export async function signInLocal(input: SignInInput) {
  const account = getLocalAccount()
  if (!account) throw new Error('Primero tenés que crear el acceso de este dispositivo.')

  const passwordHash = await hashPassword(input.password)
  if (account.email !== normalizeEmail(input.email) || account.passwordHash !== passwordHash) {
    throw new Error('El correo o la contraseña no son correctos.')
  }

  const session = buildSession(account, input.remember)
  persistSession(session)
  return session
}

export async function verifyLocalPassword(password: string) {
  const account = getLocalAccount()
  if (!account) return false
  return account.passwordHash === await hashPassword(password)
}

export function getStoredSession() {
  const session = readJson<AuthSession>(localStorage, PERSISTENT_SESSION_KEY)
    ?? readJson<AuthSession>(sessionStorage, TEMPORARY_SESSION_KEY)

  if (!session) return null
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    clearStoredSession()
    return null
  }
  return session
}

export function clearStoredSession() {
  localStorage.removeItem(PERSISTENT_SESSION_KEY)
  sessionStorage.removeItem(TEMPORARY_SESSION_KEY)
}

export async function resetLocalPassword(email: string, password: string) {
  const account = getLocalAccount()
  if (!account || account.email !== normalizeEmail(email)) {
    throw new Error('No existe un acceso local con ese correo en este dispositivo.')
  }

  const updated: LocalAccount = {
    ...account,
    passwordHash: await hashPassword(password),
    updatedAt: new Date().toISOString()
  }
  writeJson(localStorage, ACCOUNT_KEY, updated)
  clearStoredSession()
  return updated
}
