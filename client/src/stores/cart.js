import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])
  const loading = ref(false)

  const totalAmount = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  async function fetchCart() {
    loading.value = true
    try {
      const res = await api.get('/cart')
      items.value = res.data.items
    } finally {
      loading.value = false
    }
  }

  async function addToCart(productId, quantity = 1) {
    await api.post('/cart', { productId, quantity })
    await fetchCart()
  }

  async function updateQuantity(cartItemId, quantity) {
    await api.put(`/cart/${cartItemId}`, { quantity })
    await fetchCart()
  }

  async function removeItem(cartItemId) {
    await api.delete(`/cart/${cartItemId}`)
    await fetchCart()
  }

  async function clearCart() {
    await api.delete('/cart')
    items.value = []
  }

  async function checkout() {
    const res = await api.post('/orders/checkout')
    items.value = []
    return res.data
  }

  return { items, loading, totalAmount, itemCount, fetchCart, addToCart, updateQuantity, removeItem, clearCart, checkout }
})
