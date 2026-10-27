import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Radio,
  Layers,
  Crosshair,
  Wifi,
  Clock,
  Hash,
  Building2,
  Users,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sliders,
  Lock,
} from 'lucide-react';
import { getCardHolder, formatTime, timeAgo } from '../data/simulationData';

// Map tile layers - Default Satellite for Lamongan Shorebase port
const MAP_LAYERS = {
  satellite: {
    name: 'Citra Satelit (Esri)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP',
    maxZoom: 18,
  },
  osm: {
    name: 'OpenStreetMap Jalan',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  dark: {
    name: 'Peta Gelap (Dark Mode)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  light: {
    name: 'Peta Terang (Positron)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 20,
    subdomains: 'abcd',
  },
};

const getStatusColor = (status) => {
  switch (status) {
    case 'connected':
      return { border: '#15803D', fill: '#15803D', label: 'Online', bgClass: 'bg-emerald-500' };
    case 'connecting':
      return { border: '#B45309', fill: '#B45309', label: 'Warning', bgClass: 'bg-amber-500' };
    case 'error':
      return { border: '#BE123C', fill: '#BE123C', label: 'Error', bgClass: 'bg-rose-500' };
    default:
      return { border: '#94A3B8', fill: '#94A3B8', label: 'Offline', bgClass: 'bg-slate-400' };
  }
};

// Calculate approximate GPS offset for cards inside the gateway's radius without covering gateway beacon
const getCardCoordinate = (baseLat, baseLng, index, total) => {
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI + (index * 0.7);
  const distanceMeters = 18 + (index % 3) * 10; // 18m to 38m offset
  const deltaLat = (distanceMeters * Math.cos(angle)) * 0.000009;
  const deltaLng = (distanceMeters * Math.sin(angle)) * 0.0000095;
  return [baseLat + deltaLat, baseLng + deltaLng];
};

const GatewayRangeMap = ({
  activeDetections = [],
  gateways = [],
  theme = 'light',
  onUpdateGatewayPosition,
  onResetGatewayPositions,
  onAddNotification,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const circlesLayerGroupRef = useRef(null);
  const cardMarkersGroupRef = useRef(null);
  const gatewayMarkersMapRef = useRef({});

  const [selectedGwId, setSelectedGwId] = useState(null);
  const [simulatedRadius, setSimulatedRadius] = useState(50);
  const [showRadius, setShowRadius] = useState(true);
  const [showCardPins, setShowCardPins] = useState(true);
  const [activeTileType, setActiveTileType] = useState('satellite'); // Satellite view as requested

  const isDark = theme === 'dark';

  // Group active detections by gatewayId
  const cardsByGateway = useMemo(() => {
    const map = {};
    activeDetections.forEach(det => {
      if (!map[det.gatewayId]) map[det.gatewayId] = [];
      map[det.gatewayId].push(det);
    });
    return map;
  }, [activeDetections]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // PT Eastern Logistics — Lamongan Shorebase, Paciran, Jawa Timur
      const defaultCenter = [-6.8665, 112.4168];
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 16,
        zoomControl: false,
        attributionControl: true,
      });

      // Add Zoom control on top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      // Create Layer Groups
      const circlesGroup = L.layerGroup().addTo(map);
      const gwMarkersGroup = L.layerGroup().addTo(map);
      const cardMarkersGroup = L.layerGroup().addTo(map);

      circlesLayerGroupRef.current = circlesGroup;
      markersLayerGroupRef.current = gwMarkersGroup;
      cardMarkersGroupRef.current = cardMarkersGroup;
      mapInstanceRef.current = map;

      // Auto-fit to all gateway positions on first load
      if (gateways.length > 0) {
        const bounds = L.latLngBounds(
          gateways.map(g => [g.lat || defaultCenter[0], g.lng || defaultCenter[1]])
        );
        setTimeout(() => {
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17, animate: true });
        }, 300);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when activeTileType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const layerConfig = MAP_LAYERS[activeTileType] || MAP_LAYERS.satellite;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTileLayer = L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: layerConfig.maxZoom || 19,
      subdomains: layerConfig.subdomains || 'abc',
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [activeTileType]);

  // Render Gateways and Radius Circles
  useEffect(() => {
    const map = mapInstanceRef.current;
    const circlesGroup = circlesLayerGroupRef.current;
    const gwMarkersGroup = markersLayerGroupRef.current;
    const cardGroup = cardMarkersGroupRef.current;

    if (!map || !circlesGroup || !gwMarkersGroup || !cardGroup) return;

    circlesGroup.clearLayers();
    gwMarkersGroup.clearLayers();
    cardGroup.clearLayers();
    gatewayMarkersMapRef.current = {};

    gateways.forEach((gw) => {
      const lat = gw.lat || -6.8678;
      const lng = gw.lng || 112.4168;
      const statusInfo = getStatusColor(gw.status);
      const detectedList = cardsByGateway[gw.id] || [];
      const isSelected = selectedGwId === gw.id;

      // 1. Draw Sensor Coverage Circle
      if (showRadius) {
        const circle = L.circle([lat, lng], {
          radius: simulatedRadius,
          color: isSelected ? '#4F46E5' : statusInfo.border,
          weight: isSelected ? 2.5 : 1.5,
          dashArray: isSelected ? '6, 4' : '4, 4',
          fillColor: isSelected ? '#4F46E5' : statusInfo.fill,
          fillOpacity: isSelected ? 0.22 : 0.14,
        });

        circle.bindTooltip(
          `<div class="text-xs font-semibold px-1">${gw.name} &bull; Radius ${simulatedRadius}m</div>`,
          { sticky: true, opacity: 0.95 }
        );
        circlesGroup.addLayer(circle);
      }

      // 2. Custom Beacon DivIcon Marker
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer select-none" style="width: 46px; height: 46px;">
          ${
            gw.status === 'connected'
              ? `<div class="absolute inset-0 rounded-full gw-pulse-ring" style="background-color: ${statusInfo.border}; opacity: 0.4;"></div>`
              : ''
          }
          <div class="relative w-9 h-9 rounded-full flex flex-col items-center justify-center shadow-lg transition-transform duration-200 ${
            isSelected ? 'scale-110 ring-4 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : 'hover:scale-105'
          }" style="background-color: ${isDark ? '#0F172A' : '#FFFFFF'}; border: 2.5px solid ${statusInfo.border};">
            <span class="text-[10px] font-black leading-none ${isDark ? 'text-white' : 'text-slate-900'}">${gw.id.replace('GW-', '')}</span>
            <span class="w-1.5 h-1.5 rounded-full mt-0.5" style="background-color: ${statusInfo.border};"></span>
          </div>
          ${
            detectedList.length > 0
              ? `<div class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 z-10">
                  ${detectedList.length}
                </div>`
              : ''
          }
        </div>
      `;

      const beaconIcon = L.divIcon({
        className: 'custom-gw-marker',
        html: iconHtml,
        iconSize: [46, 46],
        iconAnchor: [23, 23],
        popupAnchor: [0, -23],
      });

      const marker = L.marker([lat, lng], {
        icon: beaconIcon,
        draggable: false, // Terkunci paten (tidak bisa digeser-geser)
        zIndexOffset: 1000, // Gateway marker always stays above card markers
      });

      // Rich Gateway Popup
      const popupHtml = `
        <div class="p-1 min-w-[220px] font-sans">
          <div class="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
            <div>
              <div class="text-xs font-bold text-slate-900 dark:text-white">${gw.name}</div>
              <div class="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">${gw.id} &bull; ${gw.ip}</div>
            </div>
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style="background-color: ${statusInfo.border}">
              ${statusInfo.label}
            </span>
          </div>
          <div class="space-y-1 text-xs text-slate-600 dark:text-slate-300">
            <div class="flex justify-between">
              <span class="text-slate-400">Lokasi:</span>
              <span class="font-medium text-slate-800 dark:text-slate-200">${gw.location}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Jangkauan:</span>
              <span class="font-semibold text-indigo-600 dark:text-indigo-400">${simulatedRadius} Meter</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Sinyal / Latensi:</span>
              <span class="font-mono font-medium">${gw.signalStrength || 0}% &bull; ${gw.latency || 0}ms</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Kartu Terdeteksi:</span>
              <span class="font-bold text-emerald-600 dark:text-emerald-400">${detectedList.length} Kartu Aktif</span>
            </div>
          </div>
          ${
            detectedList.length > 0
              ? `<div class="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div class="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kartu di Radius:</div>
                  <div class="max-h-24 overflow-y-auto space-y-1">
                    ${detectedList
                      .map((det) => {
                        const h = getCardHolder(det.cardId);
                        return `
                          <div class="flex items-center justify-between text-[11px] py-0.5 px-1.5 rounded bg-slate-50 dark:bg-slate-800/60">
                            <span class="font-semibold text-slate-800 dark:text-slate-200 truncate">${h?.name || det.cardId}</span>
                            <span class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 ml-2 font-bold">${det.cardId}</span>
                          </div>
                        `;
                      })
                      .join('')}
                  </div>
                </div>`
              : ''
          }
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => {
        setSelectedGwId(gw.id);
      });

      gwMarkersGroup.addLayer(marker);
      gatewayMarkersMapRef.current[gw.id] = marker;

      // 3. Render Card Markers if toggled
      if (showCardPins && detectedList.length > 0) {
        detectedList.forEach((det, idx) => {
          const cardCoord = getCardCoordinate(lat, lng, idx, detectedList.length);
          const holder = getCardHolder(det.cardId) || {
            name: det.cardHolder || 'Pemegang Kartu',
            cardId: det.cardId,
            employeeId: 'EMP-XXX',
            department: 'Umum',
            avatarInitials: (det.cardId || 'ID').slice(0, 2),
            cardType: 'employee',
          };

          const cardHtml = `
            <div class="cursor-pointer group flex items-center justify-center" style="width: 26px; height: 26px;">
              <div class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] shadow-md border-2 border-white dark:border-slate-900 transition-transform group-hover:scale-125" style="background-color: ${
                holder.cardType === 'visitor' ? '#F97316' : '#4F46E5'
              }; color: #FFFFFF;">
                ${holder.avatarInitials || 'ID'}
              </div>
            </div>
          `;

          const cardIcon = L.divIcon({
            className: 'custom-card-marker',
            html: cardHtml,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
            popupAnchor: [0, -13],
          });

          const cardMarker = L.marker(cardCoord, { icon: cardIcon, zIndexOffset: 200 });

          const cardPopup = `
            <div class="p-1 min-w-[200px] font-sans">
              <div class="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-slate-200 dark:border-slate-800">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white" style="background-color: ${
                  holder.cardType === 'visitor' ? '#F97316' : '#4F46E5'
                }">
                  ${holder.avatarInitials || 'ID'}
                </div>
                <div>
                  <div class="text-xs font-bold text-slate-900 dark:text-white">${holder.name}</div>
                  <div class="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">${holder.cardId}</div>
                </div>
              </div>
              <div class="text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
                <div><strong class="text-slate-400">NIP / ID:</strong> ${holder.employeeId}</div>
                <div><strong class="text-slate-400">Departemen:</strong> ${holder.department}</div>
                <div><strong class="text-slate-400">Terdeteksi di:</strong> ${gw.name}</div>
                <div><strong class="text-slate-400">Waktu:</strong> ${formatTime(det.detectedAt)} (${timeAgo(det.detectedAt)})</div>
              </div>
            </div>
          `;

          cardMarker.bindPopup(cardPopup);
          cardMarker.bindTooltip(
            `<span class="text-xs font-bold">${holder.name}</span> <span class="text-[10px] text-slate-400 font-mono">(${holder.cardId})</span>`,
            { direction: 'top', offset: [0, -10] }
          );

          cardGroup.addLayer(cardMarker);
        });
      }
    });
  }, [gateways, activeDetections, simulatedRadius, showRadius, showCardPins, selectedGwId, isDark]);

  // Recenter / Fit All Gateways
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map || gateways.length === 0) return;

    const bounds = L.latLngBounds(
      gateways.map(g => [g.lat || -6.8665, g.lng || 112.4168])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 17, animate: true });
    setSelectedGwId(null);
  };

  // Focus a specific gateway
  const handleFocusGateway = (gwId) => {
    const map = mapInstanceRef.current;
    const targetGw = gateways.find(g => g.id === gwId);
    if (!map || !targetGw) return;

    setSelectedGwId(gwId);
    const lat = targetGw.lat || -6.8665;
    const lng = targetGw.lng || 112.4168;

    map.flyTo([lat, lng], 17, { duration: 0.8 });

    const marker = gatewayMarkersMapRef.current[gwId];
    if (marker) {
      setTimeout(() => {
        marker.openPopup();
      }, 850);
    }
  };

  const selectedGwData = gateways.find(g => g.id === selectedGwId);
  const selectedCards = selectedGwId ? (cardsByGateway[selectedGwId] || []) : [];

  return (
    <div className="card-container p-5 space-y-4">
      {/* Header - Clean as original */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="section-title">
            <Radio size={18} className="text-[var(--brand)]" />
            Peta Geografis Jangkauan Sensor Gateway
          </h2>
          <p className="section-subtitle">
            Pemetaan sensor Gateway di kawasan PT Eastern Logistics — Lamongan Shorebase, Paciran, Jawa Timur
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRecenter}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Pusatkan peta ke semua gateway"
          >
            <Crosshair size={13} className="text-[var(--brand)]" />
            Pusatkan Peta
          </button>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--brand-bg)] text-[var(--brand)] border border-[var(--brand-border)]">
            LIVE MAP
          </span>
        </div>
      </div>

      {/* Control Bar: Layer Selector + Radius & Card Toggles */}
      <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
        {/* Layer Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-xs font-bold text-[var(--text-secondary)] mr-1">
            <Layers size={14} className="text-[var(--brand)]" />
            Lapisan Peta:
          </div>
          {Object.entries(MAP_LAYERS).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setActiveTileType(key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                activeTileType === key
                  ? 'bg-[var(--brand)] text-white font-bold shadow-2xs'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
              }`}
            >
              {key === 'satellite' ? 'Citra Satelit' : key === 'osm' ? 'Jalan' : key === 'dark' ? 'Mode Gelap' : 'Positron'}
            </button>
          ))}
        </div>

        {/* Visibility Toggles */}
        <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)] flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showRadius}
              onChange={(e) => setShowRadius(e.target.checked)}
              className="accent-[var(--brand)] rounded cursor-pointer"
            />
            <span>Radius Jangkauan ({simulatedRadius}m)</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showCardPins}
              onChange={(e) => setShowCardPins(e.target.checked)}
              className="accent-[var(--brand)] rounded cursor-pointer"
            />
            <span>Pin Kartu Terdeteksi</span>
          </label>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Right Focus Panel */}
      <div className="flex flex-col lg:flex-row items-start gap-5">
        {/* Real Leaflet Map Container */}
        <div className="flex-1 w-full rounded-2xl overflow-hidden border border-[var(--border-subtle)] relative shadow-xs min-h-[520px] h-[580px] bg-[var(--bg-subtle)]">
          <div ref={mapContainerRef} className="w-full h-full" style={{ zIndex: 1 }} />

          {/* Floating Map Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-[500] p-3 rounded-xl bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-subtle)] shadow-md text-xs space-y-1.5">
            <div className="text-[11px] font-bold text-[var(--text-primary)] mb-1">Status Sensor Gateway:</div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Online
              </span>
              <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span> Warning
              </span>
              <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Error
              </span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
              Lingkaran putus-putus = Area sensor radius {simulatedRadius} meter
            </div>
          </div>
        </div>

        {/* Right Controls & Focus Panel - Clean as original layout */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4">
          {/* Radius Slider Card */}
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--text-primary)]">Radius Sensor Jangkauan</span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-md bg-[var(--brand-bg)] text-[var(--brand)] border border-[var(--brand-border)]">
                {simulatedRadius} meter
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={simulatedRadius}
              onChange={(e) => setSimulatedRadius(Number(e.target.value))}
              className="w-full accent-[var(--brand)] cursor-pointer"
              id="slider-radius"
            />
            <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)] mt-1">
              <span>10m</span>
              <span>Default: 50m</span>
              <span>100m</span>
            </div>
          </div>

          {/* Gateway Focus List */}
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shadow-xs">
            <div className="text-xs font-bold text-[var(--text-primary)] mb-2.5 flex items-center justify-between">
              <span>Pilih Gateway untuk Fokus:</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">{gateways.length} Unit</span>
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {gateways.map((gw) => {
                const count = (cardsByGateway[gw.id] || []).length;
                const statusColor = {
                  connected: 'bg-[var(--success)]',
                  disconnected: 'bg-[var(--text-muted)]',
                  connecting: 'bg-[var(--warning)]',
                  error: 'bg-[var(--danger)]',
                }[gw.status] || 'bg-slate-400';

                const isSelected = selectedGwId === gw.id;

                return (
                  <button
                    key={gw.id}
                    onClick={() => handleFocusGateway(gw.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--bg-surface)] border border-[var(--brand)] text-[var(--brand)] shadow-xs font-bold'
                        : 'hover:bg-[var(--bg-hover)] border border-transparent text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`} />
                    <span className="flex-1 text-left truncate">{gw.name}</span>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">{gw.id}</span>
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

          {/* Dedicated Selected Gateway Detail Box */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              selectedGwData
                ? 'bg-[var(--bg-surface)] border-[var(--brand-border)] shadow-xs'
                : 'bg-[var(--bg-subtle)] border-dashed border-[var(--border-subtle)]'
            }`}
          >
            {selectedGwData ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{selectedGwData.name}</span>
                  <span className="text-xs font-mono font-bold text-[var(--brand)]">{selectedGwData.id}</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Status</span>
                    <span className="font-bold capitalize text-[var(--text-primary)]">{selectedGwData.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">IP Sensor</span>
                    <span className="font-mono font-bold text-[var(--text-primary)]">{selectedGwData.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Lokasi</span>
                    <span className="font-medium text-[var(--text-secondary)]">{selectedGwData.location}</span>
                  </div>
                  <div className="flex justify-between font-mono text-[11px]">
                    <span className="text-[var(--text-muted)]">Koordinat</span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      [{selectedGwData.lat?.toFixed(5)}, {selectedGwData.lng?.toFixed(5)}]
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--text-muted)]">Kartu dalam Jangkauan</span>
                    <span className="font-bold text-[var(--brand)]">{selectedCards.length} kartu</span>
                  </div>
                </div>

                {/* Status Posisi Peta Terkunci */}
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1.5 text-xs">
                  <div className="font-bold text-[var(--text-primary)] flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Lock size={13} className="text-emerald-600 dark:text-emerald-400" />
                      Status Posisi Peta:
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 size={10} /> TERKUNCI &amp; TETAP
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Posisi sensor Gateway ini telah ditetapkan secara permanen pada peta dan <strong>terkunci agar tidak dapat digeser-geser</strong> secara tidak sengaja.
                  </p>
                </div>

                {selectedCards.length > 0 && (
                  <div className="pt-2 border-t border-[var(--border-subtle)]">
                    <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
                      Daftar Kartu Terdeteksi:
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {selectedCards.map((c) => {
                        const h = getCardHolder(c.cardId);
                        return (
                          <div
                            key={c.id}
                            className="p-1.5 rounded-lg bg-[var(--bg-subtle)] flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold truncate text-[var(--text-primary)]">
                              {h?.name || c.cardId}
                            </span>
                            <span className="font-mono text-[10px] text-[var(--brand)] font-bold ml-1">
                              {c.cardId}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-[var(--text-muted)]">
                Klik salah satu Gateway pada peta atau daftar di atas untuk memfokuskan tampilan kamera peta
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatewayRangeMap;
