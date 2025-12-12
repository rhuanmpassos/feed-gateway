<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import Header from './components/Header.vue'
import StatusBar from './components/StatusBar.vue'
import FilterBar from './components/FilterBar.vue'
import FeedCard from './components/FeedCard.vue'
import ConnectionLog from './components/ConnectionLog.vue'
import AuthScreen from './components/AuthScreen.vue'

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

// Auth state (JWT)
const authToken = ref(localStorage.getItem('auth_token') || null)
const currentUserId = ref(localStorage.getItem('test_user_id') || null)
const currentUserName = ref(localStorage.getItem('user_name') || '')
const currentUserEmail = ref(localStorage.getItem('user_email') || '')
const showOnboardingModal = ref(false)
const authError = ref('')
const selectedOnboardingCategories = ref([])
const pendingUserId = ref(null)
const onboardingLoading = ref(false)
const onboardingError = ref('')
const userPreferences = ref([])
const userStats = ref(null)

// Feed mode: 'chronological' | 'for-you'
const feedMode = ref('chronological')

// Interaction tracking
const interactionQueue = ref([])
const interactionInterval = ref(null)
const statsRefreshInterval = ref(null)
const viewStartTimes = ref(new Map()) // track view duration

// Helper para headers de autenticação
function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  if (authToken.value) {
    headers['Authorization'] = `Bearer ${authToken.value}`
  }
  return headers
}

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

const isLoggedIn = computed(() => !!authToken.value && !!currentUserId.value)

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

// ========== JWT AUTH ==========
async function handleLogin({ email, password }) {
  authError.value = ''
  try {
    addLog('info', 'Fazendo login...')
    const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    
    if (data.success && data.data?.token) {
      const { token, user } = data.data
      
      // Salva token e dados do usuário
      authToken.value = token
      currentUserId.value = user.id
      currentUserName.value = user.name
      currentUserEmail.value = user.email
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('test_user_id', user.id)
      localStorage.setItem('user_name', user.name)
      localStorage.setItem('user_email', user.email)
      
      addLog('success', `🔐 Login com sucesso! Bem-vindo, ${user.name}`)
      
      // Verifica preferências para onboarding
      const prefs = user.preferences || []
      if (prefs.length === 0) {
        pendingUserId.value = user.id
        selectedOnboardingCategories.value = []
        showOnboardingModal.value = true
        addLog('info', 'Configure suas preferências para personalizar o feed')
      } else {
        await loadUserData()
      }
    } else {
      authError.value = data.error || 'Email ou senha incorretos'
      addLog('error', 'Falha no login', data.error)
    }
  } catch (e) {
    authError.value = 'Erro de conexão. Tente novamente.'
    addLog('error', 'Erro ao fazer login', e.message)
  }
}

