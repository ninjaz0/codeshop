<template>
  <div class="profile-page">
    <div class="page-header"><h1>{{ $t('profile.title') }}</h1><p>{{ $t('profile.subtitle') }}</p></div>
    <div class="profile-grid">
      <div class="card">
        <h2>{{ $t('profile.changeUsername') }}</h2>
        <div v-if="profileMsg" class="alert" :class="profileOk ? 'alert-success' : 'alert-error'">{{ profileMsg }}</div>
        <form @submit.prevent="updateProfile">
          <div class="form-group"><label>{{ $t('profile.newUsername') }}</label><input v-model="newUsername" type="text" class="form-input" minlength="3" maxlength="20" required /></div>
          <button type="submit" class="btn btn-primary" :disabled="profileLoading">{{ profileLoading ? $t('profile.saving') : $t('profile.saveChanges') }}</button>
        </form>
      </div>
      <div class="card">
        <h2>{{ $t('profile.changePassword') }}</h2>
        <div v-if="pwdMsg" class="alert" :class="pwdOk ? 'alert-success' : 'alert-error'">{{ pwdMsg }}</div>
        <form @submit.prevent="changePassword">
          <div class="form-group"><label>{{ $t('profile.currentPassword') }}</label><input v-model="oldPassword" type="password" class="form-input" required /></div>
          <div class="form-group"><label>{{ $t('profile.newPassword') }}</label><input v-model="newPassword" type="password" class="form-input" minlength="6" required /></div>
          <div class="form-group"><label>{{ $t('profile.confirmNewPassword') }}</label><input v-model="confirmNewPassword" type="password" class="form-input" required /></div>
          <button type="submit" class="btn btn-primary" :disabled="pwdLoading">{{ pwdLoading ? $t('profile.changing') : $t('profile.changeBtn') }}</button>
        </form>
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
const newUsername = ref(authStore.user?.username || ''); const profileLoading = ref(false); const profileMsg = ref(''); const profileOk = ref(false)
const oldPassword = ref(''); const newPassword = ref(''); const confirmNewPassword = ref(''); const pwdLoading = ref(false); const pwdMsg = ref(''); const pwdOk = ref(false)
async function updateProfile() {
  profileLoading.value = true; profileMsg.value = ''
  try { await api.put('/user/profile', { username: newUsername.value }); profileMsg.value = t('profile.usernameUpdated'); profileOk.value = true; authStore.fetchMe() }
  catch (e) { profileMsg.value = e.response?.data?.error || t('profile.updateFailed'); profileOk.value = false }
  finally { profileLoading.value = false }
}
async function changePassword() {
  pwdMsg.value = ''
  if (newPassword.value !== confirmNewPassword.value) { pwdMsg.value = t('auth.passwordMismatch'); pwdOk.value = false; return }
  pwdLoading.value = true
  try { await api.put('/user/password', { oldPassword: oldPassword.value, newPassword: newPassword.value }); pwdMsg.value = t('profile.passwordUpdated'); pwdOk.value = true; oldPassword.value = ''; newPassword.value = ''; confirmNewPassword.value = '' }
  catch (e) { pwdMsg.value = e.response?.data?.error || t('profile.updateFailed'); pwdOk.value = false }
  finally { pwdLoading.value = false }
}
</script>

<style scoped>
.profile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 24px; }
.profile-grid h2 { font-size: 1.1rem; margin-bottom: 20px; }
</style>
