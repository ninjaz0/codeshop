<template>
  <div class="admin-codes">
    <div class="flex-between mb-3">
      <div class="page-header" style="margin-bottom:0"><h1>{{ $t('admin.invitations.title') }}</h1></div>
      <button class="btn btn-primary" @click="showGenerate = true">{{ $t('admin.invitations.generate') }}</button>
    </div>

    <!-- Generate Modal -->
    <div v-if="showGenerate" class="modal-overlay" @click.self="showGenerate = false">
      <div class="modal">
        <h2>{{ $t('admin.invitations.batchGenerate') }}</h2>
        <div v-if="generatedCodes.length" class="alert alert-success">{{ $t('admin.invitations.generated', { count: generatedCodes.length }) }}</div>
        <form @submit.prevent="generateCodes">
          <div class="form-group"><label>{{ $t('admin.invitations.count') }}</label><input v-model.number="genCount" type="number" min="1" max="100" class="form-input" required /></div>
          <div class="modal-actions"><button type="button" class="btn btn-secondary" @click="showGenerate = false; generatedCodes = []">{{ $t('common.close') }}</button><button type="submit" class="btn btn-primary" :disabled="generating">{{ generating ? $t('admin.invitations.generating') : $t('admin.invitations.generateBtn') }}</button></div>
        </form>
        <div v-if="generatedCodes.length" class="generated-list mt-2">
          <div class="flex-between mb-1"><strong>{{ $t('admin.invitations.generatedCodes') }}</strong><button class="btn btn-sm btn-secondary" @click="copyAllCodes">{{ $t('admin.invitations.copyAll') }}</button></div>
          <div class="code-box"><div v-for="c in generatedCodes" :key="c" class="code-line">{{ c }}</div></div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-page"><div class="spinner"></div></div>

    <div v-else class="table-wrap card">
      <table>
        <thead>
          <tr><th>{{ $t('admin.invitations.id') }}</th><th>{{ $t('admin.invitations.code') }}</th><th>{{ $t('admin.invitations.status') }}</th><th>{{ $t('admin.invitations.usedBy') }}</th><th>{{ $t('admin.invitations.usedAt') }}</th><th>{{ $t('admin.invitations.createdAt') }}</th><th>{{ $t('admin.invitations.action') }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="code in codes" :key="code.id">
            <td>{{ code.id }}</td>
            <td><code>{{ code.code }}</code></td>
            <td><span class="badge" :class="code.status === 'unused' ? 'badge-success' : 'badge-danger'">{{ code.status === 'unused' ? $t('admin.invitations.unused') : $t('admin.invitations.used') }}</span></td>
            <td>{{ code.used_by_name || '—' }}</td>
            <td>{{ code.used_at || '—' }}</td>
            <td>{{ code.created_at }}</td>
            <td>
              <button class="btn btn-sm btn-danger" @click="deleteCode(code)">{{ $t('common.delete') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../../api'

const { t } = useI18n()
const codes = ref([]); const loading = ref(true); const showGenerate = ref(false); const genCount = ref(10); const generating = ref(false); const generatedCodes = ref([])
onMounted(() => fetchCodes())
async function fetchCodes() { loading.value = true; try { const res = await api.get('/admin/invitations'); codes.value = res.data.codes } finally { loading.value = false } }
async function generateCodes() { generating.value = true; try { const res = await api.post('/admin/invitations', { count: genCount.value }); generatedCodes.value = res.data.codes; await fetchCodes() } catch (e) { alert(e.response?.data?.error || t('admin.invitations.generateFailed')) } finally { generating.value = false } }
async function deleteCode(code) { if (!confirm(t('admin.invitations.deleteConfirm', { code: code.code }))) return; try { await api.delete(`/admin/invitations/${code.id}`); await fetchCodes() } catch (e) { alert(e.response?.data?.error || t('admin.invitations.deleteFailed')) } }
async function copyAllCodes() { try { await navigator.clipboard.writeText(generatedCodes.value.join('\n')); alert(t('admin.invitations.copiedAll')) } catch { /* fallback */ } }
</script>

<style scoped>
code { font-family: 'Courier New', monospace; font-size: 0.85rem; color: var(--accent); }
.generated-list { border-top: 1px solid var(--border); padding-top: 16px; }
.code-box { max-height: 200px; overflow-y: auto; background: var(--bg-input); border-radius: var(--radius-sm); padding: 12px; }
.code-line { font-family: monospace; font-size: 0.85rem; padding: 4px 0; color: var(--text-primary); }
</style>
