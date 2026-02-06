
# Rencana Implementasi: Sinkronisasi Realtime & Auto Backup

## Ringkasan
Implementasi sinkronisasi data secara real-time untuk SEMUA menu aplikasi termasuk pengaturan toko, dan membuat fitur auto backup otomatis setiap hari pukul 20:00 WIB.

---

## Bagian 1: Sinkronisasi Pengaturan (Settings) ke Database

Saat ini pengaturan toko (nama, alamat, telepon, logo, printer settings, stock settings) hanya tersimpan di localStorage sehingga tidak tersinkron antar perangkat. Perlu migrasi ke database.

### 1.1 Perubahan Database
Menambahkan kolom baru ke tabel `profiles`:

| Kolom Baru | Tipe Data | Keterangan |
|------------|-----------|------------|
| `store_address` | text | Alamat toko |
| `store_phone` | text | Nomor telepon toko |
| `store_logo` | text | Logo toko (base64) |
| `printer_type` | text | thermal / regular |
| `paper_width` | text | 58mm / 80mm / A4 |
| `auto_print` | boolean | Cetak otomatis |
| `min_stock_alert` | integer | Batas peringatan stok |

### 1.2 Update StoreContext
- Migrasi dari localStorage ke Supabase
- Tambahkan realtime listener untuk tabel `profiles`
- Sinkronisasi pengaturan otomatis saat ada perubahan

---

## Bagian 2: Verifikasi Realtime di Semua Menu

### Menu yang Sudah Tersinkron (via DataContext):
- Dashboard - transactions, products, purchases, expenses, projects
- Kasir - products, transactions
- Produk - products
- Pembelian - purchases, suppliers
- Penjualan - transactions
- Proyek - projects
- Proyek Dashboard - projects
- Utang/Piutang - debts
- Operasional - expenses
- Laporan - all data

### Yang Perlu Ditambahkan:
- **Pengaturan (Settings)** - perlu realtime sync untuk profiles table

---

## Bagian 3: Auto Backup Harian (20:00 WIB)

### 3.1 Membuat Tabel Backups
Tabel baru untuk menyimpan riwayat backup:

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | ID pengguna |
| `backup_data` | jsonb | Data backup lengkap |
| `backup_type` | text | 'auto' / 'manual' |
| `created_at` | timestamptz | Waktu backup |

### 3.2 Membuat Edge Function untuk Backup
Edge function `auto-backup` yang akan:
1. Mengambil semua data pengguna (products, transactions, purchases, dll)
2. Menyimpan ke tabel `backups`
3. Menjaga maksimal 7 backup terakhir (hapus yang lama)

### 3.3 Menjadwalkan Backup dengan pg_cron
Menambahkan cron job yang berjalan setiap hari pukul 20:00 WIB (13:00 UTC):

```text
Jadwal: 0 13 * * * (setiap hari jam 13:00 UTC = 20:00 WIB)
```

### 3.4 Update Menu Pengaturan
- Menampilkan riwayat backup
- Tombol backup manual
- Tombol restore dari backup
- Status backup terakhir

---

## Detail Teknis

### File yang Akan Dibuat:
1. `supabase/functions/auto-backup/index.ts` - Edge function untuk backup
2. Migration untuk tabel `backups` dan update `profiles`

### File yang Akan Dimodifikasi:
1. `src/contexts/StoreContext.tsx` - Migrasi ke Supabase dengan realtime
2. `src/pages/Pengaturan.tsx` - UI backup & restore, realtime settings
3. `src/contexts/DataContext.tsx` - Menambahkan fungsi backup/restore

### Alur Auto Backup:
```text
pg_cron (20:00 WIB)
    |
    v
HTTP POST ke edge function /auto-backup
    |
    v
Edge function mengambil data tiap user
    |
    v
Simpan ke tabel backups (JSONB)
    |
    v
Hapus backup >7 hari
```

### Alur Manual Backup:
```text
User klik "Backup Sekarang"
    |
    v
Frontend panggil edge function
    |
    v
Data disimpan ke tabel backups
    |
    v
Toast sukses + refresh daftar backup
```

### Alur Restore:
```text
User pilih backup dari daftar
    |
    v
Konfirmasi restore
    |
    v
Data dari backup di-insert ke masing-masing tabel
    |
    v
Refresh semua data
```

---

## Keamanan
- RLS pada tabel `backups` - user hanya bisa akses backup miliknya
- Edge function menggunakan service role untuk backup semua user
- Validasi user_id saat restore

---

## Hasil Akhir
1. Semua pengaturan toko tersinkron real-time antar perangkat
2. Backup otomatis setiap hari jam 20:00 WIB
3. Riwayat backup tersedia di menu Pengaturan
4. User bisa backup manual dan restore kapan saja
5. Data aman karena backup disimpan di server
