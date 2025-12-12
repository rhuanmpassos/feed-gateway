<script setup>
import { computed } from 'vue'

const props = defineProps({
  item: Object,
  liked: Boolean,
  bookmarked: Boolean
})

const emit = defineEmits(['like', 'bookmark', 'share'])

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

const timeAgo = computed(() => {
  const now = new Date()
  const date = new Date(props.item.publishedAt || props.item.receivedAt)
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  
  if (diffMins < 5) return 'AGORA'
  if (diffMins < 60) return `${diffMins} min`
  if (diffHours < 24) return `${diffHours}h`
  return null
})

const isUrgent = computed(() => {
  const now = new Date()
  const date = new Date(props.item.publishedAt || props.item.receivedAt)
  const diffMs = now - date
  return diffMs < 300000 // 5 minutos
})

const isRecent = computed(() => {
  const now = new Date()
  const date = new Date(props.item.publishedAt || props.item.receivedAt)
  const diffMs = now - date
  return diffMs < 3600000 // 1 hora
})

const sourceLabel = computed(() => {
  return props.item.siteName
})

function handleAction(action, event) {
  event.stopPropagation()
  emit(action, props.item)
}
</script>

<template>
  <article class="glass-card rounded-2xl overflow-hidden group" :data-article-id="item.id">
    <div class="flex flex-col sm:flex-row">
      <!-- Thumbnail -->
      <div class="relative sm:w-48 h-32 sm:h-auto flex-shrink-0">
        <img 
          v-if="item.imageUrl"
          :src="item.imageUrl" 
          :alt="item.title"
          class="w-full h-full object-cover"
          loading="lazy"
        />
        <div v-else class="w-full h-full bg-gradient-to-br from-purple-900/50 to-blue-900/50 flex items-center justify-center">
          <span class="text-4xl">📰</span>
        </div>
        
        <!-- Source Badge -->
        <div class="absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/90 text-white">
          News
        </div>
        
        <!-- Urgency Badge -->
        <div v-if="isUrgent" class="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold bg-red-500 text-white animate-pulse">
          URGENTE
        </div>
        <div v-else-if="timeAgo === 'AGORA'" class="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-bold bg-amber-500 text-white">
          AGORA
        </div>
        <div v-else-if="isRecent" class="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium bg-green-500/90 text-white">
          NOVO
        </div>
      </div>
      
      <!-- Content -->
      <div class="flex-1 p-4">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <!-- Category + Time -->
            <div class="flex items-center gap-2 mb-2">
              <span v-if="categoryName" class="badge">{{ categoryName }}</span>
              <span v-if="timeAgo && timeAgo !== 'AGORA'" class="text-xs text-white/40">{{ timeAgo }}</span>
            </div>
            
            <!-- Title -->
            <h3 class="font-semibold text-white group-hover:text-purple-300 transition-colors line-clamp-2 mb-2">
              {{ item.title }}
            </h3>
            
            <!-- Summary -->
            <p v-if="item.summary" class="text-sm text-white/50 line-clamp-2 mb-3">
              {{ item.summary }}
            </p>
            
            <!-- Meta + Actions -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3 text-xs text-white/40">
                <!-- Site -->
                <span>{{ sourceLabel || 'Fonte desconhecida' }}</span>
                <span>•</span>
                <span>{{ formattedDate }}</span>
              </div>
              
              <!-- Action Buttons -->
              <div class="flex items-center gap-1">
                <!-- Like (Star) -->
                <button 
                  @click="handleAction('like', $event)"
                  class="p-2 rounded-lg transition-all hover:bg-white/10"
                  :class="liked ? 'text-yellow-400' : 'text-white/30 hover:text-yellow-400'"
                  title="Curtir"
                >
                  <svg class="w-5 h-5" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
                
                <!-- Bookmark -->
                <button 
                  @click="handleAction('bookmark', $event)"
                  class="p-2 rounded-lg transition-all hover:bg-white/10"
                  :class="bookmarked ? 'text-blue-400' : 'text-white/30 hover:text-blue-400'"
                  title="Salvar"
                >
                  <svg class="w-5 h-5" :fill="bookmarked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
                
                <!-- Share -->
                <button 
                  @click="handleAction('share', $event)"
                  class="p-2 rounded-lg transition-all text-white/30 hover:text-green-400 hover:bg-white/10"
                  title="Compartilhar"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
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
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
