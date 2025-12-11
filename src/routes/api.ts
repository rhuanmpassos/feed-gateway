import { Router, Request, Response } from 'express';
import { feedStore } from '../services/feed-store';
import { newsClient } from '../clients/news-client';
import { wsBroadcaster } from '../services/ws-broadcaster';
import config from '../config';
import { Interaction } from '../types';

const router = Router();

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
 * Body: { id: "news_456" }
 */
router.post('/bookmark', async (req: Request, res: Response) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'ID é obrigatório' });
  }

  try {
    if (id.startsWith('news_')) {
      // Proxy para News
      const articleId = id.replace('news_', '');
      const response = await fetch(
        `${config.newsBackendUrl}/api/articles/${articleId}/bookmark`,
        { method: 'POST' }
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
 */
router.post('/interactions', async (req: Request, res: Response) => {
  const { user_id, interactions } = req.body;

  if (!user_id || !interactions || !Array.isArray(interactions)) {
    return res.status(400).json({ error: 'user_id e interactions são obrigatórios' });
  }

  try {
    // Normaliza IDs: "news_123" → 123
    const newsInteractions = interactions
      .filter((i: Interaction) => i.article_id?.startsWith('news_'))
      .map((i: Interaction) => ({
        ...i,
        article_id: parseInt(i.article_id.replace('news_', ''), 10)
      }));

    // Envia para backend de notícias
    if (newsInteractions.length > 0) {
      const response = await fetch(`${config.newsBackendUrl}/api/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
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
 * Proxy para feed "For You" personalizado
 * Query params: user_id, limit
 */
router.get('/feeds/for-you', async (req: Request, res: Response) => {
  try {
    const { user_id, limit = 50 } = req.query;
    
    if (!user_id) {
      return res.status(400).json({ error: 'user_id é obrigatório' });
    }

    const response = await fetch(
      `${config.newsBackendUrl}/feeds/for-you?user_id=${user_id}&limit=${limit}`
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
    const response = await fetch(`${config.newsBackendUrl}/api/users/${id}`);
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
    const response = await fetch(`${config.newsBackendUrl}/api/users/${id}/preferences`);
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
    const response = await fetch(`${config.newsBackendUrl}/api/users/${id}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
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
    const response = await fetch(`${config.newsBackendUrl}/api/interactions/user/${userId}/stats`);
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ success: false, error: 'Erro ao comunicar com backend' });
  }
});

export default router;
