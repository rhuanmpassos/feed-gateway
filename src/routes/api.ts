import { Router, Request, Response } from 'express';
import { feedStore } from '../services/feed-store';
import { newsClient } from '../clients/news-client';
import { wsBroadcaster } from '../services/ws-broadcaster';
import config from '../config';
import { Interaction, InteractionBatch } from '../types';

const router = Router();

// ==================== AUTENTICAÇÃO ====================

/**
 * POST /api/auth/register
 * Registra novo usuário
 */
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${config.newsBackendUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao registrar:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

/**
 * POST /api/auth/login
 * Login de usuário
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${config.newsBackendUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
router.get('/auth/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Token não fornecido' });
    }

    const response = await fetch(`${config.newsBackendUrl}/api/auth/me`, {
      headers: { 'Authorization': authHeader }
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

/**
 * POST /api/auth/refresh
 * Renova token JWT
 */
router.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Token não fornecido' });
    }

    const response = await fetch(`${config.newsBackendUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Authorization': authHeader }
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

/**
 * PUT /api/auth/password
 * Atualiza senha do usuário
 */
router.put('/auth/password', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: 'Token não fornecido' });
    }

    const response = await fetch(`${config.newsBackendUrl}/api/auth/password`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': authHeader 
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

// ==================== STATUS ====================

/**
 * GET /api/status
 * Status do gateway e backend
 */
router.get('/status', (req: Request, res: Response) => {
  const wsStats = wsBroadcaster.getStats();
  const feedStats = feedStore.getStats();

  res.json({
    gateway: {
      status: 'running',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
    backends: {
      news: newsClient.getStatus(),
    },
    websocket: wsStats,
    feed: feedStats,
    config: {
      maxHistoryItems: config.maxHistoryItems,
      wsHeartbeatInterval: config.wsHeartbeatInterval,
    },
  });
});

/**
 * GET /api/feed
 * Feed de notícias com filtros
 * Query params: category, limit
 */
router.get('/feed', (req: Request, res: Response) => {
  const { category, limit } = req.query;

  const options: any = {
    limit: limit ? parseInt(limit as string) : 50,
  };

  if (category) {
    options.categories = (category as string).split(',');
  }

  const items = feedStore.list(options);
  res.json(items);
});

/**
 * POST /api/bookmark
 * Proxy para salvar bookmark
 * Body: { id: "news_456", user_id: number }
 */
router.post('/bookmark', async (req: Request, res: Response) => {
  const { id, user_id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID é obrigatório' });
  }

  try {
    if (id.startsWith('news_')) {
      // Proxy para News
      const articleId = id.replace('news_', '');
      const response = await fetch(
        `${config.newsBackendUrl}/api/articles/${articleId}/bookmark`,
        { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id })
        }
      );
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    return res.status(400).json({ error: 'ID inválido. Use formato news_xxx' });
  } catch (error) {
    console.error('Erro ao fazer bookmark:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

/**
 * POST /api/articles/:id/like
 * Adiciona like (estrela) ao artigo
 * Body: { user_id: number }
 */
router.post('/articles/:id/like', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id é obrigatório' });
  }

  try {
    // Normaliza ID: "news_123" → "123"
    const articleId = id.startsWith('news_') ? id.replace('news_', '') : id;
    
    const response = await fetch(
      `${config.newsBackendUrl}/api/articles/${articleId}/like`,
      { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id })
      }
    );
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao adicionar like:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

/**
 * DELETE /api/articles/:id/like
 * Remove like do artigo
 * Query: user_id
 */
router.delete('/articles/:id/like', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id é obrigatório' });
  }

  try {
    const articleId = id.startsWith('news_') ? id.replace('news_', '') : id;
    
    const response = await fetch(
      `${config.newsBackendUrl}/api/articles/${articleId}/like?user_id=${user_id}`,
      { method: 'DELETE' }
    );
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao remover like:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/articles/liked
 * Lista artigos com like do usuário
 * Query: user_id, limit
 */
router.get('/articles/liked', async (req: Request, res: Response) => {
  const { user_id, limit = 100 } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id é obrigatório' });
  }

  try {
    const response = await fetch(
      `${config.newsBackendUrl}/api/articles/liked?user_id=${user_id}&limit=${limit}`
    );
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao buscar artigos liked:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

/**
 * DELETE /api/bookmark/:id
 * Proxy para remover bookmark
 */
router.delete('/bookmark/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    if (id.startsWith('news_')) {
      // Proxy para News
      const articleId = id.replace('news_', '');
      const response = await fetch(
        `${config.newsBackendUrl}/api/articles/${articleId}/bookmark`,
        { method: 'DELETE' }
      );
      const data = await response.json();
      return res.status(response.status).json(data);
    }

    return res.status(400).json({ error: 'ID inválido. Use formato news_xxx' });
  } catch (error) {
    console.error('Erro ao remover bookmark:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/bookmarks
 * Lista todos os bookmarks
 */
router.get('/bookmarks', async (req: Request, res: Response) => {
  try {
    const results: any[] = [];

    // Busca do News
    try {
      const newsResponse = await fetch(`${config.newsBackendUrl}/api/articles/bookmarked`);
      if (newsResponse.ok) {
        const newsData = await newsResponse.json() as any[];
        for (const article of newsData) {
          results.push({
            id: `news_${article.id}`,
            source: 'news',
            type: 'article',
            title: article.title,
            summary: article.summary,
            imageUrl: article.image_url,
            url: article.url,
            siteName: article.site_name,
            category: article.category,
            publishedAt: article.published_at,
            bookmarkedAt: article.updated_at,
          });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar bookmarks do News:', error);
    }

    // Ordena por data de bookmark (mais recente primeiro)
    results.sort((a, b) => 
      new Date(b.bookmarkedAt || 0).getTime() - new Date(a.bookmarkedAt || 0).getTime()
    );

    res.json(results);
  } catch (error) {
    console.error('Erro ao buscar bookmarks:', error);
    res.status(500).json({ error: 'Erro ao buscar bookmarks' });
  }
});

/**
 * POST /api/interactions
 * Recebe batch de interações do app e encaminha para o backend
 * ATUALIZADO: Suporta novos campos de aprendizado
 */
router.post('/interactions', async (req: Request, res: Response) => {
  const { user_id, session_id, device_type, interactions } = req.body as InteractionBatch;

  if (!user_id || !interactions || !Array.isArray(interactions)) {
    return res.status(400).json({ error: 'user_id e interactions são obrigatórios' });
  }

  try {
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    // Normaliza IDs: "news_123" → 123
    const newsInteractions = interactions
      .filter((i: Interaction) => i.article_id?.startsWith('news_'))
      .map((i: Interaction) => ({
        article_id: parseInt(i.article_id.replace('news_', ''), 10),
        interaction_type: i.interaction_type,
        duration: i.duration,
        position: i.position,
        scroll_velocity: i.scroll_velocity,
        screen_position: i.screen_position,
        viewport_time: i.viewport_time,
        timestamp: i.timestamp
      }));

    // Envia para backend de notícias
    if (newsInteractions.length > 0) {
      const response = await fetch(`${config.newsBackendUrl}/api/interactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id,
          session_id,
          device_type,
          interactions: newsInteractions
        })
      });

      if (!response.ok) {
        console.error('Erro ao enviar interações para backend:', await response.text());
      }
    }

    return res.json({ success: true, processed: interactions.length });
  } catch (error) {
    console.error('Erro ao processar interações:', error);
    return res.status(500).json({ error: 'Erro ao processar interações' });
  }
});

