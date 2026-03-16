import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatRupiah } from '@/components/RupiahIcon';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Plus, Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  DollarSign, Edit, Trash2, X, PiggyBank, Receipt, BarChart3,
  ArrowRightLeft, Landmark, CalendarIcon, Save, Printer, Download,
  Filter,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CapitalRecord {
  id: string;
  type: 'modal_awal' | 'penambahan' | 'penarikan';
  jumlah: number;
  tanggal: string;
  keterangan: string;
}

const typeLabels: Record<string, string> = {
  modal_awal: 'Modal Awal',
  penambahan: 'Penambahan Modal',
  penarikan: 'Penarikan Modal',
};

const typeColors: Record<string, string> = {
  modal_awal: 'bg-primary/10 text-primary',
  penambahan: 'bg-secondary/10 text-secondary',
  penarikan: 'bg-destructive/10 text-destructive',
};

type PeriodType = 'harian' | 'mingguan' | 'bulanan' | 'kustom' | 'semua';

function getDateRange(period: PeriodType, customStart?: Date, customEnd?: Date): { start: Date; end: Date } | null {
  const now = new Date();
  switch (period) {
    case 'harian':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'mingguan':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'bulanan':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'kustom':
      if (customStart && customEnd) {
        return { start: startOfDay(customStart), end: endOfDay(customEnd) };
      }
      return null;
    case 'semua':
    default:
      return null;
  }
}

function isInPeriod(dateStr: string, range: { start: Date; end: Date } | null): boolean {
  if (!range) return true;
  try {
    const d = parseISO(dateStr);
    return isWithinInterval(d, { start: range.start, end: range.end });
  } catch {
    return true;
  }
}

function getPeriodLabel(period: PeriodType, range: { start: Date; end: Date } | null): string {
  if (!range) return 'Semua Periode';
  return `${format(range.start, 'd MMM yyyy', { locale: localeId })} - ${format(range.end, 'd MMM yyyy', { locale: localeId })}`;
}

