<template>
  <div class="recharge-page">
    <div class="page-header"><h1>{{ $t('recharge.title') }}</h1><p>{{ $t('recharge.subtitle') }}</p></div>
    <div class="recharge-grid">
      <div class="card recharge-card">
        <h2>{{ $t('recharge.inputCode') }}</h2>
        <div v-if="result" class="alert" :class="resultType === 'success' ? 'alert-success' : 'alert-error'">{{ result }}</div>
        <form @submit.prevent="handleRecharge">
          <div class="form-group">
            <label>{{ $t('recharge.codeLabel') }}</label>
            <input v-model="code" type="text" class="form-input code-input" :placeholder="$t('recharge.codePlaceholder')" required :disabled="loading" />
          </div>
          <button type="submit" class="btn btn-primary btn-lg" style="width:100%" :disabled="loading || !code.trim()">
            <span v-if="loading" class="spinner"></span>
            {{ loading ? $t('recharge.submitting') : $t('recharge.submit') }}
          </button>
        </form>
      </div>
      <div class="card balance-card">
        <div class="balance-icon">💎</div>
        <div class="balance-label">{{ $t('recharge.currentBalance') }}</div>
        <div class="balance-value">¥{{ (authStore.user?.balance || 0).toFixed(2) }}</div>
        <div class="balance-hint">{{ $t('recharge.balanceHint') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../api'
import { useAuthStore } from '../stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()
const code = ref(''); const loading = ref(false); const result = ref(''); const resultType = ref('')
async function handleRecharge() {
  loading.value = true; result.value = ''
  try { const res = await api.post('/user/recharge', { code: code.value }); result.value = res.data.message; resultType.value = 'success'; authStore.updateBalance(res.data.balance); code.value = '' }
  catch (e) { result.value = e.response?.data?.error || t('recharge.failed'); resultType.value = 'error' }
  finally { loading.value = false }
}
</script>

<style scoped>
.recharge-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; }
.recharge-card h2 { font-size: 1.2rem; margin-bottom: 24px; }
.code-input { font-family: 'Courier New', monospace; font-size: 1.1rem; letter-spacing: 2px; text-transform: uppercase; text-align: center; }
.balance-card { text-align: center; padding: 40px 24px; background: linear-gradient(135deg, var(--bg-card) 0%, rgba(124, 92, 252, 0.05) 100%); }
.balance-icon { font-size: 2.5rem; margin-bottom: 16px; }
.balance-label { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
.balance-value { font-size: 2.2rem; font-weight: 700; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 12px; }
.balance-hint { font-size: 0.8rem; color: var(--text-muted); }
@media (max-width: 768px) { .recharge-grid { grid-template-columns: 1fr; } }
</style>
