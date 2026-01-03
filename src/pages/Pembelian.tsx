import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/components/RupiahIcon';
import {
  Plus,
  ShoppingBag,
  TrendingUp,
  Package,
  Truck,
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

const purchases = [
  { id: 'PO001', supplier: 'PT Indofood', date: '2024-01-15', total: 2500000, status: 'Selesai' },
  { id: 'PO002', supplier: 'CV Maju Jaya', date: '2024-01-14', total: 1850000, status: 'Selesai' },
  { id: 'PO003', supplier: 'UD Berkah', date: '2024-01-13', total: 750000, status: 'Pending' },
  { id: 'PO004', supplier: 'PT Unilever', date: '2024-01-12', total: 3200000, status: 'Dikirim' },
  { id: 'PO005', supplier: 'CV Sejahtera', date: '2024-01-11', total: 980000, status: 'Selesai' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Selesai':
      return 'bg-success/10 text-success';
    case 'Pending':
      return 'bg-warning/10 text-warning';
    case 'Dikirim':
      return 'bg-info/10 text-info';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function Pembelian() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pembelian</h1>
          <p className="text-muted-foreground">Kelola pembelian dan supplier</p>
        </div>
        <Button className="gap-2 bg-gradient-primary">
          <Plus className="w-4 h-4" />
          Buat Pembelian
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">24</p>
              <p className="text-sm text-muted-foreground">Total Pembelian</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatRupiah(15280000)}</p>
              <p className="text-sm text-muted-foreground">Bulan Ini</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">2</p>
              <p className="text-sm text-muted-foreground">Dalam Pengiriman</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase list */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No. PO</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{purchase.id}</TableCell>
                  <TableCell>{purchase.supplier}</TableCell>
                  <TableCell className="text-muted-foreground">{purchase.date}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRupiah(purchase.total)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(purchase.status)} variant="secondary">
                      {purchase.status}
                    </Badge>
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
