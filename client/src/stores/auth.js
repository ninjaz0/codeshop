import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password })
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res.data
  }

  async function register(username, password, invitationCode) {
    const res = await api.post('/auth/register', { username, password, invitationCode })
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res.data
  }

  async function fetchMe() {
    const res = await api.get('/auth/me')
    user.value = res.data.user
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res.data.user
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function updateBalance(newBalance) {
    if (user.value) {
      user.value = { ...user.value, balance: newBalance }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  return { token, user, isLoggedIn, isAdmin, login, register, fetchMe, logout, updateBalance }
})
