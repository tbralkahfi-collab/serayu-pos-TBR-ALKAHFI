import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah } from '@/components/RupiahIcon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
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
  FolderKanban,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { DebtRecord } from '@/contexts/DataContext';

export default function UtangPiutang() {
  const { debts, projects, addDebt, updateDebt, deleteDebt, addPayment, createProjectDebt } = useData();
  const [activeTab, setActiveTab] = useState<'utang' | 'piutang'>('utang');
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [showProjectDebtDialog, setShowProjectDebtDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DebtRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<DebtRecord | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<DebtRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transfer');
  const [paymentNote, setPaymentNote] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectDueDate, setProjectDueDate] = useState('');
  const [formData, setFormData] = useState({
    nama: '',
    total: '',
    jatuhTempo: '',
    keterangan: '',
  });

  // Real-time sync: combine debts with project receivables
  const projectsWithReceivables = useMemo(() => {
    return projects.filter(p => 
      p.status !== 'Dibatalkan' && 
      (p.nilaiKontrak - p.dp) > 0
    );
  }, [projects]);

  const utangData = debts.filter(d => d.type === 'utang');
  const piutangData = debts.filter(d => d.type === 'piutang');

  const totalUtang = utangData.filter(u => u.sisa > 0).reduce((sum, u) => sum + u.sisa, 0);
  const totalPiutang = piutangData.filter(p => p.sisa > 0).reduce((sum, p) => sum + p.sisa, 0);

  const currentData = activeTab === 'utang' ? utangData : piutangData;

  const handleAddNew = () => {
    setEditingRecord(null);
    setFormData({ nama: '', total: '', jatuhTempo: '', keterangan: '' });
    setShowDialog(true);
  };

  const handleEdit = (record: DebtRecord) => {
    setEditingRecord(record);
    setFormData({
      nama: record.nama,
      total: record.total.toString(),
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
      deleteDebt(recordToDelete.id);
      toast.success(`Data berhasil dihapus`);
      setShowDeleteDialog(false);
      setRecordToDelete(null);
    }
  };

  const handlePayment = (record: DebtRecord) => {
    setSelectedRecord(record);
    setPaymentAmount('');
    setPaymentMethod('Transfer');
    setPaymentNote('');
    setShowPaymentDialog(true);
  };

  const handleViewHistory = (record: DebtRecord) => {
    setSelectedRecord(record);
    setShowHistoryDialog(true);
  };

  const confirmPayment = () => {
    if (!selectedRecord || !paymentAmount) return;

    const amount = parseInt(paymentAmount);
    const sisaHutang = selectedRecord.sisa;

    if (amount <= 0) {
      toast.error('Jumlah pembayaran harus lebih dari 0');
      return;
    }

    if (amount > sisaHutang) {
      toast.error(`Jumlah pembayaran melebihi sisa ${activeTab === 'utang' ? 'utang' : 'piutang'}`);
      return;
    }

    addPayment(selectedRecord.id, {
      tanggal: new Date().toISOString().split('T')[0],
      jumlah: amount,
      metode: paymentMethod,
      catatan: paymentNote,
    });

    toast.success(`Pembayaran ${formatRupiah(amount)} berhasil dicatat`);
    setShowPaymentDialog(false);
  };

  const handleSave = () => {
    if (!formData.nama || !formData.total || !formData.jatuhTempo) {
      toast.error('Lengkapi semua field yang diperlukan');
      return;
    }

    if (editingRecord) {
      updateDebt(editingRecord.id, {
        nama: formData.nama,
        total: parseInt(formData.total),
        jatuhTempo: formData.jatuhTempo,
        keterangan: formData.keterangan,
      });
      toast.success('Data berhasil diperbarui');
    } else {
      addDebt({
        type: activeTab,
        nama: formData.nama,
        total: parseInt(formData.total),
        sisa: parseInt(formData.total),
        tanggal: new Date().toISOString().split('T')[0],
        jatuhTempo: formData.jatuhTempo,
        keterangan: formData.keterangan,
      });
      toast.success('Data berhasil ditambahkan');
    }
    setShowDialog(false);
  };

  const getStatus = (record: DebtRecord) => record.sisa <= 0 ? 'Lunas' : 'Belum Lunas';

  const handleAddProjectDebt = () => {
    if (!selectedProjectId || !projectDueDate) {
      toast.error('Pilih proyek dan tanggal jatuh tempo');
      return;
    }
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return;
    
    const sisaProyek = project.nilaiKontrak - project.dp;
    createProjectDebt(project.id, `${project.namaProyek} - ${project.pelanggan}`, sisaProyek, projectDueDate);
    toast.success(`Piutang proyek "${project.namaProyek}" berhasil ditambahkan`);
    setShowProjectDebtDialog(false);
    setSelectedProjectId('');
    setProjectDueDate('');
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utang / Piutang</h1>
          <p className="text-muted-foreground">Kelola utang dan piutang usaha</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'piutang' && (
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShowProjectDebtDialog(true)}
            >
              <FolderKanban className="w-4 h-4" />
              Dari Proyek
            </Button>
          )}
          <Button className="gap-2 bg-gradient-primary" onClick={handleAddNew}>
            <Plus className="w-4 h-4" />
            Tambah {activeTab === 'utang' ? 'Utang' : 'Piutang'}
          </Button>
        </div>
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
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <ArrowUpRight className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary">{formatRupiah(totalPiutang)}</p>
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
              <p className={`text-2xl font-bold ${totalPiutang - totalUtang >= 0 ? 'text-secondary' : 'text-destructive'}`}>
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'utang' | 'piutang')}>
          <CardHeader className="pb-0">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="utang" className="gap-2">
                <ArrowDownLeft className="w-4 h-4" />
                Utang ({utangData.filter(u => u.sisa > 0).length})
              </TabsTrigger>
              <TabsTrigger value="piutang" className="gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Piutang ({piutangData.filter(p => p.sisa > 0).length})
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            <TabsContent value="utang" className="mt-0">
              <DebtTable 
                data={utangData} 
                type="utang"
                getStatus={getStatus}
                onPayment={handlePayment}
                onViewHistory={handleViewHistory}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>
            <TabsContent value="piutang" className="mt-0">
              <DebtTable 
                data={piutangData} 
                type="piutang"
                getStatus={getStatus}
                onPayment={handlePayment}
                onViewHistory={handleViewHistory}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
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
                  value={formData.total}
                  onChange={(e) => setFormData(prev => ({ ...prev, total: e.target.value }))}
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
                placeholder="Keterangan tambahan"
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
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-secondary" />
              {activeTab === 'utang' ? 'Bayar Utang' : 'Terima Pembayaran'}
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Nama</p>
                <p className="font-medium">{selectedRecord.nama}</p>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-medium">{formatRupiah(selectedRecord.total)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Sisa</p>
                    <p className="font-medium text-primary">{formatRupiah(selectedRecord.sisa)}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Jumlah Pembayaran (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
                <div className="flex gap-2 mt-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPaymentAmount(Math.round(selectedRecord.sisa / 2).toString())}
                  >
                    50%
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setPaymentAmount(selectedRecord.sisa.toString())}
                  >
                    Lunas
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Metode Pembayaran</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transfer">Transfer Bank</SelectItem>
                    <SelectItem value="Cash">Tunai</SelectItem>
                    <SelectItem value="Kartu">Kartu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Catatan (opsional)</Label>
                <Input
                  placeholder="Catatan pembayaran"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Batal
            </Button>
            <Button onClick={confirmPayment} className="bg-secondary hover:bg-secondary/90">
              <CreditCard className="w-4 h-4 mr-2" />
              Konfirmasi Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Riwayat Pembayaran
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{selectedRecord.nama}</p>
                <p className="text-sm text-muted-foreground">{selectedRecord.keterangan}</p>
              </div>
              
              {selectedRecord.payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada riwayat pembayaran
                </p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {selectedRecord.payments.map((payment, idx) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <p className="font-medium text-secondary">{formatRupiah(payment.jumlah)}</p>
                        <p className="text-xs text-muted-foreground">{payment.tanggal} • {payment.metode}</p>
                        {payment.catatan && (
                          <p className="text-xs text-muted-foreground mt-1">{payment.catatan}</p>
                        )}
                      </div>
                      <Badge variant="secondary">#{idx + 1}</Badge>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Dibayar</span>
                  <span className="font-medium text-secondary">
                    {formatRupiah(selectedRecord.total - selectedRecord.sisa)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sisa</span>
                  <span className="font-medium text-primary">
                    {formatRupiah(selectedRecord.sisa)}
                  </span>
                </div>
              </div>
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
              Anda yakin ingin menghapus data "{recordToDelete?.nama}"? 
              Tindakan ini tidak dapat dibatalkan.
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

      {/* Project Debt Dialog */}
      <Dialog open={showProjectDebtDialog} onOpenChange={setShowProjectDebtDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              Tambah Piutang dari Proyek
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pilih Proyek</Label>
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih proyek..." />
                </SelectTrigger>
                <SelectContent>
                  {projectsWithReceivables.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.namaProyek} - {project.pelanggan} ({formatRupiah(project.nilaiKontrak - project.dp)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProjectId && (() => {
              const project = projects.find(p => p.id === selectedProjectId);
              if (!project) return null;
              return (
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <p className="font-medium">{project.namaProyek}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Pelanggan</p>
                      <p className="font-medium">{project.pelanggan}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nilai Kontrak</p>
                      <p className="font-medium">{formatRupiah(project.nilaiKontrak)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">DP Diterima</p>
                      <p className="font-medium text-secondary">{formatRupiah(project.dp)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Sisa Piutang</p>
                      <p className="font-medium text-primary">{formatRupiah(project.nilaiKontrak - project.dp)}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-2">
              <Label>Jatuh Tempo</Label>
              <Input
                type="date"
                value={projectDueDate}
                onChange={(e) => setProjectDueDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProjectDebtDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleAddProjectDebt} className="bg-gradient-primary">
              Tambah Piutang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted table component for reuse
function DebtTable({ 
  data, 
  type,
  getStatus,
  onPayment, 
  onViewHistory, 
  onEdit, 
  onDelete 
}: {
  data: DebtRecord[];
  type: 'utang' | 'piutang';
  getStatus: (record: DebtRecord) => string;
  onPayment: (record: DebtRecord) => void;
  onViewHistory: (record: DebtRecord) => void;
  onEdit: (record: DebtRecord) => void;
  onDelete: (record: DebtRecord) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Nama</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">{type === 'utang' ? 'Dibayar' : 'Diterima'}</TableHead>
          <TableHead className="text-right">Sisa</TableHead>
          <TableHead>Jatuh Tempo</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => {
          const status = getStatus(item);
          const paid = item.total - item.sisa;
          return (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.id}
                {item.projectId && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    <FolderKanban className="w-3 h-3 mr-1" />
                    Proyek
                  </Badge>
                )}
              </TableCell>
              <TableCell>{item.nama}</TableCell>
              <TableCell>{item.nama}</TableCell>
              <TableCell className="text-right">{formatRupiah(item.total)}</TableCell>
              <TableCell className="text-right text-secondary">{formatRupiah(paid)}</TableCell>
              <TableCell className={`text-right font-medium ${type === 'utang' ? 'text-destructive' : 'text-primary'}`}>
                {formatRupiah(item.sisa)}
              </TableCell>
              <TableCell className="text-muted-foreground">{item.jatuhTempo}</TableCell>
              <TableCell>
                <Badge variant={status === 'Lunas' ? 'default' : type === 'utang' ? 'destructive' : 'secondary'}>
                  {status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {status !== 'Lunas' && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary hover:text-secondary" onClick={() => onPayment(item)} title={type === 'utang' ? 'Bayar' : 'Terima'}>
                      <CreditCard className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onViewHistory(item)} title="Riwayat">
                    <History className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(item)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(item)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
