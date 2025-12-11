<script setup>
defineProps({
  backends: Object,
  stats: Object
})

const getStatusClass = (status) => {
  return {
    'connected': 'from-green-500/20 to-green-600/20 border-green-500/30',
    'disconnected': 'from-red-500/20 to-red-600/20 border-red-500/30',
    'connecting': 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
  }[status] || 'from-gray-500/20 to-gray-600/20 border-gray-500/30'
}

const getStatusDot = (status) => {
  return {
    'connected': 'bg-green-500',
    'disconnected': 'bg-red-500',
    'connecting': 'bg-amber-500 animate-pulse',
  }[status] || 'bg-gray-500'
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 py-4">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- News Backend -->
      <div :class="['glass-card rounded-2xl p-4 bg-gradient-to-br border', getStatusClass(backends?.news?.status)]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
          <div>
            <p class="text-xs text-white/50">Backend Notícias</p>
            <div class="flex items-center gap-2">
              <span :class="['w-2 h-2 rounded-full', getStatusDot(backends?.news?.status)]"></span>
              <span class="text-sm font-medium text-white/80 capitalize">{{ backends?.news?.status || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Total Items -->
      <div class="glass-card rounded-2xl p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <div>
            <p class="text-xs text-white/50">Feed Cronológico</p>
            <p class="text-lg font-bold text-white">{{ stats?.total || 0 }}</p>
          </div>
        </div>
      </div>
      
      <!-- For You Items -->
      <div class="glass-card rounded-2xl p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
            <span class="text-lg">🎯</span>
          </div>
          <div>
            <p class="text-xs text-white/50">Feed For You</p>
            <p class="text-lg font-bold text-pink-400">{{ stats?.forYou || 0 }}</p>
          </div>
        </div>
      </div>
      
      <!-- Articles Count -->
      <div class="glass-card rounded-2xl p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p class="text-xs text-white/50">Artigos</p>
            <p class="text-lg font-bold text-blue-400">{{ stats?.news || 0 }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
