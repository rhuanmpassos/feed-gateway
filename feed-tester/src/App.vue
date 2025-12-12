<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
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
const breakingNews = ref([])
const logs = ref([])
const filters = ref({ categories: [] })
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
const userPatterns = ref(null)
const userProfile = ref(null)

// Session
const currentSessionId = ref(null)
const sessionStartTime = ref(null)

// User actions (likes, bookmarks)
const likedItems = ref(new Set())
const bookmarkedItems = ref(new Set())

// Feed mode: 'chronological' | 'for-you' | 'addictive'
const feedMode = ref('chronological')

// Interaction tracking
const interactionQueue = ref([])
const interactionInterval = ref(null)
const statsRefreshInterval = ref(null)
const viewStartTimes = ref(new Map())
const impressionsSent = ref(new Set())
const scrollStopTimers = ref(new Map())

// Observers
let intersectionObserver = null

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
  if (feedMode.value === 'for-you' || feedMode.value === 'addictive') {
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
  breaking: breakingNews.value.length,
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

// ========== SESSION MANAGEMENT ==========
async function startSession() {
  if (!currentUserId.value) return
  
  try {
    currentSessionId.value = crypto.randomUUID()
    sessionStartTime.value = Date.now()
    
    const res = await fetch(`${GATEWAY_URL}/api/sessions`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        id: currentSessionId.value,
        user_id: parseInt(currentUserId.value),
        device_type: 'web',
        is_first_session: !localStorage.getItem('has_session')
      })
    })
    
    const data = await res.json()
    if (data.success) {
      localStorage.setItem('has_session', 'true')
      addLog('success', `🎬 Sessão iniciada: ${currentSessionId.value.slice(0, 8)}...`)
    }
  } catch (e) {
    addLog('error', 'Erro ao iniciar sessão', e.message)
  }
}

async function endSession() {
  if (!currentSessionId.value) return
  
  try {
    const duration = Math.floor((Date.now() - sessionStartTime.value) / 1000)
    
    await fetch(`${GATEWAY_URL}/api/sessions/${currentSessionId.value}/end`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ duration_seconds: duration })
    })
    
    addLog('info', `🏁 Sessão finalizada: ${duration}s`)
  } catch (e) {
    // Silencioso
  }
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
      
      authToken.value = token
      currentUserId.value = user.id
      currentUserName.value = user.name
      currentUserEmail.value = user.email
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('test_user_id', user.id)
      localStorage.setItem('user_name', user.name)
      localStorage.setItem('user_email', user.email)
      
      addLog('success', `🔐 Login com sucesso! Bem-vindo, ${user.name}`)
      
      // Inicia sessão
      await startSession()
      
      const prefs = user.preferences || []
      if (prefs.length === 0) {
        pendingUserId.value = user.id
        showOnboardingModal.value = true
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
      
      authToken.value = token
      currentUserId.value = user.id
      currentUserName.value = user.name
      currentUserEmail.value = user.email
      
      localStorage.setItem('auth_token', token)
      localStorage.setItem('test_user_id', user.id)
      localStorage.setItem('user_name', user.name)
      localStorage.setItem('user_email', user.email)
      
      addLog('success', `✨ Conta criada! Bem-vindo, ${user.name}`)
      
      await startSession()
      
      pendingUserId.value = user.id
      showOnboardingModal.value = true
    } else {
      authError.value = data.error || 'Erro ao criar conta.'
      addLog('error', 'Falha no registro', data.error)
    }
  } catch (e) {
    authError.value = 'Erro de conexão. Tente novamente.'
    addLog('error', 'Erro ao criar conta', e.message)
  }
}

