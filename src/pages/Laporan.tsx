import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/components/RupiahIcon';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import { useStore } from '@/contexts/StoreContext';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  FileText,
  PieChart,
  FileSpreadsheet,
  File,
  FolderKanban,
  Clock,
  Package,
  Users,
  Wallet,
  Calculator,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Berjalan': 'bg-blue-100 text-blue-800',
  'Selesai': 'bg-green-100 text-green-800',
  'Dibatalkan': 'bg-red-100 text-red-800',
};

export default function Laporan() {
  console.log('Laporan component loaded');
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePeriod, setActivePeriod] = useState('Semua Periode');

  const { expenses, projects, transactions, products, debts, purchases, modalAwal } = useData();
  console.log('Laporan data:', { transactions: transactions.length, expenses: expenses.length, modalAwal });
  const { storeInfo } = useStore();

  // Filter data by period
  const filteredData = useMemo(() => {
    const filterByDate = <T extends { tanggal?: string; date?: string; tanggalOrder?: string }>(
      items: T[]
    ): T[] => {
      if (!startDate || !endDate) return items;
      return items.filter((item) => {
        const itemDate = item.tanggal || item.date || item.tanggalOrder || '';
        const dateOnly = itemDate.split(' ')[0];
        return dateOnly >= startDate && dateOnly <= endDate;
      });
    };

    return {
      transactions: filterByDate(transactions),
      expenses: filterByDate(expenses),
      purchases: filterByDate(purchases),
      projects: startDate && endDate 
        ? projects.filter(p => {
            const orderDate = p.tanggalOrder;
            return orderDate >= startDate && orderDate <= endDate;
          })
        : projects,
    };
  }, [transactions, expenses, purchases, projects, startDate, endDate]);

  // Calculate real stats from filtered data
  const totalPenjualan = useMemo(
    () => filteredData.transactions.reduce((sum, t) => sum + t.total, 0),
    [filteredData.transactions]
  );

  const totalPembelian = useMemo(
    () => filteredData.purchases.reduce((sum, p) => sum + p.total, 0),
    [filteredData.purchases]
  );

  const totalOperasional = useMemo(
    () => filteredData.expenses.reduce((sum, e) => sum + e.jumlah, 0),
    [filteredData.expenses]
  );

  const labaKotor = totalPenjualan - totalPembelian;
  const labaBersih = labaKotor - totalOperasional;
  const marginBersih = totalPenjualan > 0 ? (labaBersih / totalPenjualan) * 100 : 0;

  // Debug modal awal state
  useEffect(() => {
    console.log('[Laporan] modalAwal state:', modalAwal);
    console.log('[Laporan] accountingData:', accountingData);
  }, [modalAwal, accountingData]);

  // Accounting calculations with modal awal
  const accountingData = useMemo(() => {
    console.log('Calculating accounting data...', { modalAwal, totalPenjualan, totalPembelian, totalOperasional, debts, products });
    
    if (!modalAwal) {
      console.log('No modal awal, returning default values');
      return {
        modalAwalTotal: 0,
        ekuitasAwal: 0,
        ekuitasAkhir: labaBersih,
        totalAset: 0,
        totalLiabilitas: 0,
        totalEkuitas: labaBersih,
      };
    }

    // Calculate current assets
    const totalPiutang = debts
      .filter(d => d.type === 'piutang')
      .reduce((sum, d) => sum + d.sisa, 0);
    
    const totalStokValue = products.reduce((sum, p) => sum + (p.hargaBeli * p.stok), 0);
    
    // Calculate liabilities
    const totalUtang = debts
      .filter(d => d.type === 'utang')
      .reduce((sum, d) => sum + d.sisa, 0);

    // Current cash estimation (simplified)
    const kasTersedia = modalAwal.kas + totalPenjualan - totalPembelian - totalOperasional;

    const totalAset = kasTersedia + modalAwal.bank + totalStokValue + totalPiutang;
    const totalLiabilitas = totalUtang;
    const ekuitasAkhir = modalAwal.total + labaBersih;

    console.log('Calculated values:', {
      totalPiutang,
      totalStokValue,
      totalUtang,
      kasTersedia,
      totalAset,
      totalLiabilitas,
      ekuitasAkhir
    });

    return {
      modalAwalTotal: modalAwal.total,
      ekuitasAwal: modalAwal.total,
      ekuitasAkhir,
      totalAset,
      totalLiabilitas,
      totalEkuitas: ekuitasAkhir,
      kasTersedia,
      totalPiutang,
      totalUtang,
      totalStokValue,
    };
  }, [modalAwal, labaBersih, totalPenjualan, totalPembelian, totalOperasional, debts, products]);

  const projectStats = useMemo(() => {
    const data = filteredData.projects;
    const total = data.length;
    const selesai = data.filter(p => p.status === 'Selesai').length;
    const berjalan = data.filter(p => p.status === 'Berjalan').length;
    const pending = data.filter(p => p.status === 'Pending').length;
    const totalNilai = data.reduce((sum, p) => sum + p.nilaiKontrak, 0);
    const totalDP = data.reduce((sum, p) => sum + p.dp, 0);
    const totalMaterial = data.reduce((sum, p) => 
      sum + (p.materials?.reduce((ms, m) => ms + (m.qty * m.harga), 0) || 0), 0);
    const totalTenagaKerja = data.reduce((sum, p) => sum + (p.biayaTenagaKerja || 0), 0);
    const sisaBayar = totalNilai - totalDP;
    const keuntungan = totalNilai - totalMaterial - totalTenagaKerja;
    return { total, selesai, berjalan, pending, totalNilai, totalDP, sisaBayar, totalMaterial, totalTenagaKerja, keuntungan };
  }, [filteredData.projects]);

  // Top products from transactions
  const topProducts = useMemo(() => {
    const productSales: Record<string, { sold: number; revenue: number }> = {};
    
    filteredData.transactions.forEach(t => {
      // Parse items string like "Product x10, Product2 x5"
      const itemParts = t.items.split(', ');
      itemParts.forEach(part => {
        const match = part.match(/(.+)\s+x(\d+)/);
        if (match) {
          const name = match[1].trim();
          const qty = parseInt(match[2]);
          if (!productSales[name]) {
            productSales[name] = { sold: 0, revenue: 0 };
          }
          productSales[name].sold += qty;
        }
      });
    });

    // Get product details
    return Object.entries(productSales)
      .map(([name, data]) => {
        const product = products.find(p => p.nama.includes(name.split(' ')[0]));
        const hargaBeli = product?.hargaBeli || 0;
        const hargaJual = product?.hargaJual || product?.harga || 0;
        const margin = hargaJual - hargaBeli;
        return {
          name,
          sold: data.sold,
          unit: product?.satuan || 'pcs',
          hargaBeli,
          hargaJual,
          margin,
          revenue: data.sold * hargaJual,
          totalMargin: data.sold * margin,
        };
      })
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }, [filteredData.transactions, products]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: id });
    } catch {
      return dateStr;
    }
  };

  const handleApplyPeriod = () => {
    if (!startDate || !endDate) {
      toast.error('Pilih tanggal mulai dan akhir');
      return;
    }
    setActivePeriod(`${formatDate(startDate)} - ${formatDate(endDate)}`);
    setShowPeriodDialog(false);
    toast.success('Periode berhasil diterapkan');
  };

  const handleQuickReport = (type: string) => {
    console.log('handleQuickReport called with type:', type);
    console.log('modalAwal:', modalAwal);
    console.log('accountingData:', accountingData);
    
    toast.success(`Membuat laporan ${type}...`);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup diblokir');
      return;
    }

    let reportContent = '';
    let reportTitle = '';

    const headerHTML = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #16a34a; padding-bottom: 20px;">
        <h1 style="color: #dc2626; margin: 0; font-size: 28px;">${storeInfo.name || 'SERAYU POS'}</h1>
        <p style="color: #666; margin: 5px 0;">${storeInfo.address || 'Alamat Toko'}</p>
        <p style="color: #666; margin: 5px 0;">Telp: ${storeInfo.phone || '-'}</p>
      </div>
    `;

    switch (type) {
      case 'penjualan':
        reportTitle = 'Laporan Penjualan';
        reportContent = `
          ${headerHTML}
          <h2 style="color: #16a34a; border-bottom: 2px solid #ddd; padding-bottom: 10px;">LAPORAN PENJUALAN</h2>
          <p><strong>Periode:</strong> ${activePeriod}</p>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>ID Transaksi</th>
                <th>Pelanggan</th>
                <th>Item</th>
                <th>Total</th>
                <th>Metode</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.transactions.map((t, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${t.tanggal.split(' ')[0]}</td>
                  <td>${t.id}</td>
                  <td>${t.pelanggan}</td>
                  <td>${t.items}</td>
                  <td style="text-align: right;">Rp ${t.total.toLocaleString('id-ID')}</td>
                  <td>${t.metode}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #dcfce7;">
                <th colspan="5" style="text-align: right;">TOTAL PENJUALAN</th>
                <th style="text-align: right;">Rp ${totalPenjualan.toLocaleString('id-ID')}</th>
                <th></th>
              </tr>
            </tfoot>
          </table>
          <div style="margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">
            <p><strong>Total Transaksi:</strong> ${filteredData.transactions.length} transaksi</p>
            <p><strong>Total Penjualan:</strong> Rp ${totalPenjualan.toLocaleString('id-ID')}</p>
          </div>
        `;
        break;
      case 'pembelian':
        reportTitle = 'Laporan Pembelian';
        reportContent = `
          ${headerHTML}
          <h2 style="color: #dc2626; border-bottom: 2px solid #ddd; padding-bottom: 10px;">LAPORAN PEMBELIAN</h2>
          <p><strong>Periode:</strong> ${activePeriod}</p>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>ID PO</th>
                <th>Supplier</th>
                <th>Item</th>
                <th>Total</th>
                <th>DP</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.purchases.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${p.date}</td>
                  <td>${p.id}</td>
                  <td>${p.supplier}</td>
                  <td>${p.items}</td>
                  <td style="text-align: right;">Rp ${p.total.toLocaleString('id-ID')}</td>
                  <td style="text-align: right;">Rp ${p.dp.toLocaleString('id-ID')}</td>
                  <td>${p.status}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #fef2f2;">
                <th colspan="5" style="text-align: right;">TOTAL PEMBELIAN</th>
                <th style="text-align: right;">Rp ${totalPembelian.toLocaleString('id-ID')}</th>
                <th colspan="2"></th>
              </tr>
            </tfoot>
          </table>
        `;
        break;
      case 'stok':
        reportTitle = 'Laporan Stok Produk';
        reportContent = `
          ${headerHTML}
          <h2 style="color: #f59e0b; border-bottom: 2px solid #ddd; padding-bottom: 10px;">LAPORAN STOK PRODUK</h2>
          <p><strong>Tanggal Cetak:</strong> ${formatDate(new Date().toISOString().split('T')[0])}</p>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>ID Produk</th>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Satuan</th>
                <th>Harga Beli</th>
                <th>Harga Jual</th>
                <th>Nilai Stok</th>
              </tr>
            </thead>
            <tbody>
              ${products.map((p, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${p.id}</td>
                  <td>${p.nama}</td>
                  <td>${p.kategori}</td>
                  <td style="text-align: center; ${p.stok <= (p.minStok || 10) ? 'color: #dc2626; font-weight: bold;' : ''}">${p.stok}</td>
                  <td>${p.satuan}</td>
                  <td style="text-align: right;">Rp ${(p.hargaBeli || 0).toLocaleString('id-ID')}</td>
                  <td style="text-align: right;">Rp ${(p.hargaJual || p.harga || 0).toLocaleString('id-ID')}</td>
                  <td style="text-align: right;">Rp ${(p.stok * (p.hargaBeli || 0)).toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background: #fef3c7;">
                <th colspan="4" style="text-align: right;">TOTAL</th>
                <th style="text-align: center;">${products.reduce((s, p) => s + p.stok, 0)}</th>
                <th colspan="3"></th>
                <th style="text-align: right;">Rp ${products.reduce((s, p) => s + (p.stok * (p.hargaBeli || 0)), 0).toLocaleString('id-ID')}</th>
              </tr>
            </tfoot>
          </table>
        `;
        break;
      case 'labarugi':
        reportTitle = 'Laporan Laba/Rugi';
        reportContent = `
          ${headerHTML}
          <h2 style="color: #0ea5e9; border-bottom: 2px solid #ddd; padding-bottom: 10px;">LAPORAN LABA RUGI</h2>
          <p><strong>Periode:</strong> ${activePeriod}</p>
          
          <div style="max-width: 600px; margin: 20px auto;">
            <table style="width: 100%;">
              <tbody>
                <tr><td colspan="2" style="font-weight: bold; background: #f3f4f6; padding: 10px;">PENDAPATAN</td></tr>
                <tr>
                  <td style="padding: 8px 20px;">Penjualan</td>
                  <td style="text-align: right; padding: 8px; color: #16a34a; font-weight: bold;">Rp ${totalPenjualan.toLocaleString('id-ID')}</td>
                </tr>
                
                <tr><td colspan="2" style="font-weight: bold; background: #f3f4f6; padding: 10px;">PENGELUARAN</td></tr>
                <tr>
                  <td style="padding: 8px 20px;">Pembelian Barang</td>
                  <td style="text-align: right; padding: 8px; color: #dc2626;">Rp ${totalPembelian.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 20px;">Biaya Operasional</td>
                  <td style="text-align: right; padding: 8px; color: #dc2626;">Rp ${totalOperasional.toLocaleString('id-ID')}</td>
                </tr>
                <tr style="border-top: 2px solid #ddd;">
                  <td style="padding: 8px 20px; font-weight: bold;">Total Pengeluaran</td>
                  <td style="text-align: right; padding: 8px; color: #dc2626; font-weight: bold;">Rp ${(totalPembelian + totalOperasional).toLocaleString('id-ID')}</td>
                </tr>
                
                <tr style="background: ${labaBersih >= 0 ? '#dcfce7' : '#fef2f2'}; border-top: 3px double #333;">
                  <td style="padding: 15px; font-size: 18px; font-weight: bold;">LABA BERSIH</td>
                  <td style="text-align: right; padding: 15px; font-size: 18px; font-weight: bold; color: ${labaBersih >= 0 ? '#16a34a' : '#dc2626'};">Rp ${labaBersih.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 20px;">Margin Bersih</td>
                  <td style="text-align: right; padding: 8px; font-weight: bold;">${marginBersih.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style="margin-top: 30px;">Rincian Biaya Operasional</h3>
          <table>
            <thead>
              <tr><th>No</th><th>Kategori</th><th>Deskripsi</th><th>Tanggal</th><th>Jumlah</th></tr>
            </thead>
            <tbody>
              ${filteredData.expenses.map((e, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${e.kategori}</td>
                  <td>${e.deskripsi}</td>
                  <td>${e.tanggal}</td>
                  <td style="text-align: right;">Rp ${e.jumlah.toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
      case 'neraca':
        console.log('Generating neraca report...');
        console.log('modalAwal exists:', !!modalAwal);
        console.log('accountingData:', accountingData);
        
        reportTitle = 'Laporan Neraca';
        reportContent = modalAwal ? `
          ${headerHTML}
          <h2 style="color: #8b5cf6; border-bottom: 2px solid #ddd; padding-bottom: 10px;">LAPORAN NERACA</h2>
          <p><strong>Periode:</strong> ${activePeriod}</p>
          <p><strong>Tanggal:</strong> ${formatDate(new Date().toISOString().split('T')[0])}</p>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 20px 0;">
            <div>
              <h3 style="color: #8b5cf6; margin-bottom: 15px;">ASET</h3>
              <table style="width: 100%; margin-bottom: 20px;">
                <tbody>
                  <tr><td colspan="2" style="font-weight: bold; background: #f3f4f6; padding: 10px;">Aset Lancar</td></tr>
                  <tr>
                    <td style="padding: 8px 20px;">Kas Tersedia</td>
                    <td style="text-align: right; padding: 8px;">Rp ${accountingData.kasTersedia.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 20px;">Bank</td>
                    <td style="text-align: right; padding: 8px;">Rp ${modalAwal.bank.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 20px;">Piutang Usaha</td>
                    <td style="text-align: right; padding: 8px;">Rp ${accountingData.totalPiutang.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 20px;">Persediaan Barang</td>
                    <td style="text-align: right; padding: 8px;">Rp ${accountingData.totalStokValue.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr style="border-top: 2px solid #8b5cf6;">
                    <td style="padding: 10px 20px; font-weight: bold;">Total Aset</td>
                    <td style="text-align: right; padding: 10px; font-weight: bold; color: #8b5cf6;">Rp ${accountingData.totalAset.toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div>
              <h3 style="color: #8b5cf6; margin-bottom: 15px;">LIABILITAS & EKUITAS</h3>
              <table style="width: 100%; margin-bottom: 20px;">
                <tbody>
                  <tr><td colspan="2" style="font-weight: bold; background: #f3f4f6; padding: 10px;">Liabilitas</td></tr>
                  <tr>
                    <td style="padding: 8px 20px;">Utang Usaha</td>
                    <td style="text-align: right; padding: 8px;">Rp ${accountingData.totalUtang.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr><td colspan="2" style="font-weight: bold; background: #f3f4f6; padding: 10px;">Ekuitas</td></tr>
                  <tr>
                    <td style="padding: 8px 20px;">Modal Awal</td>
                    <td style="text-align: right; padding: 8px;">Rp ${accountingData.ekuitasAwal.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 20px;">Laba Bersih ${labaBersih >= 0 ? '' : '(Rugi)'}</td>
                    <td style="text-align: right; padding: 8px; color: ${labaBersih >= 0 ? '#16a34a' : '#dc2626'};">Rp ${labaBersih.toLocaleString('id-ID')}</td>
                  </tr>
                  <tr style="border-top: 2px solid #8b5cf6;">
                    <td style="padding: 10px 20px; font-weight: bold;">Total Liab & Ekuitas</td>
                    <td style="text-align: right; padding: 10px; font-weight: bold; color: #8b5cf6;">Rp ${(accountingData.totalLiabilitas + accountingData.totalEkuitas).toLocaleString('id-ID')}</td>
                  </tr>
                </tbody>
              </table>
              
              <div style="background: #dcfce7; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <h4 style="color: #16a34a; margin-bottom: 10px;">EKUITAS AKHIR</h4>
                <p style="font-size: 18px; font-weight: bold; color: #16a34a;">Rp ${accountingData.ekuitasAkhir.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        ` : `
          ${headerHTML}
          <h2 style="color: #8b5cf6; border-bottom: 2px solid #ddd; padding-bottom: 10px;">LAPORAN NERACA</h2>
          <div style="text-align: center; padding: 50px; background: #f3f4f6; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #666;">Modal Awal Belum Disetup</h3>
            <p style="color: #666; margin-top: 10px;">Silakan setup modal awal di Pengaturan → Akuntansi</p>
          </div>
        `;
        break;
      case 'proyek':
        reportTitle = 'Laporan Proyek';
        reportContent = `
          ${headerHTML}
          <h2 style="color: #8b5cf6; border-bottom: 2px solid #ddd; padding-bottom: 10px;">LAPORAN PROYEK</h2>
          <p><strong>Periode:</strong> ${activePeriod}</p>
          
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0;">
            <div style="text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold;">${projectStats.total}</div>
              <div style="font-size: 12px; color: #666;">Total Proyek</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #fef3c7; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #d97706;">${projectStats.pending}</div>
              <div style="font-size: 12px; color: #666;">Pending</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #dbeafe; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #2563eb;">${projectStats.berjalan}</div>
              <div style="font-size: 12px; color: #666;">Berjalan</div>
            </div>
            <div style="text-align: center; padding: 15px; background: #dcfce7; border-radius: 8px;">
              <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${projectStats.selesai}</div>
              <div style="font-size: 12px; color: #666;">Selesai</div>
            </div>
          </div>

          <h3>Ringkasan Keuangan Proyek</h3>
          <table style="max-width: 500px;">
            <tbody>
              <tr>
                <td style="padding: 8px;">Total Nilai Kontrak</td>
                <td style="text-align: right; font-weight: bold;">Rp ${projectStats.totalNilai.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">Total DP Diterima</td>
                <td style="text-align: right; color: #16a34a; font-weight: bold;">Rp ${projectStats.totalDP.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">Total Biaya Material</td>
                <td style="text-align: right; color: #dc2626;">Rp ${projectStats.totalMaterial.toLocaleString('id-ID')}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">Total Biaya Tenaga Kerja</td>
                <td style="text-align: right; color: #dc2626;">Rp ${projectStats.totalTenagaKerja.toLocaleString('id-ID')}</td>
              </tr>
              <tr style="background: #f3f4f6;">
                <td style="padding: 8px;">Sisa Pembayaran</td>
                <td style="text-align: right; color: #dc2626; font-weight: bold;">Rp ${projectStats.sisaBayar.toLocaleString('id-ID')}</td>
              </tr>
              <tr style="background: ${projectStats.keuntungan >= 0 ? '#dcfce7' : '#fef2f2'};">
                <td style="padding: 8px; font-weight: bold;">Estimasi Keuntungan</td>
                <td style="text-align: right; font-weight: bold; color: ${projectStats.keuntungan >= 0 ? '#16a34a' : '#dc2626'};">Rp ${projectStats.keuntungan.toLocaleString('id-ID')}</td>
              </tr>
            </tbody>
          </table>

          <h3 style="margin-top: 30px;">Daftar Proyek</h3>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Proyek</th>
                <th>Pelanggan</th>
                <th>Nilai Kontrak</th>
                <th>Material</th>
                <th>Tenaga Kerja</th>
                <th>Keuntungan</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.projects.map((p, i) => {
                const materialCost = p.materials?.reduce((sum, m) => sum + (m.qty * m.harga), 0) || 0;
                const laborCost = p.biayaTenagaKerja || 0;
                const profit = p.nilaiKontrak - materialCost - laborCost;
                return `
                <tr>
                  <td>${i + 1}</td>
                  <td>
                    ${p.namaProyek}
                    ${p.status !== 'Selesai' ? '<br><span style="color: #d97706; font-size: 11px;">(Material Pending)</span>' : ''}
                  </td>
                  <td>${p.pelanggan}</td>
                  <td style="text-align: right;">Rp ${p.nilaiKontrak.toLocaleString('id-ID')}</td>
                  <td style="text-align: right; color: #dc2626;">Rp ${materialCost.toLocaleString('id-ID')}</td>
                  <td style="text-align: right; color: #dc2626;">Rp ${laborCost.toLocaleString('id-ID')}</td>
                  <td style="text-align: right; font-weight: bold; color: ${profit >= 0 ? '#16a34a' : '#dc2626'};">Rp ${profit.toLocaleString('id-ID')}</td>
                  <td><span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; ${
                    p.status === 'Selesai' ? 'background: #dcfce7; color: #16a34a;' :
                    p.status === 'Berjalan' ? 'background: #dbeafe; color: #2563eb;' :
                    p.status === 'Pending' ? 'background: #fef3c7; color: #d97706;' :
                    'background: #fef2f2; color: #dc2626;'
                  }">${p.status}</span></td>
                </tr>
              `}).join('')}
            </tbody>
          </table>

          ${filteredData.projects.filter(p => p.materials && p.materials.length > 0).map(p => `
            <h4 style="margin-top: 25px; color: #8b5cf6;">Detail Material: ${p.namaProyek} ${p.status !== 'Selesai' ? '<span style="color: #d97706; font-size: 12px;">(PENDING)</span>' : ''}</h4>
            <table style="font-size: 12px;">
              <thead>
                <tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                ${p.materials?.map(m => `
                  <tr ${p.status !== 'Selesai' ? 'style="background: #fef3c7;"' : ''}>
                    <td>${m.productName} ${p.status !== 'Selesai' ? '<span style="color: #d97706;">(Pending)</span>' : ''}</td>
                    <td style="text-align: center;">${m.qty} ${m.satuan}</td>
                    <td style="text-align: right;">Rp ${m.harga.toLocaleString('id-ID')}</td>
                    <td style="text-align: right;">Rp ${(m.qty * m.harga).toLocaleString('id-ID')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `).join('')}
        `;
        break;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle} - ${storeInfo.name || 'SERAYU POS'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; font-size: 12px; }
          h2 { margin: 20px 0 15px; font-size: 18px; }
          h3 { margin: 20px 0 10px; font-size: 14px; color: #333; }
          h4 { margin: 15px 0 8px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }
          th { background: #333; color: white; font-weight: 600; }
          tbody tr:nth-child(even) { background: #f9fafb; }
          @media print { 
            button { display: none !important; } 
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${reportContent}
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #666;">
          <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
          <p>Oleh: ${storeInfo.name || 'SERAYU POS'}</p>
        </div>
        <button onclick="window.print();" style="position: fixed; bottom: 20px; right: 20px; padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
          🖨️ Print / Save as PDF
        </button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportLaporanExcel = (type: 'penjualan' | 'pembelian' | 'stok' | 'labarugi' | 'proyek' | 'neraca' | 'semua') => {
    const workbook = XLSX.utils.book_new();
    const dateNow = new Date().toISOString().split('T')[0];
    
    // Penjualan Sheet
    if (type === 'penjualan' || type === 'semua') {
      const penjualanData = [
        ['LAPORAN PENJUALAN'],
        [`Periode: ${activePeriod}`],
        [`Toko: ${storeInfo.name}`],
        [],
        ['No', 'Tanggal', 'ID Transaksi', 'Pelanggan', 'Item', 'Total', 'Metode'],
        ...filteredData.transactions.map((t, i) => [
          i + 1,
          t.tanggal.split(' ')[0],
          t.id,
          t.pelanggan,
          t.items,
          t.total,
          t.metode
        ]),
        [],
        ['', '', '', '', 'TOTAL PENJUALAN:', totalPenjualan, '']
      ];
      const wsPenjualan = XLSX.utils.aoa_to_sheet(penjualanData);
      wsPenjualan['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, wsPenjualan, 'Penjualan');
    }

    // Pembelian Sheet
    if (type === 'pembelian' || type === 'semua') {
      const pembelianData = [
        ['LAPORAN PEMBELIAN'],
        [`Periode: ${activePeriod}`],
        [],
        ['No', 'Tanggal', 'ID PO', 'Supplier', 'Item', 'Total', 'DP', 'Status'],
        ...filteredData.purchases.map((p, i) => [
          i + 1,
          p.date,
          p.id,
          p.supplier,
          p.items,
          p.total,
          p.dp,
          p.status
        ]),
        [],
        ['', '', '', '', 'TOTAL PEMBELIAN:', totalPembelian, '', '']
      ];
      const wsPembelian = XLSX.utils.aoa_to_sheet(pembelianData);
      wsPembelian['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, wsPembelian, 'Pembelian');
    }

    // Stok Sheet
    if (type === 'stok' || type === 'semua') {
      const stokData = [
        ['LAPORAN STOK PRODUK'],
        [`Tanggal Cetak: ${dateNow}`],
        [],
        ['No', 'ID Produk', 'Nama Produk', 'Kategori', 'Stok', 'Satuan', 'Harga Beli', 'Harga Jual', 'Nilai Stok'],
        ...products.map((p, i) => [
          i + 1,
          p.id,
          p.nama,
          p.kategori,
          p.stok,
          p.satuan,
          p.hargaBeli || 0,
          p.hargaJual || p.harga || 0,
          p.stok * (p.hargaBeli || 0)
        ]),
        [],
        ['', '', '', 'TOTAL:', products.reduce((s, p) => s + p.stok, 0), '', '', '', products.reduce((s, p) => s + (p.stok * (p.hargaBeli || 0)), 0)]
      ];
      const wsStok = XLSX.utils.aoa_to_sheet(stokData);
      wsStok['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 30 }, { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, wsStok, 'Stok');
    }

    // Laba Rugi Sheet
    if (type === 'labarugi' || type === 'semua') {
      const labaRugiData = [
        ['LAPORAN LABA RUGI'],
        [`Periode: ${activePeriod}`],
        [],
        ['KETERANGAN', 'JUMLAH'],
        ['PENDAPATAN', ''],
        ['Penjualan', totalPenjualan],
        [],
        ['PENGELUARAN', ''],
        ['Pembelian Barang', totalPembelian],
        ['Biaya Operasional', totalOperasional],
        ['Total Pengeluaran', totalPembelian + totalOperasional],
        [],
        ['LABA KOTOR', labaKotor],
        ['LABA BERSIH', labaBersih],
        ['Margin Bersih (%)', marginBersih.toFixed(2)],
        [],
        ['RINCIAN BIAYA OPERASIONAL', ''],
        ['Kategori', 'Deskripsi', 'Tanggal', 'Jumlah'],
        ...filteredData.expenses.map(e => ['', e.kategori, e.deskripsi, e.tanggal, e.jumlah])
      ];
      const wsLabaRugi = XLSX.utils.aoa_to_sheet(labaRugiData);
      wsLabaRugi['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, wsLabaRugi, 'Laba Rugi');
    }

    // Proyek Sheet
    if (type === 'proyek' || type === 'semua') {
      const proyekData = [
        ['LAPORAN PROYEK'],
        [`Periode: ${activePeriod}`],
        [],
        ['RINGKASAN'],
        ['Total Proyek', projectStats.total],
        ['Pending', projectStats.pending],
        ['Berjalan', projectStats.berjalan],
        ['Selesai', projectStats.selesai],
        ['Total Nilai Kontrak', projectStats.totalNilai],
        ['Total DP', projectStats.totalDP],
        ['Sisa Bayar', projectStats.sisaBayar],
        ['Biaya Material', projectStats.totalMaterial],
        ['Biaya Tenaga Kerja', projectStats.totalTenagaKerja],
        ['Estimasi Keuntungan', projectStats.keuntungan],
        [],
        ['DAFTAR PROYEK'],
        ['No', 'Nama Proyek', 'Pelanggan', 'Nilai Kontrak', 'Material', 'Tenaga Kerja', 'Keuntungan', 'Status'],
        ...filteredData.projects.map((p, i) => {
          const materialCost = p.materials?.reduce((sum, m) => sum + (m.qty * m.harga), 0) || 0;
          const laborCost = p.biayaTenagaKerja || 0;
          const profit = p.nilaiKontrak - materialCost - laborCost;
          return [
            i + 1,
            p.namaProyek + (p.status !== 'Selesai' ? ' (PENDING)' : ''),
            p.pelanggan,
            p.nilaiKontrak,
            materialCost,
            laborCost,
            profit,
            p.status
          ];
        })
      ];
      const wsProyek = XLSX.utils.aoa_to_sheet(proyekData);
      wsProyek['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
      XLSX.utils.book_append_sheet(workbook, wsProyek, 'Proyek');
    }

    // Neraca Sheet
    if (type === 'neraca' || type === 'semua') {
      const neracaData = modalAwal ? [
        ['LAPORAN NERACA'],
        [`Periode: ${activePeriod}`],
        [`Toko: ${storeInfo.name}`],
        [],
        ['ASET', ''],
        ['Kas Tersedia', accountingData.kasTersedia],
        ['Bank', modalAwal.bank],
        ['Piutang Usaha', accountingData.totalPiutang],
        ['Persediaan Barang', accountingData.totalStokValue],
        [],
        ['TOTAL ASET', accountingData.totalAset],
        [],
        ['LIABILITAS & EKUITAS', ''],
        ['Liabilitas', ''],
        ['Utang Usaha', accountingData.totalUtang],
        [],
        ['Ekuitas', ''],
        ['Modal Awal', accountingData.ekuitasAwal],
        ['Laba Bersih', labaBersih],
        [],
        ['TOTAL LIAB & EKUITAS', accountingData.totalLiabilitas + accountingData.totalEkuitas],
        [],
        ['EKUITAS AKHIR', accountingData.ekuitasAkhir],
      ] : [
        ['LAPORAN NERACA'],
        [`Periode: ${activePeriod}`],
        [`Toko: ${storeInfo.name}`],
        [],
        ['MODAL AWAL BELUM DISETUP'],
        ['Silakan setup modal awal di Pengaturan → Akuntansi'],
      ];
      const wsNeraca = XLSX.utils.aoa_to_sheet(neracaData);
      wsNeraca['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, wsNeraca, 'Neraca');
    }

    const fileName = type === 'semua' 
      ? `Laporan_Lengkap_${storeInfo.name.replace(/\s+/g, '_')}_${dateNow}.xlsx`
      : `Laporan_${type.charAt(0).toUpperCase() + type.slice(1)}_${dateNow}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    toast.success(`Laporan ${type === 'semua' ? 'Lengkap' : type} berhasil di-export ke Excel`);
  };

  const exportLaporanPDF = (type: 'penjualan' | 'pembelian' | 'stok' | 'labarugi' | 'proyek' | 'neraca' | 'semua') => {
    const doc = new jsPDF();
    const dateNow = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    let yPos = 20;

    const addHeader = (title: string) => {
      doc.setFontSize(18);
      doc.setTextColor(220, 38, 38);
      doc.text(storeInfo.name || 'SERAYU POS', 105, yPos, { align: 'center' });
      yPos += 6;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(storeInfo.address || 'Alamat Toko', 105, yPos, { align: 'center' });
      yPos += 4;
      doc.text(`Telp: ${storeInfo.phone || '-'}`, 105, yPos, { align: 'center' });
      yPos += 10;
      doc.setFontSize(14);
      doc.setTextColor(22, 163, 74);
      doc.text(title, 105, yPos, { align: 'center' });
      yPos += 6;
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(`Periode: ${activePeriod}`, 14, yPos);
      yPos += 8;
    };

    const addNewPage = () => {
      doc.addPage();
      yPos = 20;
    };

    // Penjualan
    if (type === 'penjualan' || type === 'semua') {
      addHeader('LAPORAN PENJUALAN');
      autoTable(doc, {
        startY: yPos,
        head: [['No', 'Tanggal', 'ID', 'Pelanggan', 'Item', 'Total', 'Metode']],
        body: filteredData.transactions.map((t, i) => [
          i + 1,
          t.tanggal.split(' ')[0],
          t.id,
          t.pelanggan,
          t.items.length > 30 ? t.items.substring(0, 30) + '...' : t.items,
          `Rp ${t.total.toLocaleString('id-ID')}`,
          t.metode
        ]),
        foot: [['', '', '', '', 'TOTAL:', `Rp ${totalPenjualan.toLocaleString('id-ID')}`, '']],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [22, 163, 74] },
        footStyles: { fillColor: [220, 252, 231], textColor: [22, 163, 74], fontStyle: 'bold' },
      });
      if (type === 'semua') addNewPage();
    }

    // Pembelian
    if (type === 'pembelian' || type === 'semua') {
      if (type !== 'semua') addHeader('LAPORAN PEMBELIAN');
      else {
        addHeader('LAPORAN PEMBELIAN');
      }
      autoTable(doc, {
        startY: yPos,
        head: [['No', 'Tanggal', 'ID PO', 'Supplier', 'Item', 'Total', 'DP', 'Status']],
        body: filteredData.purchases.map((p, i) => [
          i + 1,
          p.date,
          p.id,
          p.supplier,
          p.items.length > 25 ? p.items.substring(0, 25) + '...' : p.items,
          `Rp ${p.total.toLocaleString('id-ID')}`,
          `Rp ${p.dp.toLocaleString('id-ID')}`,
          p.status
        ]),
        foot: [['', '', '', '', 'TOTAL:', `Rp ${totalPembelian.toLocaleString('id-ID')}`, '', '']],
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [220, 38, 38] },
        footStyles: { fillColor: [254, 242, 242], textColor: [220, 38, 38], fontStyle: 'bold' },
      });
      if (type === 'semua') addNewPage();
    }

    // Stok
    if (type === 'stok' || type === 'semua') {
      if (type !== 'semua') addHeader('LAPORAN STOK PRODUK');
      else addHeader('LAPORAN STOK PRODUK');
      autoTable(doc, {
        startY: yPos,
        head: [['No', 'ID', 'Nama Produk', 'Kategori', 'Stok', 'Satuan', 'Harga Beli', 'Harga Jual', 'Nilai Stok']],
        body: products.map((p, i) => [
          i + 1,
          p.id,
          p.nama.length > 20 ? p.nama.substring(0, 20) + '...' : p.nama,
          p.kategori,
          p.stok,
          p.satuan,
          `Rp ${(p.hargaBeli || 0).toLocaleString('id-ID')}`,
          `Rp ${(p.hargaJual || p.harga || 0).toLocaleString('id-ID')}`,
          `Rp ${(p.stok * (p.hargaBeli || 0)).toLocaleString('id-ID')}`
        ]),
        foot: [['', '', '', 'TOTAL:', products.reduce((s, p) => s + p.stok, 0), '', '', '', `Rp ${products.reduce((s, p) => s + (p.stok * (p.hargaBeli || 0)), 0).toLocaleString('id-ID')}`]],
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [245, 158, 11] },
        footStyles: { fillColor: [254, 243, 199], textColor: [217, 119, 6], fontStyle: 'bold' },
      });
      if (type === 'semua') addNewPage();
    }

    // Laba Rugi
    if (type === 'labarugi' || type === 'semua') {
      if (type !== 'semua') addHeader('LAPORAN LABA RUGI');
      else addHeader('LAPORAN LABA RUGI');
      autoTable(doc, {
        startY: yPos,
        head: [['KETERANGAN', 'JUMLAH']],
        body: [
          ['PENDAPATAN', ''],
          ['    Penjualan', `Rp ${totalPenjualan.toLocaleString('id-ID')}`],
          ['', ''],
          ['PENGELUARAN', ''],
          ['    Pembelian Barang', `Rp ${totalPembelian.toLocaleString('id-ID')}`],
          ['    Biaya Operasional', `Rp ${totalOperasional.toLocaleString('id-ID')}`],
          ['    Total Pengeluaran', `Rp ${(totalPembelian + totalOperasional).toLocaleString('id-ID')}`],
          ['', ''],
          ['LABA KOTOR', `Rp ${labaKotor.toLocaleString('id-ID')}`],
          ['LABA BERSIH', `Rp ${labaBersih.toLocaleString('id-ID')}`],
          ['Margin Bersih', `${marginBersih.toFixed(2)}%`],
        ],
        styles: { fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [14, 165, 233] },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 60, halign: 'right' }
        },
      });
      if (type === 'semua') addNewPage();
    }

    // Proyek
    if (type === 'proyek' || type === 'semua') {
      if (type !== 'semua') addHeader('LAPORAN PROYEK');
      else addHeader('LAPORAN PROYEK');
      
      // Summary table
      autoTable(doc, {
        startY: yPos,
        head: [['Ringkasan Proyek', 'Jumlah']],
        body: [
          ['Total Proyek', projectStats.total.toString()],
          ['Pending', projectStats.pending.toString()],
          ['Berjalan', projectStats.berjalan.toString()],
          ['Selesai', projectStats.selesai.toString()],
          ['Total Nilai Kontrak', `Rp ${projectStats.totalNilai.toLocaleString('id-ID')}`],
          ['Biaya Material', `Rp ${projectStats.totalMaterial.toLocaleString('id-ID')}`],
          ['Biaya Tenaga Kerja', `Rp ${projectStats.totalTenagaKerja.toLocaleString('id-ID')}`],
          ['Estimasi Keuntungan', `Rp ${projectStats.keuntungan.toLocaleString('id-ID')}`],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [139, 92, 246] },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 60, halign: 'right' }
        },
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 10;
      
      // Project list
      autoTable(doc, {
        startY: yPos,
        head: [['No', 'Nama Proyek', 'Pelanggan', 'Nilai Kontrak', 'Material', 'Keuntungan', 'Status']],
        body: filteredData.projects.map((p, i) => {
          const materialCost = p.materials?.reduce((sum, m) => sum + (m.qty * m.harga), 0) || 0;
          const laborCost = p.biayaTenagaKerja || 0;
          const profit = p.nilaiKontrak - materialCost - laborCost;
          return [
            i + 1,
            p.namaProyek + (p.status !== 'Selesai' ? ' (PENDING)' : ''),
            p.pelanggan,
            `Rp ${p.nilaiKontrak.toLocaleString('id-ID')}`,
            `Rp ${materialCost.toLocaleString('id-ID')}`,
            `Rp ${profit.toLocaleString('id-ID')}`,
            p.status
          ];
        }),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [139, 92, 246] },
      });
    }

    // Neraca
    if (type === 'neraca' || type === 'semua') {
      if (type !== 'semua') addHeader('LAPORAN NERACA');
      else addHeader('LAPORAN NERACA');
      
      if (modalAwal) {
        // Aset table
        autoTable(doc, {
          startY: yPos,
          head: [['ASET', 'JUMLAH']],
          body: [
            ['Kas Tersedia', `Rp ${accountingData.kasTersedia.toLocaleString('id-ID')}`],
            ['Bank', `Rp ${modalAwal.bank.toLocaleString('id-ID')}`],
            ['Piutang Usaha', `Rp ${accountingData.totalPiutang.toLocaleString('id-ID')}`],
            ['Persediaan Barang', `Rp ${accountingData.totalStokValue.toLocaleString('id-ID')}`],
            ['', ''],
            ['TOTAL ASET', `Rp ${accountingData.totalAset.toLocaleString('id-ID')}`],
          ],
          styles: { fontSize: 10, cellPadding: 4 },
          headStyles: { fillColor: [139, 92, 246] },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 60, halign: 'right' }
          },
        });
        
        yPos += 60;
        
        // Liabilitas & Ekuitas table
        autoTable(doc, {
          startY: yPos,
          head: [['LIABILITAS & EKUITAS', 'JUMLAH']],
          body: [
            ['Liabilitas', ''],
            ['Utang Usaha', `Rp ${accountingData.totalUtang.toLocaleString('id-ID')}`],
            ['', ''],
            ['Ekuitas', ''],
            ['Modal Awal', `Rp ${accountingData.ekuitasAwal.toLocaleString('id-ID')}`],
            ['Laba Bersih', `Rp ${labaBersih.toLocaleString('id-ID')}`],
            ['', ''],
            ['TOTAL LIAB & EKUITAS', `Rp ${(accountingData.totalLiabilitas + accountingData.totalEkuitas).toLocaleString('id-ID')}`],
          ],
          styles: { fontSize: 10, cellPadding: 4 },
          headStyles: { fillColor: [139, 92, 246] },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 60, halign: 'right' }
          },
        });
        
        yPos += 80;
        
        // Ekuitas Akhir
        doc.setFillColor(220, 252, 231);
        doc.rect(14, yPos, 182, 15, 'F');
        doc.setTextColor(22, 163, 74);
        doc.setFontSize(12);
        doc.text('EKUITAS AKHIR:', 20, yPos + 10);
        doc.text(`Rp ${accountingData.ekuitasAkhir.toLocaleString('id-ID')}`, 120, yPos + 10, { align: 'right' });
      } else {
        doc.text('Modal Awal Belum Disetup', 105, yPos + 20, { align: 'center' });
        doc.text('Silakan setup modal awal di Pengaturan → Akuntansi', 105, yPos + 30, { align: 'center' });
      }
      if (type === 'semua') addNewPage();
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text(`Dicetak: ${dateNow} | ${storeInfo.name || 'SERAYU POS'} | Halaman ${i} dari ${pageCount}`, 105, 290, { align: 'center' });
    }

    const fileName = type === 'semua' 
      ? `Laporan_Lengkap_${storeInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
      : `Laporan_${type.charAt(0).toUpperCase() + type.slice(1)}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(fileName);
    toast.success(`Laporan ${type === 'semua' ? 'Lengkap' : type} berhasil di-export ke PDF`);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Laporan</h1>
          <p className="text-sm text-muted-foreground">Analisis dan laporan bisnis</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="gap-2 border-secondary/30 hover:bg-secondary/5 text-sm"
            onClick={() => setShowPeriodDialog(true)}
          >
            <Calendar className="w-4 h-4 text-secondary" />
            <span className="hidden sm:inline">{activePeriod}</span>
            <span className="sm:hidden">Periode</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-gradient-primary text-sm">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Laporan</span>
                <span className="sm:hidden">Export</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Export Excel (.xlsx)</div>
              <DropdownMenuItem onClick={() => exportLaporanExcel('semua')} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 text-secondary" />
                Semua Laporan (Excel)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLaporanExcel('penjualan')} className="gap-2 cursor-pointer pl-6">
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                Penjualan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLaporanExcel('pembelian')} className="gap-2 cursor-pointer pl-6">
                <FileSpreadsheet className="w-4 h-4 text-red-600" />
                Pembelian
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLaporanExcel('stok')} className="gap-2 cursor-pointer pl-6">
                <FileSpreadsheet className="w-4 h-4 text-yellow-600" />
                Stok Produk
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLaporanExcel('labarugi')} className="gap-2 cursor-pointer pl-6">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                Laba Rugi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLaporanExcel('proyek')} className="gap-2 cursor-pointer pl-6">
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                Proyek
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLaporanExcel('neraca')} className="gap-2 cursor-pointer pl-6">
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                Neraca
              </DropdownMenuItem>
              
              <div className="border-t my-1" />
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Export PDF</div>
              <DropdownMenuItem onClick={() => exportLaporanPDF('semua')} className="gap-2 cursor-pointer">
                <File className="w-4 h-4 text-primary" />
                Semua Laporan (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLaporanPDF('penjualan')} className="gap-2 cursor-pointer pl-6">
                <File className="w-4 h-4 text-green-600" />
                Penjualan
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLaporanPDF('pembelian')} className="gap-2 cursor-pointer pl-6">
                <File className="w-4 h-4 text-red-600" />
                Pembelian
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLaporanPDF('stok')} className="gap-2 cursor-pointer pl-6">
                <File className="w-4 h-4 text-yellow-600" />
                Stok Produk
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLaporanPDF('labarugi')} className="gap-2 cursor-pointer pl-6">
                <File className="w-4 h-4 text-blue-600" />
                Laba Rugi
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLaporanPDF('proyek')} className="gap-2 cursor-pointer pl-6">
                <File className="w-4 h-4 text-purple-600" />
                Proyek
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportLaporanPDF('neraca')} className="gap-2 cursor-pointer pl-6">
                <File className="w-4 h-4 text-purple-600" />
                Neraca
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card className="border-l-4 border-l-secondary bg-card">
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm md:text-lg font-bold text-secondary truncate">{formatRupiah(totalPenjualan)}</p>
              <p className="text-xs text-muted-foreground">Total Penjualan</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive bg-card">
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-sm md:text-lg font-bold text-destructive truncate">{formatRupiah(totalPembelian)}</p>
              <p className="text-xs text-muted-foreground">Total Pembelian</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary bg-card">
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className={`text-sm md:text-lg font-bold truncate ${labaBersih >= 0 ? 'text-secondary' : 'text-destructive'}`}>{formatRupiah(labaBersih)}</p>
              <p className="text-xs text-muted-foreground">Laba Bersih</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info bg-card">
          <CardContent className="p-3 md:p-4 flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0">
              <PieChart className="w-5 h-5 md:w-6 md:h-6 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-lg md:text-xl font-bold">{marginBersih.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Margin</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Top Products */}
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="w-5 h-5 text-primary" />
              Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produk</TableHead>
                      <TableHead className="text-right">Terjual</TableHead>
                      <TableHead className="text-right hidden md:table-cell">Margin</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p) => (
                      <TableRow key={p.name}>
                        <TableCell className="font-medium text-sm">{p.name}</TableCell>
                        <TableCell className="text-right text-sm">{p.sold}</TableCell>
                        <TableCell className="text-right text-primary text-sm hidden md:table-cell">{formatRupiah(p.totalMargin)}</TableCell>
                        <TableCell className="text-right font-semibold text-secondary text-sm">{formatRupiah(p.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Belum ada data penjualan</p>
            )}
          </CardContent>
        </Card>

        {/* Project Summary */}
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="w-5 h-5 text-primary" />
              Ringkasan Proyek
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 md:gap-4 mb-4">
              <div className="text-center p-2 md:p-3 bg-muted/30 rounded-lg">
                <p className="text-lg md:text-2xl font-bold text-primary">{projectStats.total}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <p className="text-lg md:text-2xl font-bold text-yellow-600">{projectStats.pending}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-lg md:text-2xl font-bold text-blue-600">{projectStats.berjalan}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Berjalan</p>
              </div>
              <div className="text-center p-2 md:p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-lg md:text-2xl font-bold text-green-600">{projectStats.selesai}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Selesai</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Nilai Kontrak</span>
                <span className="font-bold">{formatRupiah(projectStats.totalNilai)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Biaya Material</span>
                <span className="text-destructive">{formatRupiah(projectStats.totalMaterial)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Biaya Tenaga Kerja</span>
                <span className="text-destructive">{formatRupiah(projectStats.totalTenagaKerja)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Estimasi Keuntungan</span>
                <span className={`font-bold ${projectStats.keuntungan >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                  {formatRupiah(projectStats.keuntungan)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Laba/Rugi Card */}
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="w-5 h-5 text-info" />
              Laba/Rugi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Penjualan</span>
                <span className="text-sm font-semibold text-green-600">{formatRupiah(totalPenjualan)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Pembelian</span>
                <span className="text-sm font-semibold text-red-600">{formatRupiah(totalPembelian)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Biaya Operasional</span>
                <span className="text-sm font-semibold text-orange-600">{formatRupiah(totalOperasional)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Laba Kotor</span>
                  <span className={`text-sm font-bold ${labaKotor >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatRupiah(labaKotor)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Laba Bersih</span>
                  <span className={`text-sm font-bold ${labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatRupiah(labaBersih)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Margin</span>
                  <span className="text-xs text-muted-foreground">
                    {marginBersih.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Neraca Card */}
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Neraca
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modalAwal ? (
              <div className="space-y-3">
                <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs font-medium text-purple-800 mb-1">Modal Awal</p>
                  <p className="text-sm font-bold text-purple-900">{formatRupiah(accountingData.modalAwalTotal)}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Aset</p>
                  <div className="flex justify-between items-center text-xs">
                    <span>Kas Tersedia</span>
                    <span className="font-medium">{formatRupiah(accountingData.kasTersedia)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Bank</span>
                    <span className="font-medium">{formatRupiah(modalAwal.bank)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Piutang</span>
                    <span className="font-medium">{formatRupiah(accountingData.totalPiutang)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Stok</span>
                    <span className="font-medium">{formatRupiah(accountingData.totalStokValue)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t">
                    <span className="text-xs font-semibold">Total Aset</span>
                    <span className="text-sm font-bold text-purple-600">{formatRupiah(accountingData.totalAset)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Liabilitas & Ekuitas</p>
                  <div className="flex justify-between items-center text-xs">
                    <span>Utang</span>
                    <span className="font-medium">{formatRupiah(accountingData.totalUtang)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Ekuitas Awal</span>
                    <span className="font-medium">{formatRupiah(accountingData.ekuitasAwal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span>Laba Bersih</span>
                    <span className={`font-medium ${labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatRupiah(labaBersih)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t">
                    <span className="text-xs font-semibold">Total Liab & Ekuitas</span>
                    <span className="text-sm font-bold text-purple-600">{formatRupiah(accountingData.totalLiabilitas + accountingData.totalEkuitas)}</span>
                  </div>
                </div>

                <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-green-800">Ekuitas Akhir</span>
                    <span className="text-sm font-bold text-green-900">{formatRupiah(accountingData.ekuitasAkhir)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calculator className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Modal awal belum disetup</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Set up modal awal di Pengaturan → Akuntansi
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Reports */}
        <Card className="lg:col-span-2 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Laporan Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 md:py-6 flex-col gap-2 border-secondary/30 hover:bg-secondary/5 hover:border-secondary text-xs md:text-sm"
                onClick={() => handleQuickReport('penjualan')}
              >
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-secondary" />
                <span>Penjualan</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 md:py-6 flex-col gap-2 border-primary/30 hover:bg-primary/5 hover:border-primary text-xs md:text-sm"
                onClick={() => handleQuickReport('pembelian')}
              >
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <span>Pembelian</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 md:py-6 flex-col gap-2 border-warning/30 hover:bg-warning/5 hover:border-warning text-xs md:text-sm"
                onClick={() => handleQuickReport('stok')}
              >
                <Package className="w-6 h-6 md:w-8 md:h-8 text-warning" />
                <span>Stok</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 md:py-6 flex-col gap-2 border-info/30 hover:bg-info/5 hover:border-info text-xs md:text-sm"
                onClick={() => handleQuickReport('labarugi')}
              >
                <Wallet className="w-6 h-6 md:w-8 md:h-8 text-info" />
                <span>Laba/Rugi</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 md:py-6 flex-col gap-2 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-500 text-xs md:text-sm"
                onClick={() => handleQuickReport('neraca')}
              >
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                <span>Neraca</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 md:py-6 flex-col gap-2 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-500 text-xs md:text-sm col-span-2 sm:col-span-1"
                onClick={() => handleQuickReport('proyek')}
              >
                <FolderKanban className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
                <span>Proyek</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Dialog */}
      <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pilih Periode Laporan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Akhir</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setStartDate(today.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                }}
              >
                Hari Ini
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const dayOfWeek = today.getDay();
                  const startOfWeek = new Date(today);
                  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
                  setStartDate(startOfWeek.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                }}
              >
                Minggu Ini
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const start = new Date(today.getFullYear(), today.getMonth(), 1);
                  setStartDate(start.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                }}
              >
                Bulan Ini
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const today = new Date();
                  const start = new Date(today.getFullYear(), 0, 1);
                  setStartDate(start.toISOString().split('T')[0]);
                  setEndDate(today.toISOString().split('T')[0]);
                }}
              >
                Tahun Ini
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setActivePeriod('Semua Periode');
                }}
              >
                Semua
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPeriodDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleApplyPeriod} className="bg-gradient-primary">
              Terapkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
