<template>
  <div class="admin-orders">
    <div class="page-header">
      <h1>{{ $t('admin.orders.title') }}</h1>
      <p>{{ $t('admin.orders.subtitle') }}</p>
    </div>

    <div v-if="loading" class="loading-page"><div class="spinner"></div></div>

    <div v-else class="table-wrap card">
      <table>
        <thead>
          <tr>
            <th>{{ $t('admin.orders.orderId') }}</th><th>{{ $t('admin.orders.user') }}</th><th>{{ $t('admin.orders.itemCount') }}</th><th>{{ $t('admin.orders.totalAmount') }}</th><th>{{ $t('admin.orders.status') }}</th><th>{{ $t('admin.orders.orderTime') }}</th><th>{{ $t('admin.orders.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>#{{ order.id }}</td>
            <td>{{ order.username }}</td>
            <td>{{ order.itemCount }}</td>
            <td>¥{{ order.total_amount.toFixed(2) }}</td>
            <td><span class="badge badge-success">{{ order.status === 'completed' ? $t('orders.completed') : order.status }}</span></td>
            <td>{{ order.created_at }}</td>
            <td><button class="btn btn-sm btn-secondary" @click="viewDetail(order.id)">{{ $t('admin.orders.viewDetail') }}</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Order Detail Modal -->
    <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
      <div class="modal" style="max-width:700px">
        <div class="flex-between mb-2">
          <h2>{{ $t('admin.orders.orderDetail', { id: selectedOrder?.order?.id }) }}</h2>
          <span class="badge badge-success">{{ $t('orders.completed') }}</span>
        </div>
        <div class="info-grid mb-2">
          <div class="info-item"><span>{{ $t('admin.orders.userLabel', { name: selectedOrder?.order?.username }) }}</span></div>
          <div class="info-item"><span>{{ $t('admin.orders.timeLabel', { time: selectedOrder?.order?.created_at }) }}</span></div>
          <div class="info-item"><strong>{{ $t('admin.orders.totalLabel', { amount: selectedOrder?.order?.total_amount.toFixed(2) }) }}</strong></div>
        </div>

        <div class="table-wrap">
          <table>
            <thead><tr><th>{{ $t('admin.products.image') }}</th><th>{{ $t('admin.products.name') }}</th><th>{{ $t('admin.products.price') }}</th><th>数量</th><th>{{ $t('admin.orders.totalAmount') }}</th></tr></thead>
            <tbody>
              <tr v-for="item in selectedOrder?.items" :key="item.id">
                <td><img v-if="item.image_url" :src="item.image_url" class="thumb" /><span v-else>—</span></td>
                <td>
                  <div><strong>{{ item.product_name }}</strong></div>
                  <div v-if="item.delivery_content" class="mt-1">
                    <small class="text-success">{{ $t('admin.orders.deliveryContent') }}</small>
                    <pre class="delivery-pre">{{ item.delivery_content }}</pre>
                  </div>
                </td>
                <td>¥{{ item.unit_price.toFixed(2) }}</td>
                <td>{{ item.quantity }}</td>
                <td><strong>¥{{ (item.unit_price * item.quantity).toFixed(2) }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="modal-actions mt-2"><button class="btn btn-secondary" @click="showDetailModal = false">{{ $t('common.close') }}</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '../../api'

const { t } = useI18n()
const orders = ref([])
const loading = ref(true)
const showDetailModal = ref(false)
const selectedOrder = ref(null)

onMounted(async () => {
  try { const res = await api.get('/admin/orders'); orders.value = res.data.orders } catch (e) { console.error(e) } finally { loading.value = false }
})

async function viewDetail(id) {
  try { const res = await api.get(`/admin/orders/${id}`); selectedOrder.value = res.data; showDetailModal.value = true }
  catch (e) { alert(t('admin.orders.detailFailed')) }
}
</script>

<style scoped>
.thumb { width: 40px; height: 40px; border-radius: 4px; object-fit: cover; }
.info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; background: var(--bg-input); padding: 12px; border-radius: var(--radius-sm); font-size: 0.9rem; }
.delivery-pre { margin-top: 4px; padding: 6px; background: rgba(0,0,0,0.1); border-radius: 4px; font-size: 0.8rem; font-family: monospace; white-space: pre-wrap; word-break: break-all; color: var(--text-secondary); border: 1px solid var(--border); }
</style>
