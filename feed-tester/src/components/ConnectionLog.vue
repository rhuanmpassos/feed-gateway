<script setup>
import { ref } from 'vue'

defineProps({
  logs: Array
})

const expanded = ref(null)

const logColors = {
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
  live: 'text-red-500',
}

const logIcons = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
  live: '●',
}

function toggleExpand(id) {
  expanded.value = expanded.value === id ? null : id
}
</script>

<template>
  <div class="glass-card rounded-2xl overflow-hidden sticky top-4">
    <!-- Header -->
    <div class="p-4 border-b border-white/10">
      <div class="flex items-center justify-between">
        <h2 class="font-semibold text-white flex items-center gap-2">
          <span class="text-lg">📋</span>
          Log de Conexão
        </h2>
        <span class="text-xs text-white/40">{{ logs.length }} eventos</span>
      </div>
    </div>
    
    <!-- Logs -->
    <div class="h-[500px] overflow-y-auto p-2 space-y-1">
      <TransitionGroup name="log">
        <div
          v-for="log in logs"
          :key="log.id"
          @click="log.data && toggleExpand(log.id)"
          :class="[
            'p-3 rounded-xl transition-all',
            log.data ? 'cursor-pointer hover:bg-white/5' : '',
            expanded === log.id ? 'bg-white/5' : ''
          ]"
        >
          <div class="flex items-start gap-2">
            <!-- Icon -->
            <span :class="['text-xs mt-0.5', logColors[log.type]]">
              {{ logIcons[log.type] }}
            </span>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-sm text-white/80">{{ log.message }}</span>
                <span v-if="log.data" class="text-xs text-white/30">
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="expanded === log.id ? 'M19 9l-7 7-7-7' : 'M9 5l7 7-7 7'" />
                  </svg>
                </span>
              </div>
              <span class="text-xs text-white/30">{{ log.timestamp }}</span>
              
              <!-- Expanded Data -->
              <Transition name="expand">
                <div v-if="expanded === log.id && log.data" class="mt-2 p-2 rounded-lg bg-black/30 overflow-x-auto">
                  <pre class="text-xs text-white/60 font-mono">{{ JSON.stringify(log.data, null, 2) }}</pre>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </TransitionGroup>
      
      <div v-if="logs.length === 0" class="p-8 text-center">
        <span class="text-4xl mb-2 block">📭</span>
        <p class="text-sm text-white/40">Nenhum evento ainda</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.log-enter-active {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.2s ease;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.expand-enter-to,
.expand-leave-from {
  max-height: 200px;
}
</style>

