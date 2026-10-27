// ============================================================
// DATA GATEWAY & KARTU IDENTITAS REAL-TIME MONITORING
// Kawasan: PT Eastern Logistics — Lamongan Shorebase, Paciran, Jawa Timur
// ============================================================

export const SIMULATION_LABEL = '[LIVE]';

export const SHOREBASE_PRESETS = [
  { id: 'GW-01', name: 'Area Kantor & Administrasi', lat: -6.86780, lng: 112.41680, zone: 'Central Office' },
  { id: 'GW-02', name: 'Gudang & Bonded Storage', lat: -6.86720, lng: 112.41530, zone: 'Warehouses' },
  { id: 'GW-03', name: 'Workshop & Fabrikasi', lat: -6.86650, lng: 112.41450, zone: 'Fabrication Plant' },
  { id: 'GW-04', name: 'Dermaga Jetty (250m)', lat: -6.86108, lng: 112.41806, zone: 'Marine Jetty' },
  { id: 'GW-05', name: 'Helipad & Evakuasi Medis', lat: -6.86890, lng: 112.41620, zone: 'Helipad / HSE' },
  { id: 'GW-06', name: 'Gerbang Masuk Jl. Daendels', lat: -6.87220, lng: 112.41730, zone: 'Main Security Gate' },
  { id: 'GW-07', name: 'Open Yard & Staging Area', lat: -6.86490, lng: 112.41520, zone: 'OCTG Yard' },
];

// Gateway devices with real IPs in network 10.1.5.x
export const GATEWAYS = [
  {
    id: 'GW-01',
    name: 'Gateway Deteksi 01',
    ip: '10.1.5.13',
    url: 'http://10.1.5.13',
    location: 'Titik Deteksi 01 — Area Kantor & Administrasi',
    floor: 1,
    lat: -6.86780,
    lng: 112.41680,
    radius: 50,
    status: 'connected',
    latency: 12,
    lastSeen: new Date().toISOString(),
    serviceAccess: 'HTTP',
    authType: 'Bearer Token',
    maxPacketSize: 1024,
    uptime: '3d 14h 22m',
    signalStrength: 92,
    detectedCount: 0,
    posX: 50,
    posY: 45,
  },
  {
    id: 'GW-02',
    name: 'Gateway Deteksi 02',
    ip: '10.1.5.32',
    url: 'http://10.1.5.32',
    location: 'Titik Deteksi 02 — Gudang & Bonded Storage',
    floor: 1,
    lat: -6.86720,
    lng: 112.41530,
    radius: 50,
    status: 'connected',
    latency: 8,
    lastSeen: new Date().toISOString(),
    serviceAccess: 'HTTP',
    authType: 'Bearer Token',
    maxPacketSize: 2048,
    uptime: '7d 2h 5m',
    signalStrength: 88,
    detectedCount: 0,
    posX: 80,
    posY: 30,
  },
  {
    id: 'GW-03',
    name: 'Gateway Deteksi 03',
    ip: '10.1.5.62',
    url: 'http://10.1.5.62',
    location: 'Titik Deteksi 03 — Workshop & Fabrikasi',
    floor: 1,
    lat: -6.86650,
    lng: 112.41450,
    radius: 60,
    status: 'connected',
    latency: 28,
    lastSeen: new Date().toISOString(),
    serviceAccess: 'HTTP',
    authType: 'API Key',
    maxPacketSize: 1024,
    uptime: '1d 8h 45m',
    signalStrength: 78,
    detectedCount: 0,
    posX: 25,
    posY: 30,
  },
  {
    id: 'GW-04',
    name: 'Gateway Deteksi 04',
    ip: '10.1.5.89',
    url: 'http://10.1.5.89',
    location: 'Titik Deteksi 04 — Dermaga Jetty (250m)',
    floor: 0,
    lat: -6.86108,
    lng: 112.41806,
    radius: 50,
    status: 'connected',
    latency: 19,
    lastSeen: new Date().toISOString(),
    serviceAccess: 'HTTP',
    authType: 'Bearer Token',
    maxPacketSize: 1024,
    uptime: '2d 6h 41m',
    signalStrength: 82,
    detectedCount: 0,
    posX: 50,
    posY: 75,
  },
  {
    id: 'GW-05',
    name: 'Gateway Deteksi 05',
    ip: '10.1.5.114',
    url: 'http://10.1.5.114',
    location: 'Titik Deteksi 05 — Helipad & Evakuasi Medis',
    floor: 1,
    lat: -6.86890,
    lng: 112.41620,
    radius: 40,
    status: 'connected',
    latency: 15,
    lastSeen: new Date().toISOString(),
    serviceAccess: 'HTTP',
    authType: 'Basic Auth',
    maxPacketSize: 512,
    uptime: '5d 11h 33m',
    signalStrength: 95,
    detectedCount: 0,
    posX: 20,
    posY: 65,
  },
  {
    id: 'GW-06',
    name: 'Gateway Deteksi 06',
    ip: '10.1.5.140',
    url: 'http://10.1.5.140',
    location: 'Titik Deteksi 06 — Gerbang Masuk Jl. Daendels',
    floor: 1,
    lat: -6.87220,
    lng: 112.41730,
    radius: 45,
    status: 'connected',
    latency: 22,
    lastSeen: new Date().toISOString(),
    serviceAccess: 'HTTP',
    authType: 'Bearer Token',
    maxPacketSize: 1024,
    uptime: '4d 2h 10m',
    signalStrength: 84,
    detectedCount: 0,
    posX: 80,
    posY: 70,
  },
  {
    id: 'GW-07',
    name: 'Gateway Deteksi 07',
    ip: '10.1.5.194',
    url: 'http://10.1.5.194',
    location: 'Titik Deteksi 07 — Open Yard & Staging Area',
    floor: 1,
    lat: -6.86490,
    lng: 112.41520,
    radius: 70,
    status: 'connected',
    latency: 14,
    lastSeen: new Date().toISOString(),
    serviceAccess: 'HTTP',
    authType: 'Bearer Token',
    maxPacketSize: 1024,
    uptime: '6d 18h 55m',
    signalStrength: 87,
    detectedCount: 0,
    posX: 50,
    posY: 10,
  },
];

