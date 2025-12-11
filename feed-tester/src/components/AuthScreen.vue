<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['login', 'register'])

const mode = ref('login') // 'login' | 'register'
const name = ref('')
const email = ref('')
const isLoading = ref(false)
const localError = ref('')

// Watch para exibir erros externos
watch(() => props.error, (newError) => {
  if (newError) {
    localError.value = newError
    isLoading.value = false
  }
})

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  localError.value = ''
}

async function handleSubmit() {
  localError.value = ''
  
  if (!email.value) {
    localError.value = 'Digite seu email'
    return
  }
  
  if (mode.value === 'register' && !name.value) {
    localError.value = 'Digite seu nome'
    return
  }
  
  isLoading.value = true
  
  emit(mode.value === 'login' ? 'login' : 'register', {
    name: name.value,
    email: email.value
  })
}
</script>

<template>
  <div class="auth-container min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
    <!-- Animated background -->
    <div class="absolute inset-0 overflow-hidden">
      <!-- Floating orbs -->
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="orb orb-4"></div>
      
      <!-- Grid pattern -->
      <div class="grid-pattern"></div>
      
      <!-- Gradient overlay -->
      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f0f23]/50 to-[#0f0f23]"></div>
    </div>
    
    <!-- Main content -->
    <div class="relative z-10 w-full max-w-md">
      <!-- Logo/Brand -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 mb-6 shadow-2xl shadow-violet-500/30">
          <span class="text-4xl">📰</span>
        </div>
        <h1 class="text-4xl font-bold text-white mb-2 tracking-tight" style="font-family: 'Outfit', sans-serif;">
          Feed<span class="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Gateway</span>
        </h1>
        <p class="text-white/50 text-lg">Notícias personalizadas para você</p>
      </div>
      
      <!-- Auth Card -->
      <div class="auth-card rounded-3xl p-8 relative overflow-hidden">
        <!-- Card glow effect -->
        <div class="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-20 -left-20 w-40 h-40 bg-fuchsia-500/20 rounded-full blur-3xl"></div>
        
        <div class="relative z-10">
          <!-- Tab switcher -->
          <div class="flex bg-white/5 rounded-xl p-1 mb-6">
            <button 
              @click="mode = 'login'"
              :class="[
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                mode === 'login' 
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg' 
                  : 'text-white/50 hover:text-white/70'
              ]"
            >
              Entrar
            </button>
            <button 
              @click="mode = 'register'"
              :class="[
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300',
                mode === 'register' 
                  ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-lg' 
                  : 'text-white/50 hover:text-white/70'
              ]"
            >
              Criar Conta
            </button>
          </div>
          
          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Name field (register only) -->
            <Transition name="slide-fade">
              <div v-if="mode === 'register'">
                <label class="block text-sm text-white/70 mb-2 font-medium">Nome</label>
                <input 
                  v-model="name"
                  type="text"
                  class="input-field"
                  placeholder="Como você quer ser chamado?"
                />
              </div>
            </Transition>
            
            <!-- Email field -->
            <div>
              <label class="block text-sm text-white/70 mb-2 font-medium">Email</label>
              <input 
                v-model="email"
                type="email"
                class="input-field"
                placeholder="seu@email.com"
              />
            </div>
            
            <!-- Error message -->
            <Transition name="fade">
              <div v-if="localError" class="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm flex items-center gap-2">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {{ localError }}
              </div>
            </Transition>
            
            <!-- Submit button -->
            <button 
              type="submit"
              :disabled="isLoading"
              class="submit-btn w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2"
            >
              <span v-if="isLoading" class="loading-spinner"></span>
              <span v-else>
                {{ mode === 'login' ? '🚀 Entrar' : '✨ Criar Conta' }}
              </span>
            </button>
          </form>
          
          <!-- Info text -->
          <p class="text-center text-white/40 text-sm mt-6">
            {{ mode === 'login' 
              ? 'Entre com seu email para acessar as notícias' 
              : 'Crie sua conta para personalizar seu feed' 
            }}
          </p>
        </div>
      </div>
      
      <!-- Features -->
      <div class="mt-8 grid grid-cols-3 gap-4 text-center">
        <div class="feature-item p-4 rounded-2xl">
          <div class="text-2xl mb-2">🎯</div>
          <p class="text-xs text-white/50">Feed Personalizado</p>
        </div>
        <div class="feature-item p-4 rounded-2xl">
          <div class="text-2xl mb-2">⚡</div>
          <p class="text-xs text-white/50">Tempo Real</p>
        </div>
        <div class="feature-item p-4 rounded-2xl">
          <div class="text-2xl mb-2">📊</div>
          <p class="text-xs text-white/50">Suas Estatísticas</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%);
}

.grid-pattern {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at center, black 20%, transparent 70%);
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: float 20s infinite ease-in-out;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(236, 72, 153, 0.2));
  top: -10%;
  right: -10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.2));
  bottom: 10%;
  left: -5%;
  animation-delay: -5s;
}

.orb-3 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(245, 158, 11, 0.2));
  top: 40%;
  right: 10%;
  animation-delay: -10s;
}

.orb-4 {
  width: 250px;
  height: 250px;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2));
  top: 20%;
  left: 15%;
  animation-delay: -15s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(30px, -30px) scale(1.05);
  }
  50% {
    transform: translate(-20px, 20px) scale(0.95);
  }
  75% {
    transform: translate(-30px, -20px) scale(1.02);
  }
}

.auth-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

.input-field {
  width: 100%;
  padding: 14px 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: white;
  font-size: 15px;
  transition: all 0.3s ease;
}

.input-field::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.input-field:focus {
  outline: none;
  border-color: rgba(139, 92, 246, 0.6);
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15);
}

.submit-btn {
  background: linear-gradient(135deg, #8b5cf6, #d946ef);
  box-shadow: 0 10px 30px -5px rgba(139, 92, 246, 0.4);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px -5px rgba(139, 92, 246, 0.5);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.feature-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(139, 92, 246, 0.3);
  transform: translateY(-2px);
}

/* Transitions */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

