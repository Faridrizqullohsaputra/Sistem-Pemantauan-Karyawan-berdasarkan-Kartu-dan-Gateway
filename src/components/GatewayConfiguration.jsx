import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  TestTube,
  RotateCcw,
  Eye,
  EyeOff,
  Server,
  Globe,
  Loader2,
  MapPin,
  Radio,
  Sliders,
  CheckCircle2,
  Navigation,
  Compass,
  AlertCircle,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { GATEWAYS } from '../data/simulationData';

const AUTH_TYPES = ['Bearer Token', 'API Key', 'Basic Auth', 'No Authentication'];
const SERVICE_TYPES = ['HTTP', 'HTTPS', 'WebSocket', 'MQTT'];
const PACKET_SIZES = [256, 512, 1024, 2048, 4096];
const RADIUS_OPTIONS = [30, 45, 50, 60, 70, 85, 100];
const STATUS_OPTIONS = [
  { value: 'connected', label: 'Online (Connected)' },
  { value: 'connecting', label: 'Warning (Connecting / High Latency)' },
  { value: 'error', label: 'Offline (Disconnected / Error)' },
];

const GatewayConfigCard = ({ gw, onSelect, isSelected }) => {
  return (
    <button
      onClick={() => onSelect(gw)}
      className={`gw-list-card ${isSelected ? 'selected' : ''}`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            gw.status === 'connected'
              ? 'bg-emerald-500 ring-2 ring-emerald-500/20'
              : gw.status === 'connecting'
              ? 'bg-amber-500 ring-2 ring-amber-500/20'
              : 'bg-rose-500 ring-2 ring-rose-500/20'
          }`}
        />
        <span className="font-mono text-xs font-bold text-[var(--brand)]">{gw.id}</span>
        <span className="text-xs font-bold text-[var(--text-primary)] flex-1 truncate">{gw.name}</span>
      </div>

      <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] truncate mb-1">
        <MapPin size={11} className="flex-shrink-0 text-amber-500" />
        <span className="truncate">{gw.location}</span>
      </div>

      <div className="grid grid-cols-2 gap-1 text-[10px] text-[var(--text-muted)] font-mono font-medium pt-1 border-t border-[var(--border-subtle)]/60">
        <div>Lat: {gw.lat !== undefined ? Number(gw.lat).toFixed(4) : '-6.8678'}</div>
        <div>Lng: {gw.lng !== undefined ? Number(gw.lng).toFixed(4) : '112.4168'}</div>
      </div>
    </button>
  );
};

const GatewayConfiguration = ({
  gateways = [],
  onUpdateGateway,
  onAddGateway,
  onDeleteGateway,
  onAddNotification,
  initialSelectedGwId = null,
}) => {
  const [selectedGwId, setSelectedGwId] = useState(
    initialSelectedGwId || gateways[0]?.id
  );

  // Mode: false = edit existing, true = add new
  const [isAddingNew, setIsAddingNew] = useState(false);

  const activeGw = gateways.find(g => g.id === selectedGwId) || gateways[0] || {};

  const [form, setForm] = useState({
    name: '',
    ip: '',
    url: '',
    serviceAccess: 'HTTP',
    authType: 'Bearer Token',
    credential: '••••••••',
    maxPacketSize: 1024,
    radius: 50,
    status: 'connected',
    location: '',
    zone: '',
    lat: -6.8678,
    lng: 112.4168,
  });

  // Form for adding a new gateway
  const [newForm, setNewForm] = useState({
    name: '',
    ip: '',
    url: '',
    serviceAccess: 'HTTP',
    authType: 'Bearer Token',
    maxPacketSize: 1024,
    radius: 50,
    status: 'connected',
    location: '',
    zone: '',
    lat: -6.8678,
    lng: 112.4168,
  });
  const [addSaveStatus, setAddSaveStatus] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // gwId to confirm delete

  const [showCredential, setShowCredential] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  // Load gateway details into form when selection changes
  useEffect(() => {
    if (activeGw && activeGw.id) {
      setForm({
        name: activeGw.name || '',
        ip: activeGw.ip || '',
        url: activeGw.url || `http://${activeGw.ip || '10.1.5.13'}`,
        serviceAccess: activeGw.serviceAccess || 'HTTP',
        authType: activeGw.authType || 'Bearer Token',
        credential: '••••••••',
        maxPacketSize: activeGw.maxPacketSize || 1024,
        radius: activeGw.radius || 50,
        status: activeGw.status || 'connected',
        location: activeGw.location || '',
        zone: activeGw.zone || '',
        lat: activeGw.lat !== undefined ? activeGw.lat : -6.8678,
        lng: activeGw.lng !== undefined ? activeGw.lng : 112.4168,
      });
      setTestStatus(null);
      setSaveStatus(null);
    }
  }, [selectedGwId, activeGw.id]);

  const handleSelectGw = (gw) => {
    setSelectedGwId(gw.id);
    setIsAddingNew(false);
    setDeleteConfirm(null);
  };

  // Open add-new mode
  const handleOpenAddNew = () => {
    const nextNum = gateways.length + 1;
    const suggestedId = `GW-${String(nextNum).padStart(2, '0')}`;
    const takenIds = gateways.map(g => g.id);
    const safeId = takenIds.includes(suggestedId)
      ? `GW-${String(nextNum + 1).padStart(2, '0')}`
      : suggestedId;
    setNewForm({
      id: safeId,
      name: '',
      ip: '',
      url: '',
      serviceAccess: 'HTTP',
      authType: 'Bearer Token',
      maxPacketSize: 1024,
      radius: 50,
      status: 'connected',
      location: '',
      zone: '',
      lat: -6.8678,
      lng: 112.4168,
    });
    setAddSaveStatus(null);
    setIsAddingNew(true);
    setDeleteConfirm(null);
  };

  const handleCancelAddNew = () => {
    setIsAddingNew(false);
    setAddSaveStatus(null);
  };

  const handleSaveNewGateway = (e) => {
    e?.preventDefault();
    if (!newForm.name.trim() || (!newForm.url.trim() && !newForm.ip.trim())) {
      onAddNotification?.('warning', 'Validasi Gagal', 'Nama Gateway dan Alamat IP / URL wajib diisi.');
      return;
    }
    const parsedLat = parseFloat(newForm.lat);
    const parsedLng = parseFloat(newForm.lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      onAddNotification?.('warning', 'Koordinat Tidak Valid', 'Nilai Latitude dan Longitude harus berupa angka desimal koordinat GPS.');
      return;
    }
    setAddSaveStatus('saving');
    setTimeout(() => {
      const created = onAddGateway?.({ ...newForm, lat: parsedLat, lng: parsedLng });
      setAddSaveStatus('saved');
      setIsAddingNew(false);
      if (created?.id) {
        setSelectedGwId(created.id);
      }
      setNewForm({
        name: '',
        ip: '',
        url: '',
        serviceAccess: 'HTTP',
        authType: 'Bearer Token',
        maxPacketSize: 1024,
        radius: 50,
        status: 'connected',
        location: '',
        zone: '',
        lat: -6.8678,
        lng: 112.4168,
      });
      setTimeout(() => setAddSaveStatus(null), 2000);
    }, 350);
  };

  const handleDeleteGateway = (gwId) => {
    if (deleteConfirm === gwId) {
      onDeleteGateway?.(gwId);
      setDeleteConfirm(null);
      // Select next available gateway
      const remaining = gateways.filter(g => g.id !== gwId);
      if (remaining.length > 0) setSelectedGwId(remaining[0].id);
    } else {
      setDeleteConfirm(gwId);
    }
  };

  const handleResetToCurrent = () => {
    if (activeGw) {
      setForm({
        name: activeGw.name || '',
        ip: activeGw.ip || '',
        url: activeGw.url || '',
        serviceAccess: activeGw.serviceAccess || 'HTTP',
        authType: activeGw.authType || 'Bearer Token',
        credential: '••••••••',
        maxPacketSize: activeGw.maxPacketSize || 1024,
        radius: activeGw.radius || 50,
        status: activeGw.status || 'connected',
        location: activeGw.location || '',
        zone: activeGw.zone || '',
        lat: activeGw.lat !== undefined ? activeGw.lat : -6.8678,
        lng: activeGw.lng !== undefined ? activeGw.lng : 112.4168,
      });
      onAddNotification?.('info', 'Form Dikembalikan', `Form dikembalikan ke data tersimpan untuk ${activeGw.name}.`);
    }
  };

  const handleResetToDefaultFactory = () => {
    const defaultGw = GATEWAYS.find(g => g.id === activeGw.id);
    if (defaultGw) {
      setForm({
        name: defaultGw.name,
        ip: defaultGw.ip,
        url: defaultGw.url,
        serviceAccess: defaultGw.serviceAccess,
        authType: defaultGw.authType,
        credential: '••••••••',
        maxPacketSize: defaultGw.maxPacketSize,
        radius: defaultGw.radius,
        status: defaultGw.status,
        location: defaultGw.location,
        zone: defaultGw.zone || 'Shorebase Zone',
        lat: defaultGw.lat,
        lng: defaultGw.lng,
      });
      onAddNotification?.('info', 'Default Pabrik Dimuat', `Konfigurasi dan koordinat default untuk ${activeGw.id} siap disimpan.`);
    }
  };

  const handleTestConnection = async () => {
    const targetIp = (form.ip || '').trim();
    if (!form.url && !targetIp) {
      onAddNotification?.('warning', 'Validasi IP/URL', 'Alamat URL atau IP Gateway harus diisi.');
      return;
    }
    setTestStatus('testing');
    onAddNotification?.('info', 'Uji Jaringan', `Menguji komunikasi jaringan ke ${targetIp || form.url}...`);

    try {
      const res = await fetch(`/api/gateway/ping?ip=${encodeURIComponent(targetIp)}&id=${encodeURIComponent(activeGw?.id || selectedGwId || '')}`);
      const data = await res.json();

      if (data.success) {
        const ms = data.latency || 15;
        const ttl = data.ttl || 63;
        setTestStatus('success');
        setForm(prev => ({ ...prev, status: 'connected', latency: ms, signalStrength: 88, issue: undefined }));
        onAddNotification?.(
          'success',
          'Koneksi Berhasil!',
          `Perangkat ${form.name || targetIp} (${targetIp}) aktif & merespon! Latensi: ${ms}ms (TTL=${ttl}).`
        );
      } else {
        setTestStatus('failed');
        setForm(prev => ({
          ...prev,
          status: 'error',
          latency: null,
          signalStrength: 0,
          issue: 'Koneksi perangkat gateway terputus (RTO)',
        }));
        onAddNotification?.('error', 'Koneksi Gagal', `Tidak dapat terhubung ke ${targetIp}. Gateway tidak merespon (RTO). Status diterapkan Error.`);
      }
    } catch (err) {
      setTestStatus('failed');
      setForm(prev => ({
        ...prev,
        status: 'error',
        latency: null,
        signalStrength: 0,
        issue: 'Gagal menghubungi perangkat (Network Error)',
      }));
      onAddNotification?.('error', 'Koneksi Gagal', `Tidak dapat terhubung ke ${targetIp}. Status diterapkan Error.`);
    }
  };

  const handleSave = (e) => {
    e?.preventDefault();
    if (!form.name.trim() || (!form.url.trim() && !form.ip.trim())) {
      onAddNotification?.('warning', 'Validasi Gagal', 'Nama Gateway dan Alamat IP / URL wajib diisi.');
      return;
    }

    const parsedLat = parseFloat(form.lat);
    const parsedLng = parseFloat(form.lng);

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      onAddNotification?.('warning', 'Koordinat Tidak Valid', 'Nilai Latitude dan Longitude harus berupa angka desimal koordinat GPS.');
      return;
    }

    setSaveStatus('saving');
    setTimeout(() => {
      if (onUpdateGateway) {
        onUpdateGateway(activeGw.id, {
          ...form,
          lat: parsedLat,
          lng: parsedLng,
        });
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 3000);
    }, 350);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Page Header */}
      <div className="card-container p-5 bg-gradient-to-r from-indigo-900/10 via-purple-900/5 to-teal-900/10 border-[var(--border-subtle)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--brand)] text-white flex items-center justify-center shadow-md flex-shrink-0">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Konfigurasi Gateway &amp; Posisi Peta
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Kustomisasi parameter perangkat jaringan dan koreksi titik koordinat GPS pada peta
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <Compass size={13} />
              Koordinat &amp; Perangkat Dapat Diedit
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 items-stretch">
        {/* Left: Gateway Selection List */}
        <div className="w-full lg:w-80 flex-shrink-0 flex flex-col">
          <div className="card-container p-4 flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
              <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <Server size={14} className="text-[var(--brand)]" />
                Daftar Gateway (Pilih untuk Edit)
              </h3>
              <span className="text-[11px] text-[var(--text-muted)] font-mono font-bold">
                {gateways.length} Unit
              </span>
            </div>

            {/* Add New Gateway Button */}
            <button
              type="button"
              onClick={handleOpenAddNew}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-xs font-bold transition-all cursor-pointer ${
                isAddingNew
                  ? 'bg-[var(--brand-bg)] border-[var(--brand)] text-[var(--brand)]'
                  : 'border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--brand)] hover:text-[var(--brand)] hover:bg-[var(--brand-bg)]'
              }`}
            >
              <Plus size={14} />
              Tambah Gateway Baru
            </button>

            <div className="space-y-2 flex-1 overflow-y-auto pr-1">
              {gateways.map(gw => (
                <div key={gw.id} className="relative group">
                  <GatewayConfigCard
                    gw={gw}
                    onSelect={handleSelectGw}
                    isSelected={!isAddingNew && selectedGwId === gw.id}
                  />
                  {/* Delete button - appears on hover */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {deleteConfirm === gw.id ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDeleteGateway(gw.id)}
                          className="px-2 py-0.5 rounded-md bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold cursor-pointer flex items-center gap-1"
                          title="Konfirmasi hapus gateway"
                        >
                          <Trash2 size={10} /> Hapus?
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(null)}
                          className="p-0.5 rounded-md bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                          title="Batal"
                        >
                          <X size={12} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(gw.id); }}
                        className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 cursor-pointer"
                        title={`Hapus ${gw.name}`}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Configuration Form */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">
          {/* == FORM: TAMBAH GATEWAY BARU == */}
          {isAddingNew ? (
            <form onSubmit={handleSaveNewGateway} className="flex flex-col gap-5">
              {/* Header Add New */}
              <div className="card-container p-5 bg-gradient-to-r from-emerald-900/10 via-teal-900/5 to-cyan-900/10 border-emerald-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
                      <Plus size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)]">Tambah Gateway Baru</h3>
                      <p className="text-[11px] text-[var(--text-muted)]">ID otomatis: <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{newForm.id}</span></p>
                    </div>
                  </div>
                  <button type="button" onClick={handleCancelAddNew} className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-pointer">
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Lokasi & Koordinat */}
              <div className="card-container p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-subtle)]">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                    <MapPin size={17} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Lokasi &amp; Koordinat GPS</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1">
                      <MapPin size={12} className="text-indigo-500" />
                      Nama Titik Lokasi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newForm.location}
                      onChange={e => setNewForm(f => ({ ...f, location: e.target.value }))}
                      placeholder="Contoh: Titik Deteksi 08 — Dermaga Utara"
                      className="input-styled font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1">
                      <Globe size={12} className="text-indigo-500" />
                      Zona Kawasan Shorebase
                    </label>
                    <input
                      type="text"
                      value={newForm.zone}
                      onChange={e => setNewForm(f => ({ ...f, zone: e.target.value }))}
                      placeholder="Contoh: Central Office, Marine Jetty, dll"
                      className="input-styled font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Navigation size={12} className="text-indigo-500" />
                        Latitude GPS <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">Format: -6.xxxxx</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newForm.lat}
                      onChange={e => setNewForm(f => ({ ...f, lat: e.target.value }))}
                      placeholder="-6.86780"
                      className="input-styled font-mono font-bold text-indigo-600 dark:text-indigo-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Compass size={12} className="text-indigo-500" />
                        Longitude GPS <span className="text-rose-500">*</span>
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">Format: 112.xxxxx</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newForm.lng}
                      onChange={e => setNewForm(f => ({ ...f, lng: e.target.value }))}
                      placeholder="112.41680"
                      className="input-styled font-mono font-bold text-indigo-600 dark:text-indigo-400"
                      required
                    />
                  </div>
                </div>

                {/* Telemetri & Status Geografis Live */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)] mb-1">
                      <MapPin size={11} className="text-indigo-500" />
                      <span>Koordinat GPS</span>
                    </div>
                    <div className="font-mono text-xs font-bold text-[var(--text-primary)] truncate">
                      {newForm.lat && newForm.lng ? `${Number(newForm.lat).toFixed(5)}, ${Number(newForm.lng).toFixed(5)}` : 'Belum diisi'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)] mb-1">
                      <Radio size={11} className="text-emerald-500" />
                      <span>Radius Jangkauan</span>
                    </div>
                    <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
                      {newForm.radius || 50} meter
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)] mb-1">
                      <Globe size={11} className="text-amber-500" />
                      <span>Zona Wilayah</span>
                    </div>
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {newForm.zone || 'Kawasan Shorebase'}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)] mb-1">
                      <CheckCircle2 size={11} className="text-emerald-500" />
                      <span>Status Peta</span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Siap Ditempatkan</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parameter Perangkat */}
              <div className="card-container p-5 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-[var(--border-subtle)]">
                  <div className="w-8 h-8 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center border border-[var(--brand-border)]">
                    <Sliders size={17} />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Parameter Hardware &amp; Jaringan</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Nama Perangkat <span className="text-rose-500">*</span></label>
                    <input type="text" value={newForm.name}
                      onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Contoh: Gateway Deteksi 08"
                      className="input-styled font-semibold" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Alamat IP <span className="text-rose-500">*</span></label>
                    <input type="text" value={newForm.ip}
                      onChange={e => { const ip = e.target.value; setNewForm(f => ({ ...f, ip, url: `http://${ip}` })); }}
                      placeholder="10.1.5.18" className="input-styled font-mono font-semibold" required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">URL / Webhook Endpoint <span className="text-rose-500">*</span></label>
                    <input type="text" value={newForm.url}
                      onChange={e => setNewForm(f => ({ ...f, url: e.target.value }))}
                      placeholder="http://10.1.5.18" className="input-styled font-mono" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Protokol Service Access</label>
                    <select value={newForm.serviceAccess} onChange={e => setNewForm(f => ({ ...f, serviceAccess: e.target.value }))} className="input-styled cursor-pointer">
                      {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Metode Autentikasi</label>
                    <select value={newForm.authType} onChange={e => setNewForm(f => ({ ...f, authType: e.target.value }))} className="input-styled cursor-pointer">
                      {AUTH_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
                      <span>Radius Jangkauan</span>
                      <span className="font-mono text-[var(--brand)] font-bold">{newForm.radius}m</span>
                    </label>
                    <select value={newForm.radius} onChange={e => setNewForm(f => ({ ...f, radius: Number(e.target.value) }))} className="input-styled cursor-pointer font-mono font-semibold">
                      {RADIUS_OPTIONS.map(r => <option key={r} value={r}>{r} Meter{r === 50 ? ' (Standar)' : ''}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Status Operasional</label>
                    <select value={newForm.status} onChange={e => setNewForm(f => ({ ...f, status: e.target.value }))} className="input-styled cursor-pointer font-semibold">
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">Max Packet Size</label>
                    <select value={newForm.maxPacketSize} onChange={e => setNewForm(f => ({ ...f, maxPacketSize: Number(e.target.value) }))} className="input-styled cursor-pointer font-mono">
                      {PACKET_SIZES.map(p => <option key={p} value={p}>{p} Bytes</option>)}
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[var(--border-subtle)]">
                  <button type="submit" disabled={addSaveStatus === 'saving'}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50">
                    {addSaveStatus === 'saving' ? <Loader2 size={14} className="animate-spin" /> :
                     addSaveStatus === 'saved' ? <CheckCircle2 size={14} /> :
                     <Plus size={14} />}
                    <span>{addSaveStatus === 'saving' ? 'Mendaftarkan...' : addSaveStatus === 'saved' ? 'Berhasil Ditambahkan!' : 'Simpan & Daftarkan Gateway'}</span>
                  </button>
                  <button type="button" onClick={handleCancelAddNew}
                    className="px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer">
                    <X size={14} /> Batal
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              {/* 1. KARTU LOKASI & KOORDINAT PETA (DAPAT DIEDIT PENUH) */}
              <div className="card-container p-5 bg-[var(--bg-surface)] border-[var(--border-subtle)] shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                    <MapPin size={17} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      Lokasi &amp; Koordinat Posisi Peta (Dapat Diedit)
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Sesuaikan nama titik penempatan dan koordinat GPS agar letak Gateway tepat di peta
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 size={11} /> POSISI DAPAT DISESUAIKAN
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Nama Titik Lokasi */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1">
                    <MapPin size={12} className="text-indigo-500" />
                    Nama Titik Lokasi Penempatan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Contoh: Titik Deteksi 01 — Area Kantor & Administrasi"
                    className="input-styled font-medium"
                    required
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Label nama area sensor pada peta &amp; popup monitor.
                  </p>
                </div>

                {/* Zona Kawasan */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1">
                    <Globe size={12} className="text-indigo-500" />
                    Zona Kawasan Shorebase
                  </label>
                  <input
                    type="text"
                    value={form.zone}
                    onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                    placeholder="Contoh: Central Office, Warehouses, Marine Jetty, dll"
                    className="input-styled font-medium"
                  />
                  <p className="text-[11px] text-[var(--text-muted)] mt-1">
                    Kelompok zona operasional fasilitas darat / pelabuhan.
                  </p>
                </div>

                {/* Latitude GPS */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Navigation size={12} className="text-indigo-500" />
                      Latitude GPS (Lintang) <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">Format: -6.xxxxx</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.lat}
                    onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                    placeholder="-6.86780"
                    className="input-styled font-mono font-bold text-indigo-600 dark:text-indigo-400"
                    required
                  />
                </div>

                {/* Longitude GPS */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Compass size={12} className="text-indigo-500" />
                      Longitude GPS (Bujur) <span className="text-rose-500">*</span>
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">Format: 112.xxxxx</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={form.lng}
                    onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                    placeholder="112.41680"
                    className="input-styled font-mono font-bold text-indigo-600 dark:text-indigo-400"
                    required
                  />
                </div>
              </div>

              {/* Strip Telemetri Geografis */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
                <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shadow-sm">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)] mb-1">
                    <MapPin size={11} className="text-indigo-500" />
                    <span>Koordinat Titik</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-[var(--text-primary)] truncate">
                    {form.lat && form.lng ? `${Number(form.lat).toFixed(5)}, ${Number(form.lng).toFixed(5)}` : 'Belum diset'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shadow-sm">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)] mb-1">
                    <Radio size={11} className="text-emerald-500" />
                    <span>Radius Deteksi</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-[var(--text-primary)]">
                    {form.radius || activeGw?.radius || 50} meter
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shadow-sm">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)] mb-1">
                    <Globe size={11} className="text-amber-500" />
                    <span>Zona Operasional</span>
                  </div>
                  <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                    {form.zone || 'Kawasan Shorebase'}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shadow-sm">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--text-muted)] mb-1">
                    <CheckCircle2 size={11} className="text-emerald-500" />
                    <span>Sinkronisasi Peta</span>
                  </div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Aktif Terhubung</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. KARTU PENGATURAN PERANGKAT HARDWARE & JARINGAN */}
            <div className="card-container p-5 md:p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <div>
                  <h3 className="section-title">
                    <Sliders size={18} className="text-[var(--brand)]" />
                    Parameter Hardware &amp; Jaringan Perangkat ({activeGw.id})
                  </h3>
                  <p className="section-subtitle">
                    Konfigurasi nama unit, alamat IP, URL transmisi data, dan metode autentikasi
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--brand-bg)] text-[var(--brand)] border border-[var(--brand-border)]">
                    ID: {activeGw.id}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gateway Device Name */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    Nama Perangkat Gateway <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Contoh: Gateway Deteksi 01"
                    className="input-styled font-semibold"
                    required
                  />
                </div>

                {/* IP Address */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    Alamat IP Perangkat <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.ip}
                    onChange={e => {
                      const ip = e.target.value;
                      setForm(f => ({
                        ...f,
                        ip,
                        url: f.url.startsWith('http') ? `http://${ip}` : f.url,
                      }));
                    }}
                    placeholder="10.1.5.13"
                    className="input-styled font-mono font-semibold"
                    required
                  />
                </div>

                {/* Gateway URL / Endpoint */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    Alamat URL / Webhook Endpoint <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.url}
                    onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                    placeholder="http://10.1.5.13"
                    className="input-styled font-mono"
                    required
                  />
                </div>

                {/* Service Access Protocol */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    Protokol Service Access
                  </label>
                  <select
                    value={form.serviceAccess}
                    onChange={e => setForm(f => ({ ...f, serviceAccess: e.target.value }))}
                    className="input-styled cursor-pointer font-medium"
                  >
                    {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Authentication Method */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    Metode Autentikasi
                  </label>
                  <select
                    value={form.authType}
                    onChange={e => setForm(f => ({ ...f, authType: e.target.value }))}
                    className="input-styled cursor-pointer font-medium"
                  >
                    {AUTH_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                {/* Signal Coverage Radius */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5 flex items-center justify-between">
                    <span>Radius Jangkauan Sinyal di Peta</span>
                    <span className="font-mono text-[var(--brand)] font-bold">{form.radius}m</span>
                  </label>
                  <select
                    value={form.radius}
                    onChange={e => setForm(f => ({ ...f, radius: Number(e.target.value) }))}
                    className="input-styled cursor-pointer font-mono font-semibold"
                  >
                    {RADIUS_OPTIONS.map(r => (
                      <option key={r} value={r}>
                        {r} Meter {r === 50 ? '(Standar)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Operational Status */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    Status Operasional Perangkat
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="input-styled cursor-pointer font-semibold"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Max Packet Size */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                    Max Packet Size
                  </label>
                  <select
                    value={form.maxPacketSize}
                    onChange={e => setForm(f => ({ ...f, maxPacketSize: Number(e.target.value) }))}
                    className="input-styled cursor-pointer font-mono"
                  >
                    {PACKET_SIZES.map(p => <option key={p} value={p}>{p} Bytes</option>)}
                  </select>
                </div>

                {/* Credential / Token */}
                {form.authType !== 'No Authentication' && (
                  <div>
                    <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                      Kredensial / Token Akses
                    </label>
                    <div className="relative">
                      <input
                        type={showCredential ? 'text' : 'password'}
                        value={form.credential}
                        onChange={e => setForm(f => ({ ...f, credential: e.target.value }))}
                        placeholder="Masukkan token keamanan..."
                        className="input-styled pr-9 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCredential(v => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        title={showCredential ? 'Sembunyikan' : 'Tampilkan'}
                      >
                        {showCredential ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Test Status Banner */}
              {testStatus && testStatus !== 'testing' && (
                <div
                  className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                    testStatus === 'success'
                      ? 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]'
                      : 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testStatus === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>
                      {testStatus === 'success'
                        ? `Konektivitas ke ${form.name} (${form.ip}) normal dan stabil.`
                        : `Gagal menjangkau ${form.ip || form.url}. Periksa kabel atau sambungan jaringan.`}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white/20">
                    {testStatus === 'success' ? 'STATUS: OK' : 'STATUS: TIMEOUT'}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={saveStatus === 'saving'}
                    className="px-4 py-2.5 rounded-xl bg-[var(--brand)] hover:opacity-90 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    {saveStatus === 'saving' ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : saveStatus === 'saved' ? (
                      <CheckCircle2 size={14} className="text-emerald-300" />
                    ) : (
                      <Save size={14} />
                    )}
                    <span>
                      {saveStatus === 'saving'
                        ? 'Menyimpan...'
                        : saveStatus === 'saved'
                        ? 'Tersimpan ke Peta!'
                        : 'Simpan Perubahan Gateway & Koordinat'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="px-3.5 py-2.5 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] font-bold text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {testStatus === 'testing' ? (
                      <Loader2 size={14} className="animate-spin text-[var(--brand)]" />
                    ) : (
                      <TestTube size={14} className="text-[var(--brand)]" />
                    )}
                    <span>{testStatus === 'testing' ? 'Menguji...' : 'Uji Koneksi'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetToCurrent}
                    className="px-3 py-2 rounded-xl bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Batalkan perubahan yang belum disimpan"
                  >
                    <RotateCcw size={13} />
                    <span>Batal</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetToDefaultFactory}
                    className="px-3 py-2 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30 font-semibold text-xs transition-all cursor-pointer"
                    title="Muat pengaturan awal pabrik untuk gateway ini"
                  >
                    Default Pabrik
                  </button>
                </div>
              </div>
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default GatewayConfiguration;
