import http from 'node:http';
import { WebSocketServer } from 'ws';
import { SERVER_CONFIG } from './config.js';
import { RoomManager } from './RoomManager.js';

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        service: 'gather-shopee-server',
        timestamp: new Date().toISOString(),
        port: SERVER_CONFIG.PORT
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const wss = new WebSocketServer({ server });
const roomManager = new RoomManager();

let clientCounter = 0;

wss.on('connection', (ws) => {
  clientCounter += 1;
  const clientId = `usr_${Date.now().toString(36)}_${clientCounter}`;
  console.log(`[New Connection] Client connected with ID: ${clientId}`);

  roomManager.handleConnection(ws, clientId);
});

server.listen(SERVER_CONFIG.PORT, () => {
  console.log(`🚀 Gather Shopee Realtime Server listening on port ${SERVER_CONFIG.PORT}`);
  console.log(`👉 Healthcheck: http://localhost:${SERVER_CONFIG.PORT}/health`);
  console.log(`👉 WebSocket: ws://localhost:${SERVER_CONFIG.PORT}`);
});

process.on('SIGINT', () => {
  console.log('\nGracefully shutting down server...');
  roomManager.stopTickLoop();
  wss.close();
  server.close(() => {
    console.log('Server terminated successfully.');
    process.exit(0);
  });
});
