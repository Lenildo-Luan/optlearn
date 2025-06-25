export interface SignUpData {
  email: string
  password: string
  confirmPassword?: string
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