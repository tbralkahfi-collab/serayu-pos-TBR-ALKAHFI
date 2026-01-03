import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRupiah } from '@/components/RupiahIcon';
import { toast } from 'sonner';
import {
  Search,
  FileText,
  Download,
  Eye,
  Filter,
  Calendar,
  FileSpreadsheet,
  File,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Transaction {
  id: string;
  pelanggan: string;
  tanggal: string;
  items: { nama: string; qty: number; harga: number }[];
  total: number;
  metode: string;
  status: string;
}

const transactions: Transaction[] = [
  { id: 'TRX001', pelanggan: 'Bpk. Agus', tanggal: '2024-01-15 10:30', items: [{ nama: 'Baja Ringan C75', qty: 50, harga: 85000 }], total: 4250000, metode: 'Tunai', status: 'Selesai' },
  { id: 'TRX002', pelanggan: 'CV Maju Jaya', tanggal: '2024-01-15 11:15', items: [{ nama: 'Spandek 0.35mm', qty: 100, harga: 95000 }], total: 9500000, metode: 'Transfer', status: 'Selesai' },
  { id: 'TRX003', pelanggan: 'Bpk. Joko', tanggal: '2024-01-15 12:45', items: [{ nama: 'Hollow 4x4', qty: 30, harga: 65000 }], total: 1950000, metode: 'Tunai', status: 'Selesai' },
  { id: 'TRX004', pelanggan: 'UD Berkah', tanggal: '2024-01-15 14:20', items: [{ nama: 'Genteng Metal', qty: 200, harga: 45000 }], total: 9000000, metode: 'Kartu', status: 'Selesai' },
  { id: 'TRX005', pelanggan: 'Bpk. Rudi', tanggal: '2024-01-15 15:05', items: [{ nama: 'Reng Baja Ringan', qty: 100, harga: 28000 }], total: 2800000, metode: 'Tunai', status: 'Selesai' },
  { id: 'TRX006', pelanggan: 'Toko Bangunan Makmur', tanggal: '2024-01-15 16:30', items: [{ nama: 'Baja Ringan C100', qty: 40, harga: 110000 }], total: 4400000, metode: 'Transfer', status: 'Pending' },
  { id: 'TRX007', pelanggan: 'CV Kontraktor Jaya', tanggal: '2024-01-15 17:00', items: [{ nama: 'Sekrup Baja 12mm', qty: 10, harga: 85000 }, { nama: 'Dynabolt 10mm', qty: 5, harga: 125000 }], total: 1475000, metode: 'Kartu', status: 'Selesai' },
];

const getMethodColor = (metode: string) => {
  switch (metode) {
    case 'Tunai':
      return 'bg-success/10 text-success';
    case 'Transfer':
      return 'bg-info/10 text-info';
    case 'Kartu':
      return 'bg-primary/10 text-primary';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function Transaksi() {
  const [search, setSearch] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const filteredTransactions = transactions.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.pelanggan.toLowerCase().includes(search.toLowerCase())
  );

  const totalToday = transactions
    .filter((t) => t.status === 'Selesai')
    .reduce((sum, t) => sum + t.total, 0);

  const handleViewDetail = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setShowDetailDialog(true);
  };

  const exportToExcel = () => {
    // Create CSV content
    const headers = ['ID Transaksi', 'Pelanggan', 'Tanggal', 'Items', 'Total', 'Metode', 'Status'];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      tx.pelanggan,
      tx.tanggal,
      tx.items.map(i => `${i.nama} (${i.qty})`).join('; '),
      tx.total,
      tx.metode,
      tx.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transaksi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Data transaksi berhasil di-export ke Excel (CSV)');
  };

  const exportToPDF = () => {
    // Create print-friendly HTML
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup diblokir. Izinkan popup untuk export PDF.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Transaksi</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
          .total { font-weight: bold; }
          .header-info { margin-bottom: 20px; }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>Laporan Transaksi</h1>
        <div class="header-info">
          <p><strong>Tanggal Export:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
          <p><strong>Total Transaksi:</strong> ${filteredTransactions.length}</p>
          <p><strong>Total Penjualan:</strong> Rp ${totalToday.toLocaleString('id-ID')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Pelanggan</th>
              <th>Tanggal</th>
              <th>Items</th>
              <th>Total</th>
              <th>Metode</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.map(tx => `
              <tr>
                <td>${tx.id}</td>
                <td>${tx.pelanggan}</td>
                <td>${tx.tanggal}</td>
                <td>${tx.items.map(i => `${i.nama} (${i.qty})`).join(', ')}</td>
                <td>Rp ${tx.total.toLocaleString('id-ID')}</td>
                <td>${tx.metode}</td>
                <td>${tx.status}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="4">Total</td>
              <td>Rp ${filteredTransactions.reduce((sum, tx) => sum + tx.total, 0).toLocaleString('id-ID')}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
        <button onclick="window.print();" style="margin-top: 20px; padding: 10px 20px; cursor: pointer;">
          Print / Save as PDF
        </button>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    toast.success('Silakan print atau save as PDF');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaksi</h1>
          <p className="text-muted-foreground">Riwayat transaksi penjualan baja ringan</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
              <File className="w-4 h-4" />
              Export PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{transactions.length}</p>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <span className="text-success font-bold">Rp</span>
            </div>
            <div>
              <p className="text-xl font-bold text-success">{formatRupiah(totalToday)}</p>
              <p className="text-sm text-muted-foreground">Total Hari Ini</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatRupiah(Math.round(totalToday / transactions.length))}</p>
              <p className="text-sm text-muted-foreground">Rata-rata</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{transactions.filter(t => t.status === 'Pending').length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction list */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Cari ID transaksi atau pelanggan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Transaksi</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Tanggal & Waktu</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.id}</TableCell>
                  <TableCell>{tx.pelanggan}</TableCell>
                  <TableCell className="text-muted-foreground">{tx.tanggal}</TableCell>
                  <TableCell className="text-center">{tx.items.reduce((sum, i) => sum + i.qty, 0)}</TableCell>
                  <TableCell>
                    <Badge className={getMethodColor(tx.metode)} variant="secondary">
                      {tx.metode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(tx.total)}</TableCell>
                  <TableCell>
                    <Badge variant={tx.status === 'Selesai' ? 'default' : 'secondary'}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleViewDetail(tx)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detail Transaksi {selectedTransaction?.id}</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pelanggan</p>
                  <p className="font-medium">{selectedTransaction.pelanggan}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{selectedTransaction.tanggal}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Items</p>
                <div className="space-y-2">
                  {selectedTransaction.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between p-2 rounded bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{item.nama}</p>
                        <p className="text-xs text-muted-foreground">{item.qty} x {formatRupiah(item.harga)}</p>
                      </div>
                      <p className="font-medium">{formatRupiah(item.qty * item.harga)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Metode</p>
                  <Badge className={getMethodColor(selectedTransaction.metode)}>{selectedTransaction.metode}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-primary">{formatRupiah(selectedTransaction.total)}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
