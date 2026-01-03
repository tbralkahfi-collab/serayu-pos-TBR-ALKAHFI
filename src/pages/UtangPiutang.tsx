import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/components/RupiahIcon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Wallet,
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

const utangData = [
  { id: 'U001', nama: 'PT Indofood', jumlah: 5000000, jatuhTempo: '2024-02-01', status: 'Belum Lunas' },
  { id: 'U002', nama: 'CV Maju Jaya', jumlah: 2500000, jatuhTempo: '2024-01-25', status: 'Belum Lunas' },
  { id: 'U003', nama: 'UD Berkah', jumlah: 1200000, jatuhTempo: '2024-01-20', status: 'Lunas' },
];

const piutangData = [
  { id: 'P001', nama: 'Toko Makmur', jumlah: 3500000, jatuhTempo: '2024-02-05', status: 'Belum Lunas' },
  { id: 'P002', nama: 'Warung Berkah', jumlah: 1800000, jatuhTempo: '2024-01-28', status: 'Belum Lunas' },
  { id: 'P003', nama: 'Kios Sejahtera', jumlah: 750000, jatuhTempo: '2024-01-15', status: 'Lunas' },
];

export default function UtangPiutang() {
  const [activeTab, setActiveTab] = useState('utang');

  const totalUtang = utangData.filter(u => u.status === 'Belum Lunas').reduce((sum, u) => sum + u.jumlah, 0);
  const totalPiutang = piutangData.filter(p => p.status === 'Belum Lunas').reduce((sum, p) => sum + p.jumlah, 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utang / Piutang</h1>
          <p className="text-muted-foreground">Kelola utang dan piutang usaha</p>
        </div>
        <Button className="gap-2 bg-gradient-primary">
          <Plus className="w-4 h-4" />
          Tambah Data
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <ArrowDownLeft className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{formatRupiah(totalUtang)}</p>
              <p className="text-sm text-muted-foreground">Total Utang</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-success">{formatRupiah(totalPiutang)}</p>
              <p className="text-sm text-muted-foreground">Total Piutang</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${totalPiutang - totalUtang >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatRupiah(totalPiutang - totalUtang)}
              </p>
              <p className="text-sm text-muted-foreground">Selisih</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="utang" className="gap-2">
                <ArrowDownLeft className="w-4 h-4" />
                Utang
              </TabsTrigger>
              <TabsTrigger value="piutang" className="gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Piutang
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            <TabsContent value="utang" className="mt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utangData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.nama}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        {formatRupiah(item.jumlah)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.jatuhTempo}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Lunas' ? 'default' : 'destructive'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="piutang" className="mt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {piutangData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.nama}</TableCell>
                      <TableCell className="text-right font-medium text-success">
                        {formatRupiah(item.jumlah)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.jatuhTempo}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Lunas' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
