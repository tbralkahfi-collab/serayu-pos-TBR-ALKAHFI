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
  Calendar,
  CalendarDays,
  CalendarRange,
  Wallet,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function Dashboard() {
  const { storeInfo, stockSettings } = useStore();
  const { user } = useAuth();
  const { products, transactions, expenses, projects, debts } = useData();
  const navigate = useNavigate();

  const currentHour = new Date().getHours();
  let greeting = 'Selamat Pagi';
  if (currentHour >= 12 && currentHour < 15) greeting = 'Selamat Siang';
  else if (currentHour >= 15 && currentHour < 18) greeting = 'Selamat Sore';
  else if (currentHour >= 18) greeting = 'Selamat Malam';

  // Calculate real-time stats for today, this week, this month
  const salesStats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Get start of week (Monday)
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const weekStart = startOfWeek.toISOString().split('T')[0];
    
    // Get start of month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStart = startOfMonth.toISOString().split('T')[0];

    // Filter transactions by period - handle both date formats
    const getTransactionDate = (t: { tanggal: string }) => {
      // Handle format "2024-01-15 14:30" or "2024-01-15"
      return t.tanggal.split(' ')[0];
    };

    const todayTransactions = transactions.filter(t => getTransactionDate(t) === today);
    const weekTransactions = transactions.filter(t => getTransactionDate(t) >= weekStart);
    const monthTransactions = transactions.filter(t => getTransactionDate(t) >= monthStart);

    // Calculate sales
    const todaySales = todayTransactions.reduce((sum, t) => sum + t.total, 0);
    const weekSales = weekTransactions.reduce((sum, t) => sum + t.total, 0);
    const monthSales = monthTransactions.reduce((sum, t) => sum + t.total, 0);

    // Filter expenses by period
    const todayExpenses = expenses.filter(e => e.tanggal === today);
    const weekExpenses = expenses.filter(e => e.tanggal >= weekStart);
    const monthExpenses = expenses.filter(e => e.tanggal >= monthStart);

    // Calculate operational costs
    const todayOperational = todayExpenses.reduce((sum, e) => sum + e.jumlah, 0);
    const weekOperational = weekExpenses.reduce((sum, e) => sum + e.jumlah, 0);
    const monthOperational = monthExpenses.reduce((sum, e) => sum + e.jumlah, 0);

    // Net profit (sales - operational)
    const todayNet = todaySales - todayOperational;
    const weekNet = weekSales - weekOperational;
    const monthNet = monthSales - monthOperational;

    return {
      today: { sales: todaySales, transactions: todayTransactions.length, operational: todayOperational, net: todayNet },
      week: { sales: weekSales, transactions: weekTransactions.length, operational: weekOperational, net: weekNet },
      month: { sales: monthSales, transactions: monthTransactions.length, operational: monthOperational, net: monthNet },
    };
  }, [transactions, expenses]);

  // Chart data for bar chart
  const chartData = useMemo(() => {
    return [
      { 
        name: 'Hari Ini', 
        penjualan: salesStats.today.sales, 
        operasional: salesStats.today.operational,
        laba: salesStats.today.net,
        color: 'hsl(142, 70%, 45%)'
      },
      { 
        name: 'Minggu Ini', 
        penjualan: salesStats.week.sales, 
        operasional: salesStats.week.operational,
        laba: salesStats.week.net,
        color: 'hsl(0, 75%, 50%)'
      },
      { 
        name: 'Bulan Ini', 
        penjualan: salesStats.month.sales, 
        operasional: salesStats.month.operational,
        laba: salesStats.month.net,
        color: 'hsl(199, 89%, 48%)'
      },
    ];
  }, [salesStats]);

  // Utang Piutang summary (real-time)
  const debtSummary = useMemo(() => {
    const totalUtang = debts.filter(d => d.type === 'utang' && d.sisa > 0).reduce((sum, d) => sum + d.sisa, 0);
    const totalPiutang = debts.filter(d => d.type === 'piutang' && d.sisa > 0).reduce((sum, d) => sum + d.sisa, 0);
    return { totalUtang, totalPiutang, net: totalPiutang - totalUtang };
  }, [debts]);

  // Project summary (real-time)
  const projectSummary = useMemo(() => {
    const active = projects.filter(p => p.status === 'Berjalan').length;
    const pending = projects.filter(p => p.status === 'Pending').length;
    const totalValue = projects.filter(p => p.status !== 'Dibatalkan').reduce((sum, p) => sum + p.nilaiKontrak, 0);
    const totalDP = projects.reduce((sum, p) => sum + p.dp, 0);
    const sisaBayar = totalValue - totalDP;
    return { active, pending, totalValue, totalDP, sisaBayar };
  }, [projects]);

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

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatRupiah(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {greeting}, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Berikut ringkasan aktivitas toko Anda hari ini.
          </p>
        </div>

        {/* Store info card */}
        <Card className="w-full lg:w-auto lg:min-w-[320px] border-2 border-primary/20 shadow-lg bg-card">
          <CardContent className="p-4 md:p-5">
            <div className="flex items-center gap-4">
              {storeInfo.logo ? (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-2 flex items-center justify-center ring-2 ring-primary/30 shadow-md flex-shrink-0">
                  <img
                    src={storeInfo.logo}
                    alt="Logo Toko"
                    className="w-full h-full object-contain drop-shadow-md"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-xl md:text-2xl font-bold text-primary-foreground">SP</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base md:text-lg text-foreground truncate">{storeInfo.name}</h3>
                <p className="text-xs font-medium text-primary mb-1">SERAYU POS</p>
                <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 text-secondary" />
                  <span className="truncate">{storeInfo.address}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                  <Phone className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 text-info" />
                  <span>{storeInfo.phone}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart - Sales Overview */}
      <Card className="mb-6 bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Grafik Penjualan & Laba
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}jt`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
                    return value;
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="penjualan" name="Penjualan" fill="hsl(142, 70%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="operasional" name="Operasional" fill="hsl(0, 75%, 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="laba" name="Laba Bersih" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(142, 70%, 45%)' }} />
              <span className="text-muted-foreground">Penjualan</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(0, 75%, 50%)' }} />
              <span className="text-muted-foreground">Operasional</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(199, 89%, 48%)' }} />
              <span className="text-muted-foreground">Laba Bersih</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Stats - Today, Week, Month */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Today */}
        <Card className="border-l-4 border-l-secondary bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Penjualan</span>
              <span className="text-base md:text-lg font-bold text-secondary">{formatRupiah(salesStats.today.sales)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Transaksi</span>
              <span className="font-medium text-sm">{salesStats.today.transactions} transaksi</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Operasional</span>
              <span className="font-medium text-destructive text-sm">-{formatRupiah(salesStats.today.operational)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-xs md:text-sm font-medium">Laba Bersih</span>
              <span className={`text-base md:text-lg font-bold ${salesStats.today.net >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                {formatRupiah(salesStats.today.net)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* This Week */}
        <Card className="border-l-4 border-l-primary bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              Minggu Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Penjualan</span>
              <span className="text-base md:text-lg font-bold text-primary">{formatRupiah(salesStats.week.sales)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Transaksi</span>
              <span className="font-medium text-sm">{salesStats.week.transactions} transaksi</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Operasional</span>
              <span className="font-medium text-destructive text-sm">-{formatRupiah(salesStats.week.operational)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-xs md:text-sm font-medium">Laba Bersih</span>
              <span className={`text-base md:text-lg font-bold ${salesStats.week.net >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                {formatRupiah(salesStats.week.net)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* This Month */}
        <Card className="border-l-4 border-l-info bg-card hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CalendarRange className="w-4 h-4" />
              Bulan Ini
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 md:space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Penjualan</span>
              <span className="text-base md:text-lg font-bold text-info">{formatRupiah(salesStats.month.sales)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Transaksi</span>
              <span className="font-medium text-sm">{salesStats.month.transactions} transaksi</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs md:text-sm text-muted-foreground">Operasional</span>
              <span className="font-medium text-destructive text-sm">-{formatRupiah(salesStats.month.operational)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-xs md:text-sm font-medium">Laba Bersih</span>
              <span className={`text-base md:text-lg font-bold ${salesStats.month.net >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                {formatRupiah(salesStats.month.net)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {/* Total Products */}
        <Card className="bg-card">
          <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold">{products.length}</p>
              <p className="text-xs md:text-sm text-muted-foreground truncate">Total Produk</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Projects */}
        <Card className="bg-card">
          <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-secondary" />
            </div>
            <div className="min-w-0">
              <p className="text-xl md:text-2xl font-bold">{projectSummary.active}</p>
              <p className="text-xs md:text-sm text-muted-foreground truncate">Proyek Berjalan</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Piutang */}
        <Card className="bg-card">
          <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 md:w-6 md:h-6 text-info" />
            </div>
            <div className="min-w-0">
              <p className="text-sm md:text-lg font-bold text-info">{formatRupiah(debtSummary.totalPiutang)}</p>
              <p className="text-xs md:text-sm text-muted-foreground truncate">Total Piutang</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Utang */}
        <Card className="bg-card">
          <CardContent className="p-3 md:p-4 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-5 h-5 md:w-6 md:h-6 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-sm md:text-lg font-bold text-destructive">{formatRupiah(debtSummary.totalUtang)}</p>
              <p className="text-xs md:text-sm text-muted-foreground truncate">Total Utang</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low stock alert */}
      {productsNeedRestock.length > 0 && (
        <Card className="mb-6 border-warning/50 bg-warning/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-warning text-sm md:text-base">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5" />
              Peringatan Stok Rendah ({productsNeedRestock.length} produk)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
              {productsNeedRestock.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-card border border-warning/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-xs md:text-sm truncate">{product.nama}</p>
                    <p className="text-xs text-muted-foreground">Min: {product.minStok || stockSettings.minStockAlert} {product.satuan}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs ml-2 flex-shrink-0">
                    {product.stok} {product.satuan}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Recent transactions */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              Transaksi Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 md:space-y-4">
              {recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">Belum ada transaksi hari ini</p>
              ) : (
                recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                        <RupiahIcon size="sm" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate">{tx.customer}</p>
                        <p className="text-xs text-muted-foreground truncate">{tx.items}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-semibold text-secondary text-sm">{formatRupiah(tx.amount)}</p>
                      <p className="text-xs text-muted-foreground">{tx.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-sm md:text-base">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <button 
                onClick={() => navigate('/kasir')}
                className="flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-6 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <ShoppingCart className="w-6 h-6 md:w-8 md:h-8" />
                <span className="font-medium text-sm md:text-base">Kasir</span>
              </button>
              <button 
                onClick={() => navigate('/produk')}
                className="flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-6 rounded-xl bg-gradient-secondary text-secondary-foreground hover:opacity-90 transition-opacity"
              >
                <Package className="w-6 h-6 md:w-8 md:h-8" />
                <span className="font-medium text-sm md:text-base">Produk</span>
              </button>
              <button 
                onClick={() => navigate('/laporan')}
                className="flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-6 rounded-xl bg-info text-info-foreground hover:opacity-90 transition-opacity"
              >
                <BarChart3 className="w-6 h-6 md:w-8 md:h-8" />
                <span className="font-medium text-sm md:text-base">Laporan</span>
              </button>
              <button 
                onClick={() => navigate('/proyek')}
                className="flex flex-col items-center justify-center gap-2 md:gap-3 p-4 md:p-6 rounded-xl border-2 border-primary/30 bg-card text-foreground hover:bg-primary/5 transition-colors"
              >
                <Users className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                <span className="font-medium text-sm md:text-base">Proyek</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
