import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah } from '@/components/RupiahIcon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Wallet,
  Edit,
  Trash2,
  X,
  CreditCard,
  History,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DebtRecord {
  id: string;
  nama: string;
  jumlah: number;
  dibayar: number;
  jatuhTempo: string;
  status: string;
  keterangan: string;
  riwayatPembayaran: { tanggal: string; jumlah: number }[];
}

const initialUtangData: DebtRecord[] = [
  { id: 'U001', nama: 'PT Baja Steel Indonesia', jumlah: 50000000, dibayar: 20000000, jatuhTempo: '2024-02-01', status: 'Belum Lunas', keterangan: 'Pembelian baja ringan C75', riwayatPembayaran: [{ tanggal: '2024-01-15', jumlah: 20000000 }] },
  { id: 'U002', nama: 'CV Spandek Jaya', jumlah: 25000000, dibayar: 0, jatuhTempo: '2024-01-25', status: 'Belum Lunas', keterangan: 'Pembelian spandek', riwayatPembayaran: [] },
  { id: 'U003', nama: 'UD Hollow Mandiri', jumlah: 12000000, dibayar: 12000000, jatuhTempo: '2024-01-20', status: 'Lunas', keterangan: 'Pembelian hollow', riwayatPembayaran: [{ tanggal: '2024-01-18', jumlah: 12000000 }] },
];

const initialPiutangData: DebtRecord[] = [
  { id: 'P001', nama: 'Toko Bangunan Makmur', jumlah: 35000000, dibayar: 15000000, jatuhTempo: '2024-02-05', status: 'Belum Lunas', keterangan: 'Penjualan baja ringan', riwayatPembayaran: [{ tanggal: '2024-01-20', jumlah: 15000000 }] },
  { id: 'P002', nama: 'CV Kontraktor Jaya', jumlah: 18000000, dibayar: 0, jatuhTempo: '2024-01-28', status: 'Belum Lunas', keterangan: 'Proyek atap', riwayatPembayaran: [] },
  { id: 'P003', nama: 'Bpk. Ahmad (Proyek Rumah)', jumlah: 7500000, dibayar: 7500000, jatuhTempo: '2024-01-15', status: 'Lunas', keterangan: 'Rangka atap rumah', riwayatPembayaran: [{ tanggal: '2024-01-14', jumlah: 7500000 }] },
];