async function handleRegister({ name, email, password }) {
  authError.value = ''
  try {
    addLog('info', 'Criando conta...')
    const res = await fetch(`${GATEWAY_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })
    const data = await res.json()
    
    if (data.success && data.data?.token) {
      const { token, user } = data.data
      
      // Salva token e dados do usuário
      authToken.value = token
      currentUserId.value = user.id
      currentUserName.value = user.name
      currentUserEmail.value = user.email
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('test_user_id', user.id)
      localStorage.setItem('user_name', user.name)
      localStorage.setItem('user_email', user.email)
      
      addLog('success', `✨ Conta criada com sucesso! Bem-vindo, ${user.name}`)
      
      // Novo usuário - mostra onboarding
      pendingUserId.value = user.id
      selectedOnboardingCategories.value = []
      showOnboardingModal.value = true
    } else {
      authError.value = data.error || 'Erro ao criar conta. Tente novamente.'
      addLog('error', 'Falha no registro', data.error)
    }
  } catch (e) {
    authError.value = 'Erro de conexão. Tente novamente.'
    addLog('error', 'Erro ao criar conta', e.message)
  }
}

// Salva preferências do onboarding
async function saveOnboardingPreferences() {
  if (selectedOnboardingCategories.value.length < 1) {
    onboardingError.value = 'Selecione pelo menos 1 categoria'
    addLog('error', 'Selecione pelo menos 1 categoria')
    return
  }

  if (!pendingUserId.value && !currentUserId.value) {
    onboardingError.value = 'Erro: ID do usuário não encontrado. Tente criar a conta novamente.'
    addLog('error', 'userId é null')
    return
  }

  onboardingLoading.value = true
  onboardingError.value = ''
  
  const categoriesToSave = [...selectedOnboardingCategories.value]
  const userId = pendingUserId.value || currentUserId.value

  try {
    console.log('Salvando preferências para usuário:', userId)
    console.log('Categorias selecionadas:', categoriesToSave)
    
    const res = await fetch(`${GATEWAY_URL}/api/users/${userId}/preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ categories: categoriesToSave })
    })
    
    console.log('Response status:', res.status)
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('Error response:', errorText)
      onboardingError.value = `Erro ${res.status}: ${errorText || 'Falha na requisição'}`
      addLog('error', `Erro ${res.status}`, errorText)
      return
    }
    
    const data = await res.json()
    console.log('Response data:', data)
    
    if (data.success) {
      showOnboardingModal.value = false
      pendingUserId.value = null
      selectedOnboardingCategories.value = []
      addLog('success', `✅ ${categoriesToSave.length} categorias salvas! Feed For You personalizado.`)
      await loadUserData()
      // Muda para For You automaticamente
      feedMode.value = 'for-you'
    } else {
      onboardingError.value = data.error || 'Erro ao salvar preferências'
      addLog('error', 'Erro ao salvar preferências', data)
    }
  } catch (e) {
    console.error('Erro ao salvar preferências:', e)
    onboardingError.value = `Erro de conexão: ${e.message}`
    addLog('error', 'Erro ao salvar preferências', e.message)
  } finally {
    onboardingLoading.value = false
  }
}

// Toggle categoria no onboarding
function toggleOnboardingCategory(categoryId) {
  const idx = selectedOnboardingCategories.value.indexOf(categoryId)
  if (idx > -1) {
    selectedOnboardingCategories.value.splice(idx, 1)
  } else if (selectedOnboardingCategories.value.length < 6) {
    selectedOnboardingCategories.value.push(categoryId)
  }
}

// Pular onboarding (usar feed cronológico)
function skipOnboarding() {
  showOnboardingModal.value = false
  pendingUserId.value = null
  addLog('info', 'Onboarding pulado - usando feed cronológico')
  loadUserData()
}

