import React, { useState, useMemo } from 'react';
import {
  CreditCard, UserPlus, Search, X, Check, AlertCircle,
  Building2, Hash, Shield, User, Users, Radio, Trash2,
  Power, PowerOff, Sparkles, Filter, CheckCircle2, ChevronRight,
  Pencil, Edit3, AlertTriangle, Wifi, ZapOff,
} from 'lucide-react';
import { formatTime, timeAgo, getGateway } from '../data/simulationData';

const DEPARTMENTS = [
  'Engineering',
  'IT & Infrastructure',
  'HRD',
  'Finance & Accounting',
  'Operations & Logistics',
  'Marketing & Sales',
  'General Affairs',
  'Visitor / Tamu Eksternal',
];

const CardManagement = ({
  registeredCards = [],
  activeDetections = [],
  onRegisterCard,
  onUpdateCard,
  onToggleStatus,
  onDeleteCard,
  onDetectCard,
  onOpenHardwareModal,
  onAddNotification,
  unknownCardSignals = [],
  onRegisterUnknownCard,
}) => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'register'

  // Search & Filter state for list
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'inactive'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'employee' | 'visitor'
  const [filterDept, setFilterDept] = useState('all');

  // Edit Card Modal state
  const [editingCard, setEditingCard] = useState(null);
  const [editForm, setEditForm] = useState({
    cardId: '',
    employeeId: '',
    name: '',
    department: 'Engineering',
    division: '',
    role: '',
    cardType: 'employee',
    status: 'active',
  });
  const [editError, setEditError] = useState('');

  // Delete confirmation modal state
  const [cardToDelete, setCardToDelete] = useState(null);

  // Form state for registration
  const [form, setForm] = useState({
    cardId: '',
    employeeId: '',
    name: '',
    department: 'Engineering',
    division: '',
    role: '',
    cardType: 'employee',
    status: 'active',
    autoDetect: true,
  });

  const [formError, setFormError] = useState('');

  // Quick-register from unknown signal
  const [quickRegisterSignal, setQuickRegisterSignal] = useState(null);
  const [quickForm, setQuickForm] = useState({ name: '', department: 'Engineering', role: '', cardType: 'employee' });


  // Start editing a card
  const handleStartEdit = (card) => {
    setEditingCard(card);
    setEditForm({
      cardId: card.cardId,
      employeeId: card.employeeId || '',
      name: card.name,
      department: card.department || 'Engineering',
      division: card.division || card.department || '',
      role: card.role || '',
      cardType: card.cardType || 'employee',
      status: card.status || 'active',
    });
    setEditError('');
  };

  // Save edited card
  const handleSaveEdit = (e) => {
    e.preventDefault();
    setEditError('');

    if (!editForm.name.trim()) {
      setEditError('Nama pemegang kartu wajib diisi.');
      return;
    }
    if (!editForm.cardId.trim()) {
      setEditError('ID Kartu wajib diisi.');
      return;
    }

    if (onUpdateCard && editingCard) {
      onUpdateCard(editingCard.cardId, {
        name: editForm.name.trim(),
        cardId: editForm.cardId.trim().toUpperCase(),
        employeeId: editForm.employeeId.trim().toUpperCase(),
        department: editForm.department,
        division: editForm.division.trim() || editForm.department,
        role: editForm.role.trim() || 'Staff',
        cardType: editForm.cardType,
        status: editForm.status,
      });
    }

    setEditingCard(null);
  };

  // Helper to generate a unique random card ID
  const generateRandomCardId = () => {
    const num = Math.floor(100 + Math.random() * 900);
    const generated = `CARD-00${num}`;
    setForm(prev => ({
      ...prev,
      cardId: generated,
      employeeId: prev.employeeId || `EMP-2024-${num}`,
    }));
  };

  // Metrics
  const totalCards = registeredCards.length;
  const activeCards = registeredCards.filter(c => c.status === 'active').length;
  const inactiveCards = registeredCards.filter(c => c.status === 'inactive').length;
  const currentlyDetectedCardIds = new Set(activeDetections.map(d => d.cardId));
  const detectedCount = registeredCards.filter(c => currentlyDetectedCardIds.has(c.cardId)).length;

  // Filtered Cards List
  const filteredCards = useMemo(() => {
    return registeredCards.filter(card => {
      // Status filter
      if (filterStatus === 'active' && card.status !== 'active') return false;
      if (filterStatus === 'inactive' && card.status !== 'inactive') return false;

      // Type filter
      if (filterType !== 'all' && card.cardType !== filterType) return false;

      // Dept filter
      if (filterDept !== 'all' && card.department !== filterDept) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = card.name?.toLowerCase().includes(q);
        const matchCardId = card.cardId?.toLowerCase().includes(q);
        const matchEmpId = card.employeeId?.toLowerCase().includes(q);
        const matchDept = card.department?.toLowerCase().includes(q);
        const matchRole = card.role?.toLowerCase().includes(q);
        return matchName || matchCardId || matchEmpId || matchDept || matchRole;
      }
      return true;
    });
  }, [registeredCards, search, filterStatus, filterType, filterDept]);

  // Handle Form Submit
  const handleSubmitRegister = (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.cardId.trim()) {
      setFormError('ID Kartu RFID / BLE wajib diisi.');
      return;
    }
    if (!form.name.trim()) {
      setFormError('Nama lengkap pemegang kartu wajib diisi.');
      return;
    }

    // Attempt registration
    const success = onRegisterCard(
      {
        cardId: form.cardId.trim().toUpperCase(),
        employeeId: form.employeeId.trim().toUpperCase() || `EMP-${Date.now().toString().slice(-4)}`,
        name: form.name.trim(),
        department: form.department,
        division: form.division.trim() || form.department,
        role: form.role.trim() || (form.cardType === 'visitor' ? 'Tamu Perusahaan' : 'Staff'),
        cardType: form.cardType,
        status: form.status,
      },
      form.autoDetect
    );

    if (success) {
      // Reset form
      setForm({
        cardId: '',
        employeeId: '',
        name: '',
        department: 'Engineering',
        division: '',
        role: '',
        cardType: 'employee',
        status: 'active',
        autoDetect: true,
      });
      // Switch back to list view to see newly registered card
      setActiveTab('list');
    }
  };

  // Handle quick-register of unknown card signal
  const handleQuickRegister = (e) => {
    e.preventDefault();
    if (!quickForm.name.trim()) return;
    const success = onRegisterCard?.({
      cardId: quickRegisterSignal.cardId,
      employeeId: `EMP-${Date.now().toString().slice(-4)}`,
      name: quickForm.name.trim(),
      department: quickForm.department,
      role: quickForm.role.trim() || 'Staff',
      cardType: quickForm.cardType,
      status: 'active',
    }, false);
    if (success) {
      onRegisterUnknownCard?.(quickRegisterSignal);
      setQuickRegisterSignal(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header & Statistics Cards ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <CreditCard size={22} className="text-[var(--brand)]" />
            Registrasi &amp; Manajemen Kartu
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Basis data identitas kartu IoT. Sinyal kartu asing yang belum terdaftar akan tertangkap dan ditampilkan sebagai peringatan untuk segera didaftarkan.
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex items-center gap-2 bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-subtle)] flex-shrink-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-[var(--bg-surface)] text-[var(--brand)] shadow-xs border border-[var(--border-subtle)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users size={14} />
            Daftar Kartu ({totalCards})
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'register'
                ? 'bg-[var(--brand)] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <UserPlus size={14} />
            + Registrasi Kartu Baru
          </button>
        </div>
      </div>

      {/* ── 4 Quick Stat Summary Pills ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-container p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-bg)] border border-[var(--brand-border)] text-[var(--brand)] flex items-center justify-center flex-shrink-0">
            <CreditCard size={20} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[var(--text-primary)] font-mono leading-tight">
              {totalCards}
            </div>
            <div className="text-xs text-[var(--text-muted)] font-medium">Total Terdaftar</div>
          </div>
        </div>

        <div className="card-container p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--success-bg)] border border-[var(--success-border)] text-[var(--success)] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[var(--success)] font-mono leading-tight">
              {activeCards}
            </div>
            <div className="text-xs text-[var(--text-muted)] font-medium">Status Aktif</div>
          </div>
        </div>

        <div className="card-container p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Radio size={20} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono leading-tight">
              {detectedCount}
            </div>
            <div className="text-xs text-[var(--text-muted)] font-medium">Sedang Terdeteksi Live</div>
          </div>
        </div>

        <div className="card-container p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-subtle)] text-[var(--text-muted)] flex items-center justify-center flex-shrink-0">
            <PowerOff size={20} />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-[var(--text-secondary)] font-mono leading-tight">
              {inactiveCards}
            </div>
            <div className="text-xs text-[var(--text-muted)] font-medium">Kartu Nonaktif</div>
          </div>
        </div>
      </div>

      {/* ── BANNER: SINYAL KARTU ASING YANG TERTANGKAP GATEWAY ── */}
      {unknownCardSignals.length > 0 && (
        <div className="card-container p-4 border-amber-400/40 bg-amber-50/60 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-amber-400/30">
            <div className="w-7 h-7 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Wifi size={15} />
            </div>
            <div className="flex-1">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                ⚠️ Sinyal Kartu Asing Tertangkap Gateway
              </span>
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {unknownCardSignals.length}
              </span>
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium">
              ID Terdeteksi — Belum Terdaftar
            </span>
          </div>

          <div className="space-y-2">
            {unknownCardSignals.map(sig => (
              <div key={sig.cardId}>
                {quickRegisterSignal?.cardId === sig.cardId ? (
                  /* Form Registrasi Cepat */
                  <form onSubmit={handleQuickRegister}
                    className="p-3 rounded-xl bg-[var(--bg-surface)] border border-amber-400/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <UserPlus size={13} className="text-[var(--brand)]" />
                        Daftarkan Kartu <span className="font-mono text-[var(--brand)]">{sig.cardId}</span>
                      </span>
                      <button type="button" onClick={() => setQuickRegisterSignal(null)}
                        className="p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                        <X size={13} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">
                          Nama Pemegang <span className="text-rose-500">*</span>
                        </label>
                        <input type="text" value={quickForm.name}
                          onChange={e => setQuickForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Nama lengkap..." className="input-styled text-xs py-1.5" required autoFocus />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">Departemen</label>
                        <select value={quickForm.department}
                          onChange={e => setQuickForm(f => ({ ...f, department: e.target.value }))}
                          className="input-styled text-xs py-1.5 cursor-pointer">
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">Jabatan</label>
                        <input type="text" value={quickForm.role}
                          onChange={e => setQuickForm(f => ({ ...f, role: e.target.value }))}
                          placeholder="Staff / Operator / dll..." className="input-styled text-xs py-1.5" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1">Tipe Kartu</label>
                        <select value={quickForm.cardType}
                          onChange={e => setQuickForm(f => ({ ...f, cardType: e.target.value }))}
                          className="input-styled text-xs py-1.5 cursor-pointer">
                          <option value="employee">Karyawan</option>
                          <option value="visitor">Tamu / Visitor</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="submit"
                        className="px-3 py-1.5 rounded-lg bg-[var(--brand)] hover:opacity-90 text-white font-bold text-[11px] flex items-center gap-1.5 cursor-pointer">
                        <Check size={12} /> Simpan &amp; Daftarkan
                      </button>
                      <button type="button" onClick={() => setQuickRegisterSignal(null)}
                        className="px-3 py-1.5 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)] font-semibold text-[11px] cursor-pointer">
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Baris sinyal asing */
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-surface)] border border-amber-400/30">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                      <ZapOff size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{sig.cardId}</span>
                        {sig.count > 1 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            {sig.count}× terdeteksi
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
                        <Radio size={9} />
                        <span>{sig.gatewayName}</span>
                        <span>·</span>
                        <span>{new Date(sig.detectedAt).toLocaleTimeString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setQuickRegisterSignal(sig);
                          setQuickForm({ name: '', department: 'Engineering', role: '', cardType: 'employee' });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[var(--brand)] hover:opacity-90 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus size={10} /> Daftarkan
                      </button>
                      <button
                        onClick={() => onRegisterUnknownCard?.(sig)}
                        className="px-2 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border-subtle)] font-semibold text-[10px] cursor-pointer"
                        title="Abaikan sinyal ini"
                      >
                        <X size={11} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB CONTENT ── */}
      {activeTab === 'register' ? (
        /* ══════════════════════════════════════════════════════
           TAB 2: FORM REGISTRASI KARTU BARU
        ══════════════════════════════════════════════════════ */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form Column (2 Cols) */}
          <div className="lg:col-span-2 card-container p-6">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <UserPlus size={18} className="text-[var(--brand)]" />
                  Formulir Registrasi Kartu Baru
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Masukkan UID kartu identitas dan data karyawan/pengunjung untuk diintegrasikan ke jaringan Gateway
                </p>
              </div>
              <button
                type="button"
                onClick={generateRandomCardId}
                className="px-3 py-1.5 rounded-lg bg-[var(--brand-bg)] hover:bg-[var(--brand)] text-[var(--brand)] hover:text-white border border-[var(--brand-border)] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Buat ID Kartu otomatis"
              >
                <Sparkles size={13} />
                Generate ID Acak
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-[var(--danger-bg)] border border-[var(--danger-border)] text-[var(--danger)] text-xs flex items-center gap-2">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* ID Kartu */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    ID Kartu (RFID / BLE UID) <span className="text-[var(--danger)]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Contoh: CARD-00912"
                      value={form.cardId}
                      onChange={e => setForm(prev => ({ ...prev, cardId: e.target.value.toUpperCase() }))}
                      className="input-styled w-full uppercase font-mono text-xs py-2 pl-3"
                      required
                    />
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                    ID unik sensor RFID/BLE pada kartu fisik
                  </span>
                </div>

                {/* Nomor Kartu */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Nomor Kartu
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 562427 atau Nomor Seri Kartu"
                    value={form.employeeId}
                    onChange={e => setForm(prev => ({ ...prev, employeeId: e.target.value.toUpperCase() }))}
                    className="input-styled w-full uppercase font-mono text-xs py-2 pl-3"
                  />
                  <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                    Nomor fisik yang tercetak pada kartu
                  </span>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                  Nama Lengkap Pemegang Kartu <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Masukkan nama lengkap karyawan atau tamu..."
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="input-styled w-full text-xs py-2 pl-3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tipe Kartu */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Tipe Kartu Identitas
                  </label>
                  <select
                    value={form.cardType}
                    onChange={e => setForm(prev => ({ ...prev, cardType: e.target.value }))}
                    className="input-styled w-full text-xs py-2 pl-3 cursor-pointer"
                  >
                    <option value="employee">Karyawan Perusahaan (Employee)</option>
                    <option value="visitor">Tamu / Pengunjung (Visitor)</option>
                  </select>
                </div>

                {/* Departemen */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Departemen
                  </label>
                  <select
                    value={form.department}
                    onChange={e => setForm(prev => ({ ...prev, department: e.target.value }))}
                    className="input-styled w-full text-xs py-2 pl-3 cursor-pointer"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Divisi / Unit Kerja */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Divisi / Unit Kerja
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Software Development, Accounting"
                    value={form.division}
                    onChange={e => setForm(prev => ({ ...prev, division: e.target.value }))}
                    className="input-styled w-full text-xs py-2 pl-3"
                  />
                </div>

                {/* Jabatan / Role */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Jabatan / Role
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Senior Engineer, Manager"
                    value={form.role}
                    onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
                    className="input-styled w-full text-xs py-2 pl-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Status Awal */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Status Kartu Setelah Terdaftar
                  </label>
                  <select
                    value={form.status}
                    onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                    className="input-styled w-full text-xs py-2 pl-3 cursor-pointer"
                  >
                    <option value="active">Aktif (Dapat Dideteksi oleh Gateway)</option>
                    <option value="inactive">Nonaktif (Ditolak oleh Gateway)</option>
                  </select>
                </div>

                {/* Auto detect checkbox */}
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="chk-auto-detect"
                    type="checkbox"
                    checked={form.autoDetect}
                    onChange={e => setForm(prev => ({ ...prev, autoDetect: e.target.checked }))}
                    className="w-4 h-4 rounded text-[var(--brand)] focus:ring-[var(--brand)] cursor-pointer"
                  />
                  <label htmlFor="chk-auto-detect" className="text-xs font-medium text-[var(--text-primary)] cursor-pointer">
                    Langsung uji deteksi di Gateway setelah registrasi
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--brand)] text-white hover:opacity-90 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  Simpan &amp; Daftarkan Kartu
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Column (1 Col) */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card-container p-5 bg-gradient-to-br from-indigo-500/10 via-[var(--bg-surface)] to-[var(--bg-subtle)] border-2 border-[var(--brand-border)]">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--brand)] mb-3 pb-2 border-b border-[var(--border-subtle)]">
                <span>PREVIEW KARTU FISIK</span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[var(--brand-bg)] border border-[var(--brand-border)]">
                  RFID / BLE 2.4GHz
                </span>
              </div>

              {/* Physical card mock */}
              <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-lg space-y-3 relative overflow-hidden">
                <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold tracking-wider opacity-90">
                    <Shield size={14} />
                    <span>SMART ACCESS PASS</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/20 uppercase font-bold">
                    {form.cardType === 'visitor' ? 'Pengunjung' : 'Karyawan'}
                  </span>
                </div>

                <div className="pt-2">
                  <div className="text-lg font-bold truncate leading-tight">
                    {form.name || 'Nama Pemegang Kartu'}
                  </div>
                  <div className="text-xs opacity-80 mt-0.5">
                    {form.role || 'Jabatan / Role'} • {form.department}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/20 flex items-end justify-between font-mono text-xs">
                  <div>
                    <div className="text-[9px] opacity-70 uppercase">ID KARTU RFID</div>
                    <div className="font-bold tracking-widest">{form.cardId || 'CARD-00000'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] opacity-70 uppercase">NOMOR KARTU</div>
                    <div className="font-bold">{form.employeeId || 'NO-KARTU'}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs space-y-1.5 text-[var(--text-muted)]">
                <div className="flex items-center justify-between">
                  <span>Status Registrasi:</span>
                  <span className="font-bold text-[var(--success)]">
                    {form.status === 'active' ? 'Aktif (Akan Dideteksi)' : 'Nonaktif'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Protokol Sensor:</span>
                  <span className="font-mono text-[var(--text-primary)]">Proximity Gateway 10.1.5.x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════
           TAB 1: DAFTAR KARTU TERDAFTAR (CARD REGISTRY TABLE)
        ══════════════════════════════════════════════════════ */
        <div className="card-container p-5 space-y-4">
          {/* ── Search & Filter Controls ── */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search input */}
            <div className="relative flex-1 min-w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Cari nama, ID Kartu, Nomor Kartu, atau departemen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-styled pl-9 pr-8 py-2 text-xs w-full"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="input-styled px-3 py-2 text-xs cursor-pointer font-medium"
            >
              <option value="all">Semua Status ({totalCards})</option>
              <option value="active">Aktif ({activeCards})</option>
              <option value="inactive">Nonaktif ({inactiveCards})</option>
            </select>

            {/* Filter Type */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="input-styled px-3 py-2 text-xs cursor-pointer font-medium"
            >
              <option value="all">Semua Tipe</option>
              <option value="employee">Karyawan</option>
              <option value="visitor">Pengunjung (Visitor)</option>
            </select>

            {/* Filter Department */}
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="input-styled px-3 py-2 text-xs cursor-pointer font-medium"
            >
              <option value="all">Semua Departemen</option>
              {DEPARTMENTS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Reset Filter Button if active */}
            {(search || filterStatus !== 'all' || filterType !== 'all' || filterDept !== 'all') && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterStatus('all');
                  setFilterType('all');
                  setFilterDept('all');
                }}
                className="px-2.5 py-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-hover)] rounded-xl border border-[var(--border-subtle)] transition-all cursor-pointer flex items-center gap-1"
              >
                <X size={12} /> Reset
              </button>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={onOpenHardwareModal}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                title="Buka panel penangkapan sinyal kartu fisik via Gateway"
              >
                <Radio size={14} className="animate-pulse" />
                <span>Tangkap Sinyal Gateway</span>
              </button>

              <button
                onClick={() => setActiveTab('register')}
                className="px-3.5 py-2 rounded-xl bg-[var(--brand)] hover:opacity-90 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <UserPlus size={14} />
                Daftarkan Kartu
              </button>
            </div>
          </div>

          {/* ── Table of Registered Cards ── */}
          <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
            <table className="data-table w-full text-left text-xs">
              <thead>
                <tr>
                  <th>Pemegang Kartu</th>
                  <th>ID Kartu &amp; Nomor Kartu</th>
                  <th>Departemen &amp; Role</th>
                  <th>Tipe</th>
                  <th>Status Deteksi Live</th>
                  <th>Status Registrasi</th>
                  <th className="text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody>
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[var(--text-muted)]">
                      <CreditCard size={32} className="mx-auto mb-2 text-[var(--border-strong)]" />
                      Tidak ada kartu identitas yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map(card => {
                    const isDetected = currentlyDetectedCardIds.has(card.cardId);
                    const detectionInfo = activeDetections.find(d => d.cardId === card.cardId);
                    const currentGateway = detectionInfo ? getGateway(detectionInfo.gatewayId) : null;

                    return (
                      <tr key={card.cardId} className="hover:bg-[var(--bg-subtle)] transition-colors">
                        {/* Name & Avatar */}
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 text-white shadow-xs"
                              style={{ backgroundColor: card.avatarColor || '#6366f1' }}
                            >
                              {card.avatarInitials || card.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[var(--text-primary)] truncate">
                                {card.name}
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)] truncate">
                                Reg: {card.registeredAt || '2024-01-01'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Card ID & Employee ID */}
                        <td>
                          <div className="font-mono font-bold text-[var(--brand)]">
                            {card.cardId}
                          </div>
                          <div className="font-mono text-[11px] text-[var(--text-muted)]">
                            {card.employeeId || '—'}
                          </div>
                        </td>

                        {/* Dept & Role */}
                        <td>
                          <div className="font-semibold text-[var(--text-primary)]">
                            {card.department}
                          </div>
                          <div className="text-[11px] text-[var(--text-muted)]">
                            {card.role || card.division || '—'}
                          </div>
                        </td>

                        {/* Card Type */}
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            card.cardType === 'visitor'
                              ? 'bg-[var(--warning-bg)] text-[var(--warning)] border border-[var(--warning-border)]'
                              : 'bg-[var(--brand-bg)] text-[var(--brand)] border border-[var(--brand-border)]'
                          }`}>
                            {card.cardType === 'visitor' ? 'Pengunjung' : 'Karyawan'}
                          </span>
                        </td>

                        {/* Live Detection Status */}
                        <td>
                          {isDetected ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-ping" />
                              <span>{currentGateway?.name || 'Gateway Aktif'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[var(--border-strong)]" />
                              Di Luar Jangkauan
                            </span>
                          )}
                        </td>

                        {/* Registration Status */}
                        <td>
                          <button
                            onClick={() => onToggleStatus(card.cardId)}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                              card.status === 'active'
                                ? 'bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)] hover:opacity-80'
                                : 'bg-[var(--danger-bg)] text-[var(--danger)] border border-[var(--danger-border)] hover:opacity-80'
                            }`}
                            title="Klik untuk mengubah status aktif/nonaktif"
                          >
                            {card.status === 'active' ? (
                              <>
                                <Power size={10} />
                                Aktif
                              </>
                            ) : (
                              <>
                                <PowerOff size={10} />
                                Nonaktif
                              </>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Simulate / Hardware Detect Button */}
                            {card.status === 'active' && !isDetected && (
                              <button
                                onClick={() => {
                                  onOpenHardwareModal?.(card.cardId);
                                }}
                                className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white dark:text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                                title={`Tangkap sinyal ${card.name} melalui Gateway`}
                              >
                                <Radio size={11} className="animate-pulse" />
                                <span>Tangkap Sinyal</span>
                              </button>
                            )}

                            {/* Edit Button */}
                            <button
                              onClick={() => handleStartEdit(card)}
                              className="p-1.5 rounded-lg text-[var(--brand)] hover:bg-[var(--brand-bg)] border border-[var(--border-subtle)] hover:border-[var(--brand-border)] transition-colors cursor-pointer"
                              title="Edit data kartu ini"
                            >
                              <Pencil size={13} />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setCardToDelete(card)}
                              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 border border-[var(--border-subtle)] hover:border-red-300 dark:hover:border-red-800 transition-colors cursor-pointer"
                              title="Hapus kartu"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL EDIT KARTU ── */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[var(--brand-bg)] border border-[var(--brand-border)] text-[var(--brand)] flex items-center justify-center flex-shrink-0">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Edit Data Kartu Identitas</h3>
                  <p className="text-xs text-[var(--text-muted)]">Perbarui informasi pemilik atau konfigurasi kartu.</p>
                </div>
              </div>
              <button
                onClick={() => setEditingCard(null)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Nama Pemegang Kartu */}
              <div>
                <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                  Nama Lengkap Pemegang Kartu *
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input-styled w-full text-xs py-2 pl-9 pr-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* ID Kartu RFID / MAC */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    ID Kartu (RFID / MAC BLE) *
                  </label>
                  <div className="relative">
                    <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      required
                      value={editForm.cardId}
                      onChange={e => setEditForm(prev => ({ ...prev, cardId: e.target.value }))}
                      className="input-styled w-full text-xs py-2 pl-9 pr-3 font-mono"
                    />
                  </div>
                </div>

                {/* Nomor Kartu */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Nomor Kartu
                  </label>
                  <div className="relative">
                    <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Nomor kartu fisik"
                      value={editForm.employeeId}
                      onChange={e => setEditForm(prev => ({ ...prev, employeeId: e.target.value }))}
                      className="input-styled w-full text-xs py-2 pl-9 pr-3 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Departemen */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Departemen
                  </label>
                  <select
                    value={editForm.department}
                    onChange={e => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                    className="input-styled w-full text-xs py-2 pl-3 cursor-pointer"
                  >
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                {/* Jabatan / Role */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Jabatan / Posisi
                  </label>
                  <input
                    type="text"
                    value={editForm.role}
                    onChange={e => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    className="input-styled w-full text-xs py-2 pl-3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Tipe Kartu */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Tipe Pengguna
                  </label>
                  <select
                    value={editForm.cardType}
                    onChange={e => setEditForm(prev => ({ ...prev, cardType: e.target.value }))}
                    className="input-styled w-full text-xs py-2 pl-3 cursor-pointer"
                  >
                    <option value="employee">Karyawan Internal</option>
                    <option value="visitor">Pengunjung / Tamu</option>
                  </select>
                </div>

                {/* Status Registrasi */}
                <div>
                  <label className="block text-xs font-bold text-[var(--text-primary)] mb-1">
                    Status Registrasi
                  </label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    className="input-styled w-full text-xs py-2 pl-3 cursor-pointer"
                  >
                    <option value="active">Aktif (Dapat Dideteksi Gateway)</option>
                    <option value="inactive">Nonaktif (Ditolak Gateway)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--brand)] hover:opacity-90 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check size={14} />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL KONFIRMASI HAPUS ── */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">Hapus Kartu Identitas?</h3>
                <p className="text-xs text-[var(--text-muted)]">Tindakan ini akan menghapus kartu secara permanen.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs space-y-1">
              <div className="font-semibold text-[var(--text-primary)]">{cardToDelete.name}</div>
              <div className="font-mono text-xs text-[var(--brand)] font-bold">{cardToDelete.cardId} • {cardToDelete.employeeId || '—'}</div>
              <div className="text-[var(--text-muted)]">{cardToDelete.department} • {cardToDelete.role || 'Staff'}</div>
            </div>

            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Kartu ini akan dihapus dari sistem dan tidak akan dikenali atau dideteksi lagi oleh seluruh sensor Gateway.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border-subtle)] transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCard(cardToDelete.cardId);
                  setCardToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} />
                Ya, Hapus Kartu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardManagement;
