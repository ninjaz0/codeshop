<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card card">
        <div class="auth-header">
          <h1>✦ {{ $t('app.name') }}</h1>
          <p>{{ $t('auth.loginTitle') }}</p>
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label>{{ $t('auth.username') }}</label>
            <input v-model="username" type="text" class="form-input" :placeholder="$t('auth.usernamePlaceholder')" required />
          </div>
          <div class="form-group">
            <label>{{ $t('auth.password') }}</label>
            <input v-model="password" type="password" class="form-input" :placeholder="$t('auth.passwordPlaceholder')" required />
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width:100%" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? $t('auth.loggingIn') : $t('auth.login') }}
          </button>
        </form>
        <p class="auth-footer">
          {{ $t('auth.noAccount') }}<router-link to="/register">{{ $t('auth.goRegister') }}</router-link>
        </p>
        <div class="auth-lang"><LanguageSwitcher /></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  try {
    await authStore.login(username.value, password.value)
    router.push(authStore.isAdmin ? '/admin' : '/')
  } catch (e) {
    error.value = e.response?.data?.error || t('auth.loginFailed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
.auth-card { width: 100%; max-width: 420px; padding: 40px; animation: scaleIn 0.4s ease; }
.auth-header { text-align: center; margin-bottom: 32px; }
.auth-header h1 { font-size: 1.8rem; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 8px; }
.auth-header p { color: var(--text-secondary); }
.auth-footer { text-align: center; margin-top: 24px; font-size: 0.9rem; color: var(--text-secondary); }
.auth-lang { display: flex; justify-content: center; margin-top: 16px; }
</style>
