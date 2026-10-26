import React, { useState, useMemo } from 'react';
import { Radio } from 'lucide-react';
import { getCardHolder } from '../data/simulationData';

const GW_POSITIONS = {
  'GW-01': { x: 50, y: 46, label: 'Lobby Utama' },
  'GW-02': { x: 78, y: 28, label: 'Ruang Server' },
  'GW-03': { x: 22, y: 28, label: 'Ruang Rapat' },
  'GW-04': { x: 50, y: 76, label: 'Area Parkir' },
  'GW-05': { x: 22, y: 70, label: 'Kantin' },
  'GW-06': { x: 78, y: 70, label: 'Gudang' },
  'GW-07': { x: 50, y: 16, label: 'Pintu Belakang' },
};

const getCardPosition = (cardId, gatewayId, index, total) => {
  const gw = GW_POSITIONS[gatewayId] || { x: 50, y: 50 };
  const angle = (index / (total || 1)) * 2 * Math.PI + (cardId.charCodeAt(5) * 0.35);
  const radius = 6.5 + (index % 3) * 2;
  return {
    x: gw.x + Math.cos(angle) * radius,
    y: gw.y + Math.sin(angle) * radius,
  };
};

const GatewayNode = ({ gw, isSelected, onClick, cardCount, isDark }) => {
  const pos = GW_POSITIONS[gw.id] || { x: 50, y: 50 };
  const statusColor = {
    connected: '#15803D',
    disconnected: '#94A3B8',
    connecting: '#B45309',
    error: '#BE123C',
  }[gw.status] || '#94A3B8';

  return (
    <g
      transform={`translate(${pos.x}, ${pos.y})`}
      className="cursor-pointer select-none group"
      onClick={() => onClick(gw.id)}
    >
      {/* Range outline */}
      {gw.status === 'connected' && (
        <>
          <circle r="14" fill={`${statusColor}0A`} stroke={statusColor} strokeWidth="0.4" strokeDasharray="2 2" opacity="0.6" />
          <circle r="7" fill={`${statusColor}14`} stroke={statusColor} strokeWidth="0.5" strokeDasharray="1 1" opacity="0.8" />
        </>
      )}

      {/* Selected Indicator Ring (does not resize or shift the node) */}
      {isSelected && (
        <circle
          r="5.6"
          fill="none"
          stroke="#4F46E5"
          strokeWidth="0.9"
          strokeDasharray="2 1.5"
        />
      )}

      {/* Gateway center circle (Fixed radius, zero scaling jitter) */}
      <circle
        r="3.5"
        fill={statusColor}
        stroke={isSelected ? '#4F46E5' : (isDark ? '#111827' : '#FFFFFF')}
        strokeWidth={isSelected ? 1.5 : 1}
        className="transition-colors"
      />

      {/* ID Label */}
      <text
        x="0" y="6.4"
        textAnchor="middle"
        fontSize="2.4"
        fill={isDark ? '#F8FAFC' : '#0F172A'}
        fontFamily="'Inter', system-ui, -apple-system, sans-serif"
        fontWeight="700"
        style={{ pointerEvents: 'none' }}
      >
        {gw.id}
      </text>

      {/* Name Label */}
      <text
        x="0" y="-5.2"
        textAnchor="middle"
        fontSize="2"
        fill={statusColor}
        fontFamily="'Inter', system-ui, -apple-system, sans-serif"
        fontWeight="600"
        style={{ pointerEvents: 'none' }}
      >
        {GW_POSITIONS[gw.id]?.label}
      </text>

      {/* Card count badge */}
      {cardCount > 0 && (
        <>
          <circle cx="4.2" cy="-4" r="2.2" fill="#4F46E5" stroke={isDark ? '#111827' : '#FFFFFF'} strokeWidth="0.6" />
          <text x="4.2" y="-3.3" textAnchor="middle" fontSize="2.1" fill="#FFFFFF" fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontWeight="800">
            {cardCount}
          </text>
        </>
      )}
    </g>
  );
};

