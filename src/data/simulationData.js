// ============================================================
// SIMULATION DATA — BUKAN DATA GATEWAY AKTUAL
// File ini berisi data simulasi untuk keperluan demonstrasi UI.
// Integrasi dengan Gateway nyata dilakukan setelah dokumentasi
// protokol Gateway tersedia.
// ============================================================

export const SIMULATION_LABEL = '[SIM]';

// Gateway devices with real IPs from the network
export const GATEWAYS = [
  {
    id: 'GW-01',
    name: 'Gateway Lobby Utama',
    ip: '10.1.5.13',
    url: 'http://10.1.5.13',
    location: 'Lobby Utama Lt. 1',
    floor: 1,
    status: 'connected',
    lastSeen: new Date(Date.now() - 12000).toISOString(),
    serviceAccess: 'HTTP',
    authType: 'Bearer Token',
    maxPacketSize: 1024,
    uptime: '3d 14h 22m',
    signalStrength: 92,
    detectedCount: 47,
    posX: 50,
    posY: 45,
  },
  {
    id: 'GW-02',
    name: 'Gateway Ruang Server',
    ip: '10.1.5.32',
    url: 'http://10.1.5.32',
    location: 'Ruang Server Lt. 2',
    floor: 2,
    status: 'connected',
    lastSeen: new Date(Date.now() - 5000).toISOString(),
    serviceAccess: 'HTTP',
    authType: 'Bearer Token',
    maxPacketSize: 2048,
    uptime: '7d 2h 5m',
    signalStrength: 88,
    detectedCount: 31,
    posX: 80,
    posY: 30,
  },
  {
    id: 'GW-03',
    name: 'Gateway Ruang Rapat',
    ip: '10.1.5.62',
    url: 'http://10.1.5.62',
    location: 'Ruang Rapat Lt. 2',
    floor: 2,
    status: 'connected',
    lastSeen: new Date(Date.now() - 8000).toISOString(),
    serviceAccess: 'HTTP',
    authType: 'API Key',
    maxPacketSize: 1024,
    uptime: '1d 8h 45m',
    signalStrength: 76,
    detectedCount: 18,
    posX: 25,
    posY: 30,
  },
  {
    id: 'GW-04',
    name: 'Gateway Area Parkir',
    ip: '10.1.5.89',
    url: 'http://10.1.5.89',
    location: 'Area Parkir B1',
    floor: -1,
    status: 'connected',
    lastSeen: new Date(Date.now() - 4000).toISOString(),
    serviceAccess: 'HTTP',
    authType: 'Bearer Token',
    maxPacketSize: 1024,
    uptime: '2d 6h 41m',
    signalStrength: 82,
    detectedCount: 24,
    posX: 50,
    posY: 75,
  },
  {
    id: 'GW-05',
    name: 'Gateway Kantin',
    ip: '10.1.5.114',
    url: 'http://10.1.5.114',
    location: 'Kantin Lt. 1',
    floor: 1,
    status: 'connected',
    lastSeen: new Date(Date.now() - 3000).toISOString(),
    serviceAccess: 'HTTP',
    authType: 'Basic Auth',
    maxPacketSize: 512,
    uptime: '5d 11h 33m',
    signalStrength: 95,
    detectedCount: 62,
    posX: 20,
    posY: 65,
  },
  {
    id: 'GW-06',
    name: 'Gateway Gudang',
    ip: '10.1.5.140',
    url: 'http://10.1.5.140',
    location: 'Gudang Lt. 1',
    floor: 1,
    status: 'connected',
    lastSeen: new Date(Date.now() - 7000).toISOString(),
    serviceAccess: 'HTTP',
    authType: 'Bearer Token',
    maxPacketSize: 1024,
    uptime: '4d 3h 17m',
    signalStrength: 78,
    detectedCount: 19,
    posX: 80,
    posY: 70,
  },
  {
    id: 'GW-07',
    name: 'Gateway Pintu Belakang',
    ip: '10.1.5.194',
    url: 'http://10.1.5.194',
    location: 'Pintu Belakang Lt. 1',
    floor: 1,
    status: 'connected',
    lastSeen: new Date(Date.now() - 2000).toISOString(),
    serviceAccess: 'HTTP',
    authType: 'Bearer Token',
    maxPacketSize: 1024,
    uptime: '6d 18h 55m',
    signalStrength: 87,
    detectedCount: 33,
    posX: 50,
    posY: 10,
  },
];

