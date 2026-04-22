<template>
  <div class="home-page">
    <div class="page-header">
      <h1>{{ $t('home.title') }}</h1>
      <p>{{ $t('home.subtitle') }}</p>
    </div>
    <div v-if="loading" class="loading-page"><div class="spinner"></div></div>
    <div v-else-if="products.length === 0" class="empty-state">
      <div class="icon">🏪</div>
      <p>{{ $t('home.noProducts') }}</p>
    </div>
    <div v-else class="product-grid">
      <div v-for="product in products" :key="product.id" class="product-card card" @click="handleAddToCart(product)">
        <div class="product-image">
          <img v-if="product.image_url" :src="product.image_url" :alt="product.name" />
          <div v-else class="product-placeholder">📦</div>
          <div class="product-badge" v-if="product.delivery_type === 'fixed'">
            <span class="badge badge-info">{{ $t('home.fixedContent') }}</span>
          </div>
        </div>
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <p class="product-desc">{{ product.description || $t('home.noDescription') }}</p>
          <div class="product-footer">
            <span class="product-price">¥{{ product.price.toFixed(2) }}</span>
            <span class="product-stock" :class="{ 'out-of-stock': getStock(product) === 0 }">
              {{ getStock(product) > 0 ? $t('home.stock', { count: getStock(product) }) : $t('home.soldOut') }}
            </span>
          </div>
        </div>
        <button class="btn-add-cart" :disabled="getStock(product) === 0" @click.stop="handleAddToCart(product)">
          {{ getStock(product) === 0 ? $t('home.soldOut') : $t('home.addToCart') }}
        </button>
      </div>
    </div>
    <div v-if="message" class="toast" :class="messageType">{{ message }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../api'
import { useCartStore } from '../stores/cart'

const { t } = useI18n()
const cartStore = useCartStore()
const products = ref([])
const loading = ref(true)
const message = ref('')
const messageType = ref('')

onMounted(async () => {
  try { const res = await api.get('/products'); products.value = res.data.products }
  catch (e) { console.error(e) }
  finally { loading.value = false }
})

function getStock(product) {
  if (product.delivery_type === 'fixed') return product.stock_count > 0 ? 999 : 999
  return product.stock_count
}

async function handleAddToCart(product) {
  if (getStock(product) === 0) return
  try { await cartStore.addToCart(product.id); showMessage(t('home.addedToCart'), 'success') }
  catch (e) { showMessage(e.response?.data?.error || t('home.addFailed'), 'error') }
}

function showMessage(text, type) { message.value = text; messageType.value = type; setTimeout(() => { message.value = '' }, 2000) }
</script>

<style scoped>
.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
.product-card { padding: 0; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; transition: var(--transition); }
.product-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--accent); }
.product-image { position: relative; height: 200px; background: var(--bg-input); overflow: hidden; }
.product-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
.product-card:hover .product-image img { transform: scale(1.05); }
.product-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; background: linear-gradient(135deg, var(--bg-card) 0%, var(--bg-input) 100%); }
.product-badge { position: absolute; top: 12px; right: 12px; }
.product-info { padding: 16px 20px; flex: 1; }
.product-info h3 { font-size: 1.05rem; font-weight: 600; margin-bottom: 6px; }
.product-desc { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.product-footer { display: flex; justify-content: space-between; align-items: center; }
.product-price { font-size: 1.2rem; font-weight: 700; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.product-stock { font-size: 0.8rem; color: var(--text-muted); }
.product-stock.out-of-stock { color: var(--danger); }
.btn-add-cart { width: 100%; padding: 12px; border: none; border-top: 1px solid var(--border); background: transparent; color: var(--accent); font-family: inherit; font-size: 0.9rem; font-weight: 500; cursor: pointer; transition: var(--transition); }
.btn-add-cart:hover:not(:disabled) { background: rgba(124, 92, 252, 0.1); }
.btn-add-cart:disabled { color: var(--text-muted); cursor: not-allowed; }
.toast { position: fixed; bottom: 30px; right: 30px; padding: 14px 24px; border-radius: var(--radius-sm); font-size: 0.9rem; font-weight: 500; animation: slideIn 0.3s ease; z-index: 1000; }
.toast.success { background: var(--success); color: white; }
.toast.error { background: var(--danger); color: white; }
</style>