async function saveOnboardingPreferences() {
  if (selectedOnboardingCategories.value.length < 1) {
    onboardingError.value = 'Selecione pelo menos 1 categoria'
    return
  }

  const userId = pendingUserId.value || currentUserId.value
  if (!userId) {
    onboardingError.value = 'Erro: ID do usuário não encontrado.'
    return
  }

  onboardingLoading.value = true
  onboardingError.value = ''

  try {
    const res = await fetch(`${GATEWAY_URL}/api/users/${userId}/preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ categories: [...selectedOnboardingCategories.value] })
    })
    
    const data = await res.json()
    
    if (data.success) {
      showOnboardingModal.value = false
      pendingUserId.value = null
      selectedOnboardingCategories.value = []
      addLog('success', `✅ Preferências salvas!`)
      await loadUserData()
      feedMode.value = 'for-you'
    } else {
      onboardingError.value = data.error || 'Erro ao salvar'
    }
  } catch (e) {
    onboardingError.value = `Erro: ${e.message}`
  } finally {
    onboardingLoading.value = false
  }
}

function toggleOnboardingCategory(categoryId) {
  const idx = selectedOnboardingCategories.value.indexOf(categoryId)
  if (idx > -1) {
    selectedOnboardingCategories.value.splice(idx, 1)
  } else if (selectedOnboardingCategories.value.length < 6) {
    selectedOnboardingCategories.value.push(categoryId)
  }
}

function skipOnboarding() {
  showOnboardingModal.value = false
  pendingUserId.value = null
  loadUserData()
}

async function loadUserData() {
  if (!currentUserId.value) return

  try {
    // Preferências
    const prefsRes = await fetch(`${GATEWAY_URL}/api/users/${currentUserId.value}/preferences`, { headers: getAuthHeaders() })
    const prefsData = await prefsRes.json()
    if (prefsData.success) {
      userPreferences.value = prefsData.data || []
    }

    // Stats
    const statsRes = await fetch(`${GATEWAY_URL}/api/interactions/user/${currentUserId.value}/stats`, { headers: getAuthHeaders() })
    const statsData = await statsRes.json()
    if (statsData.success) {
      userStats.value = statsData.data
    }

    // Perfil
    const profileRes = await fetch(`${GATEWAY_URL}/api/users/${currentUserId.value}/profile`, { headers: getAuthHeaders() })
    const profileData = await profileRes.json()
    if (profileData.success) {
      userProfile.value = profileData.data
    }

    // Padrões
    const patternsRes = await fetch(`${GATEWAY_URL}/api/users/${currentUserId.value}/patterns`, { headers: getAuthHeaders() })
    const patternsData = await patternsRes.json()
    if (patternsData.success) {
      userPatterns.value = patternsData.data
    }

    // Likes
    const likesRes = await fetch(`${GATEWAY_URL}/api/articles/liked?user_id=${currentUserId.value}`, { headers: getAuthHeaders() })
    const likesData = await likesRes.json()
    if (likesData.success && likesData.data) {
      likedItems.value = new Set(likesData.data.map(a => `news_${a.id}`))
    }

    // Bookmarks
    const bookmarksRes = await fetch(`${GATEWAY_URL}/api/bookmarks?user_id=${currentUserId.value}`, { headers: getAuthHeaders() })
    const bookmarksData = await bookmarksRes.json()
    if (Array.isArray(bookmarksData)) {
      bookmarkedItems.value = new Set(bookmarksData.map(b => b.id))
    }

    addLog('info', '📊 Dados do usuário carregados')
  } catch (e) {
    addLog('error', 'Erro ao carregar dados', e.message)
  }
}

function clearUser() {
  endSession()
  
  authToken.value = null
  currentUserId.value = null
  currentUserName.value = ''
  currentUserEmail.value = ''
  currentSessionId.value = null
  
  localStorage.removeItem('auth_token')
  localStorage.removeItem('test_user_id')
  localStorage.removeItem('user_name')
  localStorage.removeItem('user_email')
  
  userPreferences.value = []
  userStats.value = null
  userProfile.value = null
  userPatterns.value = null
  forYouItems.value = []
  likedItems.value = new Set()
  bookmarkedItems.value = new Set()
  feedMode.value = 'chronological'
  
  addLog('info', '👋 Logout realizado')
}

// ========== INTERACTION TRACKING ==========
function trackInteraction(articleId, type, extra = {}) {
  if (!currentUserId.value) return

  const interaction = {
    article_id: articleId,
    interaction_type: type,
    timestamp: Date.now(),
    session_id: currentSessionId.value,
    ...extra
  }

  interactionQueue.value.push(interaction)
  addLog('info', `📊 ${type}: ${articleId}`, interaction)
}

// Intersection Observer para impressões
function setupIntersectionObserver() {
  if (intersectionObserver) {
    intersectionObserver.disconnect()
  }

  intersectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const articleId = entry.target.dataset.articleId
      if (!articleId || !currentUserId.value) return

      if (entry.isIntersecting) {
        // Entrou na viewport - track impression
        if (!impressionsSent.value.has(articleId)) {
          impressionsSent.value.add(articleId)
          const position = displayItems.value.findIndex(item => item.id === articleId)
          trackInteraction(articleId, 'impression', { 
            position,
            screen_position: entry.intersectionRatio > 0.5 ? 'center' : 'edge'
          })
        }

        // Inicia timer para scroll_stop (2s parado = interesse)
        scrollStopTimers.value.set(articleId, setTimeout(() => {
          trackInteraction(articleId, 'scroll_stop', {
            viewport_time: 2000,
            scroll_velocity: 0
          })
        }, 2000))
      } else {
        // Saiu da viewport - cancela timer
        const timer = scrollStopTimers.value.get(articleId)
        if (timer) {
          clearTimeout(timer)
          scrollStopTimers.value.delete(articleId)
        }
      }
    })
  }, { threshold: [0.3, 0.7] })
}

function observeFeedCards() {
  nextTick(() => {
    document.querySelectorAll('[data-article-id]').forEach(el => {
      intersectionObserver?.observe(el)
    })
  })
}

// Track click
function handleItemClick(item) {
  if (!currentUserId.value) {
    window.open(item.url, '_blank')
    return
  }

  const position = displayItems.value.indexOf(item)
  trackInteraction(item.id, 'click', { position })
  viewStartTimes.value.set(item.id, Date.now())
  
  window.open(item.url, '_blank')
  sendInteractions()

  setTimeout(() => {
    const startTime = viewStartTimes.value.get(item.id)
    if (startTime) {
      trackInteraction(item.id, 'view', { duration: Date.now() - startTime })
      viewStartTimes.value.delete(item.id)
      sendInteractions()
    }
  }, 5000)
}

// Like
async function handleLike(item) {
  if (!currentUserId.value) return
  
  const articleId = item.id.replace('news_', '')
  const isLiked = likedItems.value.has(item.id)
  
  try {
    if (isLiked) {
      await fetch(`${GATEWAY_URL}/api/articles/${articleId}/like?user_id=${currentUserId.value}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      likedItems.value.delete(item.id)
      addLog('info', '💔 Like removido')
    } else {
      await fetch(`${GATEWAY_URL}/api/articles/${articleId}/like`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ user_id: parseInt(currentUserId.value) })
      })
      likedItems.value.add(item.id)
      trackInteraction(item.id, 'like')
      addLog('success', '⭐ Artigo curtido!')
    }
    sendInteractions()
  } catch (e) {
    addLog('error', 'Erro ao curtir', e.message)
  }
}

