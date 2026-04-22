<template>
  <div class="cart-page">
    <div class="page-header">
      <h1>{{ $t('cart.title') }}</h1>
      <p>{{ $t('common.items', { count: cartStore.items.length }) }}</p>
    </div>
    <div v-if="cartStore.loading" class="loading-page"><div class="spinner"></div></div>
    <div v-else-if="cartStore.items.length === 0" class="empty-state">
      <div class="icon">🛒</div>
      <p>{{ $t('cart.empty') }}</p>
      <router-link to="/" class="btn btn-primary">{{ $t('cart.goShopping') }}</router-link>
    </div>
    <div v-else class="cart-layout">
      <div class="cart-items">
        <div v-for="item in cartStore.items" :key="item.id" class="cart-item card">
          <div class="item-image">
            <img v-if="item.image_url" :src="item.image_url" :alt="item.name" />
            <div v-else class="item-placeholder">📦</div>
          </div>
          <div class="item-info"><h3>{{ item.name }}</h3><div class="item-price">¥{{ item.price.toFixed(2) }}</div></div>
          <div class="item-quantity">
            <button class="qty-btn" @click="changeQty(item, -1)" :disabled="item.quantity <= 1">−</button>
            <span class="qty-value">{{ item.quantity }}</span>
            <button class="qty-btn" @click="changeQty(item, 1)">+</button>
          </div>
          <div class="item-subtotal">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
          <button class="item-remove" @click="removeItem(item.id)">✕</button>
        </div>
      </div>
      <div class="cart-summary card">
        <h3>{{ $t('cart.orderSummary') }}</h3>
        <div class="summary-row"><span>{{ $t('cart.itemCount') }}</span><span>{{ $t('common.items', { count: cartStore.itemCount }) }}</span></div>
        <div class="summary-row"><span>{{ $t('cart.totalAmount') }}</span><span>¥{{ cartStore.totalAmount.toFixed(2) }}</span></div>
        <div class="summary-divider"></div>
        <div class="summary-row total"><span>{{ $t('cart.payAmount') }}</span><span>¥{{ cartStore.totalAmount.toFixed(2) }}</span></div>
        <div class="summary-balance">
          {{ $t('cart.currentBalance', { balance: (authStore.user?.balance || 0).toFixed(2) }) }}
          <span v-if="(authStore.user?.balance || 0) < cartStore.totalAmount" class="insufficient">{{ $t('cart.insufficient') }}</span>
        </div>
        <div v-if="error" class="alert alert-error mt-2">{{ error }}</div>
        <div v-if="successMsg" class="alert alert-success mt-2">{{ successMsg }}</div>
        <button class="btn btn-primary btn-lg mt-2" style="width:100%" :disabled="checkoutLoading || cartStore.items.length === 0" @click="handleCheckout">
          <span v-if="checkoutLoading" class="spinner"></span>
          {{ checkoutLoading ? $t('cart.checkingOut') : $t('cart.checkout') }}
        </button>
        <button class="btn btn-secondary mt-1" style="width:100%" @click="cartStore.clearCart()">{{ $t('cart.clearCart') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '../stores/cart'
import { useAuthStore } from '../stores/auth'

const { t } = useI18n()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const checkoutLoading = ref(false)
const error = ref('')
const successMsg = ref('')

async function changeQty(item, delta) { const n = item.quantity + delta; if (n < 1) return; try { await cartStore.updateQuantity(item.id, n) } catch (e) { console.error(e) } }
async function removeItem(id) { try { await cartStore.removeItem(id) } catch (e) { console.error(e) } }
async function handleCheckout() {
  checkoutLoading.value = true; error.value = ''; successMsg.value = ''
  try { const result = await cartStore.checkout(); authStore.updateBalance(result.balance); successMsg.value = t('cart.orderCreated'); setTimeout(() => router.push(`/orders/${result.orderId}`), 1000) }
  catch (e) { error.value = e.response?.data?.error || t('cart.checkoutFailed') }
  finally { checkoutLoading.value = false }
}
</script>

<style scoped>
.cart-layout { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
.cart-items { display: flex; flex-direction: column; gap: 12px; }
.cart-item { display: flex; align-items: center; gap: 16px; padding: 16px; }
.item-image { width: 72px; height: 72px; border-radius: var(--radius-sm); overflow: hidden; flex-shrink: 0; background: var(--bg-input); }
.item-image img { width: 100%; height: 100%; object-fit: cover; }
.item-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
.item-info { flex: 1; min-width: 0; }
.item-info h3 { font-size: 0.95rem; font-weight: 600; margin-bottom: 4px; }
.item-price { color: var(--text-secondary); font-size: 0.85rem; }
.item-quantity { display: flex; align-items: center; gap: 8px; }
.qty-btn { width: 30px; height: 30px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--bg-input); color: var(--text-primary); font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
.qty-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.qty-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.qty-value { font-weight: 600; min-width: 24px; text-align: center; }
.item-subtotal { font-weight: 700; font-size: 1rem; min-width: 80px; text-align: right; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.item-remove { width: 28px; height: 28px; border: none; background: transparent; color: var(--text-muted); font-size: 0.9rem; cursor: pointer; border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
.item-remove:hover { background: var(--danger-bg); color: var(--danger); }
.cart-summary h3 { font-size: 1.1rem; margin-bottom: 20px; }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 0.9rem; color: var(--text-secondary); }
.summary-row.total { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); }
.summary-divider { height: 1px; background: var(--border); margin: 16px 0; }
.summary-balance { font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-top: 8px; }
.insufficient { color: var(--danger); font-weight: 600; }
@media (max-width: 768px) { .cart-layout { grid-template-columns: 1fr; } }
</style>