/**
 * GET /api/categories
 * Proxy para listar categorias do backend
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${config.newsBackendUrl}/api/categories`);
    if (response.ok) {
      const categories = await response.json();
      return res.json(categories);
    }
    return res.status(500).json({ error: 'Erro ao buscar categorias' });
  } catch (error) {
    console.error('Erro ao comunicar com backend:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/feeds/for-you
 * Feed "For You" personalizado (usa addictive internamente)
 * Query params: user_id, limit
 */
router.get('/feeds/for-you', async (req: Request, res: Response) => {
  try {
    const { user_id, limit = 50 } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório' });
    }

    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    // Chama o feed addictive (que é o verdadeiro "For You" otimizado)
    const response = await fetch(
      `${config.newsBackendUrl}/feeds/addictive?user_id=${user_id}&limit=${limit}`,
      { headers }
    );
    
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    
    return res.status(response.status).json({ error: 'Erro ao buscar feed For You' });
  } catch (error) {
    console.error('Erro ao comunicar com backend:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

/**
 * POST /api/users
 * Cria ou atualiza usuário (proxy para backend)
 * Body: { email: string, name?: string }
 */
router.post('/users', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${config.newsBackendUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/users/:id
 * Busca usuário por ID
 */
router.get('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    
    const response = await fetch(`${config.newsBackendUrl}/api/users/${id}`, { headers });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/users/email/:email
 * Busca usuário por email
 */
router.get('/users/email/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const response = await fetch(`${config.newsBackendUrl}/api/users/email/${encodeURIComponent(email)}`);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/users/:id/preferences
 * Busca preferências de categoria do usuário
 */
router.get('/users/:id/preferences', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    
    const response = await fetch(`${config.newsBackendUrl}/api/users/${id}/preferences`, { headers });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao buscar preferências:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

/**
 * PUT /api/users/:id/preferences
 * Atualiza preferências de categoria do usuário (onboarding)
 * Body: { categories: number[] }
 */
router.put('/users/:id/preferences', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    
    const response = await fetch(`${config.newsBackendUrl}/api/users/${id}/preferences`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao atualizar preferências:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/interactions/user/:userId/stats
 * Estatísticas de interações do usuário
 */
router.get('/interactions/user/:userId/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    
    const response = await fetch(`${config.newsBackendUrl}/api/interactions/user/${userId}/stats`, { headers });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

// ==================== SESSÕES ====================

/**
 * POST /api/sessions
 * Inicia nova sessão do usuário
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    
    const response = await fetch(`${config.newsBackendUrl}/api/interactions/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao criar sessão:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

/**
 * PUT /api/sessions/:sessionId/end
 * Finaliza uma sessão
 */
router.put('/sessions/:sessionId/end', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    
    const response = await fetch(`${config.newsBackendUrl}/api/interactions/sessions/${sessionId}/end`, {
      method: 'PUT',
      headers
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao finalizar sessão:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/sessions/user/:userId
 * Lista sessões de um usuário
 */
router.get('/sessions/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    
    const response = await fetch(`${config.newsBackendUrl}/api/interactions/sessions/user/${userId}`, { headers });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

// ==================== PERFIL DO USUÁRIO ====================

/**
 * GET /api/users/:userId/profile
 * Retorna perfil do usuário (para personalização)
 */
router.get('/users/:userId/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    
    const response = await fetch(`${config.newsBackendUrl}/api/interactions/users/${userId}/profile`, { headers });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/users/:userId/patterns
 * Retorna análise de padrões de comportamento
 */
router.get('/users/:userId/patterns', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    
    const response = await fetch(`${config.newsBackendUrl}/api/interactions/users/${userId}/patterns`, { headers });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao buscar padrões:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

// ==================== FEED VICIANTE ====================

/**
 * GET /api/feeds/addictive
 * Feed otimizado para engajamento máximo
 * Query: user_id, limit, offset
 */
router.get('/feeds/addictive', async (req: Request, res: Response) => {
  try {
    const { user_id, limit = 50, offset = 0 } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório' });
    }

    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetch(
      `${config.newsBackendUrl}/feeds/addictive?user_id=${user_id}&limit=${limit}&offset=${offset}`,
      { headers }
    );
    
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    
    return res.status(response.status).json({ error: 'Erro ao buscar feed' });
  } catch (error) {
    console.error('Erro ao comunicar com backend:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/feeds/addictive/more
 * GET /api/feeds/for-you/more
 * Mais conteúdo para scroll infinito
 */
router.get('/feeds/addictive/more', async (req: Request, res: Response) => {
  try {
    const { user_id, offset = 0, limit = 30 } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório' });
    }

    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetch(
      `${config.newsBackendUrl}/feeds/addictive/more?user_id=${user_id}&offset=${offset}&limit=${limit}`,
      { headers }
    );
    
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    
    return res.status(response.status).json({ error: 'Erro ao buscar mais conteúdo' });
  } catch (error) {
    console.error('Erro ao comunicar com backend:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

// Alias: /feeds/for-you/more
router.get('/feeds/for-you/more', async (req: Request, res: Response) => {
  try {
    const { user_id, offset = 0, limit = 30 } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório' });
    }

    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetch(
      `${config.newsBackendUrl}/feeds/addictive/more?user_id=${user_id}&offset=${offset}&limit=${limit}`,
      { headers }
    );
    
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    
    return res.status(response.status).json({ error: 'Erro ao buscar mais conteúdo' });
  } catch (error) {
    console.error('Erro ao comunicar com backend:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/feeds/breaking
 * Notícias das últimas 2 horas
 */
router.get('/feeds/breaking', async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;
    
    const response = await fetch(`${config.newsBackendUrl}/feeds/breaking?limit=${limit}`, { headers });
    
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    
    return res.status(response.status).json({ error: 'Erro ao buscar breaking news' });
  } catch (error) {
    console.error('Erro ao comunicar com backend:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/feeds/predict
 * Predição de clique para um artigo
 * Query: user_id, article_id
 */
router.get('/feeds/predict', async (req: Request, res: Response) => {
  try {
    let { user_id, article_id } = req.query;
    
    if (!user_id || !article_id) {
      return res.status(400).json({ error: 'user_id e article_id são obrigatórios' });
    }

    // Normaliza ID: "news_123" → "123"
    if (typeof article_id === 'string' && article_id.startsWith('news_')) {
      article_id = article_id.replace('news_', '');
    }

    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetch(
      `${config.newsBackendUrl}/feeds/predict?user_id=${user_id}&article_id=${article_id}`,
      { headers }
    );
    
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    
    return res.status(response.status).json({ error: 'Erro ao prever clique' });
  } catch (error) {
    console.error('Erro ao comunicar com backend:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

// ==================== FEED INTELIGENTE (NOVO) ====================

/**
 * GET /api/feeds/intelligent (ou /api/feeds/smart)
 * Feed inteligente com classificação hierárquica IPTC
 * 
 * Features:
 * - 80% exploitation (baseado em preferências hierárquicas)
 * - 20% exploration (descoberta de novos interesses)
 * - Scores relativos (normalização softmax)
 * - Decay temporal
 * - Feedback negativo implícito
 * 
 * Query: user_id, limit, offset
 */
router.get('/feeds/intelligent', async (req: Request, res: Response) => {
  try {
    const { user_id, limit = 50, offset = 0 } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório' });
    }

    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetch(
      `${config.newsBackendUrl}/feeds/intelligent?user_id=${user_id}&limit=${limit}&offset=${offset}`,
      { headers }
    );
    
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    
    return res.status(response.status).json({ error: 'Erro ao buscar feed inteligente' });
  } catch (error) {
    console.error('Erro ao comunicar com backend:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

// Alias: /api/feeds/smart
router.get('/feeds/smart', async (req: Request, res: Response) => {
  try {
    const { user_id, limit = 50, offset = 0 } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório' });
    }

    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetch(
      `${config.newsBackendUrl}/feeds/intelligent?user_id=${user_id}&limit=${limit}&offset=${offset}`,
      { headers }
    );
    
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    
    return res.status(response.status).json({ error: 'Erro ao buscar feed inteligente' });
  } catch (error) {
    console.error('Erro ao comunicar com backend:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/feeds/preferences/:user_id
 * Busca preferências hierárquicas do usuário (scores relativos)
 */
router.get('/feeds/preferences/:user_id', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetch(
      `${config.newsBackendUrl}/feeds/preferences/${user_id}`,
      { headers }
    );
    
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    
    return res.status(response.status).json({ error: 'Erro ao buscar preferências' });
  } catch (error) {
    console.error('Erro ao comunicar com backend:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

/**
 * POST /api/feeds/preferences/:user_id/recalculate
 * Recalcula preferências do usuário (normalização + decay + feedback negativo)
 */
router.post('/feeds/preferences/:user_id/recalculate', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.params;

    const authHeader = req.headers.authorization;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetch(
      `${config.newsBackendUrl}/feeds/preferences/${user_id}/recalculate`,
      { method: 'POST', headers }
    );
    
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    
    return res.status(response.status).json({ error: 'Erro ao recalcular preferências' });
  } catch (error) {
    console.error('Erro ao comunicar com backend:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

/**
 * GET /api/categories/hierarchical
 * Lista categorias em estrutura hierárquica (IPTC)
 */
router.get('/categories/hierarchical', async (req: Request, res: Response) => {
  try {
    const response = await fetch(`${config.newsBackendUrl}/api/categories/hierarchical`);
    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    }
    return res.status(500).json({ error: 'Erro ao buscar categorias hierárquicas' });
  } catch (error) {
    console.error('Erro ao comunicar com backend:', error);
    return res.status(500).json({ error: 'Erro ao comunicar com backend' });
  }
});

export default router;
