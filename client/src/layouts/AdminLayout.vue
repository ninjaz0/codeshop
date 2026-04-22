<template>
  <div class="admin-layout">
    <aside class="sidebar glass">
      <div class="sidebar-brand"><span class="logo">⚙</span><span>{{ $t('app.admin') }}</span></div>
      <nav class="sidebar-nav">
        <router-link to="/admin" class="sidebar-link" exact-active-class="active"><span>📊</span> {{ $t('admin.sidebar.dashboard') }}</router-link>
        <router-link to="/admin/products" class="sidebar-link" active-class="active"><span>📦</span> {{ $t('admin.sidebar.products') }}</router-link>
        <router-link to="/admin/codes" class="sidebar-link" active-class="active"><span>🎫</span> {{ $t('admin.sidebar.codes') }}</router-link>
        <router-link to="/admin/invitations" class="sidebar-link" active-class="active"><span>🎟️</span> {{ $t('admin.sidebar.invitations') }}</router-link>
        <router-link to="/admin/orders" class="sidebar-link" active-class="active"><span>📋</span> {{ $t('admin.sidebar.orders') }}</router-link>
        <router-link to="/admin/users" class="sidebar-link" active-class="active"><span>👥</span> {{ $t('admin.sidebar.users') }}</router-link>
      </nav>
      <div class="sidebar-footer">
        <LanguageSwitcher />
        <router-link to="/" class="sidebar-link"><span>🏠</span> {{ $t('admin.sidebar.backToStore') }}</router-link>
        <div class="sidebar-link" @click="handleLogout"><span>🚪</span> {{ $t('admin.sidebar.logout') }}</div>
      </div>
    </aside>
    <main class="admin-main"><router-view /></main>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LanguageSwitcher from '../components/LanguageSwitcher.vue'

const router = useRouter()
const authStore = useAuthStore()
function handleLogout() { authStore.logout(); router.push('/login') }
</script>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; }
.sidebar { width: 240px; border-right: 1px solid var(--border); display: flex; flex-direction: column; position: fixed; top: 0; left: 0; bottom: 0; z-index: 100; }
.sidebar-brand { padding: 20px 24px; display: flex; align-items: center; gap: 10px; font-size: 1.1rem; font-weight: 700; border-bottom: 1px solid var(--border); }
.sidebar-brand .logo { font-size: 1.3rem; }
.sidebar-nav { flex: 1; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
.sidebar-link { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-radius: var(--radius-sm); font-size: 0.9rem; color: var(--text-secondary); cursor: pointer; transition: var(--transition); }
.sidebar-link:hover { background: rgba(255, 255, 255, 0.05); color: var(--text-primary); }
.sidebar-link.active { background: rgba(124, 92, 252, 0.1); color: var(--accent); }
.sidebar-footer { padding: 12px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
.admin-main { flex: 1; margin-left: 240px; padding: 32px; max-width: calc(100vw - 240px); }
</style>
