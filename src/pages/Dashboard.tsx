import React from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { RupiahIcon, formatRupiah } from '@/components/RupiahIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  Phone,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

const stats = [
  {
    title: 'Penjualan Hari Ini',
    value: 2500000,
    change: 12.5,
    icon: TrendingUp,
    positive: true,
  },
  {
    title: 'Transaksi',
    value: 45,
    change: 8.2,
    icon: ShoppingCart,
    positive: true,
    isCount: true,
  },
  {
    title: 'Produk Terjual',
    value: 128,
    change: -2.4,
    icon: Package,
    positive: false,
    isCount: true,
  },
  {
    title: 'Pelanggan Baru',
    value: 12,
    change: 15.3,
    icon: Users,
    positive: true,
    isCount: true,
  },
];

const recentTransactions = [
  { id: 'TRX001', customer: 'Budi Santoso', amount: 150000, time: '10:30' },
  { id: 'TRX002', customer: 'Siti Aminah', amount: 275000, time: '11:15' },
  { id: 'TRX003', customer: 'Ahmad Yani', amount: 89000, time: '12:45' },
  { id: 'TRX004', customer: 'Dewi Lestari', amount: 425000, time: '14:20' },
  { id: 'TRX005', customer: 'Rudi Hartono', amount: 198000, time: '15:05' },
];

export default function Dashboard() {
  const { storeInfo } = useStore();
  const { user } = useAuth();

  const currentHour = new Date().getHours();
  let greeting = 'Selamat Pagi';
  if (currentHour >= 12 && currentHour < 15) greeting = 'Selamat Siang';
  else if (currentHour >= 15 && currentHour < 18) greeting = 'Selamat Sore';
  else if (currentHour >= 18) greeting = 'Selamat Malam';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {greeting}, {user?.username}! 👋
          </h1>
          <p className="text-muted-foreground">
            Berikut ringkasan aktivitas toko Anda hari ini.
          </p>
        </div>

        {/* Store info card */}
        <Card className="min-w-[300px]">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {storeInfo.logo ? (
                <img
                  src={storeInfo.logo}
                  alt="Logo Toko"
                  className="w-16 h-16 rounded-xl object-contain bg-muted"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <span className="text-xl font-bold text-primary-foreground">SP</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{storeInfo.name}</h3>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{storeInfo.address}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Phone className="w-3 h-3" />
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
          <Card key={index} className="hover:shadow-card-hover transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.positive ? 'text-success' : 'text-destructive'
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

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <Card>
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
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <RupiahIcon size="sm" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{tx.customer}</p>
                      <p className="text-sm text-muted-foreground">{tx.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatRupiah(tx.amount)}</p>
                    <p className="text-sm text-muted-foreground">{tx.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-6 rounded-xl bg-gradient-primary text-primary-foreground text-center hover:opacity-90 transition-opacity">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2" />
                <span className="font-semibold">Buka Kasir</span>
              </button>
              <button className="p-6 rounded-xl bg-muted text-foreground text-center hover:bg-muted/80 transition-colors">
                <Package className="w-8 h-8 mx-auto mb-2" />
                <span className="font-semibold">Tambah Produk</span>
              </button>
              <button className="p-6 rounded-xl bg-muted text-foreground text-center hover:bg-muted/80 transition-colors">
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <span className="font-semibold">Lihat Laporan</span>
              </button>
              <button className="p-6 rounded-xl bg-accent/20 text-accent-foreground text-center hover:bg-accent/30 transition-colors">
                <Users className="w-8 h-8 mx-auto mb-2 text-accent" />
                <span className="font-semibold">Pelanggan</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