// Bookmark
async function handleBookmark(item) {
  if (!currentUserId.value) return
  
  const isBookmarked = bookmarkedItems.value.has(item.id)
  
  try {
    if (isBookmarked) {
      await fetch(`${GATEWAY_URL}/api/bookmark/${item.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })
      bookmarkedItems.value.delete(item.id)
      addLog('info', '🗑️ Bookmark removido')
    } else {
      await fetch(`${GATEWAY_URL}/api/bookmark`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: item.id, user_id: parseInt(currentUserId.value) })
      })
      bookmarkedItems.value.add(item.id)
      trackInteraction(item.id, 'bookmark')
      addLog('success', '🔖 Artigo salvo!')
    }
    sendInteractions()
  } catch (e) {
    addLog('error', 'Erro ao salvar', e.message)
  }
}

// Share
async function handleShare(item) {
  if (!currentUserId.value) return
  
  try {
    if (navigator.share) {
      await navigator.share({
        title: item.title,
        url: item.url
      })
      trackInteraction(item.id, 'share')
      addLog('success', '📤 Artigo compartilhado!')
      sendInteractions()
    } else {
      await navigator.clipboard.writeText(item.url)
      trackInteraction(item.id, 'share')
      addLog('success', '📋 Link copiado!')
      sendInteractions()
    }
  } catch (e) {
    // Usuário cancelou
  }
}

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
        session_id: currentSessionId.value,
        device_type: 'web',
        interactions
      })
    })
    const data = await res.json()
    
    if (data.success) {
      addLog('success', `✅ ${interactions.length} interações enviadas`)
      refreshUserStats()
    } else {
      interactionQueue.value.push(...interactions)
    }
  } catch (e) {
    interactionQueue.value.push(...interactions)
  }
}

async function refreshUserStats() {
  if (!currentUserId.value) return

  try {
    const [prefsRes, statsRes] = await Promise.all([
      fetch(`${GATEWAY_URL}/api/users/${currentUserId.value}/preferences`, { headers: getAuthHeaders() }),
      fetch(`${GATEWAY_URL}/api/interactions/user/${currentUserId.value}/stats`, { headers: getAuthHeaders() })
    ])
    
    const prefsData = await prefsRes.json()
    const statsData = await statsRes.json()
    
    if (prefsData.success) userPreferences.value = prefsData.data || []
    if (statsData.success) userStats.value = statsData.data
  } catch (e) {
    // Silencioso
  }
}

// ========== FEEDS ==========
async function loadForYouFeed() {
  if (!currentUserId.value) return

  try {
    addLog('info', '🎯 Carregando feed For You...')
    const res = await fetch(`${GATEWAY_URL}/api/feeds/for-you?user_id=${currentUserId.value}&limit=50`, { headers: getAuthHeaders() })
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
        category: article.category_name ? { id: article.category_id, name: article.category_name, slug: article.category_slug } : null,
        publishedAt: article.published_at,
        score: article.score,
        scores: article.scores
      }))
      addLog('success', `🎯 For You: ${forYouItems.value.length} artigos`)
      impressionsSent.value.clear()
      observeFeedCards()
    }
  } catch (e) {
    addLog('error', 'Erro ao carregar For You', e.message)
  }
}

async function loadAddictiveFeed() {
  if (!currentUserId.value) return

  try {
    addLog('info', '🔥 Carregando feed Addictive...')
    const res = await fetch(`${GATEWAY_URL}/api/feeds/addictive?user_id=${currentUserId.value}&limit=50`, { headers: getAuthHeaders() })
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
        category: article.category_name ? { id: article.category_id, name: article.category_name } : null,
        publishedAt: article.published_at,
        score: article.score,
        displayMetadata: article.display_metadata
      }))
      addLog('success', `🔥 Addictive: ${forYouItems.value.length} artigos`)
      impressionsSent.value.clear()
      observeFeedCards()
    }
  } catch (e) {
    addLog('error', 'Erro ao carregar Addictive', e.message)
  }
}

async function loadBreakingNews() {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/feeds/breaking?limit=5`, { headers: getAuthHeaders() })
    const data = await res.json()
    
    if (data.success && data.data) {
      breakingNews.value = data.data
      if (data.data.length > 0) {
        addLog('info', `🚨 ${data.data.length} breaking news`)
      }
    }
  } catch (e) {
    // Silencioso
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
    
    ws.value.send(JSON.stringify({ action: 'subscribe', filters: filters.value }))
    ws.value.send(JSON.stringify({ action: 'get_history', limit: 50 }))
  }
  
  ws.value.onmessage = (event) => {
    try {
      handleMessage(JSON.parse(event.data))
    } catch (e) {
      addLog('error', 'Erro ao parsear mensagem', e.message)
    }
  }
  
  ws.value.onclose = () => {
    wsStatus.value = 'disconnected'
    addLog('warning', 'Desconectado do Gateway')
  }
  
  ws.value.onerror = () => {
    wsStatus.value = 'disconnected'
    addLog('error', 'Erro na conexão WebSocket')
  }
}

function handleMessage(message) {
  switch (message.event) {
    case 'connected':
      backends.value = message.data.backends
      addLog('info', `Cliente ID: ${message.data.clientId}`)
      break
      
    case 'new_item':
      const newItem = message.data
      if (!feedItems.value.some(item => item.id === newItem.id)) {
        feedItems.value.unshift(newItem)
        addLog('success', `Novo: ${newItem.title.slice(0, 40)}...`)
        observeFeedCards()
      }
      break
      
    case 'history':
      const uniqueItems = [...new Map(message.data.map(item => [item.id, item])).values()]
      feedItems.value = uniqueItems
      addLog('info', `Histórico: ${uniqueItems.length} itens`)
      observeFeedCards()
      break
      
    case 'backend_status':
      backends.value[message.data.source] = message.data
      break
      
    case 'pong':
      break
      
    default:
      addLog('info', `Evento: ${message.event}`)
  }
}

async function fetchCategories() {
  try {
    const res = await fetch(`${GATEWAY_URL}/api/categories`)
    const data = await res.json()
    if (data.success) {
      categories.value = data.data
      addLog('info', `${data.data.length} categorias`)
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
    addLog('info', 'Status atualizado')
  } catch (e) {
    addLog('error', 'Erro ao buscar status', e.message)
  }
}

function updateFilters(newFilters) {
  filters.value = newFilters
  if (ws.value && ws.value.readyState === WebSocket.OPEN) {
    ws.value.send(JSON.stringify({ action: 'subscribe', filters: newFilters }))
    addLog('info', 'Filtros atualizados')
  }
}

// Watch feed mode
watch(feedMode, (newMode) => {
  impressionsSent.value.clear()
  if (newMode === 'for-you') loadForYouFeed()
  else if (newMode === 'addictive') loadAddictiveFeed()
  else observeFeedCards()
})

// ========== LIFECYCLE ==========
onMounted(() => {
  fetchStatus()
  fetchCategories()
  connect()
  setupIntersectionObserver()
  
  if (isLoggedIn.value) {
    startSession()
    loadUserData()
    loadBreakingNews()
  }
  
  interactionInterval.value = setInterval(sendInteractions, 10000)
  statsRefreshInterval.value = setInterval(() => {
    if (currentUserId.value) {
      refreshUserStats()
      loadBreakingNews()
    }
  }, 30000)
})

onUnmounted(() => {
  endSession()
  if (ws.value) ws.value.close()
  if (interactionInterval.value) clearInterval(interactionInterval.value)
  if (statsRefreshInterval.value) clearInterval(statsRefreshInterval.value)
  if (intersectionObserver) intersectionObserver.disconnect()
  sendInteractions()
})
</script>

<template>
  <!-- Auth Screen -->
  <AuthScreen 
    v-if="!isLoggedIn" 
    :error="authError"
    @login="handleLogin" 
    @register="handleRegister" 
  />
  
  <!-- Main App -->
  <div v-else class="min-h-screen">
    <!-- Background -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 right-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></div>
    </div>
    
    <div class="relative z-10">
      <Header :ws-status="wsStatus" @reconnect="connect" />
      
      <!-- User Bar -->
      <div class="max-w-7xl mx-auto px-4 py-2">
        <div class="glass-card rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
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
              <span class="px-2 py-1 rounded-lg bg-green-500/20 text-green-300 text-xs font-medium">✓ JWT</span>
              <span v-if="currentSessionId" class="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-medium">🎬 Sessão</span>
              <button @click="loadUserData" class="text-xs text-white/50 hover:text-white p-1">🔄</button>
              <button @click="clearUser" class="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs">Sair</button>
            </div>
          </div>
          
          <!-- Feed Mode Toggle -->
          <div class="flex items-center gap-2">
            <button 
              @click="feedMode = 'chronological'"
              :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-all', feedMode === 'chronological' ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' : 'bg-white/5 text-white/50 hover:bg-white/10']"
            >📋 Crono</button>
            <button 
              @click="feedMode = 'for-you'"
              :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-all', feedMode === 'for-you' ? 'bg-purple-500/30 text-purple-300 border border-purple-500/50' : 'bg-white/5 text-white/50 hover:bg-white/10']"
            >🎯 For You</button>
            <button 
              @click="feedMode = 'addictive'"
              :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-all', feedMode === 'addictive' ? 'bg-red-500/30 text-red-300 border border-red-500/50' : 'bg-white/5 text-white/50 hover:bg-white/10']"
            >🔥 Addictive</button>
          </div>
        </div>
      </div>
      
      <!-- Breaking News Banner -->
      <div v-if="breakingNews.length > 0" class="max-w-7xl mx-auto px-4 py-2">
        <div class="glass-card rounded-xl p-3 border border-red-500/30 bg-red-500/10">
          <div class="flex items-center gap-3">
            <span class="px-2 py-1 rounded bg-red-500 text-white text-xs font-bold animate-pulse">🚨 URGENTE</span>
            <div class="flex-1 overflow-hidden">
              <p class="text-white text-sm truncate">{{ breakingNews[0].title }}</p>
            </div>
            <span class="text-white/50 text-xs">{{ breakingNews.length }} notícia(s)</span>
          </div>
        </div>
      </div>
      
      <StatusBar :backends="backends" :stats="stats" />
      
      <main class="max-w-7xl mx-auto px-4 py-6">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Feed Column -->
          <div class="lg:col-span-2 space-y-4">
            <div v-if="feedMode === 'chronological'" class="relative z-50">
              <FilterBar :categories="categories" :filters="filters" @update="updateFilters" />
            </div>
            
            <div v-if="(feedMode === 'for-you' || feedMode === 'addictive') && userPreferences.length > 0" class="glass-card rounded-xl p-4">
              <h3 class="text-sm font-medium text-white/70 mb-2">🎯 Preferências</h3>
              <div class="flex flex-wrap gap-2">
                <span v-for="pref in userPreferences.slice(0, 8)" :key="pref.category_id" class="px-2 py-1 rounded-lg text-xs" :style="{ backgroundColor: `rgba(147, 51, 234, ${pref.preference_score * 0.5})` }">
                  {{ pref.category_name }}: {{ (pref.preference_score * 100).toFixed(0) }}%
                </span>
              </div>
            </div>
            
            <div class="space-y-4 relative z-10">
              <TransitionGroup name="feed">
                <div v-for="item in displayItems" :key="item.id" @click="handleItemClick(item)" class="cursor-pointer">
                  <FeedCard 
                    :item="item" 
                    :liked="likedItems.has(item.id)"
                    :bookmarked="bookmarkedItems.has(item.id)"
                    @like="handleLike"
                    @bookmark="handleBookmark"
                    @share="handleShare"
                  />
                  <div v-if="item.score" class="mt-1 px-4 text-xs text-white/30">
                    Score: {{ (item.score * 100).toFixed(1) }}%
                  </div>
                </div>
              </TransitionGroup>
              
              <div v-if="displayItems.length === 0" class="glass-card rounded-2xl p-12 text-center">
                <div class="text-6xl mb-4">📭</div>
                <h3 class="text-xl font-semibold text-white/80 mb-2">Nenhum item no feed</h3>
                <p class="text-white/50">Aguardando artigos...</p>
              </div>
            </div>
          </div>
          
          <!-- Sidebar -->
          <div class="lg:col-span-1 space-y-4">
            <!-- User Profile -->
            <div v-if="userProfile" class="glass-card rounded-xl p-4">
              <h3 class="text-sm font-medium text-white/70 mb-3">👤 Perfil</h3>
              <div class="space-y-2 text-xs">
                <div class="flex justify-between"><span class="text-white/50">Cliques:</span><span class="text-white">{{ userProfile.total_clicks || 0 }}</span></div>
                <div class="flex justify-between"><span class="text-white/50">Sessões:</span><span class="text-white">{{ userProfile.total_sessions || 0 }}</span></div>
                <div class="flex justify-between"><span class="text-white/50">Dias ativos:</span><span class="text-white">{{ userProfile.total_days_active || 0 }}</span></div>
              </div>
            </div>

            <!-- User Stats -->
            <div v-if="userStats" class="glass-card rounded-xl p-4">
              <h3 class="text-sm font-medium text-white/70 mb-3">📊 Estatísticas</h3>
              <div class="space-y-3">
                <div>
                  <p class="text-xs text-white/50 mb-1">Por tipo:</p>
                  <div class="flex flex-wrap gap-2">
                    <span v-for="(count, type) in userStats.byType" :key="type" class="px-2 py-1 rounded bg-white/5 text-xs text-white/70">{{ type }}: {{ count }}</span>
                  </div>
                </div>
                <div v-if="userStats.topCategories?.length">
                  <p class="text-xs text-white/50 mb-1">Top Categorias:</p>
                  <div class="space-y-1">
                    <div v-for="cat in userStats.topCategories.slice(0, 5)" :key="cat.category_id" class="flex justify-between text-xs">
                      <span class="text-white/70">{{ cat.category_name }}</span>
                      <span class="text-white/50">{{ cat.interaction_count }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Patterns -->
            <div v-if="userPatterns" class="glass-card rounded-xl p-4">
              <h3 class="text-sm font-medium text-white/70 mb-3">🧠 Padrões Detectados</h3>
              <div class="space-y-2 text-xs">
                <div v-if="userPatterns.temporal?.most_active_hour !== undefined" class="flex justify-between">
                  <span class="text-white/50">Horário preferido:</span>
                  <span class="text-white">{{ userPatterns.temporal.most_active_hour }}h</span>
                </div>
                <div v-if="userPatterns.content?.preferred_categories?.length" class="flex justify-between">
                  <span class="text-white/50">Categorias:</span>
                  <span class="text-white">{{ userPatterns.content.preferred_categories.slice(0, 3).join(', ') }}</span>
                </div>
                <div v-if="userPatterns.engagement?.click_through_rate !== undefined" class="flex justify-between">
                  <span class="text-white/50">CTR:</span>
                  <span class="text-white">{{ (userPatterns.engagement.click_through_rate * 100).toFixed(1) }}%</span>
                </div>
              </div>
            </div>

            <!-- Pending Interactions -->
            <div v-if="interactionQueue.length > 0" class="glass-card rounded-xl p-4">
              <h3 class="text-sm font-medium text-amber-400 mb-2">⏳ Pendentes</h3>
              <p class="text-xs text-white/50">{{ interactionQueue.length }} interações</p>
            </div>
            
            <ConnectionLog :logs="logs" />
          </div>
        </div>
      </main>
    </div>
  </div>
  
  <!-- Onboarding Modal -->
  <Teleport to="body">
    <div v-if="showOnboardingModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
      <div class="relative glass-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="text-center mb-6">
          <div class="text-5xl mb-3">🎯</div>
          <h2 class="text-2xl font-bold text-white mb-2">Personalize seu Feed</h2>
          <p class="text-white/60">Selecione até 6 categorias</p>
        </div>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <button
            v-for="cat in categories.filter(c => c.name && c.name !== 'null')"
            :key="cat.id"
            @click="toggleOnboardingCategory(cat.id)"
            :class="['p-4 rounded-xl border-2 transition-all text-left', selectedOnboardingCategories.includes(cat.id) ? 'border-purple-500 bg-purple-500/20 text-purple-300' : 'border-white/10 bg-white/5 text-white/70 hover:border-white/30']"
          >
            <div class="font-medium">{{ cat.name }}</div>
          </button>
        </div>
        
        <div class="mb-6 p-3 rounded-lg bg-white/5">
          <div class="text-sm text-white/50">Selecionadas: {{ selectedOnboardingCategories.length }}/6</div>
        </div>
        
        <div v-if="onboardingError" class="mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">{{ onboardingError }}</div>
        
        <div class="flex gap-3">
          <button @click="skipOnboarding" :disabled="onboardingLoading" class="flex-1 px-4 py-3 rounded-lg bg-white/10 text-white/70 hover:bg-white/20">Pular</button>
          <button @click="saveOnboardingPreferences" :disabled="selectedOnboardingCategories.length === 0 || onboardingLoading" :class="['flex-1 px-4 py-3 rounded-lg font-medium transition-all', selectedOnboardingCategories.length > 0 ? 'bg-purple-500 text-white hover:bg-purple-600' : 'bg-white/10 text-white/30']">
            <span v-if="onboardingLoading" class="animate-spin">⏳</span>
            <span v-else>Começar</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style>
.feed-enter-active { animation: slideUp 0.4s ease-out; }
.feed-leave-active { animation: fadeIn 0.3s ease-out reverse; }
</style>