export default function UtangPiutang() {
  const [activeTab, setActiveTab] = useState('utang');
  const [utangData, setUtangData] = useState<DebtRecord[]>(initialUtangData);
  const [piutangData, setPiutangData] = useState<DebtRecord[]>(initialPiutangData);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DebtRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<DebtRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<DebtRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [formData, setFormData] = useState({
    nama: '',
    jumlah: '',
    jatuhTempo: '',
    keterangan: '',
  });

  const totalUtang = utangData.filter(u => u.status === 'Belum Lunas').reduce((sum, u) => sum + (u.jumlah - u.dibayar), 0);
  const totalPiutang = piutangData.filter(p => p.status === 'Belum Lunas').reduce((sum, p) => sum + (p.jumlah - p.dibayar), 0);

  const currentData = activeTab === 'utang' ? utangData : piutangData;
  const setCurrentData = activeTab === 'utang' ? setUtangData : setPiutangData;

  const handleAddNew = () => {
    setEditingRecord(null);
    setFormData({ nama: '', jumlah: '', jatuhTempo: '', keterangan: '' });
    setShowDialog(true);
  };

  const handleEdit = (record: DebtRecord) => {
    setEditingRecord(record);
    setFormData({
      nama: record.nama,
      jumlah: record.jumlah.toString(),
      jatuhTempo: record.jatuhTempo,
      keterangan: record.keterangan,
    });
    setShowDialog(true);
  };

  const handleDelete = (record: DebtRecord) => {
    setRecordToDelete(record);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      setCurrentData(prev => prev.filter(r => r.id !== recordToDelete.id));
      toast.success(`Data berhasil dihapus`);
      setShowDeleteDialog(false);
      setRecordToDelete(null);
    }
  };

  const handlePayment = (record: DebtRecord) => {
    setSelectedRecord(record);
    setPaymentAmount('');
    setShowPaymentDialog(true);
  };

  const handleViewHistory = (record: DebtRecord) => {
    setSelectedRecord(record);
    setShowHistoryDialog(true);
  };

  const confirmPayment = () => {
    if (!selectedRecord || !paymentAmount) return;

    const amount = parseInt(paymentAmount);
    const sisaHutang = selectedRecord.jumlah - selectedRecord.dibayar;

    if (amount <= 0) {
      toast.error('Jumlah pembayaran harus lebih dari 0');
      return;
    }

    if (amount > sisaHutang) {
      toast.error(`Jumlah pembayaran melebihi sisa ${activeTab === 'utang' ? 'utang' : 'piutang'}`);
      return;
    }

    setCurrentData(prev => prev.map(r => {
      if (r.id === selectedRecord.id) {
        const newDibayar = r.dibayar + amount;
        const newStatus = newDibayar >= r.jumlah ? 'Lunas' : 'Belum Lunas';
        return {
          ...r,
          dibayar: newDibayar,
          status: newStatus,
          riwayatPembayaran: [
            ...r.riwayatPembayaran,
            { tanggal: new Date().toISOString().split('T')[0], jumlah: amount }
          ]
        };
      }
      return r;
    }));

    toast.success(`Pembayaran ${formatRupiah(amount)} berhasil dicatat`);
    setShowPaymentDialog(false);
  };

  const handleSave = () => {
    if (!formData.nama || !formData.jumlah || !formData.jatuhTempo) {
      toast.error('Lengkapi semua field yang diperlukan');
      return;
    }

    if (editingRecord) {
      setCurrentData(prev => prev.map(r => 
        r.id === editingRecord.id 
          ? { 
              ...r,
              nama: formData.nama,
              jumlah: parseInt(formData.jumlah),
              jatuhTempo: formData.jatuhTempo,
              keterangan: formData.keterangan,
            }
          : r
      ));
      toast.success('Data berhasil diperbarui');
    } else {
      const prefix = activeTab === 'utang' ? 'U' : 'P';
      const newRecord: DebtRecord = {
        id: `${prefix}${String(currentData.length + 1).padStart(3, '0')}`,
        nama: formData.nama,
        jumlah: parseInt(formData.jumlah),
        dibayar: 0,
        jatuhTempo: formData.jatuhTempo,
        status: 'Belum Lunas',
        keterangan: formData.keterangan,
        riwayatPembayaran: [],
      };
      setCurrentData(prev => [...prev, newRecord]);
      toast.success('Data berhasil ditambahkan');
    }
    setShowDialog(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utang / Piutang</h1>
          <p className="text-muted-foreground">Kelola utang dan piutang usaha</p>
        </div>
        <Button className="gap-2 bg-gradient-primary" onClick={handleAddNew}>
          <Plus className="w-4 h-4" />
          Tambah {activeTab === 'utang' ? 'Utang' : 'Piutang'}
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
              <p className="text-sm text-muted-foreground">Sisa Utang</p>
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
              <p className="text-sm text-muted-foreground">Sisa Piutang</p>
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
                {formatRupiah(Math.abs(totalPiutang - totalUtang))}
              </p>
              <p className="text-sm text-muted-foreground">
                {totalPiutang - totalUtang >= 0 ? 'Lebih Piutang' : 'Lebih Utang'}
              </p>
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
                Utang ({utangData.filter(u => u.status === 'Belum Lunas').length})
              </TabsTrigger>
              <TabsTrigger value="piutang" className="gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Piutang ({piutangData.filter(p => p.status === 'Belum Lunas').length})
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
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Dibayar</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {utangData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.nama}</TableCell>
                      <TableCell className="text-right">{formatRupiah(item.jumlah)}</TableCell>
                      <TableCell className="text-right text-success">{formatRupiah(item.dibayar)}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        {formatRupiah(item.jumlah - item.dibayar)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.jatuhTempo}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Lunas' ? 'default' : 'destructive'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status !== 'Lunas' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => handlePayment(item)} title="Bayar">
                              <CreditCard className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewHistory(item)} title="Riwayat">
                            <History className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(item)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Diterima</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                    <TableHead>Jatuh Tempo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {piutangData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.nama}</TableCell>
                      <TableCell className="text-right">{formatRupiah(item.jumlah)}</TableCell>
                      <TableCell className="text-right text-success">{formatRupiah(item.dibayar)}</TableCell>
                      <TableCell className="text-right font-medium text-primary">
                        {formatRupiah(item.jumlah - item.dibayar)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.jatuhTempo}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === 'Lunas' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {item.status !== 'Lunas' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => handlePayment(item)} title="Terima Pembayaran">
                              <CreditCard className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewHistory(item)} title="Riwayat">
                            <History className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(item)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? 'Edit Data' : `Tambah ${activeTab === 'utang' ? 'Utang' : 'Piutang'}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama {activeTab === 'utang' ? 'Kreditur' : 'Debitur'}</Label>
              <Input
                placeholder={activeTab === 'utang' ? 'Nama supplier/vendor' : 'Nama pelanggan'}
                value={formData.nama}
                onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jumlah (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.jumlah}
                  onChange={(e) => setFormData(prev => ({ ...prev, jumlah: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Jatuh Tempo</Label>
                <Input
                  type="date"
                  value={formData.jatuhTempo}
                  onChange={(e) => setFormData(prev => ({ ...prev, jatuhTempo: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Input
                placeholder="Keterangan (opsional)"
                value={formData.keterangan}
                onChange={(e) => setFormData(prev => ({ ...prev, keterangan: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              {editingRecord ? 'Simpan Perubahan' : 'Tambah Data'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'utang' ? 'Bayar Utang' : 'Terima Pembayaran'}
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Sisa {activeTab === 'utang' ? 'Utang' : 'Piutang'}</p>
                <p className="text-2xl font-bold text-primary">
                  {formatRupiah(selectedRecord.jumlah - selectedRecord.dibayar)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Jumlah Pembayaran</Label>
                <Input
                  type="number"
                  placeholder="Masukkan jumlah"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPaymentAmount(((selectedRecord.jumlah - selectedRecord.dibayar) / 2).toString())}
                >
                  50%
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPaymentAmount((selectedRecord.jumlah - selectedRecord.dibayar).toString())}
                >
                  Lunas
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Batal
            </Button>
            <Button onClick={confirmPayment} className="bg-gradient-primary">
              <CreditCard className="w-4 h-4 mr-2" />
              Konfirmasi Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Riwayat Pembayaran</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium">{selectedRecord.nama}</p>
                <p className="text-sm text-muted-foreground">{selectedRecord.keterangan}</p>
              </div>
              {selectedRecord.riwayatPembayaran.length > 0 ? (
                <div className="space-y-2">
                  {selectedRecord.riwayatPembayaran.map((payment, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border">
                      <span className="text-sm text-muted-foreground">{payment.tanggal}</span>
                      <span className="font-medium text-success">{formatRupiah(payment.jumlah)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted font-medium">
                    <span>Total Dibayar</span>
                    <span className="text-success">{formatRupiah(selectedRecord.dibayar)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">Belum ada pembayaran</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
