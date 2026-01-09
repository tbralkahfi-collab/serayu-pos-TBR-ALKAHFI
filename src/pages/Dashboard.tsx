import React, { useMemo } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
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

export default function Dashboard() {
  const { storeInfo, stockSettings } = useStore();
  const { user } = useAuth();
  const { products, transactions, expenses } = useData();
  const navigate = useNavigate();

  const currentHour = new Date().getHours();
  let greeting = 'Selamat Pagi';
  if (currentHour >= 12 && currentHour < 15) greeting = 'Selamat Siang';
  else if (currentHour >= 15 && currentHour < 18) greeting = 'Selamat Sore';
  else if (currentHour >= 18) greeting = 'Selamat Malam';

  // Calculate stats from real data
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayTransactions = transactions.filter(t => t.tanggal.startsWith(today));
    const totalSales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = todayTransactions.length;

    return [
      {
        title: 'Penjualan Hari Ini',
        value: totalSales || transactions.reduce((sum, t) => sum + t.total, 0),
        change: 12.5,
        icon: TrendingUp,
        positive: true,
        color: 'secondary',
      },
      {
        title: 'Transaksi',
        value: totalTransactions || transactions.length,
        change: 8.2,
        icon: ShoppingCart,
        positive: true,
        isCount: true,
        color: 'primary',
      },
      {
        title: 'Total Produk',
        value: products.length,
        change: 0,
        icon: Package,
        positive: true,
        isCount: true,
        color: 'info',
      },
      {
        title: 'Biaya Operasional',
        value: expenses.reduce((sum, e) => sum + e.jumlah, 0),
        change: 0,
        icon: Users,
        positive: false,
        color: 'secondary',
      },
    ];
  }, [transactions, products, expenses]);

  // Recent transactions from real data
  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5).map(t => ({
      id: t.id,
      customer: t.pelanggan,
      amount: t.total,
      time: t.tanggal.split(' ')[1] || t.tanggal,
      items: t.items,
    }));
  }, [transactions]);

  // Low stock products from real data
  const productsNeedRestock = useMemo(() => {
    return products.filter(p => p.stok <= (p.minStok || stockSettings.minStockAlert));
  }, [products, stockSettings.minStockAlert]);

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
                    <p className="font-medium text-foreground text-sm">{product.nama}</p>
                    <p className="text-xs text-muted-foreground">Min: {product.minStok || stockSettings.minStockAlert} {product.satuan}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {product.stok} {product.satuan}
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