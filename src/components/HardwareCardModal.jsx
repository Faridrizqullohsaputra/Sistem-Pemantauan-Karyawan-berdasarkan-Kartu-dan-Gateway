import React, { useState, useEffect } from 'react';
import {
  Bluetooth,
  Radio,
  Copy,
  Check,
  Terminal,
  ShieldCheck,
  X,
  QrCode,
  Wifi,
  Users,
  CreditCard,
  RadioTower,
  Sparkles,
} from 'lucide-react';

const HardwareCardModal = ({
  isOpen,
  onClose,
  gateways = [],
  registeredCards = [],
  initialCardId = null,
  onDetectCard,
  onDetectAllCards,
  onScanBluetooth,
  isScanningBLE = false,
}) => {
  const [selectedGwId, setSelectedGwId] = useState(() => {
    const firstConnected = gateways.find(g => g.status === 'connected');
    return firstConnected?.id || gateways[0]?.id || 'GW-01';
  });
  const [selectedCardId, setSelectedCardId] = useState('ALL');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('gateway'); // 'gateway' | 'bluetooth' | 'webhook'

  // Filter only active registered cards
  const activeCards = registeredCards.filter(c => c.status === 'active');
  const connectedGateways = gateways.filter(g => g.status === 'connected');
  const isAllGateways = selectedGwId === 'ALL';

  // Sync selected card & gateway when modal opens or initialCardId changes
  useEffect(() => {
    if (isOpen) {
      if (initialCardId && activeCards.some(c => c.cardId === initialCardId)) {
        setSelectedCardId(initialCardId);
      } else {
        setSelectedCardId(activeCards[0]?.cardId || 'ALL');
      }

      // Pastikan gateway default adalah gateway yang valid dan online jika ada
      setSelectedGwId(prev => {
        if (prev && prev !== 'ALL' && gateways.some(g => g.id === prev)) return prev;
        const online = gateways.find(g => g.status === 'connected');
        return online?.id || gateways[0]?.id || 'GW-01';
      });
    }
  }, [isOpen, initialCardId, activeCards.length, gateways]);

  if (!isOpen) return null;

  const selectedGw = isAllGateways
    ? null
    : (gateways.find(g => g.id === selectedGwId) || gateways[0] || { id: 'GW-01', name: 'Gateway Deteksi 01', location: 'Area Perusahaan', ip: '10.1.5.13', radius: 50 });
  const selectedCard = selectedCardId !== 'ALL' ? activeCards.find(c => c.cardId === selectedCardId) : null;
  const targetCardIdForCurl = selectedCard ? selectedCard.cardId : (activeCards[0]?.cardId || 'BC572914269D');

  const effectiveCurlGwId = selectedGw?.id || (gateways[0]?.id || 'GW-01');
  const curlCommand = `curl -X POST http://localhost:5173/api/gateway/report \\
  -H "Content-Type: application/json" \\
  -d '{"cardId":"${targetCardIdForCurl}","gatewayId":"${effectiveCurlGwId}","rssi":-58}'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCaptureCard = () => {
    if (selectedCardId === 'ALL') {
      if (onDetectAllCards) {
        onDetectAllCards(selectedGwId);
      } else {
        activeCards.forEach(c => onDetectCard && onDetectCard(c.cardId, selectedGwId));
      }
    } else if (selectedCard) {
      onDetectCard && onDetectCard(selectedCard.cardId, selectedGwId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--bg-surface)] w-full max-w-xl rounded-2xl border border-[var(--border-subtle)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-gradient-to-r from-indigo-900/20 via-purple-900/10 to-teal-900/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-teal-600 text-white flex items-center justify-center shadow-md">
              <RadioTower size={20} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Tangkap Sinyal Kartu via Gateway
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Deteksi otomatis seluruh kartu aktif melalui jaringan {gateways.length} sensor Gateway
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span className="text-[var(--text-primary)] font-medium">
                Sensor Gateway Siap: <strong>{activeCards.length} Kartu Aktif Terdaftar</strong>
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500 text-white">
              ONLINE
            </span>
          </div>

          {/* Dual Selectors: Gateway & Target Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Pilih Gateway Penerima */}
            <div>
              <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5 flex items-center justify-between">
                <span>Gateway Sensor Penerima:</span>
                <span className={`text-[10px] font-semibold flex items-center gap-1 ${
                  selectedGw?.status === 'connected' ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {isAllGateways ? '🌐 Multi-Gateway' : selectedGw?.status === 'connected' ? '● Online' : '▲ Offline / Error'}
                </span>
              </label>
              <select
                value={selectedGwId}
                onChange={(e) => setSelectedGwId(e.target.value)}
                className={`w-full input-styled py-2 px-3 text-xs font-medium cursor-pointer ${
                  isAllGateways ? 'border-indigo-500/50 bg-indigo-500/5 font-bold text-indigo-600 dark:text-indigo-400' : ''
                }`}
              >
                {gateways.map(gw => (
                  <option key={gw.id} value={gw.id}>
                    {gw.id} — {gw.name} ({gw.status === 'connected' ? 'Online' : 'Error / Offline'})
                  </option>
                ))}
                {activeCards.length > 1 && (
                  <option value="ALL">
                    🌐 Sebar Kartu ke Semua Gateway ({gateways.length} Gateway)
                  </option>
                )}
              </select>
            </div>

            {/* 2. Pilih Kartu yang Ingin Ditangkap */}
            <div>
              <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">
                Pilih Target Kartu:
              </label>
              <select
                value={selectedCardId}
                onChange={(e) => setSelectedCardId(e.target.value)}
                className="w-full input-styled py-2 px-3 text-xs font-medium cursor-pointer"
              >
                <option value="ALL">
                  📡 Semua Kartu Aktif ({activeCards.length} Kartu)
                </option>
                {activeCards.map(c => (
                  <option key={c.cardId} value={c.cardId}>
                    {c.name} ({c.cardId}) — {c.department || c.role || 'Staff'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Card Preview Box */}
          {selectedCardId === 'ALL' ? (
            /* ALL CARDS PREVIEW */
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Users size={14} className="text-indigo-500" />
                  Seluruh Kartu Aktif Siap Ditangkap ({activeCards.length})
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  Mode Multi-Kartu
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                {activeCards.length === 0 ? (
                  <span className="text-xs text-[var(--text-muted)] italic">
                    Belum ada kartu dengan status aktif. Aktifkan kartu di menu registrasi.
                  </span>
                ) : (
                  activeCards.map(c => (
                    <div
                      key={c.cardId}
                      className="px-2 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] flex items-center gap-1.5 font-medium"
                    >
                      <span
                        className="w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: c.avatarColor || '#6366f1' }}
                      >
                        {c.avatarInitials || 'ID'}
                      </span>
                      <span className="font-semibold text-[var(--text-primary)]">{c.name}</span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">({c.cardId})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : selectedCard ? (
            /* INDIVIDUAL CARD PREVIEW */
            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center gap-3.5">
              <div
                className="w-12 h-14 rounded-xl text-white flex flex-col items-center justify-center shadow-xs flex-shrink-0"
                style={{ backgroundColor: selectedCard.avatarColor || '#6366f1' }}
              >
                <span className="text-xs font-bold font-mono">{selectedCard.avatarInitials || 'ID'}</span>
                <CreditCard size={16} className="mt-1 opacity-90" />
              </div>
              <div className="flex-1 min-w-0 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[var(--text-primary)] text-sm">{selectedCard.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    {selectedCard.cardType === 'visitor' ? 'Tamu' : 'Karyawan'} Aktif
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 text-[11px] text-[var(--text-secondary)] font-mono">
                  <div>ID Kartu: <strong className="text-indigo-600 dark:text-indigo-400">{selectedCard.cardId}</strong></div>
                  <div>NIK/Tag: <strong>{selectedCard.employeeId || '—'}</strong></div>
                  <div>Dept: <strong>{selectedCard.department || 'Operasional'}</strong></div>
                  <div>Jabatan: <strong>{selectedCard.role || selectedCard.division || 'Staff'}</strong></div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Gateway Reception Specs */}
          {isAllGateways ? (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-teal-500/10 border border-indigo-500/30 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)] font-medium">Mode Tangkap Sensor:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <RadioTower size={13} className="animate-pulse" />
                  Jaringan Menyeluruh ({gateways.length} Gateway)
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">Cakupan Area:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  Seluruh Zona Gedung &amp; Pabrik Perusahaan
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">Status Jaringan:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {connectedGateways.length}/{gateways.length} Gateway Online &bull; Siap Menangkap Serentak
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">Gateway Terpilih:</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedGw?.name} ({selectedGw?.id})</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">Lokasi &amp; Radius:</span>
                <span className="font-semibold text-[var(--text-primary)]">{selectedGw?.location} &bull; {selectedGw?.radius || 50} meter</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--text-muted)]">IP Jaringan:</span>
                <span className="font-mono text-[var(--brand)] font-semibold">{selectedGw?.ip || '10.1.5.x'}</span>
              </div>
            </div>
          )}

          {/* Capture Methods Tabs */}
          <div className="space-y-3 pt-1">
            <div className="flex border-b border-[var(--border-subtle)] text-xs font-bold gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('gateway')}
                className={`pb-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'gateway'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Radio size={14} />
                1. Sinyal Gateway Sensor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('bluetooth')}
                className={`pb-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'bluetooth'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Bluetooth size={14} />
                2. Web Bluetooth Scanner
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('webhook')}
                className={`pb-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'webhook'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Terminal size={14} />
                3. HTTP Webhook Gateway
              </button>
            </div>

            {/* Tab 1: Gateway Receiver Interception */}
            {activeTab === 'gateway' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {isAllGateways ? (
                    <>
                      Seluruh <strong>{gateways.length} sensor Gateway</strong> di jaringan fasilitas akan menangkap serentak pancaran sinyal dari kartu aktif:
                    </>
                  ) : (
                    <>
                      Antena sensor pada <strong>{selectedGw?.name}</strong> akan menangkap pancaran sinyal dari kartu identitas yang berada dalam jangkauan <strong>{selectedGw?.radius || 50}m</strong>:
                    </>
                  )}
                </p>

                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleCaptureCard}
                    disabled={activeCards.length === 0}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    <Radio size={16} className="animate-pulse" />
                    <span>
                      {selectedCardId === 'ALL'
                        ? isAllGateways
                          ? `Tangkap Semua Kartu (${activeCards.length}) di Semua Gateway (${gateways.length})`
                          : `Tangkap Semua Kartu Aktif (${activeCards.length}) via ${selectedGw?.id}`
                        : isAllGateways
                          ? `Tangkap Sinyal ${selectedCard?.name} di Semua Gateway (${gateways.length})`
                          : `Tangkap Sinyal ${selectedCard?.name} via ${selectedGw?.id}`}
                    </span>
                  </button>

                  {/* Quick button to capture all if single card was selected */}
                  {selectedCardId !== 'ALL' && activeCards.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (onDetectAllCards) {
                          onDetectAllCards(selectedGwId);
                        } else {
                          activeCards.forEach(c => onDetectCard && onDetectCard(c.cardId, selectedGwId));
                        }
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Users size={14} />
                      <span>
                        {isAllGateways
                          ? `Atau Tangkap Sekaligus Semua Kartu di Semua Gateway (${activeCards.length} Kartu)`
                          : `Atau Tangkap Sekaligus Semua Kartu Aktif (${activeCards.length} Kartu)`}
                      </span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-[var(--text-muted)] text-center">
                  {isAllGateways
                    ? `*Kartu didistribusikan ke seluruh jaringan ${gateways.length} Gateway (1 kartu = 1 gateway unik)`
                    : `*Deteksi diverifikasi khusus pada ${selectedGw?.name || selectedGwId} — 1 kartu hanya terdeteksi pada 1 gateway`}
                </p>
              </div>
            )}

            {/* Tab 2: Web Bluetooth Direct Scan */}
            {activeTab === 'bluetooth' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Pindai sinyal kartu BLE nirkabel secara langsung menggunakan receiver Bluetooth PC/Gateway:
                </p>
                <button
                  type="button"
                  onClick={() => onScanBluetooth && onScanBluetooth(selectedGwId, selectedCardId !== 'ALL' ? selectedCardId : null)}
                  disabled={isScanningBLE || activeCards.length === 0}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 disabled:opacity-70 cursor-pointer"
                >
                  <Bluetooth size={16} className={isScanningBLE ? 'animate-spin' : ''} />
                  <span>
                    {isScanningBLE
                      ? 'Memindai Bluetooth...'
                      : selectedCard
                      ? `Pindai Bluetooth untuk ${selectedCard.name}`
                      : 'Mulai Pindai Perangkat Kartu BLE'}
                  </span>
                </button>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {isAllGateways
                    ? `*Perangkat yang terdeteksi otomatis dicatat dan disinkronkan ke seluruh jaringan Gateway.`
                    : `*Perangkat yang terdeteksi otomatis dicatat pada sensor ${selectedGw?.name}.`}
                </p>
              </div>
            )}

            {/* Tab 3: Gateway Hardware Webhook API */}
            {activeTab === 'webhook' && (
              <div className="space-y-3 p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Perangkat Gateway fisik dapat melaporkan paket kartu aktif manapun melalui endpoint HTTP POST JSON berikut:
                </p>
                <div className="p-2.5 rounded-lg bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto relative">
                  <code>POST http://localhost:5173/api/gateway/report</code>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[var(--text-primary)]">
                    Contoh pengujian payload deteksi kartu ({targetCardIdForCurl}):
                  </span>
                  <div className="p-2.5 rounded-lg bg-slate-950 text-slate-200 font-mono text-[10px] overflow-x-auto relative leading-relaxed">
                    <pre>{curlCommand}</pre>
                    <button
                      type="button"
                      onClick={handleCopyCurl}
                      className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copied ? 'Tersalin' : 'Salin'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-end bg-[var(--bg-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-bold hover:brightness-105 transition-all cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default HardwareCardModal;
