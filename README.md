# Sistem Pemantauan Karyawan & Pengunjung Berdasarkan Kartu dan Gateway IoT

Aplikasi web modern untuk monitoring presensi dan pergerakan kartu identitas (RFID/BLE) karyawan serta pengunjung melalui jaringan perangkat Gateway IoT di lingkungan perusahaan.

---

## 🌟 Fitur Utama Sistem

### 1. Dashboard Monitoring Utama
- **4 Kartu Metrik Interaktif**:
  - *Kartu Terdeteksi*: Jumlah kartu yang saat ini berada dalam jangkauan sensor (klik untuk membuka live feed).
  - *Total Kartu Terdaftar*: Total basis data kartu karyawan & pengunjung terdaftar (klik untuk membuka modul registrasi kartu).
  - *Gateway Terhubung*: Rasio perangkat online dengan badge 3 level operasional (Normal / Warning / Offline).
  - *Total Aktivitas Deteksi*: Akumulasi pembacaan sensor harian.
- **Status Gateway 3-Level (Online / Warning / Offline)**:
  - Multi-segment health bar proporsional (Hijau, Kuning, Merah).
  - Tab filter cepat (*Semua*, *Online*, *Warning*, *Offline*) & pencarian instan.
  - Telemetri live per gateway (IP, kekuatan sinyal 4-bar, kartu aktif, waktu terakhir terlihat, dan latensi).
  - Tombol interaktif **Uji Jaringan** dan **Uji Ping ICMP** per perangkat.
  - Panel **Diagnostik Jaringan IoT** di bagian bawah kartu untuk sinkronisasi seluruh perangkat secara real-time.
- **Aktivitas Deteksi Terkini**: Live feed kartu yang baru saja terdeteksi dilengkapi pencarian instan dan filter per Gateway.
- **Grafik Aktivitas Per Jam**: Distribusi frekuensi pembacaan sensor dalam rentang 12 jam terakhir.
- **Riwayat Pembacaan Terakhir**: 5 log pencatatan terbaru yang diperbarui otomatis.

---

### 2. Registrasi & Manajemen Kartu (Card Registry)
Sistem sensor Gateway **hanya akan mendeteksi kartu yang terdaftar aktif dalam basis data**:
- **Formulir Registrasi Kartu Baru**:
  - Input ID Kartu (RFID / BLE UID) dengan fitur *Generate ID Acak*.
  - Nomor Induk Karyawan (NIK) atau Nomor Registrasi Tamu.
  - Nama lengkap pemegang kartu.
  - Tipe kartu: *Karyawan (Employee)* atau *Pengunjung (Visitor)*.
  - Departemen & Divisi (Engineering, HRD, IT, Finance, Operations, Marketing, dll).
  - Jabatan / Role kerja.
  - Status registrasi awal: *Aktif (Dapat Dideteksi)* atau *Nonaktif*.
  - Opsi *Langsung uji deteksi di Gateway setelah registrasi*.
  - **Live Preview Kartu Fisik**: Menampilkan kartu identitas virtual real-time saat mengisi form.
- **Daftar Kartu Terdaftar**:
  - Pencarian multi-field (nama, ID kartu, NIK, role, departemen).
  - Filter berdasarkan status (Aktif/Nonaktif) dan tipe (Karyawan/Pengunjung).
  - Indikator status live: *Sedang Terdeteksi di Gateway* vs *Di Luar Jangkauan*.
  - Tombol **Toggle Status** instan (Aktifkan / Nonaktifkan kartu). Kartu nonaktif otomatis ditolak oleh sensor.
  - Tombol **Uji Deteksi** untuk menguji pembacaan kartu di Gateway aktif secara langsung.
  - Fitur hapus kartu dari sistem registrasi.

---

### 3. Kartu Terdeteksi (Live Area)
- Panel khusus yang menampilkan kartu-kartu yang saat ini berada dalam radius pembacaan Gateway.
- Dilengkapi penanda waktu relatif (*Baru saja*, *dtk lalu*, *mnt lalu*), lokasi gateway deteksi, dan tombol pintas ke modul manajemen kartu.

---

### 4. Peta Jangkauan Gateway (Range Map)
- Visualisasi denah area berbasis SVG interaktif.
- Menampilkan posisi 7 titik deteksi Gateway beserta jangkauan sinyal dan posisi kartu yang terdeteksi di sekitarnya.
- Kontrol slider radius jangkauan deteksi (10m – 100m).
- Klik pada gateway untuk menginspeksi detail telemetri dan kartu yang berada dalam radiusnya.

---

### 5. Riwayat Deteksi & Ekspor Laporan CSV
- Tabel log lengkap pembacaan sensor kartu dari seluruh Gateway.
- Filter pencarian teks, filter per Gateway, filter tipe kartu, dan filter rentang tanggal.
- Pagination data responsif.
- Fitur **Ekspor CSV**: Mengunduh laporan riwayat deteksi berstandar enterprise dengan format bersih siap buka di Microsoft Excel / Google Sheets.

---

