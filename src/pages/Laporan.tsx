import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { formatRupiah } from '@/components/RupiahIcon';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
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
} from 'lucide-react';
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

const monthlyData = [
  { month: 'Jan', penjualan: 450000000, pembelian: 320000000 },
  { month: 'Feb', penjualan: 520000000, pembelian: 380000000 },
  { month: 'Mar', penjualan: 480000000, pembelian: 350000000 },
  { month: 'Apr', penjualan: 610000000, pembelian: 420000000 },
  { month: 'Mei', penjualan: 550000000, pembelian: 400000000 },
  { month: 'Jun', penjualan: 670000000, pembelian: 480000000 },
];

const topProducts = [
  { name: 'Baja Ringan C75', sold: 1250, unit: 'batang', hargaBeli: 72000, hargaJual: 85000 },
  { name: 'Spandek 0.35mm', sold: 980, unit: 'lembar', hargaBeli: 82000, hargaJual: 95000 },
  { name: 'Hollow 4x4', sold: 850, unit: 'batang', hargaBeli: 54000, hargaJual: 65000 },
  { name: 'Genteng Metal', sold: 720, unit: 'lembar', hargaBeli: 38000, hargaJual: 45000 },
  { name: 'Reng Baja Ringan', sold: 1500, unit: 'batang', hargaBeli: 22000, hargaJual: 28000 },
];

const statusColors: Record<string, string> = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Berjalan': 'bg-blue-100 text-blue-800',
  'Selesai': 'bg-green-100 text-green-800',
  'Dibatalkan': 'bg-red-100 text-red-800',
};

