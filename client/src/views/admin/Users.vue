<template>
  <div class="admin-users">
    <div class="page-header">
      <h1>{{ $t('admin.users.title') }}</h1>
      <p>{{ $t('admin.users.subtitle') }}</p>
    </div>

    <div v-if="loading" class="loading-page"><div class="spinner"></div></div>

    <div v-else class="table-wrap card">
      <table>
        <thead>
          <tr>
            <th>{{ $t('admin.users.id') }}</th>
            <th>{{ $t('admin.users.username') }}</th>
            <th>{{ $t('admin.users.role') }}</th>
            <th>{{ $t('admin.users.balance') }}</th>
            <th>{{ $t('admin.users.createdAt') }}</th>
            <th>{{ $t('admin.users.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td><strong>{{ user.username }}</strong></td>
            <td>
              <span class="badge" :class="user.role === 'admin' ? 'badge-info' : 'badge-secondary'">
                {{ user.role === 'admin' ? $t('admin.users.adminRole') : $t('admin.users.userRole') }}
              </span>
            </td>
            <td>¥{{ user.balance.toFixed(2) }}</td>
            <td>{{ user.created_at }}</td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-sm btn-secondary" @click="openBalanceModal(user)">
                  {{ $t('admin.users.editBalance') }}
                </button>
                <button 
                  class="btn btn-sm btn-secondary" 
                  @click="toggleRole(user)"
                  :disabled="user.id === authStore.user?.id"
                >
                  {{ $t('admin.users.changeRole') }}
                </button>
                <button 
                  class="btn btn-sm btn-danger" 
                  @click="deleteUser(user)"
                  :disabled="user.id === authStore.user?.id"
                >
                  {{ $t('common.delete') }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Balance Modal -->
    <div v-if="showBalanceModal" class="modal-overlay" @click.self="showBalanceModal = false">
      <div class="modal">
        <h2>{{ $t('admin.users.editBalance') }} - {{ editingUser?.username }}</h2>
        <form @submit.prevent="saveBalance">
          <div class="form-group">
            <label>{{ $t('admin.users.newBalance') }}</label>
            <input v-model.number="newBalance" type="number" step="0.01" min="0" class="form-input" required />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="showBalanceModal = false">
              {{ $t('common.cancel') }}
            </button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? $t('common.loading') : $t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../../api'
import { useAuthStore } from '../../stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()
const users = ref([])
const loading = ref(true)

const showBalanceModal = ref(false)
const editingUser = ref(null)
const newBalance = ref(0)
const saving = ref(false)

onMounted(() => {
  fetchUsers()
})

async function fetchUsers() {
  loading.value = true
  try {
    const res = await api.get('/admin/users')
    users.value = res.data.users
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openBalanceModal(user) {
  editingUser.value = user
  newBalance.value = user.balance
  showBalanceModal.value = true
}

async function saveBalance() {
  saving.value = true
  try {
    await api.put(`/admin/users/${editingUser.value.id}/balance`, { balance: newBalance.value })
    showBalanceModal.value = false
    await fetchUsers()
    alert(t('admin.users.balanceUpdated'))
  } catch (e) {
    alert(e.response?.data?.error || t('admin.users.saveFailed'))
  } finally {
    saving.value = false
  }
}

async function toggleRole(user) {
  if (user.id === authStore.user?.id) {
    alert(t('admin.users.cannotChangeOwnRole'))
    return
  }
  const newRole = user.role === 'admin' ? 'user' : 'admin'
  try {
    await api.put(`/admin/users/${user.id}/role`, { role: newRole })
    await fetchUsers()
    alert(t('admin.users.roleUpdated'))
  } catch (e) {
    alert(e.response?.data?.error || t('common.failed'))
  }
}

async function deleteUser(user) {
  if (user.id === authStore.user?.id) {
    alert(t('admin.users.cannotDeleteSelf'))
    return
  }
  if (!confirm(t('admin.users.deleteConfirm', { name: user.username }))) return
  
  try {
    await api.delete(`/admin/users/${user.id}`)
    await fetchUsers()
  } catch (e) {
    alert(e.response?.data?.error || t('admin.users.deleteFailed'))
  }
}
</script>

<style scoped>
/* Scoped styles if needed */
</style>
