import React, { useState } from 'react';
import {
  Settings, Save, TestTube, RotateCcw, Eye, EyeOff,
  Server, Lock, Globe, Package, Loader2,
} from 'lucide-react';
import { formatDateTime } from '../data/simulationData';

const INITIAL_CONFIG = {
  name: '',
  serviceAccess: 'HTTP',
  url: '',
  authType: 'Bearer Token',
  credential: '',
  maxPacketSize: 1024,
};

const AUTH_TYPES = ['Bearer Token', 'API Key', 'Basic Auth', 'No Authentication'];
const SERVICE_TYPES = ['HTTP', 'HTTPS', 'WebSocket', 'MQTT'];
const PACKET_SIZES = [256, 512, 1024, 2048, 4096];

const GatewayConfigCard = ({ gw, onSelect, isSelected }) => {
  return (
    <button
      onClick={() => onSelect(gw)}
      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
        isSelected
          ? 'bg-[var(--brand-bg)] border-[var(--brand)] text-[var(--brand)]'
          : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
      }`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${gw.status === 'connected' ? 'bg-[var(--success)]' : 'bg-[var(--text-muted)]'}`} />
        <span className="text-xs font-bold text-[var(--text-primary)] flex-1 truncate">{gw.name}</span>
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase ${
          gw.status === 'connected'
            ? 'bg-[var(--success-bg)] text-[var(--success)]'
            : 'bg-[var(--bg-hover)] text-[var(--text-muted)]'
        }`}>
          {gw.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1 text-xs text-[var(--text-muted)] font-medium">
        <div className="flex items-center gap-1">
          <Globe size={11} className="text-[var(--brand)]" />
          <span className="font-mono truncate">{gw.ip}</span>
        </div>
        <div className="flex items-center gap-1">
          <Lock size={11} className="text-[var(--text-muted)]" />
          <span className="truncate">{gw.authType}</span>
        </div>
      </div>
    </button>
  );
};

const GatewayConfiguration = ({ gateways, onAddNotification }) => {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [showCredential, setShowCredential] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [selectedGw, setSelectedGw] = useState(null);

  const handleSelectGw = (gw) => {
    setSelectedGw(gw.id);
    setConfig({
      name: gw.name,
      serviceAccess: gw.serviceAccess,
      url: gw.url,
      authType: gw.authType,
      credential: '••••••••',
      maxPacketSize: gw.maxPacketSize,
    });
    setTestStatus(null);
    setSaveStatus(null);
  };

  const handleReset = () => {
    setConfig(INITIAL_CONFIG);
    setSelectedGw(null);
    setTestStatus(null);
    setSaveStatus(null);
    onAddNotification('info', 'Form Direset', 'Semua field konfigurasi telah dikosongkan.');
  };

  const handleTestConnection = () => {
    if (!config.url) {
      onAddNotification('warning', 'Validasi', 'Alamat URL Gateway harus diisi.');
      return;
    }
    setTestStatus('testing');
    onAddNotification('info', 'Test Koneksi', `Menguji komunikasi simulasi ke ${config.url}...`);
    setTimeout(() => {
      const isKnownIP = config.url.includes('10.1.5.');
      const gw = gateways.find(g => g.id === selectedGw);
      const wouldConnect = gw ? gw.status === 'connected' : isKnownIP;
      if (wouldConnect) {
        setTestStatus('success');
        onAddNotification('success', 'Test Sukses', `Simulasi koneksi ke ${config.url} berhasil.`);
      } else {
        setTestStatus('failed');
        onAddNotification('error', 'Test Gagal', `Simulasi koneksi ke ${config.url} gagal.`);
      }
    }, 1200);
  };

  const handleSave = () => {
    if (!config.name || !config.url) {
      onAddNotification('warning', 'Validasi', 'Nama Gateway dan URL wajib diisi.');
      return;
    }
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      onAddNotification('success', 'Tersimpan', `Parameter "${config.name}" berhasil disimpan.`);
      setTimeout(() => setSaveStatus(null), 2500);
    }, 500);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Left: Gateway selection list */}
      <div className="w-full lg:w-80 flex-shrink-0">
        <div className="card-container p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Server size={14} className="text-[var(--brand)]" />
              Gateway Terdaftar
            </h3>
            <span className="text-[11px] text-[var(--text-muted)] font-mono font-bold">
              {gateways.length} Unit
            </span>
          </div>

          <div className="space-y-2 max-h-[62vh] overflow-y-auto pr-1">
            {gateways.map(gw => (
              <GatewayConfigCard
                key={gw.id}
                gw={gw}
                onSelect={handleSelectGw}
                isSelected={selectedGw === gw.id}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right: Configuration form */}
      <div className="flex-1">
        <div className="card-container p-5 md:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="section-title">
                <Settings size={18} className="text-[var(--brand)]" />
                {selectedGw ? `Konfigurasi: ${config.name || selectedGw}` : 'Tambah Konfigurasi Gateway'}
              </h2>
              <p className="section-subtitle">
                {selectedGw ? `Parameter ${selectedGw} (${gateways.find(g=>g.id===selectedGw)?.ip})` : 'Formulir pengaturan parameter Gateway'}
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--bg-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
              PROTOTIPE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gateway Name */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                Nama Gateway
              </label>
              <input
                id="input-gateway-name"
                type="text"
                value={config.name}
                onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
                placeholder="Contoh: Gateway Lobby Utama"
                className="input-styled"
              />
            </div>

            {/* Service Access */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                Service Access
              </label>
              <select
                id="select-service-access"
                value={config.serviceAccess}
                onChange={e => setConfig(c => ({ ...c, serviceAccess: e.target.value }))}
                className="input-styled cursor-pointer"
              >
                {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            {/* Gateway URL */}
            <div className="col-span-2">
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                Alamat URL Gateway
              </label>
              <input
                id="input-gateway-url"
                type="text"
                value={config.url}
                onChange={e => setConfig(c => ({ ...c, url: e.target.value }))}
                placeholder="http://10.1.5.13"
                className="input-styled font-mono"
              />
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                IP Gateway: 10.1.5.13, 10.1.5.32, 10.1.5.62, 10.1.5.89, 10.1.5.114, 10.1.5.140, 10.1.5.194
              </p>
            </div>

            {/* Auth Type */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                Metode Autentikasi
              </label>
              <select
                id="select-auth-type"
                value={config.authType}
                onChange={e => setConfig(c => ({ ...c, authType: e.target.value }))}
                className="input-styled cursor-pointer"
              >
                {AUTH_TYPES.map(a => <option key={a}>{a}</option>)}
              </select>
            </div>

            {/* Max Packet Size */}
            <div>
              <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                Max Packet Size (bytes)
              </label>
              <select
                id="select-packet-size"
                value={config.maxPacketSize}
                onChange={e => setConfig(c => ({ ...c, maxPacketSize: Number(e.target.value) }))}
                className="input-styled cursor-pointer"
              >
                {PACKET_SIZES.map(p => <option key={p} value={p}>{p} bytes</option>)}
              </select>
            </div>

            {/* Credential */}
            {config.authType !== 'No Authentication' && (
              <div className="col-span-2">
                <label className="block text-xs font-bold text-[var(--text-secondary)] mb-1.5">
                  Credential / Token
                </label>
                <div className="relative">
                  <input
                    id="input-credential"
                    type={showCredential ? 'text' : 'password'}
                    value={config.credential}
                    onChange={e => setConfig(c => ({ ...c, credential: e.target.value }))}
                    placeholder="Masukkan token..."
                    className="input-styled pr-9 font-mono"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCredential(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    title={showCredential ? 'Sembunyikan' : 'Tampilkan'}
                  >
                    {showCredential ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Test Status Alert */}
          {testStatus && testStatus !== 'testing' && (
            <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
              testStatus === 'success'
                ? 'bg-[var(--success-bg)] text-[var(--success)] border-[var(--success-border)]'
                : 'bg-[var(--danger-bg)] text-[var(--danger)] border-[var(--danger-border)]'
            }`}>
              <span>{testStatus === 'success' ? `Simulasi sukses terhubung ke ${config.url}` : `Simulasi gagal ke ${config.url}`}</span>
              <span className="font-mono text-[10px]">SIMULASI</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
            <button
              id="btn-save-config"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="btn-sim-enter"
            >
              {saveStatus === 'saving'
                ? <Loader2 size={13} className="animate-spin" />
                : <Save size={14} />}
              <span>{saveStatus === 'saving' ? 'Menyimpan...' : 'Save Configuration'}</span>
            </button>

            <button
              id="btn-test-connection"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] transition-colors"
            >
              {testStatus === 'testing'
                ? <Loader2 size={13} className="animate-spin text-[var(--brand)]" />
                : <TestTube size={14} className="text-[var(--brand)]" />}
              <span>{testStatus === 'testing' ? 'Menguji...' : 'Test Connection'}</span>
            </button>

            <button
              id="btn-reset-form"
              onClick={handleReset}
              className="btn-sim-leave ml-auto"
            >
              <RotateCcw size={13} />
              <span>Reset Form</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GatewayConfiguration;
