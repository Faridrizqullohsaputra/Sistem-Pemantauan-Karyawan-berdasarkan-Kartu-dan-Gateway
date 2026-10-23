# Company Gateway Monitoring Dashboard

> **Prototype Frontend** — Data yang ditampilkan adalah simulasi. Dashboard ini belum terhubung ke Gateway nyata.

Aplikasi web monitoring untuk memantau kartu identitas karyawan dan pengunjung yang terdeteksi melalui perangkat Gateway di lingkungan perusahaan.

## 🖥️ Preview Fitur

- **Dashboard Utama** — Statistik live, status semua Gateway, aktivitas terkini
- **Kartu Terdeteksi** — Panel kartu aktif dalam jangkauan saat ini
- **Peta Jangkauan** — Visualisasi SVG posisi Gateway & kartu, dengan slider radius
- **Riwayat Deteksi** — Tabel lengkap dengan pencarian, filter, sortir, dan ekspor CSV
- **Konfigurasi Gateway** — Form konfigurasi Gateway (prototype, tanpa request nyata)
- **Simulasi** — Kartu baru masuk/keluar jangkauan secara otomatis & manual

## 🌐 Gateway yang Dikonfigurasi

| Gateway | IP | Lokasi | Status |
|---------|-----|--------|--------|
| GW-01 | 10.1.5.13  | Lobby Utama Lt. 1   | Connected   |
| GW-02 | 10.1.5.32  | Ruang Server Lt. 2  | Connected   |
| GW-03 | 10.1.5.62  | Ruang Rapat Lt. 2   | Connected   |
| GW-04 | 10.1.5.89  | Area Parkir B1      | Connecting  |
| GW-05 | 10.1.5.114 | Kantin Lt. 1        | Connected   |
| GW-06 | 10.1.5.140 | Gudang Lt. 1        | Error       |
| GW-07 | 10.1.5.194 | Pintu Belakang Lt.1 | Disconnected|

---

## ⚙️ Prasyarat

Sebelum menjalankan proyek, pastikan sudah terinstall:

### 1. Install Node.js

Download dari **https://nodejs.org** — pilih versi **LTS (22.x)**

Setelah install, verifikasi di terminal:
```bash
node --version   # Harusnya v18+ atau v20+
npm --version    # Harusnya v9+
```

---

## 🚀 Cara Menjalankan

### Install dependencies
```bash
npm install
```

### Jalankan development server
```bash
npm run dev
```

Buka browser dan akses: **http://localhost:5173**

### Build produksi
```bash
npm run build
```

File hasil build ada di folder `dist/`.

### Preview build produksi
```bash
npm run preview
```

---

## 📁 Struktur Proyek

```
src/
├── App.jsx                        # Root aplikasi & routing antar halaman
├── main.jsx                       # Entry point React
├── index.css                      # Global styles (Tailwind + custom)
│
├── data/
│   └── simulationData.js          # ⚠️ Data simulasi (Gateway, kartu, riwayat)
│
├── hooks/
│   └── useSimulation.js           # State management simulasi
│
├── components/
│   ├── Sidebar.jsx                # Navigasi sidebar
│   ├── Header.jsx                 # Header + kontrol simulasi
│   ├── DashboardStats.jsx         # Kartu statistik
│   ├── GatewayStatus.jsx          # Panel status Gateway
│   ├── CardIdentity.jsx           # Panel kartu terdeteksi
│   ├── GatewayRangeMap.jsx        # Peta SVG jangkauan
│   ├── DetectionHistory.jsx       # Tabel riwayat + filter + CSV
│   ├── GatewayConfiguration.jsx   # Form konfigurasi Gateway
│   └── NotificationToast.jsx      # Notifikasi toast
│
└── pages/
    └── DashboardPage.jsx          # Halaman dashboard utama
```

---

## 🎮 Cara Menggunakan Simulasi

### Kontrol di Header (kanan atas):
| Tombol | Fungsi |
|--------|--------|
| ⚡ **Deteksi** | Tambah kartu baru yang terdeteksi secara manual |
| ↗ **Keluar** | Hapus satu kartu dari daftar aktif |
| ⏸/▶ **Jeda/Lanjut** | Hentikan atau lanjutkan simulasi otomatis |

### Simulasi Otomatis:
- Setiap 8 detik, sistem secara acak menambah atau menghapus kartu dari daftar aktif
- Statistik dan riwayat diperbarui otomatis
- Notifikasi muncul di pojok kanan bawah

---

## 🔧 Persiapan Integrasi Gateway Nyata

File `src/data/simulationData.js` dan `src/hooks/useSimulation.js` dirancang untuk kemudahan integrasi.

Langkah integrasi setelah dokumentasi Gateway tersedia:
1. Ganti data simulasi di `simulationData.js` dengan fetch API ke endpoint Gateway
2. Update `useSimulation.js` untuk polling atau WebSocket ke Gateway
3. Sesuaikan format payload sesuai dokumentasi protokol Gateway
4. Tambahkan autentikasi yang sesuai (Bearer Token / API Key / Basic Auth)

---

## ⚠️ Catatan Penting

- **Ini adalah prototype frontend.** Tidak ada backend atau database.
- **Data adalah simulasi**, bukan dari Gateway nyata.
- **Credential** pada form konfigurasi tidak disimpan ke localStorage.
- Integrasi dengan Gateway nyata memerlukan dokumentasi protokol terlebih dahulu.
- Jarak deteksi ditandai "N/A" karena belum terverifikasi dari Gateway.

---

## 🛠️ Teknologi

- **React 18** + Vite 5
- **Tailwind CSS 3**
- **Lucide React** (ikon)
- JavaScript ES6+
