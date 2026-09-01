import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import apiRouter from './backend/routes/api.ts';
import { sessionService } from './backend/services/instances.ts';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Mount API routes
  app.use('/api', apiRouter);

  // Set up WebSocket server for real-time interactive process I/O
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    if (url.pathname === '/api/ws' || url.pathname.startsWith('/api/session/') || url.pathname === '/api/terminal/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket, request: http.IncomingMessage) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const pathname = url.pathname;

    // Direct session attachment via /api/session/:id/ws
    const sessionMatch = pathname.match(/\/api\/session\/([^/]+)/);
    if (sessionMatch && sessionMatch[1] && sessionMatch[1] !== 'ws') {
      const sessionId = sessionMatch[1];
      const attached = sessionService.attachWebSocket(sessionId, ws);
      if (!attached) {
        ws.send(JSON.stringify({ type: 'error', message: 'Session not found or expired' }));
        ws.close();
      }
      return;
    }

    // General /api/ws connection
    ws.on('message', async (data) => {
      try {
        const text = typeof data === 'string' ? data : data.toString('utf8');
        const parsed = JSON.parse(text);

        if (parsed.type === 'start') {
          const files = parsed.files || [{ name: 'main.c', content: parsed.code || '' }];
          const standard = parsed.standard || 'c17';
          const compilerFlags = parsed.compilerFlags || parsed.compilerOptions || [];
          const timeoutMs = parsed.timeoutMs;
          const activeFileName = parsed.activeFileName || parsed.activeFile;
          const entryFile = parsed.entryFile;

          await sessionService.createAndStartSession(
            {
              files,
              standard,
              compilerFlags,
              timeoutMs,
              activeFileName,
              entryFile,
            },
            ws
          );
        } else if (parsed.type === 'attach' && parsed.sessionId) {
          const attached = sessionService.attachWebSocket(parsed.sessionId, ws);
          if (!attached) {
            ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
          }
        }
      } catch (err: any) {
        ws.send(JSON.stringify({ type: 'error', message: `Invalid WS payload: ${err.message}` }));
      }
    });
  });

  // Vite middleware for development vs static build in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`CodeForge C IDE Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