### 6. Konfigurasi Gateway
- Form konfigurasi koneksi jaringan Gateway (Service Access: HTTP, HTTPS, WebSocket, MQTT).
- Pengaturan autentikasi (Bearer Token, API Key, Basic Auth).
- Fitur uji koneksi jaringan langsung ke IP gateway.

---

## 🌐 Daftar Perangkat Gateway (Titik Deteksi)

Perangkat Gateway dinamai secara sistematis sebagai titik deteksi IoT dalam jaringan lokal `10.1.5.x`:

| ID Gateway | Nama Gateway | Alamat IP | Titik Lokasi | Level Status | Latensi |
|------------|--------------|-----------|--------------|--------------|---------|
| **GW-01** | Gateway Deteksi 01 | `10.1.5.13`  | Titik Deteksi 01 (Lt. 1) | 🟢 Online  | ~12 ms  |
| **GW-02** | Gateway Deteksi 02 | `10.1.5.32`  | Titik Deteksi 02 (Lt. 2) | 🟢 Online  | ~8 ms   |
| **GW-03** | Gateway Deteksi 03 | `10.1.5.62`  | Titik Deteksi 03 (Lt. 2) | ⚠️ Warning | ~285 ms (Sinyal lemah) |
| **GW-04** | Gateway Deteksi 04 | `10.1.5.89`  | Titik Deteksi 04 (Area B1) | 🟢 Online  | ~19 ms  |
| **GW-05** | Gateway Deteksi 05 | `10.1.5.114` | Titik Deteksi 05 (Lt. 1) | 🟢 Online  | ~15 ms  |
| **GW-06** | Gateway Deteksi 06 | `10.1.5.140` | Titik Deteksi 06 (Lt. 1) | 🔴 Offline | — (Koneksi terputus) |
| **GW-07** | Gateway Deteksi 07 | `10.1.5.194` | Titik Deteksi 07 (Lt. 1) | 🟢 Online  | ~14 ms  |

---

## 🎨 Desain & UI/UX

- **Design System Tokens**: Menggunakan CSS Custom Properties (`--bg-surface`, `--brand`, `--success`, dll) untuk konsistensi visual.
- **Dark Mode Konsisten**: Kartu dan panel memiliki kedalaman warna (*cards lighter than base background*) untuk hierarki dimensi yang elegan.
- **Tipografi Modern**: Menggunakan Google Font **Inter** untuk teks antarmuka dan **JetBrains Mono** untuk ID kartu, IP, dan latensi.
- **Radius & Transisi**: Sudut melengkung 16px (`rounded-2xl`) dengan transisi halus pada status hover dan animasi loading.

---

## 🚀 Panduan Menjalankan Proyek

### 1. Prasyarat
- **Node.js** versi 18.x atau yang lebih baru (disarankan Node.js 20+ LTS).
- **npm** versi 9+.

Verifikasi versi Node.js di terminal:
```bash
node -v
npm -v
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Menjalankan Server Development
```bash
npm run dev
```
Buka browser dan akses URL lokal: **http://localhost:5173** (atau port yang tertera pada terminal).

### 4. Build Produksi
Untuk memeriksa validitas bundle produksi:
```bash
npm run build
```
Hasil kompilasi siap rilis akan berada di direktori `dist/`.

---

## 📁 Struktur Berkas

```
src/
├── App.jsx                        # Root aplikasi, state global, dan routing halaman
├── main.jsx                       # Entry point React DOM
├── index.css                      # Design tokens CSS (Light/Dark mode, animasi, tipografi)
│
├── data/
│   └── simulationData.js          # Definisi data awal Gateway Deteksi 01-07 & kartu identitas
│
├── hooks/
│   └── useSimulation.js           # State management: registrasi kartu, deteksi berbasis register, polling IoT
│
├── components/
│   ├── Sidebar.jsx                # Navigasi sidebar dengan counter badge
│   ├── Header.jsx                 # Top bar: metadata halaman, jam digital, toggle tema
│   ├── DashboardStats.jsx         # 4 Kartu metrik utama yang terhubung ke modul
│   ├── GatewayStatus.jsx          # Panel status 3-level Gateway dengan telemetri & uji ping
│   ├── CardManagement.jsx         # Modul registrasi kartu baru & tabel manajemen kartu
│   ├── CardIdentity.jsx           # Panel live feed kartu yang sedang terdeteksi
│   ├── GatewayRangeMap.jsx        # Peta SVG interaktif posisi Gateway & kartu
│   ├── DetectionHistory.jsx       # Log riwayat lengkap, filter pencarian & ekspor CSV
│   ├── GatewayConfiguration.jsx   # Pengaturan konfigurasi koneksi jaringan Gateway
│   └── NotificationToast.jsx      # Notifikasi toast interaktif
│
└── pages/
    └── DashboardPage.jsx          # Halaman dashboard utama (Stats, Gateway, Feed, Chart, Riwayat)
```

---

## 📄 Lisensi
Sistem Pemantauan Karyawan & Pengunjung Berdasarkan Kartu dan Gateway IoT. Hak Cipta Perusahaan.
