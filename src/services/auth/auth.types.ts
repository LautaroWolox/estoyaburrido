export interface LocalAccount {
  id: string
  email: string
  displayName: string
  passwordHash: string
  createdAt: string
  updatedAt: string
}

export interface AuthSession {
  userId: string
  email: string
  displayName: string
  issuedAt: string
  expiresAt: string
  remember: boolean
}

export interface SignInInput {
  email: string
  password: string
  remember: boolean
}

export interface CreateAccountInput {
  displayName: string
  email: string
  password: string
  remember: boolean
}