export default function Akuntansi() {
  const { user } = useAuth();
  const { transactions, purchases, expenses, debts, products } = useData();
  const { storeInfo } = useStore();

  const [capitalRecords, setCapitalRecords] = useState<CapitalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CapitalRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<CapitalRecord | null>(null);
  const [activeTab, setActiveTab] = useState('modal');
  const [formData, setFormData] = useState({
    type: 'modal_awal' as string,
    jumlah: '',
    tanggal: '',
    keterangan: '',
  });

  // Period filter state
  const [period, setPeriod] = useState<PeriodType>('semua');
  const [customStart, setCustomStart] = useState<Date | undefined>();
  const [customEnd, setCustomEnd] = useState<Date | undefined>();

  const dateRange = useMemo(() => getDateRange(period, customStart, customEnd), [period, customStart, customEnd]);
  const periodLabel = useMemo(() => getPeriodLabel(period, dateRange), [period, dateRange]);

  // Fetch capital data
  React.useEffect(() => {
    if (!user) return;
    const fetchCapital = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('capital')
        .select('*')
        .order('tanggal', { ascending: true });
      if (data) {
        setCapitalRecords(data.map(d => ({
          id: d.id,
          type: d.type as CapitalRecord['type'],
          jumlah: Number(d.jumlah),
          tanggal: d.tanggal,
          keterangan: d.keterangan || '',
        })));
      }
      if (error) console.error(error);
      setIsLoading(false);
    };
    fetchCapital();
    const channel = supabase
      .channel('capital-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'capital' }, () => fetchCapital())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // === FILTERED DATA ===
  const filteredTransactions = useMemo(() =>
    transactions.filter(t => isInPeriod(t.tanggal, dateRange)), [transactions, dateRange]);
  const filteredPurchases = useMemo(() =>
    purchases.filter(p => isInPeriod(p.date, dateRange)), [purchases, dateRange]);
  const filteredExpenses = useMemo(() =>
    expenses.filter(e => isInPeriod(e.tanggal, dateRange)), [expenses, dateRange]);
  const filteredCapital = useMemo(() =>
    capitalRecords.filter(c => isInPeriod(c.tanggal, dateRange)), [capitalRecords, dateRange]);

  // === CALCULATIONS (use filtered data) ===
  const totalModalAwal = useMemo(() =>
    filteredCapital.filter(c => c.type === 'modal_awal').reduce((s, c) => s + c.jumlah, 0), [filteredCapital]);
  const totalPenambahan = useMemo(() =>
    filteredCapital.filter(c => c.type === 'penambahan').reduce((s, c) => s + c.jumlah, 0), [filteredCapital]);
  const totalPenarikan = useMemo(() =>
    filteredCapital.filter(c => c.type === 'penarikan').reduce((s, c) => s + c.jumlah, 0), [filteredCapital]);
  const totalModal = totalModalAwal + totalPenambahan - totalPenarikan;

  const totalPenjualan = useMemo(() =>
    filteredTransactions.reduce((s, t) => s + t.total, 0), [filteredTransactions]);

  const totalHPP = useMemo(() => {
    let hpp = 0;
    filteredTransactions.forEach(t => {
      if (t.itemsData) {
        t.itemsData.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          hpp += (product?.hargaBeli || 0) * item.qty;
        });
      }
    });
    return hpp;
  }, [filteredTransactions, products]);

  const totalOperasional = useMemo(() =>
    filteredExpenses.reduce((s, e) => s + e.jumlah, 0), [filteredExpenses]);

  const labaKotor = totalPenjualan - totalHPP;
  const labaBersih = labaKotor - totalOperasional;

  const totalUtang = useMemo(() =>
    debts.filter(d => d.type === 'utang' && d.sisa > 0).reduce((s, d) => s + d.sisa, 0), [debts]);
  const totalPiutang = useMemo(() =>
    debts.filter(d => d.type === 'piutang' && d.sisa > 0).reduce((s, d) => s + d.sisa, 0), [debts]);

  const nilaiStok = useMemo(() =>
    products.reduce((s, p) => s + (p.stok * p.hargaBeli), 0), [products]);

  const kasDiterima = useMemo(() =>
    filteredTransactions.reduce((s, t) => s + t.bayar, 0), [filteredTransactions]);

  const kasDibayar = useMemo(() => {
    const dpPembelian = filteredPurchases.reduce((s, p) => s + p.dp, 0);
    return dpPembelian + totalOperasional;
  }, [filteredPurchases, totalOperasional]);

  const saldoKas = totalModal + kasDiterima - kasDibayar;
  const totalAset = saldoKas + nilaiStok + totalPiutang;
  const totalKewajiban = totalUtang;
  const totalEkuitas = totalModal + labaBersih;

  // === HANDLERS ===
  const handleAddNew = () => {
    setEditingRecord(null);
    setFormData({ type: 'modal_awal', jumlah: '', tanggal: new Date().toISOString().split('T')[0], keterangan: '' });
    setShowDialog(true);
  };

  const handleEdit = (record: CapitalRecord) => {
    setEditingRecord(record);
    setFormData({ type: record.type, jumlah: record.jumlah.toString(), tanggal: record.tanggal, keterangan: record.keterangan });
    setShowDialog(true);
  };

  const handleDelete = (record: CapitalRecord) => {
    setRecordToDelete(record);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    const { error } = await supabase.from('capital').delete().eq('id', recordToDelete.id);
    if (error) {
      toast.error('Gagal menghapus data modal');
      return;
    }
    setCapitalRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
    toast.success('Data modal berhasil dihapus');
    setShowDeleteDialog(false);
    setRecordToDelete(null);
  };

  const handleSave = async () => {
    if (!formData.jumlah || !formData.tanggal || !user) {
      toast.error('Lengkapi semua field wajib');
      return;
    }
    if (editingRecord) {
      const { error } = await supabase.from('capital').update({
        type: formData.type, jumlah: parseFloat(formData.jumlah),
        tanggal: formData.tanggal, keterangan: formData.keterangan,
      }).eq('id', editingRecord.id);
      if (error) toast.error('Gagal memperbarui data modal');
      else toast.success('Data modal berhasil diperbarui');
    } else {
      const { error } = await supabase.from('capital').insert({
        user_id: user.id, type: formData.type, jumlah: parseFloat(formData.jumlah),
        tanggal: formData.tanggal, keterangan: formData.keterangan,
      });
      if (error) toast.error('Gagal menambah data modal');
      else toast.success('Data modal berhasil ditambahkan');
    }
    setShowDialog(false);
  };

  // === PDF GENERATION ===
  const generatePDF = (andPrint: boolean) => {
    const doc = new jsPDF();
    const storeName = storeInfo?.name || 'Toko Saya';
    const storeAddr = storeInfo?.address || '';
    const storePhone = storeInfo?.phone || '';

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(storeName, 105, 15, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (storeAddr) doc.text(storeAddr, 105, 21, { align: 'center' });
    if (storePhone) doc.text(`Telp: ${storePhone}`, 105, 26, { align: 'center' });

    let y = storeAddr || storePhone ? 32 : 22;
    doc.setDrawColor(0);
    doc.line(14, y, 196, y);
    y += 6;

    // Report title
    const tabTitles: Record<string, string> = {
      modal: 'Laporan Modal',
      labarugi: 'Laporan Laba/Rugi',
      neraca: 'Neraca (Balance Sheet)',
      aruskas: 'Laporan Arus Kas',
    };
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(tabTitles[activeTab] || 'Laporan Akuntansi', 105, y, { align: 'center' });
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode: ${periodLabel}`, 105, y, { align: 'center' });
    y += 4;
    doc.text(`Dicetak: ${format(new Date(), 'd MMMM yyyy HH:mm', { locale: localeId })}`, 105, y, { align: 'center' });
    y += 8;

    if (activeTab === 'modal') {
      // Summary
      const summaryData = [
        ['Modal Awal', formatRupiah(totalModalAwal)],
        ['Penambahan Modal', formatRupiah(totalPenambahan)],
        ['Penarikan Modal', `- ${formatRupiah(totalPenarikan)}`],
        ['Total Modal', formatRupiah(totalModal)],
      ];
      autoTable(doc, {
        startY: y,
        head: [['Keterangan', 'Jumlah']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 9 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;

      // Detail table
      const detailData = filteredCapital.map(r => [
        r.tanggal, typeLabels[r.type], r.keterangan || '-',
        `${r.type === 'penarikan' ? '-' : '+'}${formatRupiah(r.jumlah)}`
      ]);
      if (detailData.length > 0) {
        autoTable(doc, {
          startY: y,
          head: [['Tanggal', 'Jenis', 'Keterangan', 'Jumlah']],
          body: detailData,
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 8 },
        });
      }
    } else if (activeTab === 'labarugi') {
      const rows: [string, string][] = [
        ['PENDAPATAN', ''],
        ['  Penjualan', formatRupiah(totalPenjualan)],
        ['', ''],
        ['HARGA POKOK PENJUALAN', ''],
        ['  HPP (Harga Beli × Qty)', `- ${formatRupiah(totalHPP)}`],
        ['', ''],
        ['LABA KOTOR', formatRupiah(labaKotor)],
        ['', ''],
        ['BIAYA OPERASIONAL', ''],
      ];
      const grouped: Record<string, number> = {};
      filteredExpenses.forEach(e => { grouped[e.kategori] = (grouped[e.kategori] || 0) + e.jumlah; });
      Object.entries(grouped).forEach(([kat, jumlah]) => {
        rows.push([`  ${kat}`, `- ${formatRupiah(jumlah)}`]);
      });
      rows.push(['  Total Biaya Operasional', `- ${formatRupiah(totalOperasional)}`]);
      rows.push(['', '']);
      rows.push(['LABA BERSIH', formatRupiah(labaBersih)]);
      if (totalPenjualan > 0) {
        rows.push(['Margin Bersih', `${((labaBersih / totalPenjualan) * 100).toFixed(1)}%`]);
      }

      autoTable(doc, {
        startY: y,
        head: [['Keterangan', 'Jumlah']],
        body: rows,
        theme: 'plain',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 9 },
        didParseCell: (data) => {
          const text = String(data.cell.raw);
          if (text === text.toUpperCase() && text.trim() && !text.startsWith(' ') && data.section === 'body') {
            data.cell.styles.fontStyle = 'bold';
          }
          if (text === 'LABA BERSIH') {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 11;
          }
        },
      });
    } else if (activeTab === 'neraca') {
      const asetRows: [string, string][] = [
        ['ASET LANCAR', ''],
        ['  Kas & Bank', formatRupiah(saldoKas)],
        ['  Piutang Usaha', formatRupiah(totalPiutang)],
        ['  Persediaan Barang', formatRupiah(nilaiStok)],
        ['TOTAL ASET', formatRupiah(totalAset)],
      ];
      const kewajibanRows: [string, string][] = [
        ['KEWAJIBAN', ''],
        ['  Utang Usaha', formatRupiah(totalUtang)],
        ['Total Kewajiban', formatRupiah(totalKewajiban)],
        ['', ''],
        ['EKUITAS', ''],
        ['  Modal Pemilik', formatRupiah(totalModal)],
        ['  Laba Ditahan', formatRupiah(labaBersih)],
        ['Total Ekuitas', formatRupiah(totalEkuitas)],
        ['', ''],
        ['TOTAL KEWAJIBAN & EKUITAS', formatRupiah(totalKewajiban + totalEkuitas)],
      ];

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('ASET', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y, body: asetRows, theme: 'plain', styles: { fontSize: 9 },
        didParseCell: (data) => {
          const t = String(data.cell.raw);
          if (t === t.toUpperCase() && t.trim() && !t.startsWith(' ')) data.cell.styles.fontStyle = 'bold';
        },
      });
      y = (doc as any).lastAutoTable.finalY + 6;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('KEWAJIBAN & EKUITAS', 14, y);
      y += 4;
      autoTable(doc, {
        startY: y, body: kewajibanRows, theme: 'plain', styles: { fontSize: 9 },
        didParseCell: (data) => {
          const t = String(data.cell.raw);
          if (t === t.toUpperCase() && t.trim() && !t.startsWith(' ')) data.cell.styles.fontStyle = 'bold';
        },
      });
    } else if (activeTab === 'aruskas') {
      const rows: [string, string][] = [
        ['ARUS KAS OPERASI', ''],
        ['  Penerimaan dari Penjualan', `+ ${formatRupiah(kasDiterima)}`],
        ['  Pembayaran ke Supplier (DP)', `- ${formatRupiah(filteredPurchases.reduce((s, p) => s + p.dp, 0))}`],
        ['  Biaya Operasional', `- ${formatRupiah(totalOperasional)}`],
        ['Arus Kas Operasi Bersih', formatRupiah(kasDiterima - kasDibayar)],
        ['', ''],
        ['ARUS KAS PENDANAAN', ''],
        ['  Modal Awal', `+ ${formatRupiah(totalModalAwal)}`],
        ['  Penambahan Modal', `+ ${formatRupiah(totalPenambahan)}`],
        ['  Penarikan Modal', `- ${formatRupiah(totalPenarikan)}`],
        ['Arus Kas Pendanaan Bersih', formatRupiah(totalModal)],
        ['', ''],
        ['SALDO KAS AKHIR', formatRupiah(saldoKas)],
      ];
      autoTable(doc, {
        startY: y,
        head: [['Keterangan', 'Jumlah']],
        body: rows,
        theme: 'plain',
        headStyles: { fillColor: [59, 130, 246], textColor: 255 },
        styles: { fontSize: 9 },
        didParseCell: (data) => {
          const t = String(data.cell.raw);
          if (t === t.toUpperCase() && t.trim() && !t.startsWith(' ') && data.section === 'body') data.cell.styles.fontStyle = 'bold';
          if (t === 'SALDO KAS AKHIR') { data.cell.styles.fontStyle = 'bold'; data.cell.styles.fontSize = 11; }
        },
      });
    }

    const tabTitlesFile: Record<string, string> = {
      modal: 'Modal', labarugi: 'LabaRugi', neraca: 'Neraca', aruskas: 'ArusKas',
    };
    const fileName = `Laporan_${tabTitlesFile[activeTab]}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;

    if (andPrint) {
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          URL.revokeObjectURL(url);
        };
      }
      toast.success('Membuka jendela cetak...');
    } else {
      doc.save(fileName);
      toast.success(`Laporan berhasil disimpan: ${fileName}`);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Landmark className="w-7 h-7 text-primary" />
            Akuntansi
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Ringkasan keuangan, modal, laba/rugi, dan neraca
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => generatePDF(false)}>
            <Save className="w-4 h-4" />
            Simpan PDF
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => generatePDF(true)}>
            <Printer className="w-4 h-4" />
            Simpan & Cetak
          </Button>
          <Button className="gap-2 bg-gradient-primary" onClick={handleAddNew}>
            <Plus className="w-4 h-4" />
            Tambah Modal
          </Button>
        </div>
      </div>

      {/* Period Filter */}
      <Card className="mb-6">
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Filter className="w-4 h-4" />
              Periode:
            </div>
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'semua', label: 'Semua' },
                { value: 'harian', label: 'Hari Ini' },
                { value: 'mingguan', label: 'Minggu Ini' },
                { value: 'bulanan', label: 'Bulan Ini' },
                { value: 'kustom', label: 'Kustom' },
              ] as { value: PeriodType; label: string }[]).map(p => (
                <Button
                  key={p.value}
                  variant={period === p.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPeriod(p.value)}
                  className={period === p.value ? 'bg-primary text-primary-foreground' : ''}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            {period === 'kustom' && (
              <div className="flex items-center gap-2 flex-wrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("gap-1 text-xs", !customStart && "text-muted-foreground")}>
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {customStart ? format(customStart, 'd MMM yyyy', { locale: localeId }) : 'Dari'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={customStart} onSelect={setCustomStart} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground text-xs">s/d</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("gap-1 text-xs", !customEnd && "text-muted-foreground")}>
                      <CalendarIcon className="w-3.5 h-3.5" />
                      {customEnd ? format(customEnd, 'd MMM yyyy', { locale: localeId }) : 'Sampai'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={customEnd} onSelect={setCustomEnd} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}
            {period !== 'semua' && dateRange && (
              <Badge variant="secondary" className="text-xs">
                {periodLabel}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <PiggyBank className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-xl font-bold text-primary">{formatRupiah(totalModal)}</p>
                <p className="text-xs text-muted-foreground">Total Modal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-secondary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-xl font-bold text-secondary">{formatRupiah(saldoKas)}</p>
                <p className="text-xs text-muted-foreground">Saldo Kas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${labaBersih >= 0 ? 'border-l-secondary' : 'border-l-destructive'}`}>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${labaBersih >= 0 ? 'bg-secondary/10' : 'bg-destructive/10'}`}>
                {labaBersih >= 0 ? <TrendingUp className="w-5 h-5 text-secondary" /> : <TrendingDown className="w-5 h-5 text-destructive" />}
              </div>
              <div className="min-w-0">
                <p className={`text-lg md:text-xl font-bold ${labaBersih >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                  {formatRupiah(labaBersih)}
                </p>
                <p className="text-xs text-muted-foreground">Laba Bersih</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info">
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-info" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-xl font-bold text-info">{formatRupiah(totalAset)}</p>
                <p className="text-xs text-muted-foreground">Total Aset</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="modal">Modal</TabsTrigger>
          <TabsTrigger value="labarugi">Laba/Rugi</TabsTrigger>
          <TabsTrigger value="neraca">Neraca</TabsTrigger>
          <TabsTrigger value="aruskas">Arus Kas</TabsTrigger>
        </TabsList>

        {/* === TAB MODAL === */}
        <TabsContent value="modal">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-primary" />
                Riwayat Modal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">Modal Awal</p>
                  <p className="text-xl font-bold text-primary">{formatRupiah(totalModalAwal)}</p>
                </div>
                <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20">
                  <p className="text-sm text-muted-foreground">Penambahan Modal</p>
                  <p className="text-xl font-bold text-secondary">{formatRupiah(totalPenambahan)}</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-sm text-muted-foreground">Penarikan Modal</p>
                  <p className="text-xl font-bold text-destructive">{formatRupiah(totalPenarikan)}</p>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCapital.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Belum ada data modal{period !== 'semua' ? ' pada periode ini' : ''}. Klik "Tambah Modal" untuk memulai.
                      </TableCell>
                    </TableRow>
                  ) : filteredCapital.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>{record.tanggal}</TableCell>
                      <TableCell>
                        <Badge className={typeColors[record.type]} variant="secondary">
                          {typeLabels[record.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.keterangan || '-'}</TableCell>
                      <TableCell className={`text-right font-medium ${record.type === 'penarikan' ? 'text-destructive' : 'text-secondary'}`}>
                        {record.type === 'penarikan' ? '-' : '+'}{formatRupiah(record.jumlah)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(record)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(record)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB LABA/RUGI === */}
        <TabsContent value="labarugi">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-secondary" />
                Laporan Laba/Rugi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl mx-auto space-y-1">
                <div className="p-3 bg-secondary/5 rounded-lg font-semibold text-foreground">PENDAPATAN</div>
                <div className="flex justify-between px-6 py-2">
                  <span className="text-muted-foreground">Penjualan</span>
                  <span className="font-medium text-secondary">{formatRupiah(totalPenjualan)}</span>
                </div>
                <div className="p-3 bg-destructive/5 rounded-lg font-semibold text-foreground mt-4">HARGA POKOK PENJUALAN (HPP)</div>
                <div className="flex justify-between px-6 py-2">
                  <span className="text-muted-foreground">HPP (Harga Beli × Qty Terjual)</span>
                  <span className="font-medium text-destructive">-{formatRupiah(totalHPP)}</span>
                </div>
                <div className="flex justify-between px-4 py-3 bg-muted/50 rounded-lg border mt-2">
                  <span className="font-semibold">Laba Kotor</span>
                  <span className={`font-bold text-lg ${labaKotor >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                    {formatRupiah(labaKotor)}
                  </span>
                </div>
                <div className="p-3 bg-warning/5 rounded-lg font-semibold text-foreground mt-4">BIAYA OPERASIONAL</div>
                {(() => {
                  const grouped: Record<string, number> = {};
                  filteredExpenses.forEach(e => { grouped[e.kategori] = (grouped[e.kategori] || 0) + e.jumlah; });
                  return Object.entries(grouped).map(([kat, jumlah]) => (
                    <div key={kat} className="flex justify-between px-6 py-2">
                      <span className="text-muted-foreground">{kat}</span>
                      <span className="font-medium text-destructive">-{formatRupiah(jumlah)}</span>
                    </div>
                  ));
                })()}
                <div className="flex justify-between px-6 py-2 border-t">
                  <span className="font-medium">Total Biaya Operasional</span>
                  <span className="font-bold text-destructive">-{formatRupiah(totalOperasional)}</span>
                </div>
                <div className={`flex justify-between px-4 py-4 rounded-lg border-2 mt-4 ${labaBersih >= 0 ? 'bg-secondary/10 border-secondary/30' : 'bg-destructive/10 border-destructive/30'}`}>
                  <span className="font-bold text-lg">LABA BERSIH</span>
                  <span className={`font-bold text-2xl ${labaBersih >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                    {formatRupiah(labaBersih)}
                  </span>
                </div>
                {totalPenjualan > 0 && (
                  <div className="text-right text-sm text-muted-foreground mt-1">
                    Margin Bersih: {((labaBersih / totalPenjualan) * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB NERACA === */}
        <TabsContent value="neraca">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-info" />
                Neraca (Balance Sheet)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <div className="space-y-2">
                  <div className="p-3 bg-secondary/10 rounded-lg font-bold text-secondary text-center">ASET</div>
                  <div className="space-y-1 p-4 bg-card border rounded-lg">
                    <p className="font-semibold text-foreground mb-2">Aset Lancar</p>
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-muted-foreground">Kas & Bank</span>
                      <span className="font-medium">{formatRupiah(saldoKas)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-muted-foreground">Piutang Usaha</span>
                      <span className="font-medium">{formatRupiah(totalPiutang)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-muted-foreground">Persediaan Barang</span>
                      <span className="font-medium">{formatRupiah(nilaiStok)}</span>
                    </div>
                    <div className="flex justify-between py-2 px-2 border-t-2 border-secondary/30 mt-2">
                      <span className="font-bold">Total Aset</span>
                      <span className="font-bold text-secondary text-lg">{formatRupiah(totalAset)}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="p-3 bg-primary/10 rounded-lg font-bold text-primary text-center">KEWAJIBAN & EKUITAS</div>
                  <div className="space-y-1 p-4 bg-card border rounded-lg">
                    <p className="font-semibold text-foreground mb-2">Kewajiban</p>
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-muted-foreground">Utang Usaha</span>
                      <span className="font-medium text-destructive">{formatRupiah(totalUtang)}</span>
                    </div>
                    <div className="flex justify-between py-2 px-2 border-t mt-1">
                      <span className="font-medium">Total Kewajiban</span>
                      <span className="font-bold text-destructive">{formatRupiah(totalKewajiban)}</span>
                    </div>
                    <p className="font-semibold text-foreground mt-4 mb-2">Ekuitas</p>
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-muted-foreground">Modal Pemilik</span>
                      <span className="font-medium">{formatRupiah(totalModal)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 px-2">
                      <span className="text-muted-foreground">Laba Ditahan</span>
                      <span className={`font-medium ${labaBersih >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                        {formatRupiah(labaBersih)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 px-2 border-t mt-1">
                      <span className="font-medium">Total Ekuitas</span>
                      <span className="font-bold text-primary">{formatRupiah(totalEkuitas)}</span>
                    </div>
                    <div className="flex justify-between py-2 px-2 border-t-2 border-primary/30 mt-2">
                      <span className="font-bold">Total Kewajiban & Ekuitas</span>
                      <span className="font-bold text-primary text-lg">{formatRupiah(totalKewajiban + totalEkuitas)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className={`mt-6 p-4 rounded-lg text-center ${Math.abs(totalAset - (totalKewajiban + totalEkuitas)) < 1 ? 'bg-secondary/10 border border-secondary/30' : 'bg-warning/10 border border-warning/30'}`}>
                {Math.abs(totalAset - (totalKewajiban + totalEkuitas)) < 1 ? (
                  <p className="text-secondary font-semibold">✓ Neraca Seimbang (Aset = Kewajiban + Ekuitas)</p>
                ) : (
                  <p className="text-warning font-semibold">⚠ Selisih: {formatRupiah(Math.abs(totalAset - (totalKewajiban + totalEkuitas)))}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === TAB ARUS KAS === */}
        <TabsContent value="aruskas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-secondary" />
                Laporan Arus Kas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-w-2xl mx-auto space-y-1">
                <div className="p-3 bg-secondary/5 rounded-lg font-semibold text-foreground">ARUS KAS DARI AKTIVITAS OPERASI</div>
                <div className="flex justify-between px-6 py-2">
                  <span className="text-muted-foreground">Penerimaan dari Penjualan</span>
                  <span className="font-medium text-secondary">+{formatRupiah(kasDiterima)}</span>
                </div>
                <div className="flex justify-between px-6 py-2">
                  <span className="text-muted-foreground">Pembayaran ke Supplier (DP)</span>
                  <span className="font-medium text-destructive">-{formatRupiah(filteredPurchases.reduce((s, p) => s + p.dp, 0))}</span>
                </div>
                <div className="flex justify-between px-6 py-2">
                  <span className="text-muted-foreground">Biaya Operasional</span>
                  <span className="font-medium text-destructive">-{formatRupiah(totalOperasional)}</span>
                </div>
                <div className="flex justify-between px-4 py-3 bg-muted/50 rounded-lg border mt-2">
                  <span className="font-semibold">Arus Kas Operasi Bersih</span>
                  <span className={`font-bold text-lg ${(kasDiterima - kasDibayar) >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                    {formatRupiah(kasDiterima - kasDibayar)}
                  </span>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg font-semibold text-foreground mt-4">ARUS KAS DARI AKTIVITAS PENDANAAN</div>
                <div className="flex justify-between px-6 py-2">
                  <span className="text-muted-foreground">Modal Awal</span>
                  <span className="font-medium text-secondary">+{formatRupiah(totalModalAwal)}</span>
                </div>
                <div className="flex justify-between px-6 py-2">
                  <span className="text-muted-foreground">Penambahan Modal</span>
                  <span className="font-medium text-secondary">+{formatRupiah(totalPenambahan)}</span>
                </div>
                <div className="flex justify-between px-6 py-2">
                  <span className="text-muted-foreground">Penarikan Modal</span>
                  <span className="font-medium text-destructive">-{formatRupiah(totalPenarikan)}</span>
                </div>
                <div className="flex justify-between px-4 py-3 bg-muted/50 rounded-lg border mt-2">
                  <span className="font-semibold">Arus Kas Pendanaan Bersih</span>
                  <span className={`font-bold text-lg ${totalModal >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {formatRupiah(totalModal)}
                  </span>
                </div>
                <div className={`flex justify-between px-4 py-4 rounded-lg border-2 mt-6 ${saldoKas >= 0 ? 'bg-secondary/10 border-secondary/30' : 'bg-destructive/10 border-destructive/30'}`}>
                  <span className="font-bold text-lg">SALDO KAS AKHIR</span>
                  <span className={`font-bold text-2xl ${saldoKas >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                    {formatRupiah(saldoKas)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Modal Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Data Modal' : 'Tambah Data Modal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Jenis Modal</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="modal_awal">Modal Awal</SelectItem>
                  <SelectItem value="penambahan">Penambahan Modal</SelectItem>
                  <SelectItem value="penarikan">Penarikan Modal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jumlah (Rp)</Label>
              <Input type="number" placeholder="0" value={formData.jumlah} onChange={(e) => setFormData(prev => ({ ...prev, jumlah: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Input type="date" value={formData.tanggal} onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea placeholder="Keterangan (opsional)" value={formData.keterangan} onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="w-4 h-4 mr-2" />Batal
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              {editingRecord ? 'Simpan Perubahan' : 'Tambah Modal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Modal?</AlertDialogTitle>
            <AlertDialogDescription>Anda yakin ingin menghapus data modal ini? Tindakan ini tidak dapat dibatalkan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
