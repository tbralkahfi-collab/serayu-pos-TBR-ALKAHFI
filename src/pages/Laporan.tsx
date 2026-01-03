import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatRupiah } from '@/components/RupiahIcon';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  FileText,
  PieChart,
} from 'lucide-react';

const monthlyData = [
  { month: 'Jan', penjualan: 450000000, pembelian: 320000000 },
  { month: 'Feb', penjualan: 520000000, pembelian: 380000000 },
  { month: 'Mar', penjualan: 480000000, pembelian: 350000000 },
  { month: 'Apr', penjualan: 610000000, pembelian: 420000000 },
  { month: 'Mei', penjualan: 550000000, pembelian: 400000000 },
  { month: 'Jun', penjualan: 670000000, pembelian: 480000000 },
];

const topProducts = [
  { name: 'Baja Ringan C75', sold: 1250, revenue: 106250000, unit: 'batang' },
  { name: 'Spandek 0.35mm', sold: 980, revenue: 93100000, unit: 'lembar' },
  { name: 'Hollow 4x4', sold: 850, revenue: 55250000, unit: 'batang' },
  { name: 'Genteng Metal', sold: 720, revenue: 32400000, unit: 'lembar' },
  { name: 'Reng Baja Ringan', sold: 1500, revenue: 42000000, unit: 'batang' },
];

export default function Laporan() {
  const totalPenjualan = monthlyData.reduce((sum, d) => sum + d.penjualan, 0);
  const totalPembelian = monthlyData.reduce((sum, d) => sum + d.pembelian, 0);
  const labaKotor = totalPenjualan - totalPembelian;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan</h1>
          <p className="text-muted-foreground">Analisis dan laporan bisnis baja ringan</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Periode
          </Button>
          <Button className="gap-2 bg-gradient-primary">
            <Download className="w-4 h-4" />
            Export Laporan
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-lg font-bold text-success">{formatRupiah(totalPenjualan)}</p>
              <p className="text-sm text-muted-foreground">Total Penjualan</p>
            </div>
          </CardContent>
        </Card>
        <Card>
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
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-lg font-bold text-primary">{formatRupiah(labaKotor)}</p>
              <p className="text-sm text-muted-foreground">Laba Kotor</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <PieChart className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-xl font-bold">{((labaKotor / totalPenjualan) * 100).toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Margin</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly chart */}
        <Card>
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
                      className="bg-success/80 rounded-l-md transition-all"
                      style={{ width: `${(data.penjualan / 700000000) * 50}%` }}
                    />
                    <div
                      className="bg-destructive/80 rounded-r-md transition-all"
                      style={{ width: `${(data.pembelian / 700000000) * 50}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex gap-4 justify-center pt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-success/80" />
                  <span>Penjualan</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-destructive/80" />
                  <span>Pembelian</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.sold} {product.unit} terjual</p>
                  </div>
                  <p className="font-semibold text-success">{formatRupiah(product.revenue)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick reports */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Laporan Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-6 flex-col gap-2">
                <FileText className="w-8 h-8 text-primary" />
                <span>Laporan Penjualan</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex-col gap-2">
                <FileText className="w-8 h-8 text-destructive" />
                <span>Laporan Pembelian</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex-col gap-2">
                <FileText className="w-8 h-8 text-warning" />
                <span>Laporan Stok</span>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex-col gap-2">
                <FileText className="w-8 h-8 text-success" />
                <span>Laporan Laba/Rugi</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
