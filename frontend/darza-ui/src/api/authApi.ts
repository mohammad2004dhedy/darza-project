import type {
  CreateUserRequest,
  LoginRequest,
  LoginResponse,
  MyProfileUserResponse,
} from '../types/api'
import { request } from './client'

export function register(body: CreateUserRequest): Promise<MyProfileUserResponse> {
  return request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) })
}

export function login(body: LoginRequest): Promise<LoginResponse> {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) })
}

export const authApi = { register, login }
