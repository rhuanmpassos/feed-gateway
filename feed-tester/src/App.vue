<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import Header from './components/Header.vue'
import StatusBar from './components/StatusBar.vue'
import FilterBar from './components/FilterBar.vue'
import FeedCard from './components/FeedCard.vue'
import ConnectionLog from './components/ConnectionLog.vue'

// Gateway URL - Render
const GATEWAY_URL = 'https://feed-gateway.onrender.com'
const WS_URL = 'wss://feed-gateway.onrender.com/ws'

// State
const wsStatus = ref('disconnected')
const backends = ref({ news: null })
const feedItems = ref([])
const forYouItems = ref([])
const logs = ref([])
const filters = ref({
  categories: [],
})
const categories = ref([])
const ws = ref(null)

// User state
const currentUserId = ref(localStorage.getItem('test_user_id') || null)
const userName = ref('')
const userEmail = ref('')
const showUserModal = ref(false)
const userPreferences = ref([])
const userStats = ref(null)

// Feed mode: 'chronological' | 'for-you'
const feedMode = ref('chronological')

// Interaction tracking
const interactionQueue = ref([])
const interactionInterval = ref(null)
const viewStartTimes = ref(new Map()) // track view duration

// Computed
const displayItems = computed(() => {
  if (feedMode.value === 'for-you') {
    return forYouItems.value
  }
  
  let items = [...feedItems.value]
  
  if (filters.value.categories.length > 0) {
    items = items.filter(item => {
      if (!item.category) return false
      const slug = item.category.slug || item.category
      return filters.value.categories.includes(slug.toLowerCase())
    })
  }
  
  return items.slice(0, 50)
})

const stats = computed(() => ({
  total: feedItems.value.length,
  news: feedItems.value.length,
  forYou: forYouItems.value.length,
}))

// ========== LOGGING ==========
function addLog(type, message, data = null) {
  logs.value.unshift({
    id: Date.now(),
    type,
    message,
    data,
    timestamp: new Date().toLocaleTimeString('pt-BR')
  })
  if (logs.value.length > 100) logs.value.pop()
}

// ========== USER MANAGEMENT ==========
async function createUser() {
  if (!userName.value || !userEmail.value) {
    addLog('error', 'Nome e email são obrigatórios')
    return
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userName.value, email: userEmail.value })
    })
    const data = await res.json()
    
    if (data.success || data.id) {
      const userId = data.data?.id || data.id
      currentUserId.value = userId
      localStorage.setItem('test_user_id', userId)
      showUserModal.value = false
      addLog('success', `Usuário criado/selecionado: ID ${userId}`)
      await loadUserData()
    } else {
      addLog('error', 'Erro ao criar usuário', data)
    }
  } catch (e) {
    addLog('error', 'Erro ao criar usuário', e.message)
  }
}

async function loadUserData() {
  if (!currentUserId.value) return

  try {
    // Carrega preferências
    const prefsRes = await fetch(`${GATEWAY_URL}/api/users/${currentUserId.value}/preferences`)
    const prefsData = await prefsRes.json()
    if (prefsData.success) {
      userPreferences.value = prefsData.data || []
      addLog('info', `${userPreferences.value.length} preferências carregadas`)
    }

    // Carrega stats
    const statsRes = await fetch(`${GATEWAY_URL}/api/interactions/user/${currentUserId.value}/stats`)
    const statsData = await statsRes.json()
    if (statsData.success) {
      userStats.value = statsData.data
      addLog('info', 'Estatísticas do usuário carregadas')
    }
  } catch (e) {
    addLog('error', 'Erro ao carregar dados do usuário', e.message)
  }
}

function clearUser() {
  currentUserId.value = null
  localStorage.removeItem('test_user_id')
  userPreferences.value = []
  userStats.value = null
  forYouItems.value = []
  feedMode.value = 'chronological'
  addLog('info', 'Usuário deslogado')
}

// ========== INTERACTION TRACKING ==========
function trackInteraction(articleId, type, extra = {}) {
  if (!currentUserId.value) return

  const interaction = {
    article_id: articleId,
    interaction_type: type,
    timestamp: Date.now(),
    ...extra
  }

  interactionQueue.value.push(interaction)
  addLog('info', `📊 Interação: ${type} em ${articleId}`, interaction)
}