// Registered card holders — Hanya 1 kartu fisik K7 terdaftar
export const CARD_HOLDERS = [
  {
    cardId: 'BC572914269D',
    employeeId: '562427',
    name: 'Kartu Beacon K7',
    department: 'Operasional',
    division: 'Shorebase Logistics',
    role: 'Staff Khusus',
    cardType: 'employee',
    status: 'active',
    avatarInitials: 'K7',
    avatarColor: '#4F46E5',
    registeredAt: '2026-10-27',
    model: 'KM Technology K7',
    macAddress: 'BC:57:29:14:26:9D',
    isHardwareCard: true,
  },
];

// Initial active detections — Kosong (menunggu sinyal aktual dari kartu fisik)
export const INITIAL_DETECTIONS = [];

// Historical detections for the table — Kosong (menunggu pembacaan riil)
export const generateHistoryRecords = () => [];

// Extra cards available for simulation (Kosong)
export const EXTRA_CARDS_FOR_SIM = [];

export const getCardHolder = (cardId, customList = null) => {
  if (customList && Array.isArray(customList)) {
    const found = customList.find(h => h.cardId === cardId);
    if (found) return found;
  }
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('company_registered_cards');
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = parsed.find(h => h.cardId === cardId);
        if (match) return match;
      }
    } catch {}
  }
  return CARD_HOLDERS.find(h => h.cardId === cardId);
};

export const getGateway = (gatewayId, customList = null) => {
  if (customList && Array.isArray(customList)) {
    const found = customList.find(g => g.id === gatewayId);
    if (found) return found;
  }
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('company_gateways_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        const match = parsed.find(g => g.id === gatewayId);
        if (match) return match;
      }
    } catch {}
  }
  return GATEWAYS.find(g => g.id === gatewayId);
};

export const formatTime = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const formatDateTime = (isoString) => {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleString('id-ID', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

export const timeAgo = (isoString) => {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 8) return 'Baru saja';
  if (secs < 60) return `${secs} dtk lalu`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  return `${Math.floor(hrs / 24)} hari lalu`;
};

export const STATUS_COLORS = {
  connected: { text: 'text-emerald-400', bg: 'bg-emerald-500', badge: 'badge-connected' },
  disconnected: { text: 'text-slate-400', bg: 'bg-slate-500', badge: 'badge-disconnected' },
  connecting: { text: 'text-amber-400', bg: 'bg-amber-500', badge: 'badge-connecting' },
  error: { text: 'text-rose-400', bg: 'bg-rose-500', badge: 'badge-error' },
};
