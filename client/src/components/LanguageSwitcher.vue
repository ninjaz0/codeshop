<template>
  <div class="lang-switcher" @click.stop="open = !open">
    <span class="lang-current">{{ currentFlag }} {{ currentName }}</span>
    <div v-if="open" class="lang-dropdown" @click.stop>
      <div
        v-for="loc in availableLocales"
        :key="loc.code"
        class="lang-option"
        :class="{ active: locale === loc.code }"
        @click="switchLang(loc.code)"
      >
        {{ loc.flag }} {{ $t(`lang.${loc.code}`) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { availableLocales, setLocale } from '../i18n'

const { locale } = useI18n()
const open = ref(false)

const currentFlag = computed(() => availableLocales.find(l => l.code === locale.value)?.flag || '🌐')
const currentName = computed(() => {
  const names = { 'zh-CN': '简体', 'zh-TW': '繁體', en: 'EN', ja: 'JP', ru: 'RU' }
  return names[locale.value] || locale.value
})

function switchLang(code) {
  setLocale(code)
  open.value = false
}

function closeMenu() { open.value = false }
onMounted(() => document.addEventListener('click', closeMenu))
onUnmounted(() => document.removeEventListener('click', closeMenu))
</script>

<style scoped>
.lang-switcher { position: relative; cursor: pointer; user-select: none; }
.lang-current { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: var(--radius-sm); font-size: 0.8rem; color: var(--text-secondary); transition: var(--transition); border: 1px solid transparent; }
.lang-current:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); border-color: var(--border); }
.lang-dropdown { position: absolute; top: calc(100% + 6px); right: 0; min-width: 160px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 6px; box-shadow: var(--shadow-lg); animation: scaleIn 0.15s ease; z-index: 200; }
.lang-option { padding: 8px 12px; border-radius: var(--radius-sm); font-size: 0.85rem; color: var(--text-secondary); cursor: pointer; transition: var(--transition); }
.lang-option:hover { background: rgba(255,255,255,0.05); color: var(--text-primary); }
.lang-option.active { color: var(--accent); background: rgba(124,92,252,0.1); }
</style>