// Track impressions when items come into view
function trackImpression(item) {
  if (!currentUserId.value) return
  const articleId = parseInt(item.id.replace('news_', ''))
  trackInteraction(articleId, 'impression', { position: displayItems.value.indexOf(item) })
}

// Track click
function handleItemClick(item) {
  if (!currentUserId.value) {
    window.open(item.url, '_blank')
    return
  }

  const articleId = parseInt(item.id.replace('news_', ''))
  trackInteraction(articleId, 'click', { position: displayItems.value.indexOf(item) })
  
  // Track view start
  viewStartTimes.value.set(articleId, Date.now())
  
  window.open(item.url, '_blank')
  
  // Simulate view end after 5 seconds
  setTimeout(() => {
    const startTime = viewStartTimes.value.get(articleId)
    if (startTime) {
      const duration = Date.now() - startTime
      trackInteraction(articleId, 'view', { duration })
      viewStartTimes.value.delete(articleId)
    }
  }, 5000)
}

// Send interactions in batch every 10 seconds
async function sendInteractions() {
  if (!currentUserId.value || interactionQueue.value.length === 0) return

  const interactions = [...interactionQueue.value]
  interactionQueue.value = []

  try {
    const res = await fetch(`${GATEWAY_URL}/api/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(currentUserId.value),
        interactions
      })
    })
    const data = await res.json()
    
    if (data.success) {
      addLog('success', `✅ ${interactions.length} interações enviadas`)
    } else {
      addLog('error', 'Erro ao enviar interações', data)
      // Re-queue failed interactions
      interactionQueue.value.push(...interactions)
    }
  } catch (e) {
    addLog('error', 'Erro ao enviar interações', e.message)
    interactionQueue.value.push(...interactions)
  }
}

// ========== FOR YOU FEED ==========
async function loadForYouFeed() {
  if (!currentUserId.value) {
    addLog('warning', 'Selecione um usuário para ver o feed For You')
    return
  }

  try {
    addLog('info', '🎯 Carregando feed For You...')
    const res = await fetch(`${GATEWAY_URL}/api/feeds/for-you?user_id=${currentUserId.value}&limit=50`)
    const data = await res.json()
    
    if (data.success || Array.isArray(data)) {
      const items = data.data || data
      forYouItems.value = items.map(article => ({
        id: `news_${article.id}`,
        source: 'news',
        type: 'article',
        title: article.title,
        summary: article.summary,
        imageUrl: article.image_url,
        url: article.url,
        siteName: article.site_name,
        category: article.category_name ? {
          id: article.category_id,
          name: article.category_name,
          slug: article.category_slug
        } : null,
        publishedAt: article.published_at,
        score: article.score,
        scores: article.scores
      }))
      addLog('success', `🎯 For You carregado: ${forYouItems.value.length} artigos`)
    }
  } catch (e) {
    addLog('error', 'Erro ao carregar For You', e.message)
  }
}

// ========== WEBSOCKET ==========
function connect() {
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    ws.value.close()
  }
  
  wsStatus.value = 'connecting'
  addLog('info', 'Conectando ao Gateway...')
  
  ws.value = new WebSocket(WS_URL)
  
  ws.value.onopen = () => {
    wsStatus.value = 'connected'
    addLog('success', 'Conectado ao Gateway!')
    
    ws.value.send(JSON.stringify({
      action: 'subscribe',
      filters: filters.value
    }))
    
    ws.value.send(JSON.stringify({
      action: 'get_history',
      limit: 50
    }))
  }
  
  ws.value.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data)
      handleMessage(message)
    } catch (e) {
      addLog('error', 'Erro ao parsear mensagem', e.message)
    }
  }
  
  ws.value.onclose = () => {
    wsStatus.value = 'disconnected'
    addLog('warning', 'Desconectado do Gateway')
  }
  
  ws.value.onerror = (error) => {
    wsStatus.value = 'disconnected'
    addLog('error', 'Erro na conexão WebSocket')
  }
}

function handleMessage(message) {
  switch (message.event) {
    case 'connected':
      backends.value = message.data.backends
      addLog('info', `Cliente ID: ${message.data.clientId}`, message.data)
      break
      
    case 'new_item':
      feedItems.value.unshift(message.data)
      addLog('success', `Novo item: ${message.data.title.slice(0, 40)}...`, message.data)
      break
      
    case 'history':
      feedItems.value = message.data
      addLog('info', `Histórico carregado: ${message.data.length} itens`)
      break
      
    case 'backend_status':
      backends.value[message.data.source] = message.data
      addLog('info', `Backend ${message.data.source}: ${message.data.status}`)
      break
      
    case 'pong':
      break
      
    default:
      addLog('info', `Evento: ${message.event}`, message.data)
  }
}

// ========== DATA FETCHING ==========
async function fetchCategories() {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/categories`)
    const data = await res.json()
    if (data.success) {
      categories.value = data.data
      addLog('info', `${data.data.length} categorias carregadas`)
    }
  } catch (e) {
    addLog('error', 'Erro ao carregar categorias', e.message)
  }
}

