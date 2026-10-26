import React, { useState, useMemo } from 'react';
import {
  History, Search, Filter, Download, ChevronUp, ChevronDown,
  ChevronsUpDown, CheckCircle, X,
} from 'lucide-react';
import { GATEWAYS, formatDateTime, getCardHolder } from '../data/simulationData';

const StatusChip = ({ status }) => {
  if (status === 'active') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--success-bg)] text-[var(--success)] border border-[var(--success-border)]">
      <CheckCircle size={11} /> Aktif
    </span>
  );
  if (status === 'inactive') return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] flex-shrink-0" /> Nonaktif
    </span>
  );
  return <span className="text-xs text-[var(--text-muted)]">{status}</span>;
};

const SortIcon = ({ field, sortField, sortDir }) => {
  if (sortField !== field) return <ChevronsUpDown size={11} className="text-[var(--text-muted)]" />;
  return sortDir === 'asc'
    ? <ChevronUp size={11} className="text-[var(--brand)]" />
    : <ChevronDown size={11} className="text-[var(--brand)]" />;
};

const DetectionHistory = ({ historyRecords, onAddNotification }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [sortField, setSortField] = useState('detectedAt');
  const [sortDir, setSortDir] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let rows = [...historyRecords];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.cardId.toLowerCase().includes(q) ||
        r.holderName.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.gatewayName.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      rows = rows.filter(r => r.cardStatus === statusFilter);
    }
    if (gatewayFilter !== 'all') {
      rows = rows.filter(r => r.gatewayId === gatewayFilter);
    }
    rows.sort((a, b) => {
      let va = a[sortField], vb = b[sortField];
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
    });
    return rows;
  }, [historyRecords, search, statusFilter, gatewayFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCSV = () => {
    if (filtered.length === 0) {
      onAddNotification?.('warning', 'Ekspor CSV', 'Tidak ada data untuk diekspor sesuai filter saat ini.');
      return;
    }

    const headers = [
      'No',
      'ID Log',
      'Waktu Deteksi',
      'ID Kartu',
      'NIP / ID Karyawan',
      'Nama Karyawan / Pemilik',
      'Departemen',
      'Divisi',
      'Jabatan',
      'Tipe Kartu',
      'ID Gateway',
      'Nama Gateway',
      'Lokasi Gateway',
      'Jarak Sensor (meter)',
      'Status Kartu',
    ];

    const rows = filtered.map((r, index) => {
      const holder = getCardHolder(r.cardId);
      return [
        index + 1,
        r.id || `LOG-${index + 1}`,
        formatDateTime(r.detectedAt),
        r.cardId || '-',
        holder?.employeeId || '-',
        r.holderName || holder?.name || '-',
        r.department || holder?.department || '-',
        holder?.division || '-',
        holder?.role || '-',
        r.cardType === 'employee' ? 'Karyawan' : 'Pengunjung/Tamu',
        r.gatewayId || '-',
        r.gatewayName || '-',
        r.location || '-',
        r.distanceAvailable && r.distance != null ? r.distance : '-',
        r.cardStatus === 'active' ? 'Aktif' : 'Nonaktif',
      ];
    });

    const escapeCSV = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    // UTF-8 BOM (\uFEFF) ensures Microsoft Excel properly displays characters and formatting
    const csvContent = '\uFEFF' + [headers, ...rows]
      .map(row => row.map(escapeCSV).join(','))
      .join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    a.href = url;
    a.download = `Laporan_Deteksi_Gateway_${dateStr}_${timeStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onAddNotification?.('success', 'Ekspor CSV Berhasil', `${filtered.length} baris riwayat deteksi berhasil diekspor.`);
  };

  const Col = ({ field, children }) => (
    <th
      onClick={() => toggleSort(field)}
      className="cursor-pointer hover:text-[var(--text-primary)] select-none transition-colors"
    >
      <div className="flex items-center gap-1.5">
        {children}
        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </div>
    </th>
  );

  return (
    <div className="card-container p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="section-title">
            <History size={18} className="text-[var(--brand)]" />
            Riwayat Deteksi Gateway
          </h2>
          <p className="section-subtitle">
            {filtered.length} dari total {historyRecords.length} aktivitas terdeteksi
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-export-csv"
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all active:scale-95"
            title="Ekspor laporan riwayat deteksi ke file CSV"
          >
            <Download size={13} strokeWidth={2.5} />
            <span>Ekspor CSV</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-800/60 text-white font-bold">
              {filtered.length}
            </span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-44">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            id="input-search-history"
            type="text"
            placeholder="Cari kartu, nama, departemen, gateway..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="input-styled pl-9 py-1.5 text-xs"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <select
            id="select-status-filter"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="input-styled pl-8 pr-7 py-1.5 text-xs appearance-none cursor-pointer min-w-36 font-medium"
          >
            <option value="all">Semua Status</option>
            <option value="active">Kartu Aktif</option>
            <option value="inactive">Kartu Nonaktif</option>
          </select>
        </div>

        {/* Gateway filter */}
        <div className="relative">
          <select
            id="select-gateway-filter"
            value={gatewayFilter}
            onChange={e => { setGatewayFilter(e.target.value); setCurrentPage(1); }}
            className="input-styled px-3 py-1.5 text-xs appearance-none cursor-pointer min-w-44 font-medium"
          >
            <option value="all">Semua Gateway</option>
            {GATEWAYS.map(gw => (
              <option key={gw.id} value={gw.id}>{gw.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto rounded-xl border border-[var(--border-subtle)]">
        <table className="data-table">
          <thead>
            <tr>
              <Col field="detectedAt">Waktu Deteksi</Col>
              <Col field="cardId">ID Kartu</Col>
              <Col field="holderName">Nama Pemilik</Col>
              <Col field="department">Departemen</Col>
              <Col field="gatewayName">Gateway</Col>
              <Col field="location">Lokasi</Col>
              <th>Jarak</th>
              <Col field="cardStatus">Status</Col>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-[var(--text-muted)] text-sm">
                  Tidak ada aktivitas yang sesuai dengan kriteria filter
                </td>
              </tr>
            ) : (
              paginated.map((record) => (
                <tr key={record.id}>
                  <td className="text-xs font-mono text-[var(--text-muted)] whitespace-nowrap">
                    {formatDateTime(record.detectedAt)}
                  </td>
                  <td>
                    <span className="text-xs font-mono font-semibold text-[var(--brand)]">
                      {record.cardId}
                    </span>
                  </td>
                  <td>
                    <div className="text-xs text-[var(--text-primary)] font-bold">{record.holderName}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {record.cardType === 'visitor' ? 'Pengunjung' : 'Karyawan'}
                    </div>
                  </td>
                  <td className="text-xs text-[var(--text-secondary)] font-medium">
                    {record.department}
                  </td>
                  <td>
                    <div className="text-xs text-[var(--text-primary)] font-semibold">{record.gatewayName}</div>
                    <div className="text-xs font-mono text-[var(--text-muted)]">{record.gatewayIp}</div>
                  </td>
                  <td className="text-xs text-[var(--text-secondary)]">
                    {record.location}
                  </td>
                  <td>
                    {record.distanceAvailable
                      ? <span className="text-xs font-mono font-medium text-[var(--text-primary)]">{record.distance}m</span>
                      : <span className="text-xs text-[var(--text-muted)] italic">N/A</span>
                    }
                  </td>
                  <td>
                    <StatusChip status={record.cardStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-[var(--text-muted)]">
            Halaman {currentPage} dari {totalPages}
          </span>
          <div className="flex gap-1.5">
            <button
              id="btn-prev-page"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Prev
            </button>
            <button
              id="btn-next-page"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetectionHistory;