async function loadUserData() {
  if (!currentUserId.value) return

  try {
    // Carrega preferências
    const prefsRes = await fetch(`${GATEWAY_URL}/api/users/${currentUserId.value}/preferences`, {
      headers: getAuthHeaders()
    })
    const prefsData = await prefsRes.json()
    if (prefsData.success) {
      userPreferences.value = prefsData.data || []
      addLog('info', `${userPreferences.value.length} preferências carregadas`)
    }

    // Carrega stats
    const statsRes = await fetch(`${GATEWAY_URL}/api/interactions/user/${currentUserId.value}/stats`, {
      headers: getAuthHeaders()
    })
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
  // Limpa todo o estado de autenticação
  authToken.value = null
  currentUserId.value = null
  currentUserName.value = ''
  currentUserEmail.value = ''
  
  localStorage.removeItem('auth_token')
  localStorage.removeItem('test_user_id')
  localStorage.removeItem('user_name')
  localStorage.removeItem('user_email')
  
  userPreferences.value = []
  userStats.value = null
  forYouItems.value = []
  feedMode.value = 'chronological'
  
  addLog('info', '👋 Logout realizado com sucesso')
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
  // Mantém formato "news_123" para o gateway
  trackInteraction(item.id, 'impression', { position: displayItems.value.indexOf(item) })
}

// Track click
function handleItemClick(item) {
  if (!currentUserId.value) {
    window.open(item.url, '_blank')
    return
  }

  // Mantém formato "news_123" para o gateway
  trackInteraction(item.id, 'click', { position: displayItems.value.indexOf(item) })
  
  // Track view start
  viewStartTimes.value.set(item.id, Date.now())
  
  window.open(item.url, '_blank')
  
  // Envia interação imediatamente para feedback em tempo real
  sendInteractions()
  
  // Simulate view end after 5 seconds
  setTimeout(() => {
    const startTime = viewStartTimes.value.get(item.id)
    if (startTime) {
      const duration = Date.now() - startTime
      trackInteraction(item.id, 'view', { duration })
      viewStartTimes.value.delete(item.id)
      // Envia view e atualiza stats
      sendInteractions()
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
      headers: getAuthHeaders(),
      body: JSON.stringify({
        user_id: parseInt(currentUserId.value),
        interactions
      })
    })
    const data = await res.json()
    
    if (data.success) {
      addLog('success', `✅ ${interactions.length} interações enviadas`)
      // Atualiza stats e preferências em tempo real após enviar interações
      await refreshUserStats()
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

// Atualiza estatísticas e preferências em tempo real (sem log)
async function refreshUserStats() {
  if (!currentUserId.value) return

  try {
    // Atualiza preferências
    const prefsRes = await fetch(`${GATEWAY_URL}/api/users/${currentUserId.value}/preferences`, {
      headers: getAuthHeaders()
    })
    const prefsData = await prefsRes.json()
    if (prefsData.success) {
      userPreferences.value = prefsData.data || []
    }

    // Atualiza stats
    const statsRes = await fetch(`${GATEWAY_URL}/api/interactions/user/${currentUserId.value}/stats`, {
      headers: getAuthHeaders()
    })
    const statsData = await statsRes.json()
    if (statsData.success) {
      userStats.value = statsData.data
    }
  } catch (e) {
    // Silencioso - não mostra erro para não poluir logs
  }
}

// ========== FOR YOU FEED ==========
async function loadForYouFeed() {
  if (!currentUserId.value) {
    addLog('warning', 'Faça login para ver o feed For You')
    return
  }

  try {
    addLog('info', '🎯 Carregando feed For You...')
    const res = await fetch(`${GATEWAY_URL}/api/feeds/for-you?user_id=${currentUserId.value}&limit=50`, {
      headers: getAuthHeaders()
    })
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
      // Verifica se item já existe para evitar duplicação
      const newItem = message.data
      const exists = feedItems.value.some(item => item.id === newItem.id)
      if (!exists) {
        feedItems.value.unshift(newItem)
        addLog('success', `Novo item: ${newItem.title.slice(0, 40)}...`, newItem)
      }
      break
      
    case 'history':
      // Remove duplicatas do histórico usando Map para manter ordem
      const uniqueItems = [...new Map(message.data.map(item => [item.id, item])).values()]
      feedItems.value = uniqueItems
      addLog('info', `Histórico carregado: ${uniqueItems.length} itens`)
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
  if (isLoggedIn.value) {
    loadUserData()
  }
  
  // Start interaction sending interval (backup - a cada 10s)
  interactionInterval.value = setInterval(sendInteractions, 10000)
  
  // Start stats refresh interval (a cada 30s para manter sincronizado)
  statsRefreshInterval.value = setInterval(() => {
    if (currentUserId.value) {
      refreshUserStats()
    }
  }, 30000)
})

onUnmounted(() => {
  if (ws.value) ws.value.close()
  if (interactionInterval.value) clearInterval(interactionInterval.value)
  if (statsRefreshInterval.value) clearInterval(statsRefreshInterval.value)
  sendInteractions() // Send remaining interactions
})
</script>

<template>
  <!-- Auth Screen - shown when not logged in -->
  <AuthScreen 
    v-if="!isLoggedIn" 
    :error="authError"
    @login="handleLogin" 
    @register="handleRegister" 
  />
  
  <!-- Main App - shown when logged in -->
  <div v-else class="min-h-screen">
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
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-medium">
                {{ currentUserName.charAt(0).toUpperCase() }}
              </div>
              <div>
                <p class="text-white text-sm font-medium">{{ currentUserName }}</p>
                <p class="text-white/40 text-xs">{{ currentUserEmail }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-2 py-1 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium flex items-center gap-1">
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Autenticado
              </span>
              <button @click="loadUserData" class="text-xs text-white/50 hover:text-white p-1" title="Atualizar dados">🔄</button>
              <button @click="clearUser" class="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs flex items-center gap-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
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
              :class="[
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                feedMode === 'for-you' 
                  ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' 
                  : 'bg-white/5 text-white/50 hover:bg-white/10'
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
            <div v-if="userStats" class="glass-card rounded-xl p-4">
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
    
  </div>
  
  <!-- Onboarding Modal - Seleção de Categorias (FORA do v-if/v-else para sempre estar disponível) -->
  <Teleport to="body">
    <div v-if="showOnboardingModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div class="relative glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🎯</div>
          <h2 class="text-2xl font-bold text-white mb-2">Personalize seu Feed</h2>
          <p class="text-white/60">Selecione até 6 categorias que mais te interessam</p>
          <p class="text-white/40 text-sm mt-1">Isso ajuda a criar seu feed "For You" personalizado</p>
        </div>
        
        <!-- Categorias Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <button
            v-for="cat in categories.filter(c => c.name && c.name !== 'null')"
            :key="cat.id"
            @click="toggleOnboardingCategory(cat.id)"
            :class="[
              'p-4 rounded-xl border-2 transition-all text-left',
              selectedOnboardingCategories.includes(cat.id)
                ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30 hover:bg-white/10'
            ]"
          >
            <div class="font-medium">{{ cat.name }}</div>
            <div class="text-xs opacity-60 mt-1">{{ cat.description || 'Notícias sobre ' + cat.name }}</div>
          </button>
        </div>
        
        <!-- Selecionadas -->
        <div class="mb-6 p-3 rounded-lg bg-white/5">
          <div class="text-sm text-white/50 mb-2">
            Selecionadas: {{ selectedOnboardingCategories.length }}/6
          </div>
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="catId in selectedOnboardingCategories" 
              :key="catId"
              class="px-3 py-1 rounded-full bg-purple-500/30 text-purple-300 text-sm"
            >
              {{ categories.find(c => c.id === catId)?.name }}
              <button @click="toggleOnboardingCategory(catId)" class="ml-1 hover:text-white">×</button>
            </span>
            <span v-if="selectedOnboardingCategories.length === 0" class="text-white/30 text-sm">
              Nenhuma categoria selecionada
            </span>
          </div>
        </div>
        
        <!-- Erro -->
        <div v-if="onboardingError" class="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
          {{ onboardingError }}
        </div>
        
        <!-- Botões -->
        <div class="flex gap-3">
          <button 
            @click="skipOnboarding"
            :disabled="onboardingLoading"
            class="flex-1 px-4 py-3 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-50"
          >
            Pular
          </button>
          <button 
            @click="saveOnboardingPreferences"
            :disabled="selectedOnboardingCategories.length === 0 || onboardingLoading"
            :class="[
              'flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
              selectedOnboardingCategories.length > 0 && !onboardingLoading
                ? 'bg-purple-500 text-white hover:bg-purple-600'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
            ]"
          >
            <span v-if="onboardingLoading" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else>
              Começar com {{ selectedOnboardingCategories.length }} categoria{{ selectedOnboardingCategories.length !== 1 ? 's' : '' }}
            </span>
          </button>
        </div>
        
        <p class="text-xs text-white/40 text-center mt-4">
          Você pode mudar suas preferências a qualquer momento
        </p>
      </div>
    </div>
  </Teleport>
</template>

<style>
.feed-enter-active {
  animation: slideUp 0.4s ease-out;
}
.feed-leave-active {
  animation: fadeIn 0.3s ease-out reverse;
}
</style>