const GatewayRangeMap = ({ activeDetections, gateways, theme }) => {
  const [selectedGw, setSelectedGw] = useState(null);
  const [simulatedRadius, setSimulatedRadius] = useState(50);
  const isDark = theme === 'dark';

  const cardsByGateway = useMemo(() => {
    const map = {};
    activeDetections.forEach(det => {
      if (!map[det.gatewayId]) map[det.gatewayId] = [];
      map[det.gatewayId].push(det);
    });
    return map;
  }, [activeDetections]);

  const selectedGwData = gateways.find(g => g.id === selectedGw);
  const selectedCards = selectedGw ? (cardsByGateway[selectedGw] || []) : [];

  return (
    <div className="card-container p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">
            <Radio size={18} className="text-[var(--brand)]" />
            Peta Jangkauan & Radar Gateway
          </h2>
          <p className="section-subtitle">
            Visualisasi area monitoring dan sebaran kartu karyawan yang terdeteksi
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--brand-bg)] text-[var(--brand)] border border-[var(--brand-border)]">
          RADAR MONITORING
        </span>
      </div>

      {/* Main Grid: items-start prevents left map from stretching/jumping when right panel updates */}
      <div className="flex flex-col lg:flex-row items-start gap-5">
        {/* SVG Floorplan Canvas Container */}
        <div
          className={`flex-1 w-full rounded-2xl overflow-hidden border border-[var(--border-subtle)] relative shadow-xs ${
            isDark ? 'bg-slate-950' : 'bg-[#F8FAFC]'
          }`}
        >
          {/* Strict 1:1 aspect ratio container so map dimensions never change when selecting gateways */}
          <div className="w-full aspect-square max-h-[540px] flex items-center justify-center p-2.5 mx-auto">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full block"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <pattern id="archGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke={isDark ? '#1F2937' : '#E5EAF2'} strokeWidth="0.35" />
                </pattern>
              </defs>

              {/* Background Grid */}
              <rect width="100" height="100" fill={isDark ? '#0B1120' : '#F4F6FB'} />
              <rect width="100" height="100" fill="url(#archGrid)" />

              {/* Perimeter Boundary */}
              <rect
                x="5" y="5" width="90" height="90" rx="3"
                fill="none"
                stroke={isDark ? '#374151' : '#CBD5E1'}
                strokeWidth="0.8"
              />

              {/* Zone Compartments */}
              <rect x="5" y="5" width="44" height="44" fill={isDark ? '#111827' : '#FFFFFF'} stroke={isDark ? '#1F2937' : '#E5EAF2'} strokeWidth="0.5" rx="2" />
              <rect x="51" y="5" width="44" height="44" fill={isDark ? '#111827' : '#FFFFFF'} stroke={isDark ? '#1F2937' : '#E5EAF2'} strokeWidth="0.5" rx="2" />
              <rect x="5" y="51" width="44" height="44" fill={isDark ? '#111827' : '#FFFFFF'} stroke={isDark ? '#1F2937' : '#E5EAF2'} strokeWidth="0.5" rx="2" />
              <rect x="51" y="51" width="44" height="44" fill={isDark ? '#111827' : '#FFFFFF'} stroke={isDark ? '#1F2937' : '#E5EAF2'} strokeWidth="0.5" rx="2" />

              {/* Zone Corner Labels - Placed in room corners to never overlap with nodes */}
              <text x="8" y="10" textAnchor="start" fontSize="2.3" fill={isDark ? '#64748B' : '#94A3B8'} fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontWeight="700" letterSpacing="0.04em">ZONA LAB & R&D</text>
              <text x="54" y="10" textAnchor="start" fontSize="2.3" fill={isDark ? '#64748B' : '#94A3B8'} fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontWeight="700" letterSpacing="0.04em">RUANG SERVER DATA</text>
              <text x="8" y="56" textAnchor="start" fontSize="2.3" fill={isDark ? '#64748B' : '#94A3B8'} fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontWeight="700" letterSpacing="0.04em">AREA KANTIN & REST</text>
              <text x="54" y="56" textAnchor="start" fontSize="2.3" fill={isDark ? '#64748B' : '#94A3B8'} fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontWeight="700" letterSpacing="0.04em">LOGISTIK & GUDANG</text>

              {/* Simulated Interactive Radius Circle */}
              {selectedGw && GW_POSITIONS[selectedGw] && (
                <circle
                  cx={GW_POSITIONS[selectedGw].x}
                  cy={GW_POSITIONS[selectedGw].y}
                  r={simulatedRadius}
                  fill="rgba(79, 70, 229, 0.12)"
                  stroke="#4F46E5"
                  strokeWidth="0.7"
                  strokeDasharray="2 1.5"
                />
              )}

              {/* Gateway Nodes */}
              {gateways.map(gw => (
                <GatewayNode
                  key={gw.id}
                  gw={gw}
                  isSelected={selectedGw === gw.id}
                  onClick={(id) => setSelectedGw(prev => prev === id ? null : id)}
                  cardCount={(cardsByGateway[gw.id] || []).length}
                  isDark={isDark}
                />
              ))}

              {/* Card Dots */}
              {activeDetections.map((det) => {
                const cards = cardsByGateway[det.gatewayId] || [];
                const pos = getCardPosition(det.cardId, det.gatewayId, cards.indexOf(det), cards.length);
                const holder = getCardHolder(det.cardId);
                return (
                  <g key={det.id} transform={`translate(${pos.x}, ${pos.y})`}>
                    <circle
                      r="2.2"
                      fill={holder?.avatarColor || '#4F46E5'}
                      stroke={isDark ? '#111827' : '#FFFFFF'}
                      strokeWidth="0.7"
                    />
                    <text
                      x="0" y="-3"
                      textAnchor="middle"
                      fontSize="1.9"
                      fill={isDark ? '#F8FAFC' : '#0F172A'}
                      fontFamily="'Inter', system-ui, -apple-system, sans-serif"
                      fontWeight="700"
                      style={{ pointerEvents: 'none' }}
                    >
                      {holder?.avatarInitials}
                    </text>
                  </g>
                );
              })}

              {/* Map Legend */}
              <g transform="translate(6, 94)">
                <circle cx="0" cy="0" r="1.3" fill="#15803D" />
                <text x="2.5" y="0.6" fontSize="2.2" fill={isDark ? '#94A3B8' : '#475569'} fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontWeight="600">Online</text>
                <circle cx="16" cy="0" r="1.3" fill="#B45309" />
                <text x="18.5" y="0.6" fontSize="2.2" fill={isDark ? '#94A3B8' : '#475569'} fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontWeight="600">Connecting</text>
                <circle cx="34" cy="0" r="1.3" fill="#BE123C" />
                <text x="36.5" y="0.6" fontSize="2.2" fill={isDark ? '#94A3B8' : '#475569'} fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontWeight="600">Error</text>
                <circle cx="48" cy="0" r="1.3" fill="#94A3B8" />
                <text x="50.5" y="0.6" fontSize="2.2" fill={isDark ? '#94A3B8' : '#475569'} fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontWeight="600">Offline</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Right Controls & Focus Panel - fixed width prevents any horizontal shift */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
          {/* Radius Slider Card */}
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--text-primary)]">Kalibrasi Radius Sensor</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-[var(--brand-bg)] text-[var(--brand)] border border-[var(--brand-border)]">
                {simulatedRadius} meter
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={simulatedRadius}
              onChange={e => setSimulatedRadius(Number(e.target.value))}
              className="w-full accent-[var(--brand)] cursor-pointer"
              id="slider-radius"
            />
            <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
              *Pengaturan parameter visual jangkauan deteksi sensor Gateway pada denah area perusahaan.
            </p>
          </div>

          {/* Gateway Selector List */}
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shadow-xs">
            <div className="text-xs font-bold text-[var(--text-primary)] mb-2.5">
              Pilih Gateway untuk Fokus:
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {gateways.map(gw => {
                const count = (cardsByGateway[gw.id] || []).length;
                const statusColor = {
                  connected: 'bg-[var(--success)]',
                  disconnected: 'bg-[var(--text-muted)]',
                  connecting: 'bg-[var(--warning)]',
                  error: 'bg-[var(--danger)]',
                }[gw.status];

                const isSelected = selectedGw === gw.id;

                return (
                  <button
                    key={gw.id}
                    onClick={() => setSelectedGw(prev => prev === gw.id ? null : gw.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-[var(--bg-surface)] border border-[var(--brand)] text-[var(--brand)] shadow-xs font-bold'
                        : 'hover:bg-[var(--bg-hover)] border border-transparent text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
                    <span className="flex-1 text-left truncate">{gw.name}</span>
                    <span className="font-mono text-xs text-[var(--text-muted)]">{gw.ip}</span>
                    {count > 0 && (
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-[var(--brand-bg)] text-[var(--brand)] font-bold text-xs">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dedicated Selected Gateway Detail Box (Never causes height popping) */}
          <div className={`p-4 rounded-xl border transition-all ${
            selectedGwData
              ? 'bg-[var(--bg-surface)] border-[var(--brand-border)] shadow-xs'
              : 'bg-[var(--bg-subtle)] border-dashed border-[var(--border-subtle)]'
          }`}>
            {selectedGwData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{selectedGwData.name}</span>
                  <span className="text-xs font-mono font-bold text-[var(--brand)]">{selectedGwData.id}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">IP Gateway</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{selectedGwData.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Lokasi</span>
                    <span className="font-medium text-[var(--text-secondary)]">{selectedGwData.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Kartu Aktif</span>
                    <span className="font-bold text-[var(--brand)]">{selectedCards.length} kartu</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-2.5 text-xs text-[var(--text-muted)]">
                Pilih Gateway pada peta atau daftar untuk melihat detail fokus
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatewayRangeMap;
