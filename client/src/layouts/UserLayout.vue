<template>
  <div class="user-layout">
    <nav class="navbar glass">
      <div class="nav-brand" @click="$router.push('/')">
        <span class="logo">✦</span>
        <span class="brand-text">{{ $t('app.name') }}</span>
      </div>
      <div class="nav-links">
        <router-link to="/" class="nav-link"><span class="nav-icon">🏠</span>{{ $t('nav.store') }}</router-link>
        <router-link to="/cart" class="nav-link">
          <span class="nav-icon">🛒</span>{{ $t('nav.cart') }}
          <span v-if="cartStore.itemCount > 0" class="cart-badge">{{ cartStore.itemCount }}</span>
        </router-link>
        <router-link to="/recharge" class="nav-link"><span class="nav-icon">💎</span>{{ $t('nav.recharge') }}</router-link>
        <router-link to="/orders" class="nav-link"><span class="nav-icon">📋</span>{{ $t('nav.orders') }}</router-link>
      </div>
      <div class="nav-right">
        <LanguageSwitcher />
        <div class="balance-display">
          <span class="balance-label">{{ $t('nav.balance') }}</span>
          <span class="balance-amount">¥{{ (authStore.user?.balance || 0).toFixed(2) }}</span>
        </div>
        <div class="user-menu" @click.stop="showMenu = !showMenu">
          <div class="avatar">{{ authStore.user?.username?.[0]?.toUpperCase() }}</div>
          <div class="dropdown" v-if="showMenu" @click.stop>
            <div class="dropdown-header">
              <strong>{{ authStore.user?.username }}</strong>
              <small>{{ authStore.isAdmin ? $t('nav.admin') : $t('nav.user') }}</small>
            </div>
            <div class="dropdown-divider"></div>
            <router-link to="/profile" class="dropdown-item" @click="showMenu = false">{{ $t('nav.profile') }}</router-link>
            <router-link v-if="authStore.isAdmin" to="/admin" class="dropdown-item" @click="showMenu = false">{{ $t('nav.adminPanel') }}</router-link>
            <div class="dropdown-divider"></div>
            <div class="dropdown-item danger" @click="handleLogout">{{ $t('nav.logout') }}</div>
          </div>
        </div>
      </div>
    </nav>
    <main class="main-content"><router-view /></main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useCartStore } from '../stores/cart'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const showMenu = ref(false)

onMounted(() => {
  authStore.fetchMe()
  cartStore.fetchCart()
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})

function closeMenu() {
  showMenu.value = false
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.user-layout { min-height: 100vh; }
.navbar { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 0 32px; height: 64px; border-bottom: 1px solid var(--border); }
.nav-brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.logo { font-size: 1.5rem; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.brand-text { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; }
.nav-links { display: flex; gap: 4px; }
.nav-link { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 0.9rem; color: var(--text-secondary); position: relative; transition: var(--transition); }
.nav-link:hover, .nav-link.router-link-active { color: var(--text-primary); background: rgba(255, 255, 255, 0.05); }
.nav-link.router-link-active::after { content: ''; position: absolute; bottom: -1px; left: 50%; transform: translateX(-50%); width: 20px; height: 2px; background: var(--accent); border-radius: 1px; }
.nav-icon { font-size: 1rem; }
.cart-badge { background: var(--accent); color: white; font-size: 0.65rem; font-weight: 700; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 5px; }
.nav-right { display: flex; align-items: center; gap: 16px; }
.balance-display { display: flex; flex-direction: column; align-items: flex-end; }
.balance-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
.balance-amount { font-size: 1rem; font-weight: 700; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.user-menu { position: relative; cursor: pointer; }
.avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--accent-gradient); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; color: white; transition: var(--transition); }
.avatar:hover { transform: scale(1.05); box-shadow: var(--shadow-glow); }
.dropdown { position: absolute; top: calc(100% + 8px); right: 0; width: 200px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 8px; box-shadow: var(--shadow-lg); animation: scaleIn 0.2s ease; }
.dropdown-header { padding: 8px 12px; display: flex; flex-direction: column; }
.dropdown-header strong { font-size: 0.9rem; }
.dropdown-header small { color: var(--text-muted); font-size: 0.75rem; }
.dropdown-divider { height: 1px; background: var(--border); margin: 4px 0; }
.dropdown-item { display: block; padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text-secondary); cursor: pointer; transition: var(--transition); }
.dropdown-item:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-primary); }
.dropdown-item.danger { color: var(--danger); }
.main-content { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
@media (max-width: 768px) {
  .navbar { padding: 0 16px; flex-wrap: wrap; height: auto; padding: 12px 16px; gap: 12px; }
  .nav-links { order: 3; width: 100%; justify-content: center; }
  .nav-link span:not(.nav-icon):not(.cart-badge) { display: none; }
  .balance-display { display: none; }
  .main-content { padding: 20px 16px; }
}
</style>