async function fetchStatus() {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/status`)
    const data = await res.json()
    backends.value = data.backends
    addLog('info', 'Status atualizado', data)
  } catch (e) {
    addLog('error', 'Erro ao buscar status', e.message)
  }
}

function updateFilters(newFilters) {
  filters.value = newFilters
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({
      action: 'subscribe',
      filters: newFilters
    }))
    addLog('info', 'Filtros atualizados', newFilters)
  }
}

// Watch feed mode changes
watch(feedMode, (newMode) => {
  if (newMode === 'for-you') {
    loadForYouFeed()
  }
})

// ========== LIFECYCLE ==========
onMounted(() => {
  fetchStatus()
  fetchCategories()
  connect()
  
  // Load user data if exists
  if (currentUserId.value) {
    loadUserData()
  }
  
  // Start interaction sending interval
  interactionInterval.value = setInterval(sendInteractions, 10000)
})

onUnmounted(() => {
  if (ws.value) ws.value.close()
  if (interactionInterval.value) clearInterval(interactionInterval.value)
  sendInteractions() // Send remaining interactions
})
</script>

<template>
  <div class="min-h-screen">
    <!-- Background effects -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 right-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
    </div>
    
    <div class="relative z-10">
      <!-- Header -->
      <Header :ws-status="wsStatus" @reconnect="connect" />
      
      <!-- User Bar -->
      <div class="max-w-7xl mx-auto px-4 py-2">
        <div class="glass-card rounded-xl p-3 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span class="text-white/50 text-sm">Usuário:</span>
            <div v-if="currentUserId" class="flex items-center gap-2">
              <span class="px-3 py-1 rounded-lg bg-green-500/20 text-green-300 text-sm font-medium">
                ID: {{ currentUserId }}
              </span>
              <button @click="loadUserData" class="text-xs text-white/50 hover:text-white">🔄</button>
              <button @click="clearUser" class="text-xs text-red-400 hover:text-red-300">✕ Sair</button>
            </div>
            <button 
              v-else
              @click="showUserModal = true"
              class="px-3 py-1 rounded-lg bg-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-500/40"
            >
              + Criar/Selecionar Usuário
            </button>
          </div>
          
          <!-- Feed Mode Toggle -->
          <div class="flex items-center gap-2">
            <button 
              @click="feedMode = 'chronological'"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                feedMode === 'chronological' 
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' 
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
              ]"
            >
              📋 Cronológico
            </button>
            <button 
              @click="feedMode = 'for-you'"
              :disabled="!currentUserId"
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                feedMode === 'for-you' 
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' 
                  : 'bg-white/5 text-white/50 hover:bg-white/10',
                !currentUserId && 'opacity-50 cursor-not-allowed'
              ]"
            >
              🎯 For You
            </button>
            <button 
              v-if="feedMode === 'for-you'"
              @click="loadForYouFeed"
              class="px-2 py-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 text-sm"
            >
              🔄
            </button>
          </div>
        </div>
      </div>
      
      <!-- Status Bar -->
      <StatusBar :backends="backends" :stats="stats" />
      
      <main class="max-w-7xl mx-auto px-4 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Feed Column -->
          <div class="lg:col-span-2 space-y-4">
            <!-- Filters (only for chronological) -->
            <div v-if="feedMode === 'chronological'" class="relative z-50">
              <FilterBar 
                :categories="categories"
                :filters="filters"
                @update="updateFilters"
              />
            </div>
            
            <!-- User Preferences (only for for-you) -->
            <div v-if="feedMode === 'for-you' && userPreferences.length > 0" class="glass-card rounded-xl p-4">
              <h3 class="text-sm font-medium text-white/70 mb-2">🎯 Suas Preferências</h3>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="pref in userPreferences.slice(0, 8)" 
                  :key="pref.category_id"
                  class="px-2 py-1 rounded-lg text-xs"
                  :style="{ backgroundColor: `rgba(147, 51, 234, ${pref.preference_score * 0.5})` }"
                >
                  {{ pref.category_name }}: {{ (pref.preference_score * 100).toFixed(0) }}%
                </span>
              </div>
            </div>
            
            <!-- Feed Items -->
            <div class="space-y-4 relative z-10">
              <TransitionGroup name="feed">
                <div 
                  v-for="item in displayItems" 
                  :key="item.id"
                  @click="handleItemClick(item)"
                  class="cursor-pointer"
                >
                  <FeedCard :item="item" />
                  <!-- Score indicator for For You -->
                  <div v-if="feedMode === 'for-you' && item.score" class="mt-1 px-4 text-xs text-white/30">
                    Score: {{ (item.score * 100).toFixed(1) }}% 
                    <span v-if="item.scores">(cat: {{ (item.scores.category * 100).toFixed(0) }}%, fresh: {{ (item.scores.freshness * 100).toFixed(0) }}%)</span>
                  </div>
                </div>
              </TransitionGroup>
              
              <div v-if="displayItems.length === 0" class="glass-card rounded-2xl p-12 text-center">
                <div class="text-6xl mb-4">📭</div>
                <h3 class="text-xl font-semibold text-white/80 mb-2">Nenhum item no feed</h3>
                <p class="text-white/50">
                  {{ feedMode === 'for-you' ? 'Interaja com artigos para personalizar!' : 'Aguardando novos artigos...' }}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Sidebar -->
          <div class="lg:col-span-1 space-y-4">
            <!-- User Stats -->
            <div v-if="currentUserId && userStats" class="glass-card rounded-xl p-4">
              <h3 class="text-sm font-medium text-white/70 mb-3">📊 Suas Estatísticas</h3>
              
              <div class="space-y-3">
                <div>
                  <p class="text-xs text-white/50 mb-1">Interações por tipo:</p>
                  <div class="flex flex-wrap gap-2">
                    <span v-for="(count, type) in userStats.byType" :key="type" class="px-2 py-1 rounded bg-white/5 text-xs text-white/70">
                      {{ type }}: {{ count }}
                    </span>
                  </div>
                </div>
                
                <div v-if="userStats.topCategories?.length">
                  <p class="text-xs text-white/50 mb-1">Top Categorias:</p>
                  <div class="space-y-1">
                    <div v-for="cat in userStats.topCategories.slice(0, 5)" :key="cat.category_id" class="flex justify-between text-xs">
                      <span class="text-white/70">{{ cat.category_name }}</span>
                      <span class="text-white/50">{{ cat.interaction_count }} interações</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pending Interactions -->
            <div v-if="interactionQueue.length > 0" class="glass-card rounded-xl p-4">
              <h3 class="text-sm font-medium text-amber-400 mb-2">⏳ Interações Pendentes</h3>
              <p class="text-xs text-white/50">{{ interactionQueue.length }} aguardando envio...</p>
            </div>
            
            <!-- Logs -->
            <ConnectionLog :logs="logs" />
          </div>
        </div>
      </main>
    </div>
    
    <!-- User Modal -->
    <Teleport to="body">
      <div v-if="showUserModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="showUserModal = false"></div>
        <div class="relative glass-card rounded-2xl p-6 w-full max-w-md">
          <h2 class="text-xl font-bold text-white mb-4">👤 Criar/Selecionar Usuário</h2>
          
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-white/70 mb-1">Nome</label>
              <input 
                v-model="userName"
                type="text"
                class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                placeholder="Seu nome"
              />
            </div>
            
            <div>
              <label class="block text-sm text-white/70 mb-1">Email</label>
              <input 
                v-model="userEmail"
                type="email"
                class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                placeholder="seu@email.com"
              />
            </div>
            
            <div class="flex gap-3">
              <button 
                @click="showUserModal = false"
                class="flex-1 px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20"
              >
                Cancelar
              </button>
              <button 
                @click="createUser"
                class="flex-1 px-4 py-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600"
              >
                Criar/Entrar
              </button>
            </div>
            
            <div class="text-xs text-white/40 text-center">
              Se o email já existir, o usuário será selecionado
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style>
.feed-enter-active {
  animation: slideUp 0.4s ease-out;
}
.feed-leave-active {
  animation: fadeIn 0.3s ease-out reverse;
}
</style>
