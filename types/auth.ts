export interface SignUpData {
  email: string
  password: string
  confirmPassword?: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message: string
  error?: string
}

export interface ValidationErrors {
  email?: string
  password?: string
  confirmPassword?: string
}

export interface SessionStatus {
  isValid: boolean
  expiresAt: number | null
  timeRemaining: number
  willExpireSoon: boolean
}

export interface SessionConfig {
  checkInterval: number
  warningThreshold: number
  refreshThreshold: number
}

export type AuthEvent = 
  | 'SIGNED_IN'
  | 'SIGNED_OUT' 
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'SESSION_EXPIRED'
  | 'SESSION_WARNING'

export interface AuthError {
  code: string
  message: string
  status?: number
}

export interface SessionWarningOptions {
  show: boolean
  timeRemaining: number
  onExtend: () => void
  onLogout: () => void
}