
# Penyempurnaan Logika Transaksi: Kasir dan Pembelian Supplier

## Ringkasan
Menambahkan status pembayaran (Lunas/Belum Lunas) pada transaksi penjualan dan pembelian, dengan otomasi pencatatan utang/piutang untuk transaksi yang belum lunas. Stok tetap dikelola oleh database trigger yang sudah ada.

---

## 1. Perubahan di Menu Kasir (Penjualan)

### UI Checkout Dialog
- Tambahkan pilihan **Status Pembayaran**: `Lunas` atau `Belum Lunas`
- Jika `Belum Lunas`, tampilkan input **Jumlah Bayar** (bisa 0 atau sebagian)
- Otomatis hitung **Sisa** = Total - Jumlah Bayar
- Jika status `Belum Lunas`, nama pelanggan **wajib diisi**

### Logika Simpan Transaksi
- Simpan transaksi dengan status `Selesai` (agar trigger stok tetap berjalan)
- Jika `Belum Lunas` atau bayar < total:
  - Otomatis buat record **Piutang** di tabel `debts` dengan:
    - `type`: `piutang`
    - `nama`: nama pelanggan
    - `total`: sisa yang belum dibayar
    - `sisa`: sama dengan total
    - `keterangan`: referensi ID transaksi

---

## 2. Perubahan di Menu Pembelian Supplier

### UI Form Pembelian
- Tambahkan pilihan **Status Pembayaran**: `Lunas` atau `Belum Lunas`
- Jika `Belum Lunas`, DP dianggap sebagai pembayaran awal
- Otomatis hitung **Sisa** = Total - DP

### Logika Simpan Pembelian
- Jika `Belum Lunas` atau DP < Total:
  - Otomatis buat record **Utang** di tabel `debts` dengan:
    - `type`: `utang`
    - `nama`: nama supplier
    - `total`: sisa yang belum dibayar (Total - DP)
    - `sisa`: sama dengan total
    - `keterangan`: referensi pembelian

---

## 3. Penanganan Edit dan Hapus

### Edit Transaksi Penjualan (via menu Penjualan)
- Stok sudah ditangani oleh trigger database (reversal otomatis saat status berubah)
- Jika status pembayaran berubah dari Belum Lunas ke Lunas: hapus/lunasi piutang terkait
- Jika jumlah berubah: update record piutang terkait

### Hapus Transaksi Penjualan
- Stok sudah dikembalikan otomatis oleh trigger `handle_transaction_stock_reversal`
- Hapus juga record piutang terkait di tabel `debts`

### Edit/Hapus Pembelian
- Stok sudah ditangani trigger database
- Update/hapus record utang terkait

---

## 4. Perubahan DataContext

Tambah fungsi helper:
- `createTransactionDebt(transactionId, customerName, amount)` -- buat piutang dari penjualan
- `createPurchaseDebt(purchaseId, supplierName, amount)` -- buat utang dari pembelian
- `removeRelatedDebt(keterangan)` -- hapus utang/piutang berdasarkan referensi transaksi

---

## 5. Detail Teknis

### File yang Dimodifikasi:
1. **`src/pages/Kasir.tsx`** -- tambah status pembayaran di checkout, logika auto-piutang
2. **`src/pages/Pembelian.tsx`** -- tambah status pembayaran, logika auto-utang
3. **`src/contexts/DataContext.tsx`** -- tambah helper functions untuk auto debt creation
4. **`src/pages/Penjualan.tsx`** -- update logika edit/hapus untuk sinkronisasi piutang

### Tidak Ada Perubahan Database:
- Tabel `debts` sudah memiliki semua kolom yang diperlukan (`type`, `nama`, `total`, `sisa`, `keterangan`)
- Trigger stok sudah berjalan dengan benar
- Tidak perlu migrasi database baru

### Alur Penjualan Belum Lunas:
```text
Kasir: Pilih produk -> Checkout -> Status: Belum Lunas
    |
    v
Simpan transaksi (status='Selesai') -> Trigger kurangi stok
    |
    v
Otomatis buat Piutang di tabel debts
    |
    v
Muncul di menu Utang/Piutang -> Tab Piutang
```

### Alur Pembelian Belum Lunas:
```text
Pembelian: Tambah item -> Status: Selesai, Bayar: Belum Lunas
    |
    v
Simpan pembelian -> Trigger tambah stok (jika Selesai)
    |
    v
Otomatis buat Utang di tabel debts
    |
    v
Muncul di menu Utang/Piutang -> Tab Utang
```
