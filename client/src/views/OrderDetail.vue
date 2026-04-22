<template>
  <div class="order-detail-page">
    <div class="page-header">
      <h1>{{ $t('orderDetail.title', { id: orderId }) }}</h1>
      <p><router-link to="/orders">{{ $t('orderDetail.backToOrders') }}</router-link></p>
    </div>
    <div v-if="loading" class="loading-page"><div class="spinner"></div></div>
    <template v-else-if="order">
      <div class="order-info card">
        <div class="info-grid">
          <div class="info-item"><span class="info-label">{{ $t('orderDetail.orderId') }}</span><span class="info-value">#{{ order.id }}</span></div>
          <div class="info-item"><span class="info-label">{{ $t('orderDetail.orderTime') }}</span><span class="info-value">{{ order.created_at }}</span></div>
          <div class="info-item"><span class="info-label">{{ $t('orderDetail.orderStatus') }}</span><span class="badge badge-success">{{ $t('orders.completed') }}</span></div>
          <div class="info-item"><span class="info-label">{{ $t('orderDetail.orderTotal') }}</span><span class="info-value price">¥{{ order.total_amount.toFixed(2) }}</span></div>
        </div>
      </div>
      <h2 class="section-title">{{ $t('orderDetail.itemDetail') }}</h2>
      <div class="items-list">
        <div v-for="item in items" :key="item.id" class="detail-item card">
          <div class="item-header">
            <div class="item-main">
              <img v-if="item.image_url" :src="item.image_url" class="item-thumb" />
              <div v-else class="item-thumb-placeholder">📦</div>
              <div><h3>{{ item.product_name }}</h3><div class="item-meta">{{ $t('orderDetail.unitPrice', { price: item.unit_price.toFixed(2), qty: item.quantity }) }}</div></div>
            </div>
            <div class="item-amount">¥{{ (item.unit_price * item.quantity).toFixed(2) }}</div>
          </div>
          <div class="delivery-section" v-if="item.delivery_content">
            <div class="delivery-label"><span>🔑</span> {{ $t('orderDetail.deliveryInfo') }}</div>
            <div class="delivery-content">
              <pre>{{ item.delivery_content }}</pre>
              <button class="btn btn-sm btn-secondary" @click="copyContent(item)">{{ copied === item.id ? $t('orderDetail.copied') : $t('orderDetail.copy') }}</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../api'
const route = useRoute(); const orderId = route.params.id
const order = ref(null); const items = ref([]); const loading = ref(true); const copied = ref(null)
onMounted(async () => { try { const res = await api.get(`/orders/${orderId}`); order.value = res.data.order; items.value = res.data.items } catch (e) { console.error(e) } finally { loading.value = false } })
async function copyContent(item) { try { await navigator.clipboard.writeText(item.delivery_content); copied.value = item.id; setTimeout(() => { copied.value = null }, 2000) } catch { const ta = document.createElement('textarea'); ta.value = item.delivery_content; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); copied.value = item.id; setTimeout(() => { copied.value = null }, 2000) } }
</script>

<style scoped>
.order-info { margin-bottom: 32px; }
.info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
.info-item { display: flex; flex-direction: column; gap: 6px; }
.info-label { font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.info-value { font-size: 1rem; font-weight: 600; }
.info-value.price { font-size: 1.2rem; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.section-title { font-size: 1.2rem; margin-bottom: 16px; }
.items-list { display: flex; flex-direction: column; gap: 16px; }
.detail-item { padding: 20px; }
.item-header { display: flex; justify-content: space-between; align-items: center; }
.item-main { display: flex; align-items: center; gap: 16px; }
.item-thumb, .item-thumb-placeholder { width: 56px; height: 56px; border-radius: var(--radius-sm); object-fit: cover; flex-shrink: 0; }
.item-thumb-placeholder { background: var(--bg-input); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
.item-main h3 { font-size: 1rem; font-weight: 600; margin-bottom: 4px; }
.item-meta { font-size: 0.85rem; color: var(--text-secondary); }
.item-amount { font-size: 1.1rem; font-weight: 700; }
.delivery-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border); }
.delivery-label { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; font-weight: 600; margin-bottom: 12px; color: var(--success); }
.delivery-content { background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px; position: relative; }
.delivery-content pre { font-family: 'Courier New', monospace; font-size: 0.9rem; white-space: pre-wrap; word-break: break-all; color: var(--text-primary); margin-bottom: 12px; }
.delivery-content .btn { float: right; }
</style>
