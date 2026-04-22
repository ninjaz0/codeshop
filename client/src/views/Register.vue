<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card card">
        <div class="auth-header">
          <h1>✦ {{ $t('app.name') }}</h1>
          <p>{{ $t('auth.registerTitle') }}</p>
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label>{{ $t('auth.username') }}</label>
            <input v-model="username" type="text" class="form-input" :placeholder="$t('auth.usernameHint')" required minlength="3" maxlength="20" />
          </div>
          <div class="form-group">
            <label>{{ $t('auth.password') }}</label>
            <input v-model="password" type="password" class="form-input" :placeholder="$t('auth.passwordHint')" required minlength="6" />
          </div>
          <div class="form-group">
            <label>{{ $t('auth.confirmPassword') }}</label>
            <input v-model="confirmPassword" type="password" class="form-input" :placeholder="$t('auth.confirmPasswordPlaceholder')" required />
          </div>
          <div class="form-group">
            <label>{{ $t('auth.invitationCode') }}</label>
            <input v-model="invitationCode" type="text" class="form-input" :placeholder="$t('auth.invitationCodePlaceholder')" required />
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width:100%" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? $t('auth.registering') : $t('auth.register') }}
          </button>
        </form>
        <p class="auth-footer">
          {{ $t('auth.hasAccount') }}<router-link to="/login">{{ $t('auth.goLogin') }}</router-link>
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
const confirmPassword = ref('')
const invitationCode = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = t('auth.passwordMismatch')
    return
  }
  loading.value = true
  try {
    await authStore.register(username.value, password.value, invitationCode.value)
    router.push('/')
  } catch (e) {
    error.value = e.response?.data?.error || t('auth.registerFailed')
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
