import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRupiah } from '@/components/RupiahIcon';
import {
  Search,
  FileText,
  Download,
  Eye,
  Filter,
  Calendar,
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

const transactions = [
  { id: 'TRX001', pelanggan: 'Budi Santoso', tanggal: '2024-01-15 10:30', items: 5, total: 150000, metode: 'Tunai', status: 'Selesai' },
  { id: 'TRX002', pelanggan: 'Siti Aminah', tanggal: '2024-01-15 11:15', items: 3, total: 275000, metode: 'Transfer', status: 'Selesai' },
  { id: 'TRX003', pelanggan: 'Ahmad Yani', tanggal: '2024-01-15 12:45', items: 8, total: 89000, metode: 'Tunai', status: 'Selesai' },
  { id: 'TRX004', pelanggan: 'Dewi Lestari', tanggal: '2024-01-15 14:20', items: 2, total: 425000, metode: 'Kartu', status: 'Selesai' },
  { id: 'TRX005', pelanggan: 'Rudi Hartono', tanggal: '2024-01-15 15:05', items: 6, total: 198000, metode: 'Tunai', status: 'Selesai' },
  { id: 'TRX006', pelanggan: 'Maya Sari', tanggal: '2024-01-15 16:30', items: 4, total: 320000, metode: 'Transfer', status: 'Pending' },
  { id: 'TRX007', pelanggan: 'Agus Wijaya', tanggal: '2024-01-15 17:00', items: 7, total: 560000, metode: 'Kartu', status: 'Selesai' },
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

  const filteredTransactions = transactions.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.pelanggan.toLowerCase().includes(search.toLowerCase())
  );

  const totalToday = transactions
    .filter((t) => t.status === 'Selesai')
    .reduce((sum, t) => sum + t.total, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaksi</h1>
          <p className="text-muted-foreground">Riwayat semua transaksi penjualan</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export
        </Button>
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
              <p className="text-2xl font-bold text-success">{formatRupiah(totalToday)}</p>
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
              <p className="text-2xl font-bold">{formatRupiah(totalToday / transactions.length)}</p>
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
              <p className="text-2xl font-bold">1</p>
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
                  <TableCell className="text-center">{tx.items}</TableCell>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
