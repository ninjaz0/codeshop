<template>
  <div class="admin-products">
    <div class="flex-between mb-3">
      <div class="page-header" style="margin-bottom:0"><h1>{{ $t('admin.products.title') }}</h1></div>
      <button class="btn btn-primary" @click="openModal()">{{ $t('admin.products.addProduct') }}</button>
    </div>

    <div v-if="loading" class="loading-page"><div class="spinner"></div></div>

    <div v-else class="table-wrap card">
      <table>
        <thead>
          <tr>
            <th>{{ $t('admin.products.id') }}</th><th>{{ $t('admin.products.image') }}</th><th>{{ $t('admin.products.name') }}</th><th>{{ $t('admin.products.price') }}</th><th>{{ $t('admin.products.type') }}</th><th>{{ $t('admin.products.stock') }}</th><th>{{ $t('admin.products.status') }}</th><th>{{ $t('admin.products.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in products" :key="p.id">
            <td>{{ p.id }}</td>
            <td><img v-if="p.image_url" :src="p.image_url" class="thumb" /><span v-else>—</span></td>
            <td><strong>{{ p.name }}</strong></td>
            <td>¥{{ p.price.toFixed(2) }}</td>
            <td><span class="badge" :class="p.delivery_type === 'unique' ? 'badge-info' : 'badge-warning'">{{ p.delivery_type === 'unique' ? $t('admin.products.uniqueType') : $t('admin.products.fixedType') }}</span></td>
            <td>{{ p.stock_count }}</td>
            <td><span class="badge" :class="p.status === 'on_sale' ? 'badge-success' : 'badge-danger'">{{ p.status === 'on_sale' ? $t('admin.products.onSale') : $t('admin.products.offSale') }}</span></td>
            <td>
              <div class="flex gap-1">
                <button class="btn btn-sm btn-secondary" @click="openModal(p)">{{ $t('common.edit') }}</button>
                <button class="btn btn-sm btn-secondary" @click="toggleStatus(p)">{{ p.status === 'on_sale' ? $t('admin.products.takeOffSale') : $t('admin.products.putOnSale') }}</button>
                <button v-if="p.delivery_type === 'unique'" class="btn btn-sm btn-secondary" @click="openKeyModal(p)">{{ $t('admin.products.manageKeys') }}</button>
                <button class="btn btn-sm btn-danger" @click="deleteProduct(p)">{{ $t('common.delete') }}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Product Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal">
        <h2>{{ editingProduct ? $t('admin.products.editProduct') : $t('admin.products.newProduct') }}</h2>
        <form @submit.prevent="saveProduct">
          <div class="form-group"><label>{{ $t('admin.products.productName') }}</label><input v-model="form.name" type="text" class="form-input" required /></div>
          <div class="form-group"><label>{{ $t('admin.products.description') }}</label><textarea v-model="form.description" class="form-input"></textarea></div>
          <div class="form-group"><label>{{ $t('admin.products.productPrice') }}</label><input v-model.number="form.price" type="number" step="0.01" min="0" class="form-input" required /></div>
          <div class="form-group"><label>{{ $t('admin.products.productImage') }}</label><input type="file" accept="image/*" @change="handleFileChange" class="form-input" /><img v-if="form.image_url" :src="form.image_url" class="preview-img mt-1" /></div>
          <div class="form-group"><label>{{ $t('admin.products.deliveryType') }}</label><select v-model="form.delivery_type" class="form-input"><option value="unique">{{ $t('admin.products.uniqueKey') }}</option><option value="fixed">{{ $t('admin.products.fixedContent') }}</option></select></div>
          <div v-if="form.delivery_type === 'fixed'" class="form-group"><label>{{ $t('admin.products.fixedDeliveryContent') }}</label><textarea v-model="form.fixed_content" class="form-input" rows="3" :placeholder="$t('admin.products.fixedDeliveryHint')"></textarea></div>
          <div v-if="form.delivery_type === 'fixed'" class="form-group"><label>{{ $t('admin.products.stockCount') }}</label><input v-model.number="form.stock_count" type="number" min="0" class="form-input" /></div>
          <div class="modal-actions"><button type="button" class="btn btn-secondary" @click="showModal = false">{{ $t('common.cancel') }}</button><button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? $t('common.loading') : $t('common.save') }}</button></div>
        </form>
      </div>
    </div>

    <!-- Key Management Modal -->
    <div v-if="showKeyModal" class="modal-overlay" @click.self="showKeyModal = false">
      <div class="modal" style="max-width:600px">
        <h2>{{ $t('admin.keys.title', { name: keyProduct?.name }) }}</h2>
        <div class="form-group"><label>{{ $t('admin.keys.batchAdd') }}</label><textarea v-model="newKeys" class="form-input" rows="6" :placeholder="$t('admin.keys.placeholder')"></textarea></div>
        <button class="btn btn-primary mb-2" @click="addKeys" :disabled="addingKeys">{{ addingKeys ? $t('admin.keys.adding') : $t('admin.keys.addKeys') }}</button>
        <h3 class="mb-1">{{ $t('admin.keys.existing', { count: keys.length }) }}</h3>
        <div class="key-list">
          <div v-for="key in keys" :key="key.id" class="key-item">
            <code>{{ key.content }}</code>
            <div class="key-actions">
              <span class="badge" :class="key.status === 'available' ? 'badge-success' : 'badge-danger'">{{ key.status === 'available' ? $t('admin.keys.available') : $t('admin.keys.sold') }}</span>
              <button v-if="key.status === 'available'" class="btn-icon-delete" @click="deleteKey(key)" :title="$t('common.delete')">✕</button>
            </div>
          </div>
        </div>
        <div class="modal-actions"><button class="btn btn-secondary" @click="showKeyModal = false">{{ $t('common.close') }}</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../../api'

const { t } = useI18n()
const products = ref([])
const loading = ref(true)
const showModal = ref(false)
const editingProduct = ref(null)
const saving = ref(false)
const selectedFile = ref(null)
const form = ref({ name: '', description: '', price: 0, image_url: '', delivery_type: 'unique', fixed_content: '', stock_count: 0 })

const showKeyModal = ref(false)
const keyProduct = ref(null)
const keys = ref([])
const newKeys = ref('')
const addingKeys = ref(false)

onMounted(() => fetchProducts())
async function fetchProducts() { loading.value = true; try { const res = await api.get('/admin/products'); products.value = res.data.products } finally { loading.value = false } }

function openModal(product) {
  if (product) { editingProduct.value = product; form.value = { ...product } }
  else { editingProduct.value = null; form.value = { name: '', description: '', price: 0, image_url: '', delivery_type: 'unique', fixed_content: '', stock_count: 0 } }
  selectedFile.value = null; showModal.value = true
}
function handleFileChange(e) { selectedFile.value = e.target.files[0] }
async function saveProduct() {
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('name', form.value.name); formData.append('description', form.value.description); formData.append('price', form.value.price)
    formData.append('delivery_type', form.value.delivery_type); formData.append('fixed_content', form.value.fixed_content || ''); formData.append('stock_count', form.value.stock_count || 0)
    if (selectedFile.value) formData.append('image', selectedFile.value)
    if (editingProduct.value) { formData.append('status', form.value.status || 'on_sale'); await api.put(`/admin/products/${editingProduct.value.id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }) }
    else { await api.post('/admin/products', formData, { headers: { 'Content-Type': 'multipart/form-data' } }) }
    showModal.value = false; await fetchProducts()
  } catch (e) { alert(e.response?.data?.error || t('admin.products.saveFailed')) }
  finally { saving.value = false }
}
async function toggleStatus(product) {
  try { const newStatus = product.status === 'on_sale' ? 'off_sale' : 'on_sale'; await api.put(`/admin/products/${product.id}`, { status: newStatus }); await fetchProducts() }
  catch (e) { alert(e.response?.data?.error || t('common.failed')) }
}
async function deleteProduct(product) {
  if (!confirm(t('admin.products.deleteConfirm', { name: product.name }))) return
  try { await api.delete(`/admin/products/${product.id}`); await fetchProducts() }
  catch (e) { alert(e.response?.data?.error || t('admin.products.deleteFailed')) }
}
async function openKeyModal(product) {
  keyProduct.value = product; showKeyModal.value = true; newKeys.value = ''
  try { const res = await api.get(`/admin/keys/${product.id}`); keys.value = res.data.keys } catch (e) { keys.value = [] }
}
async function addKeys() {
  const keyLines = newKeys.value.split('\n').map(k => k.trim()).filter(Boolean); if (keyLines.length === 0) return
  addingKeys.value = true
  try { await api.post('/admin/keys', { productId: keyProduct.value.id, keys: keyLines }); newKeys.value = ''; const res = await api.get(`/admin/keys/${keyProduct.value.id}`); keys.value = res.data.keys; await fetchProducts() }
  catch (e) { alert(e.response?.data?.error || t('admin.keys.addFailed')) }
  finally { addingKeys.value = false }
}
async function deleteKey(key) {
  if (!confirm(t('admin.keys.deleteConfirm'))) return
  try { await api.delete(`/admin/keys/${key.id}`); const res = await api.get(`/admin/keys/${keyProduct.value.id}`); keys.value = res.data.keys; await fetchProducts() }
  catch (e) { alert(e.response?.data?.error || t('admin.keys.deleteFailed')) }
}
</script>

<style scoped>
.thumb { width: 48px; height: 48px; border-radius: 6px; object-fit: cover; }
.preview-img { max-width: 200px; max-height: 120px; border-radius: var(--radius-sm); }
.key-list { max-height: 300px; overflow-y: auto; }
.key-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; border-bottom: 1px solid var(--border); font-size: 0.85rem; }
.key-item code { font-family: monospace; color: var(--text-primary); word-break: break-all; flex: 1; }
.key-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.btn-icon-delete { width: 24px; height: 24px; border: none; background: transparent; color: var(--text-muted); font-size: 0.8rem; cursor: pointer; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
.btn-icon-delete:hover { background: var(--danger-bg); color: var(--danger); }
h3 { font-size: 1rem; }
</style>
