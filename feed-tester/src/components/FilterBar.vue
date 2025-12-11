<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  categories: Array,
  filters: Object
})

const emit = defineEmits(['update'])

const selectedCategories = ref([...props.filters.categories])
const showCategoryDropdown = ref(false)
const dropdownRef = ref(null)

// Close dropdown when clicking outside
function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    showCategoryDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function toggleCategory(slug) {
  const idx = selectedCategories.value.indexOf(slug)
  if (idx > -1) {
    selectedCategories.value.splice(idx, 1)
  } else {
    selectedCategories.value.push(slug)
  }
  emitUpdate()
}

function clearFilters() {
  selectedCategories.value = []
  emitUpdate()
}

function emitUpdate() {
  emit('update', {
    categories: [...selectedCategories.value]
  })
}

watch(() => props.filters, (newFilters) => {
  selectedCategories.value = [...newFilters.categories]
}, { deep: true })
</script>

<template>
  <div class="glass-card rounded-2xl p-4">
    <div class="flex flex-wrap items-center gap-3">
      <!-- Source Label -->
      <div class="flex items-center gap-2">
        <span class="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/30 text-blue-300 border border-blue-500/50">
          📰 Notícias
        </span>
      </div>
      
      <!-- Separator -->
      <div class="hidden sm:block w-px h-6 bg-white/10"></div>
      
      <!-- Categories Dropdown -->
      <div class="relative" ref="dropdownRef">
        <button
          @click.stop="showCategoryDropdown = !showCategoryDropdown"
          class="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 transition-all flex items-center gap-2"
        >
          <span>🏷️ Categorias</span>
          <span v-if="selectedCategories.length > 0" class="px-1.5 py-0.5 text-xs bg-purple-500/30 rounded-full">
            {{ selectedCategories.length }}
          </span>
          <svg class="w-4 h-4 transition-transform" :class="{ 'rotate-180': showCategoryDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <!-- Dropdown -->
        <Transition name="dropdown">
          <div 
            v-if="showCategoryDropdown" 
            class="absolute top-full left-0 mt-2 w-64 max-h-64 overflow-y-auto rounded-xl border border-white/20 shadow-2xl z-[100]"
            style="background: rgba(15, 15, 35, 0.95); backdrop-filter: blur(20px);"
          >
            <div class="p-2 space-y-1">
              <div v-if="categories.length === 0" class="p-4 text-sm text-white/50 text-center">
                <span class="text-2xl block mb-2">📭</span>
                Nenhuma categoria disponível
              </div>
              <button
                v-for="cat in categories"
                :key="cat.id"
                @click.stop="toggleCategory(cat.slug)"
                :class="[
                  'w-full px-3 py-2.5 rounded-lg text-sm text-left transition-all flex items-center justify-between',
                  selectedCategories.includes(cat.slug)
                    ? 'bg-purple-500/40 text-purple-100 border border-purple-500/50'
                    : 'hover:bg-white/10 text-white/80 border border-transparent'
                ]"
              >
                <span>{{ cat.name }}</span>
                <svg v-if="selectedCategories.includes(cat.slug)" class="w-4 h-4 text-purple-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </Transition>
      </div>
      
      <!-- Clear Filters -->
      <button
        v-if="selectedCategories.length > 0"
        @click="clearFilters"
        class="px-3 py-1.5 rounded-lg text-sm font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-all ml-auto"
      >
        ✕ Limpar
      </button>
    </div>
  </div>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
