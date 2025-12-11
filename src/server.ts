import express from 'express';
import http from 'http';
import config from './config';
import apiRouter from './routes/api';
import { youtubeClient } from './clients/youtube-client';
import { newsClient } from './clients/news-client';
import { feedStore } from './services/feed-store';
import { wsBroadcaster } from './services/ws-broadcaster';
import { FeedItem, BackendStatus } from './types';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'Feed Gateway',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      api: '/api/*',
      websocket: '/ws',
    },
    backends: {
      youtube: youtubeClient.getStatus(),
      news: newsClient.getStatus(),
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', apiRouter);

// Inicializa WebSocket
wsBroadcaster.initialize(server);

// Configura handlers dos clientes SSE
function setupSSEHandlers(): void {
  // YouTube handlers
  youtubeClient.on('new_item', (item: FeedItem) => {
    feedStore.add(item);
    wsBroadcaster.broadcastNewItem(item);
  });

  youtubeClient.on('live_started', (item: FeedItem) => {
    feedStore.add(item);
    wsBroadcaster.broadcastLiveStarted(item);
  });

  youtubeClient.on('live_ended', (item: FeedItem) => {
    feedStore.update(item.id, { isLive: false });
    wsBroadcaster.broadcastLiveEnded(item);
  });

  youtubeClient.on('status', (status: BackendStatus) => {
    wsBroadcaster.broadcastBackendStatus(status);
  });

  // News handlers
  newsClient.on('new_item', (item: FeedItem) => {
    feedStore.add(item);
    wsBroadcaster.broadcastNewItem(item);
  });

  newsClient.on('status', (status: BackendStatus) => {
    wsBroadcaster.broadcastBackendStatus(status);
  });
}

// Inicia servidor
async function start(): Promise<void> {
  console.log('\n🚀 Feed Gateway iniciando...\n');
  console.log('📋 Configuração:');
  console.log(`   - Port: ${config.port}`);
  console.log(`   - YouTube Backend: ${config.youtubeBackendUrl}`);
  console.log(`   - News Backend: ${config.newsBackendUrl}`);
  console.log(`   - Max History: ${config.maxHistoryItems} itens`);
  console.log('');

  // Configura handlers
  setupSSEHandlers();

  // Conecta aos backends
  console.log('🔌 Conectando aos backends...\n');
  youtubeClient.connect();
  newsClient.connect();

  // Inicia servidor HTTP
  server.listen(config.port, config.host, () => {
    console.log(`\n✅ Gateway rodando em http://${config.host}:${config.port}`);
    console.log(`   - REST API: http://localhost:${config.port}/api/`);
    console.log(`   - WebSocket: ws://localhost:${config.port}/ws`);
    console.log(`   - Status: http://localhost:${config.port}/api/status`);
    console.log('');
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Encerrando gateway...');
  youtubeClient.disconnect();
  newsClient.disconnect();
  wsBroadcaster.close();
  server.close(() => {
    console.log('👋 Gateway encerrado');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Encerrando gateway...');
  youtubeClient.disconnect();
  newsClient.disconnect();
  wsBroadcaster.close();
  server.close(() => {
    process.exit(0);
  });
});

// Inicia
start().catch(console.error);

