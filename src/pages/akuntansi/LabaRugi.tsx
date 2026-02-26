import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useStore } from '@/contexts/StoreContext';
import { formatRupiah } from '@/components/RupiahIcon';
import { TrendingUp, TrendingDown, Download, FileText } from 'lucide-react';

export default function LabaRugi() {
  const { transactions, purchases, expenses } = useData();
  const { storeInfo } = useStore();

  const labaRugiData = useMemo(() => {
    const totalPenjualan = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalPembelian = purchases.reduce((sum, p) => sum + p.total, 0);
    const totalOperasional = expenses.reduce((sum, e) => sum + e.jumlah, 0);
    
    const labaKotor = totalPenjualan - totalPembelian;
    const labaBersih = labaKotor - totalOperasional;
    const marginKotor = totalPenjualan > 0 ? (labaKotor / totalPenjualan) * 100 : 0;
    const marginBersih = totalPenjualan > 0 ? (labaBersih / totalPenjualan) * 100 : 0;

    return {
      totalPenjualan,
      totalPembelian,
      totalOperasional,
      labaKotor,
      labaBersih,
      marginKotor,
      marginBersih,
    };
  }, [transactions, purchases, expenses]);

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Laba Rugi</h1>
            <p className="text-muted-foreground">Laporan laba rugi per {new Date().toLocaleDateString('id-ID')}</p>
          </div>
          <div className="flex gap-2">
            <Button className="gap-2 bg-gradient-primary">
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Store Info */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">{storeInfo.name}</h2>
                <p className="text-sm text-muted-foreground">{storeInfo.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Penjualan</p>
                  <p className="text-xl font-bold text-green-600">{formatRupiah(labaRugiData.totalPenjualan)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Pembelian</p>
                  <p className="text-xl font-bold text-red-600">{formatRupiah(labaRugiData.totalPembelian)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Operasional</p>
                  <p className="text-xl font-bold text-blue-600">{formatRupiah(labaRugiData.totalOperasional)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={`border-l-4 ${labaRugiData.labaBersih >= 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {labaRugiData.labaBersih >= 0 ? (
                  <TrendingUp className="w-8 h-8 text-green-500" />
                ) : (
                  <TrendingDown className="w-8 h-8 text-red-500" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Laba Bersih</p>
                  <p className={`text-xl font-bold ${labaRugiData.labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatRupiah(labaRugiData.labaBersih)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Laba Rugi Table */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
            <CardTitle className="text-purple-800">Detail Laba Rugi</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* PENDAPATAN */}
              <div>
                <h3 className="text-lg font-semibold text-green-700 mb-3">PENDAPATAN</h3>
                <div className="space-y-2 pl-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Penjualan</span>
                    <span className="text-sm font-bold text-green-600">{formatRupiah(labaRugiData.totalPenjualan)}</span>
                  </div>
                </div>
              </div>

              {/* HARGA POKOK PENJUALAN */}
              <div>
                <h3 className="text-lg font-semibold text-red-700 mb-3">HARGA POKOK PENJUALAN</h3>
                <div className="space-y-2 pl-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Pembelian Barang</span>
                    <span className="text-sm font-bold text-red-600">{formatRupiah(labaRugiData.totalPembelian)}</span>
                  </div>
                </div>
              </div>

              {/* LABA KOTOR */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-green-800">Laba Kotor</span>
                  <div className="text-right">
                    <span className="text-base font-bold text-green-800">{formatRupiah(labaRugiData.labaKotor)}</span>
                    <p className="text-xs text-green-600">({labaRugiData.marginKotor.toFixed(1)}%)</p>
                  </div>
                </div>
              </div>

              {/* BIAYA OPERASIONAL */}
              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-3">BIAYA OPERASIONAL</h3>
                <div className="space-y-2 pl-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Biaya Operasional</span>
                    <span className="text-sm font-bold text-blue-600">{formatRupiah(labaRugiData.totalOperasional)}</span>
                  </div>
                </div>
              </div>

              {/* LABA BERSIH */}
              <div className={`p-4 rounded-lg ${labaRugiData.labaBersih >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-base font-semibold ${labaRugiData.labaBersih >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                    Laba Bersih
                  </span>
                  <div className="text-right">
                    <span className={`text-base font-bold ${labaRugiData.labaBersih >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                      {formatRupiah(labaRugiData.labaBersih)}
                    </span>
                    <p className={`text-xs ${labaRugiData.labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({labaRugiData.marginBersih.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Margin Analysis */}
        <Card className="mt-6">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
            <CardTitle className="text-orange-800">Analisis Margin</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Margin Kotor</h3>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - labaRugiData.marginKotor / 100)}`}
                      className="text-green-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-600">{labaRugiData.marginKotor.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Margin Bersih</h3>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - Math.abs(labaRugiData.marginBersih) / 100)}`}
                      className={labaRugiData.marginBersih >= 0 ? 'text-green-500' : 'text-red-500'}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${labaRugiData.marginBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {labaRugiData.marginBersih.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
