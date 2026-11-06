import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { exec } from 'node:child_process';
import net from 'node:net';

// Known Gateways Master Directory (GW-01 s/d GW-08)
const KNOWN_GATEWAYS = [
  { id: 'GW-01', ip: '10.1.5.13', name: 'Gateway Deteksi 01', aliases: ['1', '01', 'GW-01', 'GW01', 'GW1'] },
  { id: 'GW-02', ip: '10.1.5.32', name: 'Gateway Deteksi 02', aliases: ['2', '02', 'GW-02', 'GW02', 'GW2'] },
  { id: 'GW-03', ip: '10.1.5.58', name: 'Gateway Deteksi 03', aliases: ['3', '03', 'GW-03', 'GW03', 'GW3'] },
  { id: 'GW-04', ip: '10.1.5.76', name: 'Gateway Deteksi 04', aliases: ['4', '04', 'GW-04', 'GW04', 'GW4'] },
  { id: 'GW-05', ip: '10.1.5.114', name: 'Gateway Deteksi 05', aliases: ['5', '05', 'GW-05', 'GW05', 'GW5'] },
  { id: 'GW-06', ip: '10.1.5.140', name: 'Gateway Deteksi 06', aliases: ['6', '06', 'GW-06', 'GW06', 'GW6'] },
  { id: 'GW-07', ip: '10.1.5.194', name: 'Gateway Deteksi 07', aliases: ['7', '07', 'GW-07', 'GW07', 'GW7'] },
  { id: 'GW-08', ip: '10.1.5.210', name: 'Gateway Deteksi 08', aliases: ['8', '08', 'GW-08', 'GW08', 'GW8'] },
];

function resolveGatewayId(rawInput, clientIp) {
  if (!rawInput && clientIp) {
    const cleanClientIp = clientIp.replace(/^.*:/, '');
    const foundByIp = KNOWN_GATEWAYS.find(g => g.ip === cleanClientIp);
    if (foundByIp) return foundByIp.id;
  }
  if (!rawInput) return null;

  const str = String(rawInput).trim();
  const upper = str.toUpperCase();

  // 1. Exact match ID
  const exact = KNOWN_GATEWAYS.find(g => g.id === upper);
  if (exact) return exact.id;

  // 2. Match IP
  const byIp = KNOWN_GATEWAYS.find(g => g.ip === str);
  if (byIp) return byIp.id;

  // 3. Match aliases
  const byAlias = KNOWN_GATEWAYS.find(g => g.aliases.some(a => a.toUpperCase() === upper));
  if (byAlias) return byAlias.id;

  // 4. Match name
  const byName = KNOWN_GATEWAYS.find(g => g.name.toLowerCase() === str.toLowerCase());
  if (byName) return byName.id;

  // 5. Match standard patterns (e.g. 'GW-08', 'GW-8', 'gateways/GW-08')
  const match = upper.match(/GW-?0?([1-8])\b/i);
  if (match) {
    const num = String(match[1]).padStart(2, '0');
    return `GW-${num}`;
  }

  return null;
}

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
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Gateway-Id, X-MQTT-Topic');

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
            const timestamp = new Date().toISOString();
            try {
              const data = JSON.parse(body || '{}');

              // Raw topic extraction (MQTT bridge or header)
              const rawTopic = req.headers['x-mqtt-topic'] || data.topic || data.raw_topic || req.url;

              // Raw card extraction (mendukung snake_case, camelCase, dan ragam IoT payload)
              const rawCard = data.cardId || data.card_id || data.card || data.tagId || data.tag_id || data.tag || data.uid || data.mac || data.id;
              if (!rawCard || !String(rawCard).trim()) {
                console.error(`[${timestamp}] REJECTED: raw_topic=${rawTopic} raw_payload=${body} error="Field cardId/card_id wajib diisi"`);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  status: 'error',
                  error: 'Field cardId / card_id / uid wajib diisi dan tidak boleh kosong.',
                }));
                return;
              }

              // Raw gateway extraction (mendukung gatewayId, gateway_id, device_id, gw, ip, dsb)
              const rawGw = data.gatewayId || data.gateway_id || data.gateway || data.gwId || data.gw_id || data.gw ||
                            data.device_id || data.deviceId || data.client_id || data.clientId ||
                            data.gateway_ip || data.gatewayIp || req.headers['x-gateway-id'];

              const resolvedGwId = resolveGatewayId(rawGw, req.socket?.remoteAddress);

              // VALIDASI KETAT: Jika gateway tidak dikenal, tolak event dan catat error. JANGAN diam-diam dialihkan ke GW-01!
              if (!resolvedGwId) {
                console.error(`[${timestamp}] REJECTED: raw_topic=${rawTopic} raw_payload=${body} resolved_gateway=UNKNOWN card=${rawCard} error="Gateway '${rawGw}' tidak dikenal"`);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  status: 'error',
                  error: `Gateway identifier '${rawGw || 'NULL'}' tidak dikenal/tidak terdaftar (GW-01 s/d GW-08). Event ditolak untuk mencegah salah alokasi.`,
                }));
                return;
              }

              const cleanCardId = String(rawCard).replace(/[: -]/g, '').toUpperCase();
              const rssi = typeof data.rssi === 'number' ? data.rssi : -55;
              const distance = data.distance || Math.round(Math.pow(10, (-59 - rssi) / (10 * 2)) * 10) / 10;

              // Log sementara sesuai format spesifikasi:
              // [timestamp] raw_topic=... raw_payload=... resolved_gateway=... card=...
              console.log(`[${timestamp}] raw_topic=${rawTopic} raw_payload=${body.trim()} resolved_gateway=${resolvedGwId} card=${cleanCardId}`);

              const payload = {
                type: 'CARD_DETECTION',
                cardId: cleanCardId,
                originalCardId: String(rawCard),
                gatewayId: resolvedGwId,
                rssi,
                distance: isNaN(distance) ? 50 : Math.min(100, Math.max(1, distance)),
                timestamp,
                raw: data,
              };

              // Broadcast real detection to all active frontend clients
              sseClients.forEach(client => {
                client.write(`data: ${JSON.stringify(payload)}\n\n`);
              });

              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                status: 'success',
                message: `Signal from card ${payload.cardId} captured by ${resolvedGwId}`,
                data: payload,
              }));
            } catch (err) {
              console.error(`[${timestamp}] JSON_PARSE_ERROR:`, err.message, body);
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
              gatewayId: 'GW-08',
              rssi: -58,
            },
            supportedGateways: KNOWN_GATEWAYS.map(g => ({ id: g.id, ip: g.ip, name: g.name })),
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
