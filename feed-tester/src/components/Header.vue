<script setup>
defineProps({
  wsStatus: String
})

const emit = defineEmits(['reconnect'])

const statusColors = {
  connected: 'status-connected',
  disconnected: 'status-disconnected',
  connecting: 'status-connecting'
}

const statusText = {
  connected: 'Conectado',
  disconnected: 'Desconectado',
  connecting: 'Conectando...'
}
</script>

<template>
  <header class="glass border-b border-white/10">
    <div class="max-w-7xl mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center glow-blue">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 class="font-display text-xl font-bold text-white">Feed Gateway</h1>
            <p class="text-xs text-white/50">Tester Dashboard</p>
          </div>
        </div>
        
        <!-- Connection Status -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2 glass rounded-full px-4 py-2">
            <span :class="['status-dot', statusColors[wsStatus]]"></span>
            <span class="text-sm font-medium text-white/80">{{ statusText[wsStatus] }}</span>
          </div>
          
          <button 
            @click="emit('reconnect')"
            :disabled="wsStatus === 'connecting'"
            class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="wsStatus === 'connecting'" class="flex items-center gap-2">
              <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Conectando
            </span>
            <span v-else>Reconectar</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

