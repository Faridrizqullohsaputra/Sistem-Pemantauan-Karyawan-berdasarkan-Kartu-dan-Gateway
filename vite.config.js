import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { exec } from 'node:child_process';
import net from 'node:net';

// Plugin to receive real HTTP POST signals from IoT Gateways or testing tools
const gatewayWebhookPlugin = () => {
  let sseClients = [];

  return {
    name: 'gateway-webhook-plugin',
    configureServer(server) {
      // 1. Real-time Server-Sent Events (SSE) stream for web frontend
      server.middlewares.use('/api/realtime-stream', (req, res) => {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });
        res.write('data: {"type":"connected","message":"Real-time Gateway SSE Stream Active"}\n\n');
        sseClients.push(res);

        req.on('close', () => {
          sseClients = sseClients.filter(c => c !== res);
        });
      });

      // 2. Real Gateway Webhook endpoint: POST /api/gateway/report
      server.middlewares.use('/api/gateway/report', (req, res) => {
        // Handle CORS Preflight
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body || '{}');
              const cardId = data.cardId || data.mac || data.tagId || data.uid || data.id || 'BC572914269D';
              const gatewayId = data.gatewayId || data.gw || 'GW-01';
              const rssi = data.rssi || -55;
              const distance = data.distance || Math.round(Math.pow(10, (-59 - rssi) / (10 * 2)) * 10) / 10;

              const payload = {
                type: 'CARD_DETECTION',
                cardId: String(cardId).replace(/[: -]/g, '').toUpperCase(),
                originalCardId: String(cardId),
                gatewayId,
                rssi,
                distance: isNaN(distance) ? 50 : Math.min(100, Math.max(1, distance)),
                timestamp: new Date().toISOString(),
                raw: data,
              };

              // Broadcast real detection to all active frontend clients
              sseClients.forEach(client => {
                client.write(`data: ${JSON.stringify(payload)}\n\n`);
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                status: 'success',
                message: `Signal from card ${payload.cardId} captured by ${gatewayId}`,
                data: payload,
              }));
            } catch (err) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }
          });
        } else {
          // GET: Health check & info
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status: 'online',
            service: 'IoT Gateway Real-Time Ingestion Endpoint',
            endpoint: 'POST /api/gateway/report',
            samplePayload: {
              cardId: 'BC572914269D',
              gatewayId: 'GW-01',
              rssi: -62,
            },
          }));
        }
      });

      // 3. Real Gateway Ping / Diagnostic endpoint: GET /api/gateway/ping?ip=10.1.5.140&id=GW-06
      server.middlewares.use('/api/gateway/ping', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        const reqUrl = new URL(req.url, 'http://localhost');
        const targetIp = (reqUrl.searchParams.get('ip') || '10.1.5.140').trim();
        const gwId = reqUrl.searchParams.get('id') || 'GW-06';
        const cleanIp = targetIp.replace(/[^a-zA-Z0-9.:-]/g, '');

        if (!cleanIp) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'IP address required' }));
          return;
        }

        // Real ICMP ping via Windows cmd
        exec(`ping -n 1 -w 1500 ${cleanIp}`, (err, stdout) => {
          const output = stdout || '';
          const isSuccess = /Reply from/i.test(output) &&
            !/Destination host unreachable/i.test(output) &&
            !/Request timed out/i.test(output);

          if (isSuccess) {
            let latency = 15;
            const timeMatch = output.match(/time[=<](\d+)ms/i);
            if (timeMatch && timeMatch[1]) {
              latency = parseInt(timeMatch[1], 10);
            }
            let ttl = 64;
            const ttlMatch = output.match(/TTL=(\d+)/i);
            if (ttlMatch && ttlMatch[1]) {
              ttl = parseInt(ttlMatch[1], 10);
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              ip: cleanIp,
              gatewayId: gwId,
              latency,
              ttl,
              status: 'connected',
              message: `Ping sukses ke ${cleanIp}: ${latency}ms TTL=${ttl}`,
            }));
          } else {
            // TCP fallback test on port 80
            const socket = new net.Socket();
            const start = Date.now();
            let responded = false;

            socket.setTimeout(1500);
            socket.on('connect', () => {
              if (responded) return;
              responded = true;
              const latency = Date.now() - start;
              socket.destroy();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                ip: cleanIp,
                gatewayId: gwId,
                latency,
                ttl: 64,
                status: 'connected',
                message: `TCP connect ke ${cleanIp}:80 sukses: ${latency}ms`,
              }));
            });

            const handleFail = () => {
              if (responded) return;
              responded = true;
              socket.destroy();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: false,
                ip: cleanIp,
                gatewayId: gwId,
                status: 'error',
                message: `Perangkat ${cleanIp} tidak merespon (RTO)`,
              }));
            };

            socket.on('timeout', handleFail);
            socket.on('error', handleFail);
            socket.connect(80, cleanIp);
          }
        });
      });
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), gatewayWebhookPlugin()],
});
