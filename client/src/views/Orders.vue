<template>
  <div class="orders-page">
    <div class="page-header"><h1>{{ $t('orders.title') }}</h1><p>{{ $t('orders.subtitle') }}</p></div>
    <div v-if="loading" class="loading-page"><div class="spinner"></div></div>
    <div v-else-if="orders.length === 0" class="empty-state">
      <div class="icon">📋</div><p>{{ $t('orders.noOrders') }}</p>
      <router-link to="/" class="btn btn-primary">{{ $t('orders.goShopping') }}</router-link>
    </div>
    <div v-else class="order-list">
      <router-link v-for="order in orders" :key="order.id" :to="`/orders/${order.id}`" class="order-card card">
        <div class="order-header">
          <span class="order-id">{{ $t('orders.orderId', { id: order.id }) }}</span>
          <span class="badge badge-success">{{ order.status === 'completed' ? $t('orders.completed') : order.status }}</span>
        </div>
        <div class="order-body">
          <div class="order-meta">
            <span>{{ $t('orders.itemsCount', { count: order.itemCount }) }}</span>
            <span>{{ order.created_at }}</span>
          </div>
          <div class="order-amount">¥{{ order.total_amount.toFixed(2) }}</div>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
const orders = ref([]); const loading = ref(true)
onMounted(async () => { try { const res = await api.get('/orders'); orders.value = res.data.orders } catch (e) { console.error(e) } finally { loading.value = false } })
</script>

<style scoped>
.order-list { display: flex; flex-direction: column; gap: 12px; }
.order-card { display: block; padding: 20px; cursor: pointer; transition: var(--transition); }
.order-card:hover { transform: translateX(4px); border-color: var(--accent); }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.order-id { font-weight: 600; font-size: 1rem; }
.order-body { display: flex; justify-content: space-between; align-items: center; }
.order-meta { display: flex; gap: 16px; font-size: 0.85rem; color: var(--text-secondary); }
.order-amount { font-size: 1.2rem; font-weight: 700; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
</style>
