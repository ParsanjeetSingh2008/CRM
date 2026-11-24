import { request } from './client'

export const getMe = ({ signal } = {}) => request('/auth/me', { signal })

export const login = (credentials) => request('/auth/login', { method: 'POST', body: credentials })

export const signup = (account) => request('/auth/signup', { method: 'POST', body: account })

export const logout = () => request('/auth/logout', { method: 'POST' })
