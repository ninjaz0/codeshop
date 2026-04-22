<template>
  <div class="admin-codes">
    <div class="flex-between mb-3">
      <div class="page-header" style="margin-bottom:0"><h1>{{ $t('admin.codes.title') }}</h1></div>
      <button class="btn btn-primary" @click="showGenerate = true">{{ $t('admin.codes.generate') }}</button>
    </div>

    <!-- Generate Modal -->
    <div v-if="showGenerate" class="modal-overlay" @click.self="showGenerate = false">
      <div class="modal">
        <h2>{{ $t('admin.codes.batchGenerate') }}</h2>
        <div v-if="generatedCodes.length" class="alert alert-success">{{ $t('admin.codes.generated', { count: generatedCodes.length }) }}</div>
        <form @submit.prevent="generateCodes">
          <div class="form-group"><label>{{ $t('admin.codes.count') }}</label><input v-model.number="genCount" type="number" min="1" max="100" class="form-input" required /></div>
          <div class="form-group"><label>{{ $t('admin.codes.faceValue') }}</label><input v-model.number="genValue" type="number" min="0.01" step="0.01" class="form-input" required /></div>
          <div class="modal-actions"><button type="button" class="btn btn-secondary" @click="showGenerate = false; generatedCodes = []">{{ $t('common.close') }}</button><button type="submit" class="btn btn-primary" :disabled="generating">{{ generating ? $t('admin.codes.generating') : $t('admin.codes.generateBtn') }}</button></div>
        </form>
        <div v-if="generatedCodes.length" class="generated-list mt-2">
          <div class="flex-between mb-1"><strong>{{ $t('admin.codes.generatedCodes') }}</strong><button class="btn btn-sm btn-secondary" @click="copyAllCodes">{{ $t('admin.codes.copyAll') }}</button></div>
          <div class="code-box"><div v-for="c in generatedCodes" :key="c" class="code-line">{{ c }}</div></div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-page"><div class="spinner"></div></div>

    <div v-else class="table-wrap card">
      <table>
        <thead>
          <tr><th>{{ $t('admin.codes.id') }}</th><th>{{ $t('admin.codes.code') }}</th><th>{{ $t('admin.codes.value') }}</th><th>{{ $t('admin.codes.status') }}</th><th>{{ $t('admin.codes.usedBy') }}</th><th>{{ $t('admin.codes.usedAt') }}</th><th>{{ $t('admin.codes.createdAt') }}</th><th>{{ $t('admin.codes.action') }}</th></tr>
        </thead>
        <tbody>
          <tr v-for="code in codes" :key="code.id">
            <td>{{ code.id }}</td>
            <td><code>{{ code.code }}</code></td>
            <td>¥{{ code.face_value.toFixed(2) }}</td>
            <td><span class="badge" :class="code.status === 'unused' ? 'badge-success' : 'badge-danger'">{{ code.status === 'unused' ? $t('admin.codes.unused') : $t('admin.codes.used') }}</span></td>
            <td>{{ code.used_by_name || '—' }}</td>
            <td>{{ code.used_at || '—' }}</td>
            <td>{{ code.created_at }}</td>
            <td>
              <button v-if="code.status === 'unused'" class="btn btn-sm btn-danger" @click="deleteCode(code)">{{ $t('common.delete') }}</button>
              <span v-else class="text-muted">—</span>
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
const codes = ref([]); const loading = ref(true); const showGenerate = ref(false); const genCount = ref(10); const genValue = ref(100); const generating = ref(false); const generatedCodes = ref([])
onMounted(() => fetchCodes())
async function fetchCodes() { loading.value = true; try { const res = await api.get('/admin/codes'); codes.value = res.data.codes } finally { loading.value = false } }
async function generateCodes() { generating.value = true; try { const res = await api.post('/admin/codes', { count: genCount.value, faceValue: genValue.value }); generatedCodes.value = res.data.codes; await fetchCodes() } catch (e) { alert(e.response?.data?.error || t('admin.codes.generateFailed')) } finally { generating.value = false } }
async function deleteCode(code) { if (!confirm(t('admin.codes.deleteConfirm', { code: code.code }))) return; try { await api.delete(`/admin/codes/${code.id}`); await fetchCodes() } catch (e) { alert(e.response?.data?.error || t('admin.codes.deleteFailed')) } }
async function copyAllCodes() { try { await navigator.clipboard.writeText(generatedCodes.value.join('\n')); alert(t('admin.codes.copiedAll')) } catch { /* fallback */ } }
</script>

<style scoped>
code { font-family: 'Courier New', monospace; font-size: 0.85rem; color: var(--accent); }
.generated-list { border-top: 1px solid var(--border); padding-top: 16px; }
.code-box { max-height: 200px; overflow-y: auto; background: var(--bg-input); border-radius: var(--radius-sm); padding: 12px; }
.code-line { font-family: monospace; font-size: 0.85rem; padding: 4px 0; color: var(--text-primary); }
</style>
