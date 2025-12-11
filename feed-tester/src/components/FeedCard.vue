<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: Object
})

const categoryName = computed(() => {
  if (!props.item.category) return null
  if (typeof props.item.category === 'object') {
    return props.item.category.name
  }
  return props.item.category
})

const formattedDate = computed(() => {
  const date = new Date(props.item.publishedAt || props.item.receivedAt)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const sourceLabel = computed(() => {
  return props.item.siteName
})
</script>

<template>
  <article class="glass-card rounded-2xl overflow-hidden group">
    <div class="flex flex-col sm:flex-row">
      <!-- Thumbnail -->
      <div class="relative sm:w-48 h-32 sm:h-auto flex-shrink-0">
        <img 
          v-if="item.imageUrl"
          :src="item.imageUrl" 
          :alt="item.title"
          class="w-full h-full object-cover"
        />
        <div v-else class="w-full h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
          <span class="text-4xl">📰</span>
        </div>
        
        <!-- Source Badge -->
        <div class="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/90 text-white">
          News
        </div>
      </div>
      
      <!-- Content -->
      <div class="flex-1 p-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <!-- Category -->
            <div v-if="categoryName" class="mb-2">
              <span class="badge">{{ categoryName }}</span>
            </div>
            
            <!-- Title -->
            <h3 class="font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
              {{ item.title }}
            </h3>
            
            <!-- Summary -->
            <p v-if="item.summary" class="text-sm text-white/50 line-clamp-2 mb-3">
              {{ item.summary }}
            </p>
            
            <!-- Meta -->
            <div class="flex items-center gap-3 text-xs text-white/40">
              <!-- Site -->
              <div class="flex items-center gap-1.5">
                <span>{{ sourceLabel || 'Fonte desconhecida' }}</span>
              </div>
              
              <!-- Date -->
              <span>•</span>
              <span>{{ formattedDate }}</span>
              
              <!-- ID -->
              <span class="hidden sm:inline">•</span>
              <span class="hidden sm:inline font-mono text-white/30">{{ item.id }}</span>
            </div>
          </div>
          
          <!-- Arrow -->
          <div class="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 group-hover:bg-purple-500/20 transition-colors">
            <svg class="w-5 h-5 text-white/30 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