export default function Laporan() {
  const [showPeriodDialog, setShowPeriodDialog] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePeriod, setActivePeriod] = useState('Semua Periode');

  const { expenses, projects } = useData();

  const totalOperasional = useMemo(
    () => expenses.reduce((sum, e) => sum + e.jumlah, 0),
    [expenses]
  );

  const projectStats = useMemo(() => {
    const total = projects.length;
    const selesai = projects.filter(p => p.status === 'Selesai').length;
    const berjalan = projects.filter(p => p.status === 'Berjalan').length;
    const totalNilai = projects.reduce((sum, p) => sum + p.nilaiKontrak, 0);
    const totalDP = projects.reduce((sum, p) => sum + p.dp, 0);
    const sisaBayar = totalNilai - totalDP;
    return { total, selesai, berjalan, totalNilai, totalDP, sisaBayar };
  }, [projects]);

  const totalPenjualan = monthlyData.reduce((sum, d) => sum + d.penjualan, 0);
  const totalPembelian = monthlyData.reduce((sum, d) => sum + d.pembelian, 0);
  const labaKotor = totalPenjualan - totalPembelian;
  const labaBersih = labaKotor - totalOperasional;
  const marginBersih = totalPenjualan > 0 ? (labaBersih / totalPenjualan) * 100 : 0;

  const topProductRows = useMemo(() => {
    return topProducts.map((p) => {
      const marginPerUnit = p.hargaJual - p.hargaBeli;
      const revenue = p.sold * p.hargaJual;
      const totalMargin = p.sold * marginPerUnit;
      return { ...p, marginPerUnit, revenue, totalMargin };
    });
  }, []);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd MMM yy', { locale: id });
    } catch {
      return dateStr;
    }
  };
  const handleApplyPeriod = () => {
    if (!startDate || !endDate) {
      toast.error('Pilih tanggal mulai dan akhir');
      return;
    }
    setActivePeriod(`${startDate} - ${endDate}`);
    setShowPeriodDialog(false);
    toast.success('Periode berhasil diterapkan');
  };

  const handleQuickReport = (type: string) => {
    toast.success(`Membuat laporan ${type}...`);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup diblokir');
      return;
    }

    let reportContent = '';
    let reportTitle = '';

    switch (type) {
      case 'penjualan':
        reportTitle = 'Laporan Penjualan';
        reportContent = `
          <h2>Ringkasan Penjualan</h2>
          <table>
            <thead><tr><th>Bulan</th><th>Total Penjualan</th></tr></thead>
            <tbody>
              ${monthlyData.map(d => `<tr><td>${d.month}</td><td>Rp ${d.penjualan.toLocaleString('id-ID')}</td></tr>`).join('')}
            </tbody>
            <tfoot><tr><th>Total</th><th>Rp ${totalPenjualan.toLocaleString('id-ID')}</th></tr></tfoot>
          </table>
        `;
        break;
      case 'pembelian':
        reportTitle = 'Laporan Pembelian';
        reportContent = `
          <h2>Ringkasan Pembelian</h2>
          <table>
            <thead><tr><th>Bulan</th><th>Total Pembelian</th></tr></thead>
            <tbody>
              ${monthlyData.map(d => `<tr><td>${d.month}</td><td>Rp ${d.pembelian.toLocaleString('id-ID')}</td></tr>`).join('')}
            </tbody>
            <tfoot><tr><th>Total</th><th>Rp ${totalPembelian.toLocaleString('id-ID')}</th></tr></tfoot>
          </table>
        `;
        break;
      case 'stok':
        reportTitle = 'Laporan Stok';
        reportContent = `
          <h2>Produk Terlaris (Harga Beli/Jual & Margin)</h2>
          <table>
            <thead>
              <tr>
                <th>Produk</th>
                <th>Terjual</th>
                <th>Harga Beli</th>
                <th>Harga Jual</th>
                <th>Margin/Unit</th>
                <th>Total Margin</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${topProductRows
                .map(
                  (p) =>
                    `<tr>
                      <td>${p.name}</td>
                      <td>${p.sold} ${p.unit}</td>
                      <td>Rp ${p.hargaBeli.toLocaleString('id-ID')}</td>
                      <td>Rp ${p.hargaJual.toLocaleString('id-ID')}</td>
                      <td>Rp ${p.marginPerUnit.toLocaleString('id-ID')}</td>
                      <td>Rp ${p.totalMargin.toLocaleString('id-ID')}</td>
                      <td>Rp ${p.revenue.toLocaleString('id-ID')}</td>
                    </tr>`
                )
                .join('')}
            </tbody>
          </table>
        `;
        break;
      case 'labarugi':
        reportTitle = 'Laporan Laba/Rugi';
        reportContent = `
          <h2>Ringkasan Laba/Rugi</h2>
          <table>
            <tbody>
              <tr><td>Total Penjualan</td><td style="color: #16a34a;">Rp ${totalPenjualan.toLocaleString('id-ID')}</td></tr>
              <tr><td>Total Pembelian</td><td style="color: #dc2626;">Rp ${totalPembelian.toLocaleString('id-ID')}</td></tr>
              <tr><td>Biaya Operasional</td><td style="color: #dc2626;">Rp ${totalOperasional.toLocaleString('id-ID')}</td></tr>
              <tr style="font-weight: bold; background: #dcfce7;"><td>Laba Bersih</td><td>Rp ${labaBersih.toLocaleString('id-ID')}</td></tr>
              <tr><td>Margin Bersih</td><td>${marginBersih.toFixed(1)}%</td></tr>
            </tbody>
          </table>
        `;
        break;
      case 'proyek':
        reportTitle = 'Laporan Proyek';
        reportContent = `
          <h2>Ringkasan Proyek</h2>
          <div style="display: flex; gap: 20px; margin-bottom: 20px;">
            <div style="flex:1; text-align:center; padding:15px; background:#f3f4f6; border-radius:8px;">
              <div style="font-size:24px; font-weight:bold;">${projectStats.total}</div>
              <div>Total Proyek</div>
            </div>
            <div style="flex:1; text-align:center; padding:15px; background:#dcfce7; border-radius:8px;">
              <div style="font-size:24px; font-weight:bold; color:#16a34a;">${projectStats.selesai}</div>
              <div>Selesai</div>
            </div>
            <div style="flex:1; text-align:center; padding:15px; background:#dbeafe; border-radius:8px;">
              <div style="font-size:24px; font-weight:bold; color:#2563eb;">${projectStats.berjalan}</div>
              <div>Berjalan</div>
            </div>
          </div>
          <table>
            <tbody>
              <tr><td>Total Nilai Kontrak</td><td style="font-weight:bold;">Rp ${projectStats.totalNilai.toLocaleString('id-ID')}</td></tr>
              <tr><td>Total DP Diterima</td><td style="color:#16a34a; font-weight:bold;">Rp ${projectStats.totalDP.toLocaleString('id-ID')}</td></tr>
              <tr><td>Sisa Pembayaran</td><td style="color:#dc2626; font-weight:bold;">Rp ${projectStats.sisaBayar.toLocaleString('id-ID')}</td></tr>
            </tbody>
          </table>
          <h2 style="margin-top:30px;">Daftar Proyek</h2>
          <table>
            <thead><tr><th>Proyek</th><th>Pelanggan</th><th>Nilai Kontrak</th><th>DP</th><th>Sisa</th><th>Status</th></tr></thead>
            <tbody>
              ${projects.map(p => `
                <tr>
                  <td>${p.namaProyek}</td>
                  <td>${p.pelanggan}</td>
                  <td>Rp ${p.nilaiKontrak.toLocaleString('id-ID')}</td>
                  <td style="color:#16a34a;">Rp ${p.dp.toLocaleString('id-ID')}</td>
                  <td style="color:#dc2626;">Rp ${(p.nilaiKontrak - p.dp).toLocaleString('id-ID')}</td>
                  <td>${p.status}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #dc2626; border-bottom: 2px solid #16a34a; padding-bottom: 10px; }
          h2 { color: #16a34a; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background: #dc2626; color: white; }
          tfoot th { background: #16a34a; }
          .date { color: #666; margin-bottom: 20px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${reportTitle}</h1>
        <p class="date">Periode: ${activePeriod}</p>
        <p class="date">Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
        ${reportContent}
        <button onclick="window.print();" style="margin-top: 20px; padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer;">
          Print / Save as PDF
        </button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportLaporanExcel = () => {
    const headers = ['Bulan', 'Penjualan', 'Pembelian', 'Laba'];
    const rows = monthlyData.map(d => [
      d.month,
      d.penjualan,
      d.pembelian,
      d.penjualan - d.pembelian
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Laporan berhasil di-export ke Excel (CSV)');
  };

  const exportLaporanPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup diblokir');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Lengkap</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #dc2626; text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 15px; }
          h2 { color: #16a34a; margin-top: 30px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #dc2626; color: white; }
          .summary { display: flex; gap: 20px; margin: 20px 0; }
          .summary-card { flex: 1; padding: 20px; border-radius: 8px; text-align: center; }
          .success { background: #dcfce7; color: #16a34a; }
          .danger { background: #fef2f2; color: #dc2626; }
          .primary { background: #fef2f2; border: 2px solid #dc2626; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>LAPORAN BISNIS BAJA RINGAN</h1>
        <p style="text-align: center; color: #666;">Periode: ${activePeriod} | Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
        
        <div class="summary">
          <div class="summary-card success">
            <h3>Total Penjualan</h3>
            <p style="font-size: 24px; font-weight: bold;">Rp ${totalPenjualan.toLocaleString('id-ID')}</p>
          </div>
          <div class="summary-card danger">
            <h3>Total Pembelian</h3>
            <p style="font-size: 24px; font-weight: bold;">Rp ${totalPembelian.toLocaleString('id-ID')}</p>
          </div>
          <div class="summary-card primary">
            <h3>Laba Kotor</h3>
            <p style="font-size: 24px; font-weight: bold;">Rp ${labaKotor.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <h2>Data Bulanan</h2>
        <table>
          <thead><tr><th>Bulan</th><th>Penjualan</th><th>Pembelian</th><th>Laba</th></tr></thead>
          <tbody>
            ${monthlyData.map(d => `
              <tr>
                <td>${d.month}</td>
                <td style="color: #16a34a;">Rp ${d.penjualan.toLocaleString('id-ID')}</td>
                <td style="color: #dc2626;">Rp ${d.pembelian.toLocaleString('id-ID')}</td>
                <td style="font-weight: bold;">Rp ${(d.penjualan - d.pembelian).toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Produk Terlaris (Harga Beli/Jual & Margin)</h2>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Produk</th>
              <th>Terjual</th>
              <th>Harga Beli</th>
              <th>Harga Jual</th>
              <th>Margin/Unit</th>
              <th>Total Margin</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${topProductRows.map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${p.name}</td>
                <td>${p.sold} ${p.unit}</td>
                <td>Rp ${p.hargaBeli.toLocaleString('id-ID')}</td>
                <td>Rp ${p.hargaJual.toLocaleString('id-ID')}</td>
                <td>Rp ${p.marginPerUnit.toLocaleString('id-ID')}</td>
                <td>Rp ${p.totalMargin.toLocaleString('id-ID')}</td>
                <td style="color: #16a34a;">Rp ${p.revenue.toLocaleString('id-ID')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <button onclick="window.print();" style="margin-top: 20px; padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;">
          Print / Save as PDF
        </button>
      </body>
      </html>
    `);
    printWindow.document.close();
    toast.success('Silakan print atau save as PDF');
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan</h1>
          <p className="text-muted-foreground">Analisis dan laporan bisnis baja ringan</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-2 border-secondary/30 hover:bg-secondary/5"
            onClick={() => setShowPeriodDialog(true)}
          >
            <Calendar className="w-4 h-4 text-secondary" />
            {activePeriod}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-gradient-primary">
                <Download className="w-4 h-4" />
                Export Laporan
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={exportLaporanExcel} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 text-secondary" />
                Export Excel (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportLaporanPDF} className="gap-2 cursor-pointer">
                <File className="w-4 h-4 text-primary" />
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-secondary bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-lg font-bold text-secondary">{formatRupiah(totalPenjualan)}</p>
              <p className="text-sm text-muted-foreground">Total Penjualan</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-lg font-bold text-destructive">{formatRupiah(totalPembelian)}</p>
              <p className="text-sm text-muted-foreground">Total Pembelian</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-primary bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-primary">{formatRupiah(labaBersih)}</p>
              <p className="text-sm text-muted-foreground">Laba Bersih</p>
              <p className="text-xs text-muted-foreground">
                Operasional: {formatRupiah(totalOperasional)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
              <PieChart className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-xl font-bold">{marginBersih.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Margin Bersih</p>
              <p className="text-xs text-muted-foreground">
                Laba kotor: {formatRupiah(labaKotor)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly chart */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Grafik Bulanan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((data) => (
                <div key={data.month} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{data.month}</span>
                    <span className="text-muted-foreground">
                      Laba: {formatRupiah(data.penjualan - data.pembelian)}
                    </span>
                  </div>
                  <div className="flex gap-1 h-6">
                    <div
                      className="bg-secondary/80 rounded-l-md transition-all"
                      style={{ width: `${(data.penjualan / 700000000) * 50}%` }}
                    />
                    <div
                      className="bg-primary/80 rounded-r-md transition-all"
                      style={{ width: `${(data.pembelian / 700000000) * 50}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex gap-4 justify-center pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-secondary/80" />
                  <span>Penjualan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-primary/80" />
                  <span>Pembelian</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top products */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead className="text-right">Terjual</TableHead>
                    <TableHead className="text-right">Harga Beli</TableHead>
                    <TableHead className="text-right">Harga Jual</TableHead>
                    <TableHead className="text-right">Margin/Unit</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProductRows.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{p.sold} {p.unit}</TableCell>
                      <TableCell className="text-right">{formatRupiah(p.hargaBeli)}</TableCell>
                      <TableCell className="text-right">{formatRupiah(p.hargaJual)}</TableCell>
                      <TableCell className="text-right text-primary">{formatRupiah(p.marginPerUnit)}</TableCell>
                      <TableCell className="text-right font-semibold text-secondary">{formatRupiah(p.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Project Report */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              Ringkasan Proyek
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-2xl font-bold text-primary">{projectStats.total}</p>
                <p className="text-xs text-muted-foreground">Total Proyek</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{projectStats.selesai}</p>
                <p className="text-xs text-muted-foreground">Selesai</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{projectStats.berjalan}</p>
                <p className="text-xs text-muted-foreground">Berjalan</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Nilai Kontrak</span>
                <span className="font-bold">{formatRupiah(projectStats.totalNilai)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total DP Diterima</span>
                <span className="font-bold text-secondary">{formatRupiah(projectStats.totalDP)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Sisa Pembayaran</span>
                <span className="font-bold text-destructive">{formatRupiah(projectStats.sisaBayar)}</span>
              </div>
            </div>

            {projects.length > 0 && (
              <div className="mt-4 max-h-[200px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proyek</TableHead>
                      <TableHead>Nilai</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.slice(0, 5).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-xs">{p.namaProyek}</p>
                            <p className="text-xs text-muted-foreground">{p.pelanggan}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{formatRupiah(p.nilaiKontrak)}</TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${statusColors[p.status]}`}>{p.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick reports */}
        <Card className="lg:col-span-2 bg-card">
          <CardHeader>
            <CardTitle>Laporan Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-6 flex-col gap-2 border-secondary/30 hover:bg-secondary/5 hover:border-secondary"
                onClick={() => handleQuickReport('penjualan')}
              >
                <FileText className="w-8 h-8 text-secondary" />
                <span>Laporan Penjualan</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-6 flex-col gap-2 border-primary/30 hover:bg-primary/5 hover:border-primary"
                onClick={() => handleQuickReport('pembelian')}
              >
                <FileText className="w-8 h-8 text-primary" />
                <span>Laporan Pembelian</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-6 flex-col gap-2 border-warning/30 hover:bg-warning/5 hover:border-warning"
                onClick={() => handleQuickReport('stok')}
              >
                <FileText className="w-8 h-8 text-warning" />
                <span>Laporan Stok</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-6 flex-col gap-2 border-info/30 hover:bg-info/5 hover:border-info"
                onClick={() => handleQuickReport('labarugi')}
              >
                <FileText className="w-8 h-8 text-info" />
                <span>Laporan Laba/Rugi</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-6 flex-col gap-2 border-purple-300 hover:bg-purple-50 hover:border-purple-500"
                onClick={() => handleQuickReport('proyek')}
              >
                <FolderKanban className="w-8 h-8 text-purple-500" />
                <span>Laporan Proyek</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Dialog */}
      <Dialog open={showPeriodDialog} onOpenChange={setShowPeriodDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pilih Periode Laporan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
            <div className="flex gap-2 flex-wrap">
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