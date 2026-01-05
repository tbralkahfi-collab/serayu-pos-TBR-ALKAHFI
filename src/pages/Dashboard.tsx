import React from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { RupiahIcon, formatRupiah } from '@/components/RupiahIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Phone,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from 'lucide-react';

const stats = [
  {
    title: 'Penjualan Hari Ini',
    value: 25000000,
    change: 12.5,
    icon: TrendingUp,
    positive: true,
    color: 'secondary',
  },
  {
    title: 'Transaksi',
    value: 18,
    change: 8.2,
    icon: ShoppingCart,
    positive: true,
    isCount: true,
    color: 'primary',
  },
  {
    title: 'Produk Terjual',
    value: 245,
    change: -2.4,
    icon: Package,
    positive: false,
    isCount: true,
    color: 'info',
  },
  {
    title: 'Pelanggan Baru',
    value: 5,
    change: 15.3,
    icon: Users,
    positive: true,
    isCount: true,
    color: 'secondary',
  },
];

const recentTransactions = [
  { id: 'TRX001', customer: 'Bpk. Agus', amount: 3500000, time: '10:30', items: 'Baja Ringan C75 x 50btg' },
  { id: 'TRX002', customer: 'CV Maju Jaya', amount: 8750000, time: '11:15', items: 'Spandek 0.35mm x 100lbr' },
  { id: 'TRX003', customer: 'Bpk. Joko', amount: 1890000, time: '12:45', items: 'Hollow 4x4 x 30btg' },
  { id: 'TRX004', customer: 'UD Berkah', amount: 12500000, time: '14:20', items: 'Genteng Metal x 200lbr' },
  { id: 'TRX005', customer: 'Bpk. Rudi', amount: 2450000, time: '15:05', items: 'Reng x 100btg' },
];

// Sample products with low stock
const lowStockProducts = [
  { id: '1', name: 'Baja Ringan C75', stock: 8, minStock: 10, unit: 'batang' },
  { id: '2', name: 'Sekrup Baja 12mm', stock: 5, minStock: 20, unit: 'dus' },
  { id: '3', name: 'Hollow 4x4', stock: 12, minStock: 15, unit: 'batang' },
  { id: '4', name: 'Dynabolt 10mm', stock: 3, minStock: 10, unit: 'dus' },
];

export default function Dashboard() {
  const { storeInfo, stockSettings } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const currentHour = new Date().getHours();
  let greeting = 'Selamat Pagi';
  if (currentHour >= 12 && currentHour < 15) greeting = 'Selamat Siang';
  else if (currentHour >= 15 && currentHour < 18) greeting = 'Selamat Sore';
  else if (currentHour >= 18) greeting = 'Selamat Malam';

  const productsNeedRestock = lowStockProducts.filter(p => p.stock <= stockSettings.minStockAlert);

  return (
    <div className="p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {greeting}, {user?.username}! 👋
          </h1>
          <p className="text-muted-foreground">
            Berikut ringkasan aktivitas toko Anda hari ini.
          </p>
        </div>

        {/* Store info card with improved logo display */}
        <Card className="min-w-[320px] border-2 border-primary/20 shadow-lg bg-card">
          <CardContent className="p-5">
            <div className="flex items-center gap-5">
              {/* Improved logo display */}
              <div className="relative">
                {storeInfo.logo ? (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-2 flex items-center justify-center ring-2 ring-primary/30 shadow-md">
                    <img
                      src={storeInfo.logo}
                      alt="Logo Toko"
                      className="w-full h-full object-contain drop-shadow-md"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md">
                    <span className="text-2xl font-bold text-primary-foreground">SP</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-foreground truncate">{storeInfo.name}</h3>
                <p className="text-xs font-medium text-primary mb-2">SERAYU POS</p>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-secondary" />
                  <span className="truncate">{storeInfo.address}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 shrink-0 text-info" />
                  <span>{storeInfo.phone}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className={`hover:shadow-lg transition-shadow border-l-4 ${
            stat.color === 'secondary' ? 'border-l-secondary' :
            stat.color === 'primary' ? 'border-l-primary' :
            'border-l-info'
          } bg-card`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  stat.color === 'secondary' ? 'bg-secondary/10' :
                  stat.color === 'primary' ? 'bg-primary/10' :
                  'bg-info/10'
                }`}>
                  <stat.icon className={`w-6 h-6 ${
                    stat.color === 'secondary' ? 'text-secondary' :
                    stat.color === 'primary' ? 'text-primary' :
                    'text-info'
                  }`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.positive ? 'text-secondary' : 'text-destructive'
                  }`}
                >
                  {stat.positive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.isCount ? stat.value : formatRupiah(stat.value)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low stock alert */}
      {productsNeedRestock.length > 0 && (
        <Card className="mb-6 border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="w-5 h-5" />
              Peringatan Stok Rendah ({productsNeedRestock.length} produk)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {productsNeedRestock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-card border border-warning/30"
                >
                  <div>
                    <p className="font-medium text-foreground text-sm">{product.name}</p>
                    <p className="text-xs text-muted-foreground">Min: {product.minStock} {product.unit}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {product.stock} {product.unit}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              Transaksi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                      <RupiahIcon size="sm" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{tx.customer}</p>
                      <p className="text-xs text-muted-foreground">{tx.items}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-secondary">{formatRupiah(tx.amount)}</p>
                    <p className="text-sm text-muted-foreground">{tx.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/kasir')}
                className="p-6 rounded-xl bg-gradient-primary text-primary-foreground text-center hover:opacity-90 transition-opacity shadow-md"
              >
                <ShoppingCart className="w-8 h-8 mx-auto mb-2" />
                <span className="font-semibold">Buka Kasir</span>
              </button>
              <button 
                onClick={() => navigate('/produk')}
                className="p-6 rounded-xl bg-secondary/10 text-secondary text-center hover:bg-secondary/20 transition-colors border border-secondary/30"
              >
                <Package className="w-8 h-8 mx-auto mb-2" />
                <span className="font-semibold">Tambah Produk</span>
              </button>
              <button 
                onClick={() => navigate('/laporan')}
                className="p-6 rounded-xl bg-info/10 text-info text-center hover:bg-info/20 transition-colors border border-info/30"
              >
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <span className="font-semibold">Lihat Laporan</span>
              </button>
              <button 
                onClick={() => navigate('/transaksi')}
                className="p-6 rounded-xl bg-gradient-secondary text-secondary-foreground text-center hover:opacity-90 transition-opacity shadow-md"
              >
                <Users className="w-8 h-8 mx-auto mb-2" />
                <span className="font-semibold">Transaksi</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}