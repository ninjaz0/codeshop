<template>
  <div class="dashboard-page">
    <div class="page-header"><h1>{{ $t('admin.dashboard.title') }}</h1><p>{{ $t('admin.dashboard.subtitle') }}</p></div>
    <div class="stats-grid">
      <div class="stat-card card"><div class="stat-icon">📦</div><div class="stat-info"><div class="stat-value">{{ stats.products }}</div><div class="stat-label">{{ $t('admin.dashboard.totalProducts') }}</div></div></div>
      <div class="stat-card card"><div class="stat-icon">📋</div><div class="stat-info"><div class="stat-value">{{ stats.orders }}</div><div class="stat-label">{{ $t('admin.dashboard.totalOrders') }}</div></div></div>
      <div class="stat-card card"><div class="stat-icon">👤</div><div class="stat-info"><div class="stat-value">{{ stats.users }}</div><div class="stat-label">{{ $t('admin.dashboard.totalUsers') }}</div></div></div>
      <div class="stat-card card"><div class="stat-icon">🎫</div><div class="stat-info"><div class="stat-value">{{ stats.unusedCodes }}</div><div class="stat-label">{{ $t('admin.dashboard.unusedCodes') }}</div></div></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../api'
const stats = ref({ products: 0, orders: 0, users: 0, unusedCodes: 0 })
onMounted(async () => {
  try {
    const [products, orders, codes, users] = await Promise.all([api.get('/admin/products'), api.get('/admin/orders'), api.get('/admin/codes'), api.get('/admin/users')])
    stats.value.products = products.data.products.length; stats.value.orders = orders.data.orders.length
    stats.value.unusedCodes = codes.data.codes.filter(c => c.status === 'unused').length
    stats.value.users = users.data.users.length
  } catch (e) { console.error(e) }
})
</script>

<style scoped>
.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
.stat-card { display: flex; align-items: center; gap: 20px; padding: 24px; transition: var(--transition); }
.stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
.stat-icon { font-size: 2.5rem; }
.stat-value { font-size: 1.8rem; font-weight: 700; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.stat-label { font-size: 0.85rem; color: var(--text-muted); }
</style>
