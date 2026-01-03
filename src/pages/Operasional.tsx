import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/components/RupiahIcon';
import {
  Plus,
  Building2,
  Zap,
  Droplets,
  Phone,
  Car,
  Wrench,
  TrendingDown,
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

const expenses = [
  { id: 'OP001', kategori: 'Listrik', deskripsi: 'Tagihan PLN Januari', jumlah: 850000, tanggal: '2024-01-15', icon: Zap },
  { id: 'OP002', kategori: 'Air', deskripsi: 'Tagihan PDAM Januari', jumlah: 250000, tanggal: '2024-01-15', icon: Droplets },
  { id: 'OP003', kategori: 'Telepon', deskripsi: 'Tagihan Internet & Telepon', jumlah: 450000, tanggal: '2024-01-10', icon: Phone },
  { id: 'OP004', kategori: 'Transportasi', deskripsi: 'BBM Kendaraan Operasional', jumlah: 500000, tanggal: '2024-01-12', icon: Car },
  { id: 'OP005', kategori: 'Pemeliharaan', deskripsi: 'Service AC Toko', jumlah: 350000, tanggal: '2024-01-08', icon: Wrench },
  { id: 'OP006', kategori: 'Sewa', deskripsi: 'Sewa Tempat Januari', jumlah: 5000000, tanggal: '2024-01-01', icon: Building2 },
];

const getCategoryColor = (kategori: string) => {
  switch (kategori) {
    case 'Listrik':
      return 'bg-warning/10 text-warning';
    case 'Air':
      return 'bg-info/10 text-info';
    case 'Telepon':
      return 'bg-primary/10 text-primary';
    case 'Transportasi':
      return 'bg-accent/10 text-accent';
    case 'Pemeliharaan':
      return 'bg-muted text-muted-foreground';
    case 'Sewa':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function Operasional() {
  const totalOperasional = expenses.reduce((sum, e) => sum + e.jumlah, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operasional</h1>
          <p className="text-muted-foreground">Kelola biaya operasional toko</p>
        </div>
        <Button className="gap-2 bg-gradient-primary">
          <Plus className="w-4 h-4" />
          Tambah Biaya
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="md:col-span-2">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{formatRupiah(totalOperasional)}</p>
              <p className="text-sm text-muted-foreground">Total Biaya Bulan Ini</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatRupiah(850000)}</p>
              <p className="text-sm text-muted-foreground">Listrik</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatRupiah(5000000)}</p>
              <p className="text-sm text-muted-foreground">Sewa</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense list */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Biaya Operasional</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium">{expense.id}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(expense.kategori)} variant="secondary">
                      <expense.icon className="w-3 h-3 mr-1" />
                      {expense.kategori}
                    </Badge>
                  </TableCell>
                  <TableCell>{expense.deskripsi}</TableCell>
                  <TableCell className="text-muted-foreground">{expense.tanggal}</TableCell>
                  <TableCell className="text-right font-medium text-destructive">
                    {formatRupiah(expense.jumlah)}
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