// Registered card holders (employees & visitors)
export const CARD_HOLDERS = [
  {
    cardId: 'CARD-00128',
    employeeId: 'EMP-2024-001',
    name: 'Ahmad Pratama',
    department: 'Engineering',
    division: 'Software Development',
    role: 'Senior Developer',
    cardType: 'employee',
    status: 'active',
    avatarInitials: 'AP',
    avatarColor: '#6366f1',
    registeredAt: '2024-01-15',
  },
  {
    cardId: 'CARD-00245',
    employeeId: 'EMP-2024-002',
    name: 'Siti Rahayu',
    department: 'HRD',
    division: 'Human Resources',
    role: 'HR Manager',
    cardType: 'employee',
    status: 'active',
    avatarInitials: 'SR',
    avatarColor: '#14b8a6',
    registeredAt: '2024-01-20',
  },
  {
    cardId: 'CARD-00312',
    employeeId: 'EMP-2023-089',
    name: 'Budi Santoso',
    department: 'Finance',
    division: 'Accounting',
    role: 'Finance Analyst',
    cardType: 'employee',
    status: 'active',
    avatarInitials: 'BS',
    avatarColor: '#f59e0b',
    registeredAt: '2023-08-10',
  },
  {
    cardId: 'CARD-00489',
    employeeId: 'EMP-2024-015',
    name: 'Dewi Lestari',
    department: 'Marketing',
    division: 'Digital Marketing',
    role: 'Marketing Specialist',
    cardType: 'employee',
    status: 'active',
    avatarInitials: 'DL',
    avatarColor: '#ec4899',
    registeredAt: '2024-03-05',
  },
  {
    cardId: 'CARD-00534',
    employeeId: 'EMP-2022-042',
    name: 'Rendi Wijaya',
    department: 'IT',
    division: 'Network & Infrastructure',
    role: 'Network Engineer',
    cardType: 'employee',
    status: 'active',
    avatarInitials: 'RW',
    avatarColor: '#06b6d4',
    registeredAt: '2022-11-20',
  },
  {
    cardId: 'CARD-00671',
    employeeId: 'EMP-2024-032',
    name: 'Nia Kurniawan',
    department: 'Operations',
    division: 'Logistics',
    role: 'Logistics Coordinator',
    cardType: 'employee',
    status: 'active',
    avatarInitials: 'NK',
    avatarColor: '#8b5cf6',
    registeredAt: '2024-06-01',
  },
  {
    cardId: 'CARD-00720',
    employeeId: 'VIS-2024-188',
    name: 'Eko Prasetyo',
    department: 'Visitor',
    division: 'External',
    role: 'Business Partner',
    cardType: 'visitor',
    status: 'active',
    avatarInitials: 'EP',
    avatarColor: '#f97316',
    registeredAt: '2024-10-23',
  },
  {
    cardId: 'CARD-00815',
    employeeId: 'EMP-2023-057',
    name: 'Fitriani Hamid',
    department: 'Engineering',
    division: 'Quality Assurance',
    role: 'QA Engineer',
    cardType: 'employee',
    status: 'inactive',
    avatarInitials: 'FH',
    avatarColor: '#64748b',
    registeredAt: '2023-05-18',
  },
];

// Initial active detections — semua 8 kartu aktif, jarak 50 meter, tersebar ke 7 gateway
export const INITIAL_DETECTIONS = [
  {
    id: 'DET-001',
    cardId: 'CARD-00128',
    gatewayId: 'GW-01',
    detectedAt: new Date(Date.now() - 180000).toISOString(),
    distanceAvailable: true,
    distance: 50,
    isActive: true,
    isSimulated: true,
  },
  {
    id: 'DET-002',
    cardId: 'CARD-00245',
    gatewayId: 'GW-02',
    detectedAt: new Date(Date.now() - 95000).toISOString(),
    distanceAvailable: true,
    distance: 50,
    isActive: true,
    isSimulated: true,
  },
  {
    id: 'DET-003',
    cardId: 'CARD-00312',
    gatewayId: 'GW-05',
    detectedAt: new Date(Date.now() - 45000).toISOString(),
    distanceAvailable: true,
    distance: 50,
    isActive: true,
    isSimulated: true,
  },
  {
    id: 'DET-004',
    cardId: 'CARD-00534',
    gatewayId: 'GW-02',
    detectedAt: new Date(Date.now() - 12000).toISOString(),
    distanceAvailable: true,
    distance: 50,
    isActive: true,
    isSimulated: true,
  },
  {
    id: 'DET-005',
    cardId: 'CARD-00489',
    gatewayId: 'GW-03',
    detectedAt: new Date(Date.now() - 300000).toISOString(),
    distanceAvailable: true,
    distance: 50,
    isActive: true,
    isSimulated: true,
  },
  {
    id: 'DET-006',
    cardId: 'CARD-00671',
    gatewayId: 'GW-04',
    detectedAt: new Date(Date.now() - 60000).toISOString(),
    distanceAvailable: true,
    distance: 50,
    isActive: true,
    isSimulated: true,
  },
  {
    id: 'DET-007',
    cardId: 'CARD-00720',
    gatewayId: 'GW-06',
    detectedAt: new Date(Date.now() - 130000).toISOString(),
    distanceAvailable: true,
    distance: 50,
    isActive: true,
    isSimulated: true,
  },
  {
    id: 'DET-008',
    cardId: 'CARD-00815',
    gatewayId: 'GW-07',
    detectedAt: new Date(Date.now() - 25000).toISOString(),
    distanceAvailable: true,
    distance: 50,
    isActive: true,
    isSimulated: true,
  },
];

