import React, { useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { formatRupiah } from '@/components/RupiahIcon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  TrendingUp,
  Wallet,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  PlayCircle,
  Package,
  Wrench,
  ArrowRight,
  BarChart3,
  FileDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

const statusColors: Record<string, string> = {
  'Pending': 'bg-yellow-100 text-yellow-800',
  'Berjalan': 'bg-blue-100 text-blue-800',
  'Selesai': 'bg-green-100 text-green-800',
  'Dibatalkan': 'bg-red-100 text-red-800',
};

const statusIcons: Record<string, React.ReactNode> = {
  'Pending': <Clock className="w-4 h-4" />,
  'Berjalan': <PlayCircle className="w-4 h-4" />,
  'Selesai': <CheckCircle2 className="w-4 h-4" />,
  'Dibatalkan': <AlertCircle className="w-4 h-4" />,
};

const PIE_COLORS = ['hsl(142, 70%, 45%)', 'hsl(199, 89%, 48%)', 'hsl(45, 93%, 47%)', 'hsl(0, 75%, 50%)'];

export default function ProyekDashboard() {
  const { projects, products, transactions } = useData();
  const navigate = useNavigate();

  // Get synced material price
  const getProductPrice = (productId: string, fallbackPrice: number) => {
    const product = products.find(p => p.id === productId);
    return product?.hargaJual || product?.harga || fallbackPrice;
  };

  // Calculate detailed project stats
  const projectStats = useMemo(() => {
    return projects.map(project => {
      // Total material cost (synced with current product prices)
      const totalMaterialCost = (project.materials || []).reduce((sum, mat) => {
        const currentPrice = getProductPrice(mat.productId, mat.harga);
        return sum + (mat.qty * currentPrice);
      }, 0);

      // Get payments from transactions linked to this project
      const projectTransactions = transactions.filter(
        t => t.pelanggan.trim().toLowerCase() === project.namaProyek.trim().toLowerCase()
      );
      const totalPaid = projectTransactions.reduce((sum, t) => sum + t.total, 0);

      // Payment progress
      const sisaTagihan = project.nilaiKontrak - totalPaid;
      const progressPembayaran = project.nilaiKontrak > 0 
        ? Math.min(100, (totalPaid / project.nilaiKontrak) * 100) 
        : 0;

      // Labor cost
      const biayaTenagaKerja = project.biayaTenagaKerja || 0;

      // Estimated profit
      const estimasiLaba = project.nilaiKontrak - totalMaterialCost - biayaTenagaKerja;
      const marginPersen = project.nilaiKontrak > 0 
        ? ((estimasiLaba / project.nilaiKontrak) * 100).toFixed(1) 
        : '0';

      return {
        ...project,
        totalMaterialCost,
        biayaTenagaKerja,
        totalPaid,
        sisaTagihan,
        progressPembayaran,
        estimasiLaba,
        marginPersen,
        transactionCount: projectTransactions.length,
      };
    });
  }, [projects, products, transactions]);

  // Summary stats
  const summary = useMemo(() => {
    const active = projectStats.filter(p => p.status === 'Berjalan' || p.status === 'Pending');
    const completed = projectStats.filter(p => p.status === 'Selesai');
    
    return {
      totalProyek: projects.length,
      proyekAktif: active.length,
      proyekSelesai: completed.length,
      totalNilaiKontrak: projectStats.reduce((sum, p) => sum + p.nilaiKontrak, 0),
      totalTerbayar: projectStats.reduce((sum, p) => sum + p.totalPaid, 0),
      totalSisaTagihan: projectStats.reduce((sum, p) => sum + p.sisaTagihan, 0),
      totalMaterialCost: projectStats.reduce((sum, p) => sum + p.totalMaterialCost, 0),
      totalLabor: projectStats.reduce((sum, p) => sum + p.biayaTenagaKerja, 0),
      totalEstimasiLaba: projectStats.reduce((sum, p) => sum + p.estimasiLaba, 0),
    };
  }, [projectStats]);

  // Chart data for project values
  const barChartData = useMemo(() => {
    return projectStats
      .filter(p => p.status !== 'Dibatalkan')
      .slice(0, 6)
      .map(p => ({
        name: p.namaProyek.length > 12 ? p.namaProyek.substring(0, 12) + '...' : p.namaProyek,
        kontrak: p.nilaiKontrak,
        terbayar: p.totalPaid,
        laba: p.estimasiLaba,
      }));
  }, [projectStats]);

  // Pie chart data for status distribution
  const pieChartData = useMemo(() => {
    const statusCount = {
      'Pending': projects.filter(p => p.status === 'Pending').length,
      'Berjalan': projects.filter(p => p.status === 'Berjalan').length,
      'Selesai': projects.filter(p => p.status === 'Selesai').length,
      'Dibatalkan': projects.filter(p => p.status === 'Dibatalkan').length,
    };
    return Object.entries(statusCount)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [projects]);

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

  const formatRupiahPDF = (amount: number) => {
    return 'Rp ' + amount.toLocaleString('id-ID');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN PROYEK', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tanggal: ${dateStr}`, 105, 28, { align: 'center' });

    // Summary Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('RINGKASAN', 14, 40);
    
    const summaryData = [
      ['Total Proyek', summary.totalProyek.toString()],
      ['Proyek Aktif', summary.proyekAktif.toString()],
      ['Proyek Selesai', summary.proyekSelesai.toString()],
      ['Total Nilai Kontrak', formatRupiahPDF(summary.totalNilaiKontrak)],
      ['Total Terbayar', formatRupiahPDF(summary.totalTerbayar)],
      ['Total Sisa Tagihan', formatRupiahPDF(summary.totalSisaTagihan)],
      ['Total Biaya Material', formatRupiahPDF(summary.totalMaterialCost)],
      ['Total Biaya Tenaga Kerja', formatRupiahPDF(summary.totalLabor)],
      ['Total Estimasi Laba', formatRupiahPDF(summary.totalEstimasiLaba)],
    ];

    autoTable(doc, {
      startY: 45,
      head: [['Deskripsi', 'Nilai']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
    });

    // Detail Proyek Section
    let yPos = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAIL PROYEK', 14, yPos);

    const projectData = projectStats.map(p => [
      p.namaProyek,
      p.pelanggan,
      p.status,
      formatRupiahPDF(p.nilaiKontrak),
      p.diskonPersen ? `${p.diskonPersen}%` : '-',
      p.diskonNominal ? formatRupiahPDF(p.diskonNominal) : '-',
      formatRupiahPDF(p.totalPaid),
      formatRupiahPDF(p.sisaTagihan),
      formatRupiahPDF(p.totalMaterialCost),
      formatRupiahPDF(p.biayaTenagaKerja),
      formatRupiahPDF(p.estimasiLaba),
      `${p.marginPersen}%`,
    ]);

    autoTable(doc, {
      startY: yPos + 5,
      head: [['Proyek', 'Pelanggan', 'Status', 'Kontrak', 'Disk%', 'DiskRp', 'Terbayar', 'Sisa', 'Material', 'Tng Kerja', 'Laba', 'Margin']],
      body: projectData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontSize: 6 },
      styles: { fontSize: 6, cellPadding: 1 },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 18 },
        2: { cellWidth: 12 },
      },
    });

    // Detail per proyek dengan material
    projectStats.forEach((project, index) => {
      // Add new page for each project detail
      doc.addPage();
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`DETAIL PROYEK: ${project.namaProyek}`, 14, 20);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Pelanggan: ${project.pelanggan}`, 14, 30);
      doc.text(`Status: ${project.status}`, 14, 36);
      doc.text(`Tanggal Mulai: ${project.tanggalMulai}`, 14, 42);
      if (project.tanggalSelesai) {
        doc.text(`Tanggal Selesai: ${project.tanggalSelesai}`, 14, 48);
      }

      // Financial Summary
      const finansialY = project.tanggalSelesai ? 58 : 52;
      doc.setFont('helvetica', 'bold');
      doc.text('Ringkasan Keuangan:', 14, finansialY);

      const finData = [
        ['Nilai Kontrak Awal', formatRupiahPDF(project.nilaiKontrak + (project.diskonNominal || 0) + Math.round((project.nilaiKontrak / (1 - (project.diskonPersen || 0) / 100)) * (project.diskonPersen || 0) / 100))],
        ['Diskon Persen (%)', project.diskonPersen ? `${project.diskonPersen}%` : '-'],
        ['Diskon Nominal', project.diskonNominal ? formatRupiahPDF(project.diskonNominal) : '-'],
        ['Nilai Kontrak Setelah Diskon', formatRupiahPDF(project.nilaiKontrak)],
        ['Total Terbayar', formatRupiahPDF(project.totalPaid)],
        ['Sisa Tagihan', formatRupiahPDF(project.sisaTagihan)],
        ['Progress Pembayaran', `${project.progressPembayaran.toFixed(1)}%`],
      ];

      autoTable(doc, {
        startY: finansialY + 5,
        body: finData,
        theme: 'plain',
        styles: { fontSize: 9 },
      });

      // Cost Breakdown
      let costY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Rincian Biaya:', 14, costY);

      const costData = [
        ['Biaya Material', formatRupiahPDF(project.totalMaterialCost)],
        ['Biaya Tenaga Kerja', formatRupiahPDF(project.biayaTenagaKerja)],
        ['Total Biaya', formatRupiahPDF(project.totalMaterialCost + project.biayaTenagaKerja)],
        ['Estimasi Laba', formatRupiahPDF(project.estimasiLaba)],
        ['Margin Keuntungan', `${project.marginPersen}%`],
      ];

      autoTable(doc, {
        startY: costY + 5,
        body: costData,
        theme: 'striped',
        styles: { fontSize: 9 },
      });

      // Material List
      if (project.materials && project.materials.length > 0) {
        let matY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'bold');
        doc.text('Daftar Material:', 14, matY);

        const matData = project.materials.map((mat: any) => [
          mat.nama,
          mat.qty.toString(),
          mat.satuan,
          formatRupiahPDF(mat.harga),
          formatRupiahPDF(mat.qty * mat.harga),
        ]);

        autoTable(doc, {
          startY: matY + 5,
          head: [['Material', 'Qty', 'Satuan', 'Harga', 'Subtotal']],
          body: matData,
          theme: 'grid',
          headStyles: { fillColor: [34, 197, 94] },
          styles: { fontSize: 8 },
        });
      }
    });

    // Footer on last page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Halaman ${i} dari ${pageCount}`, 105, 290, { align: 'center' });
    }

    doc.save(`Laporan-Proyek-${now.toISOString().split('T')[0]}.pdf`);
    toast.success('Laporan proyek berhasil di-export ke PDF');
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Dashboard Proyek</h1>
          <p className="text-sm text-muted-foreground">Analisis keuangan & progress proyek</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleExportPDF} variant="outline" className="gap-2">
            <FileDown className="w-4 h-4" />
            Export PDF
          </Button>
          <Button onClick={() => navigate('/proyek')} variant="outline" className="gap-2">
            <FolderKanban className="w-4 h-4" />
            Kelola Proyek
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        <Card className="bg-card">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FolderKanban className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold">{summary.totalProyek}</p>
                <p className="text-xs text-muted-foreground truncate">Total Proyek</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-secondary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm md:text-lg font-bold text-secondary truncate">{formatRupiah(summary.totalNilaiKontrak)}</p>
                <p className="text-xs text-muted-foreground truncate">Total Kontrak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-info" />
              </div>
              <div className="min-w-0">
                <p className="text-sm md:text-lg font-bold text-info truncate">{formatRupiah(summary.totalTerbayar)}</p>
                <p className="text-xs text-muted-foreground truncate">Total Terbayar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-sm md:text-lg font-bold text-warning truncate">{formatRupiah(summary.totalSisaTagihan)}</p>
                <p className="text-xs text-muted-foreground truncate">Sisa Tagihan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card col-span-2 sm:col-span-1">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className={`text-sm md:text-lg font-bold truncate ${summary.totalEstimasiLaba >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {formatRupiah(summary.totalEstimasiLaba)}
                </p>
                <p className="text-xs text-muted-foreground truncate">Est. Laba Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500 bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold text-blue-600">{formatRupiah(summary.totalMaterialCost)}</p>
              <p className="text-sm text-muted-foreground">Total Biaya Material</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold text-orange-600">{formatRupiah(summary.totalLabor)}</p>
              <p className="text-sm text-muted-foreground">Total Tenaga Kerja</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-lg md:text-xl font-bold text-green-600">{formatRupiah(summary.totalEstimasiLaba)}</p>
              <p className="text-sm text-muted-foreground">Total Estimasi Laba</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="lg:col-span-2 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base md:text-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
              Nilai Proyek vs Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 20, right: 10, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) return `${(value / 1000000).toFixed(0)}jt`;
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
                      return value;
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="kontrak" name="Nilai Kontrak" fill="hsl(199, 89%, 48%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="terbayar" name="Terbayar" fill="hsl(142, 70%, 45%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="laba" name="Est. Laba" fill="hsl(45, 93%, 47%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Status Proyek</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {pieChartData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1 text-xs">
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} 
                  />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Detail Cards */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Detail Proyek</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Belum ada proyek</p>
            ) : (
              projectStats.map(project => (
                <div key={project.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{project.namaProyek}</h3>
                        <Badge className={`gap-1 ${statusColors[project.status]}`}>
                          {statusIcons[project.status]}
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {project.pelanggan}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">{formatRupiah(project.nilaiKontrak)}</p>
                      <p className="text-xs text-muted-foreground">Nilai Kontrak</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress Pembayaran</span>
                      <span className="font-medium">{project.progressPembayaran.toFixed(1)}%</span>
                    </div>
                    <Progress value={project.progressPembayaran} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Terbayar: {formatRupiah(project.totalPaid)}</span>
                      <span>Sisa: {formatRupiah(project.sisaTagihan)}</span>
                    </div>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <p className="text-blue-600 font-medium">{formatRupiah(project.totalMaterialCost)}</p>
                      <p className="text-xs text-muted-foreground">Biaya Material</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <p className="text-orange-600 font-medium">{formatRupiah(project.biayaTenagaKerja)}</p>
                      <p className="text-xs text-muted-foreground">Tenaga Kerja</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded-lg">
                      <p className={`font-medium ${project.estimasiLaba >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {formatRupiah(project.estimasiLaba)}
                      </p>
                      <p className="text-xs text-muted-foreground">Est. Laba</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <p className={`font-medium ${parseFloat(project.marginPersen) >= 0 ? 'text-purple-600' : 'text-destructive'}`}>
                        {project.marginPersen}%
                      </p>
                      <p className="text-xs text-muted-foreground">Margin</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
