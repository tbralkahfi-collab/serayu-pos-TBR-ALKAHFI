import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { useStore } from '@/contexts/StoreContext';
import { formatRupiah } from '@/components/RupiahIcon';
import { Calculator, FileText, Download } from 'lucide-react';

export default function Neraca() {
  const { modalAwal, transactions, products, debts, purchases } = useData();
  const { storeInfo } = useStore();

  const accountingData = useMemo(() => {
    if (!modalAwal) {
      return null;
    }

    // Calculate values
    const totalPenjualan = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalPembelian = purchases.reduce((sum, p) => sum + p.total, 0);
    
    // Total piutang (simplified)
    const totalPiutang = debts.reduce((sum, d) => sum + d.sisa, 0);
    
    // Total stok value
    const totalStokValue = products.reduce((sum, p) => sum + (p.stok * p.hargaBeli), 0);
    
    // Current cash estimation
    const kasTersedia = modalAwal.kas + totalPenjualan - totalPembelian;
    
    const totalAset = kasTersedia + modalAwal.bank + totalStokValue + totalPiutang;
    const totalUtang = totalPiutang;
    const labaBersih = totalPenjualan - totalPembelian;
    const ekuitasAkhir = modalAwal.kas + modalAwal.bank + modalAwal.inventaris + labaBersih;

    return {
      totalPiutang,
      totalStokValue,
      totalUtang,
      kasTersedia,
      totalAset,
      ekuitasAkhir,
      labaBersih,
    };
  }, [modalAwal, transactions, products, debts, purchases]);

  if (!modalAwal) {
    return (
      <div className="p-4 md:p-6 lg:p-8 bg-background min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Neraca</h1>
            <p className="text-muted-foreground">Laporan posisi keuangan</p>
          </div>
          
          <Card className="border-2 border-primary/20">
            <CardContent className="p-8 text-center">
              <Calculator className="w-16 h-16 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Modal Awal Belum Disetup</h3>
              <p className="text-muted-foreground mb-4">Setup modal awal terlebih dahulu untuk melihat laporan neraca</p>
              <Button onClick={() => window.location.href = '/akuntansi/modal-awal'} className="bg-gradient-primary">
                Setup Modal Awal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Neraca</h1>
            <p className="text-muted-foreground">Laporan posisi keuangan per {new Date().toLocaleDateString('id-ID')}</p>
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
              <Badge variant="secondary" className="gap-1">
                <Calculator className="w-3 h-3" />
                Modal Awal Aktif
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Main Neraca */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ASET */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
              <CardTitle className="text-green-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                ASET
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Kas</span>
                  <span className="text-sm font-bold text-green-600">{formatRupiah(accountingData.kasTersedia)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Bank</span>
                  <span className="text-sm font-bold text-green-600">{formatRupiah(modalAwal.bank)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Piutang</span>
                  <span className="text-sm font-bold text-green-600">{formatRupiah(accountingData.totalPiutang)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Stok</span>
                  <span className="text-sm font-bold text-green-600">{formatRupiah(accountingData.totalStokValue)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-green-50 rounded px-3">
                  <span className="text-base font-bold text-green-800">Total Aset</span>
                  <span className="text-base font-bold text-green-800">{formatRupiah(accountingData.totalAset)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LIABILITAS & EKUITAS */}
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                LIABILITAS & EKUITAS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Utang</span>
                  <span className="text-sm font-bold text-blue-600">{formatRupiah(accountingData.totalUtang)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Ekuitas Awal</span>
                  <span className="text-sm font-bold text-blue-600">{formatRupiah(modalAwal.kas + modalAwal.bank + modalAwal.inventaris)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Laba Bersih</span>
                  <span className={`text-sm font-bold ${accountingData.labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatRupiah(accountingData.labaBersih)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm font-medium">Ekuitas Akhir</span>
                  <span className="text-sm font-bold text-blue-600">{formatRupiah(accountingData.ekuitasAkhir)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-blue-50 rounded px-3">
                  <span className="text-base font-bold text-blue-800">Total Liab & Ekuitas</span>
                  <span className="text-base font-bold text-blue-800">{formatRupiah(accountingData.totalAset)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Aset</h3>
                <p className="text-2xl font-bold text-green-600">{formatRupiah(accountingData.totalAset)}</p>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Utang</h3>
                <p className="text-2xl font-bold text-blue-600">{formatRupiah(accountingData.totalUtang)}</p>
              </div>
              <div className="text-center">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Ekuitas Akhir</h3>
                <p className="text-2xl font-bold text-purple-600">{formatRupiah(accountingData.ekuitasAkhir)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