// Historical detections for the table
export const generateHistoryRecords = () => {
  const history = [];
  const now = Date.now();
  const events = [
    { cardId: 'CARD-00128', gatewayId: 'GW-01', minsAgo: 3 },
    { cardId: 'CARD-00245', gatewayId: 'GW-01', minsAgo: 8 },
    { cardId: 'CARD-00671', gatewayId: 'GW-05', minsAgo: 15 },
    { cardId: 'CARD-00312', gatewayId: 'GW-05', minsAgo: 22 },
    { cardId: 'CARD-00534', gatewayId: 'GW-02', minsAgo: 30 },
    { cardId: 'CARD-00720', gatewayId: 'GW-01', minsAgo: 45 },
    { cardId: 'CARD-00489', gatewayId: 'GW-03', minsAgo: 60 },
    { cardId: 'CARD-00128', gatewayId: 'GW-05', minsAgo: 78 },
    { cardId: 'CARD-00815', gatewayId: 'GW-01', minsAgo: 95 },
    { cardId: 'CARD-00671', gatewayId: 'GW-03', minsAgo: 120 },
    { cardId: 'CARD-00312', gatewayId: 'GW-01', minsAgo: 145 },
    { cardId: 'CARD-00245', gatewayId: 'GW-05', minsAgo: 160 },
    { cardId: 'CARD-00534', gatewayId: 'GW-02', minsAgo: 185 },
    { cardId: 'CARD-00720', gatewayId: 'GW-01', minsAgo: 220 },
    { cardId: 'CARD-00128', gatewayId: 'GW-02', minsAgo: 260 },
    { cardId: 'CARD-00489', gatewayId: 'GW-05', minsAgo: 310 },
    { cardId: 'CARD-00671', gatewayId: 'GW-01', minsAgo: 360 },
    { cardId: 'CARD-00128', gatewayId: 'GW-03', minsAgo: 420 },
    { cardId: 'CARD-00312', gatewayId: 'GW-05', minsAgo: 480 },
    { cardId: 'CARD-00245', gatewayId: 'GW-02', minsAgo: 540 },
  ];

  events.forEach((ev, idx) => {
    const holder = CARD_HOLDERS.find(h => h.cardId === ev.cardId);
    const gw = GATEWAYS.find(g => g.id === ev.gatewayId);
    history.push({
      id: `HIST-${String(idx + 1).padStart(3, '0')}`,
      cardId: ev.cardId,
      holderName: holder?.name || 'Unknown',
      department: holder?.department || '—',
      gatewayId: ev.gatewayId,
      gatewayName: gw?.name || '—',
      location: gw?.location || '—',
      detectedAt: new Date(now - ev.minsAgo * 60000).toISOString(),
      distanceAvailable: false,
      distance: null,
      cardStatus: holder?.status || 'unknown',
      cardType: holder?.cardType || 'employee',
      isSimulated: true,
    });
  });

  return history;
};

// Extra cards available for simulation
export const EXTRA_CARDS_FOR_SIM = ['CARD-00671', 'CARD-00720', 'CARD-00815'];

export const getCardHolder = (cardId) => CARD_HOLDERS.find(h => h.cardId === cardId);
export const getGateway = (gatewayId) => GATEWAYS.find(g => g.id === gatewayId);

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
  if (secs < 60) return `${secs}d lalu`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j lalu`;
  return `${Math.floor(hrs / 24)}h lalu`;
};

export const STATUS_COLORS = {
  connected: { text: 'text-emerald-400', bg: 'bg-emerald-500', badge: 'badge-connected' },
  disconnected: { text: 'text-slate-400', bg: 'bg-slate-500', badge: 'badge-disconnected' },
  connecting: { text: 'text-amber-400', bg: 'bg-amber-500', badge: 'badge-connecting' },
  error: { text: 'text-rose-400', bg: 'bg-rose-500', badge: 'badge-error' },
};
