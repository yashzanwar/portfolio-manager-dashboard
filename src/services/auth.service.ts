import axios from 'axios'

const API_BASE_URL = 'http://localhost:8080/api'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  phone?: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: {
    id: number
    email: string
    fullName: string
    phone?: string
  }
}

export class AuthService {
  static async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, data)
    return response.data
  }

  static async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/register`, data)
    return response.data
  }

  static async refreshToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const response = await axios.post<{ token: string; refreshToken: string }>(
      `${API_BASE_URL}/auth/refresh`,
      null,
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    )
    return response.data
  }
}
