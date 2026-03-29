import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah } from '@/components/RupiahIcon';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  FileText,
  Download,
  Eye,
  Filter,
  Calendar,
  FileSpreadsheet,
  File,
  Edit,
  Trash2,
  X,
  Users,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
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
import type { Transaction } from '@/contexts/DataContext';

const getMethodColor = (metode: string) => {
  switch (metode) {
    case 'Cash':
      return 'bg-secondary/10 text-secondary';
    case 'Transfer':
      return 'bg-info/10 text-info';
    case 'Kartu':
      return 'bg-primary/10 text-primary';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function Transaksi() {
  const { transactions, updateTransaction, deleteTransaction, projects, removeRelatedDebt } = useData();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('pelanggan');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [editFormData, setEditFormData] = useState({
    pelanggan: '',
    metode: '',
    status: '',
  });

  // Separate transactions by type - check if pelanggan matches a project name
  const projectNames = useMemo(() => projects.map(p => p.namaProyek.toLowerCase()), [projects]);
  
  const pelangganTransactions = useMemo(() => 
    transactions.filter(t => !projectNames.includes(t.pelanggan.toLowerCase())),
    [transactions, projectNames]
  );
  
  const proyekTransactions = useMemo(() => 
    transactions.filter(t => projectNames.includes(t.pelanggan.toLowerCase())),
    [transactions, projectNames]
  );

  const currentTransactions = activeTab === 'pelanggan' ? pelangganTransactions : proyekTransactions;

  const filteredTransactions = currentTransactions.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.pelanggan.toLowerCase().includes(search.toLowerCase())
  );

  const totalToday = currentTransactions
    .filter((t) => t.status === 'Selesai')
    .reduce((sum, t) => sum + t.total, 0);

  const handleViewDetail = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setShowDetailDialog(true);
  };

  const handleEdit = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setEditFormData({
      pelanggan: tx.pelanggan,
      metode: tx.metode,
      status: tx.status,
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!selectedTransaction) return;
    
    updateTransaction(selectedTransaction.id, {
      pelanggan: editFormData.pelanggan,
      metode: editFormData.metode,
      status: editFormData.status,
    });
    toast.success(`Transaksi ${selectedTransaction.id} berhasil diperbarui`);
    setShowEditDialog(false);
  };

  const handleDelete = (tx: Transaction) => {
    setTransactionToDelete(tx);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) {
      toast.error('Tidak ada transaksi yang dipilih untuk dihapus');
      return;
    }

    try {
      // Show loading state
      const loadingToast = toast.loading('Menghapus transaksi...');
      
      // Remove related piutang first
      const debtRemoved = await removeRelatedDebt(transactionToDelete.id);
      if (!debtRemoved) {
        toast.dismiss(loadingToast);
        toast.error('Gagal menghapus piutang terkait');
        return;
      }

      // Delete the transaction
      const transactionDeleted = await deleteTransaction(transactionToDelete.id);
      
      toast.dismiss(loadingToast);
      
      if (transactionDeleted) {
        // Close dialog and reset state
        setShowDeleteDialog(false);
        setTransactionToDelete(null);
        toast.success(`Transaksi ${transactionToDelete.id} berhasil dihapus & stok dikembalikan`);
      } else {
        // Error is already handled in deleteTransaction function
        toast.error('Gagal menghapus transaksi. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Unexpected error during transaction deletion:', error);
      toast.error('Terjadi kesalahan yang tidak terduga. Silakan coba lagi.');
    }
  };

  const exportToExcel = () => {
    const headers = ['ID Transaksi', 'Pelanggan', 'Tanggal', 'Items', 'Total', 'Metode', 'Status'];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      tx.pelanggan,
      tx.tanggal,
      tx.items,
      tx.total,
      tx.metode,
      tx.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transaksi_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Data transaksi berhasil di-export ke Excel (CSV)');
  };

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup diblokir. Izinkan popup untuk export PDF.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Transaksi</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; margin-bottom: 20px; color: #dc2626; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #dc2626; color: white; }
          .total { font-weight: bold; background-color: #dcfce7; }
          .header-info { margin-bottom: 20px; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>Laporan Transaksi</h1>
        <div class="header-info">
          <p><strong>Tanggal Export:</strong> ${new Date().toLocaleDateString('id-ID')}</p>
          <p><strong>Total Transaksi:</strong> ${filteredTransactions.length}</p>
          <p><strong>Total Penjualan:</strong> Rp ${totalToday.toLocaleString('id-ID')}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Pelanggan</th>
              <th>Tanggal</th>
              <th>Items</th>
              <th>Total</th>
              <th>Metode</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTransactions.map(tx => `
              <tr>
                <td>${tx.id}</td>
                <td>${tx.pelanggan}</td>
                <td>${tx.tanggal}</td>
                <td>${tx.items}</td>
                <td>Rp ${tx.total.toLocaleString('id-ID')}</td>
                <td>${tx.metode}</td>
                <td>${tx.status}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total">
              <td colspan="4">Total</td>
              <td>Rp ${filteredTransactions.reduce((sum, tx) => sum + tx.total, 0).toLocaleString('id-ID')}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
        <button onclick="window.print();" style="margin-top: 20px; padding: 10px 20px; cursor: pointer; background: #dc2626; color: white; border: none; border-radius: 8px;">
          Print / Save as PDF
        </button>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    toast.success('Silakan print atau save as PDF');
  };

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transaksi</h1>
          <p className="text-muted-foreground">Riwayat transaksi penjualan baja ringan</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 border-primary/30 hover:bg-primary/5">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
              <FileSpreadsheet className="w-4 h-4 text-secondary" />
              Export Excel (CSV)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
              <File className="w-4 h-4 text-primary" />
              Export PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-primary bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentTransactions.length}</p>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <span className="text-secondary font-bold">Rp</span>
            </div>
            <div>
              <p className="text-xl font-bold text-secondary">{formatRupiah(totalToday)}</p>
              <p className="text-sm text-muted-foreground">Total Penjualan</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatRupiah(currentTransactions.length > 0 ? Math.round(totalToday / currentTransactions.length) : 0)}</p>
              <p className="text-sm text-muted-foreground">Rata-rata</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <FileText className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{currentTransactions.filter(t => t.status === 'Pending').length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pelanggan" className="gap-2">
            <Users className="w-4 h-4" />
            Pelanggan ({pelangganTransactions.length})
          </TabsTrigger>
          <TabsTrigger value="proyek" className="gap-2">
            <FolderKanban className="w-4 h-4" />
            Proyek ({proyekTransactions.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>
      {/* Transaction list */}
      <Card className="bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={activeTab === 'pelanggan' ? "Cari ID transaksi atau pelanggan..." : "Cari ID transaksi atau proyek..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 border-primary/20 focus:border-primary"
              />
            </div>
            <Button variant="outline" className="gap-2 border-secondary/30 hover:bg-secondary/5">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>ID Transaksi</TableHead>
                <TableHead>{activeTab === 'pelanggan' ? 'Pelanggan' : 'Proyek'}</TableHead>
                <TableHead>Tanggal & Waktu</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-primary">{tx.id}</TableCell>
                  <TableCell>{tx.pelanggan}</TableCell>
                  <TableCell className="text-muted-foreground">{tx.tanggal}</TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate">{tx.items}</TableCell>
                  <TableCell>
                    <Badge className={getMethodColor(tx.metode)} variant="secondary">
                      {tx.metode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatRupiah(tx.total)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={tx.status === 'Selesai' ? 'default' : 'secondary'}
                      className={tx.status === 'Selesai' ? 'bg-secondary text-secondary-foreground' : ''}
                    >
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-info/10 hover:text-info"
                        onClick={() => handleViewDetail(tx)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-secondary/10 hover:text-secondary"
                        onClick={() => handleEdit(tx)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                        onClick={() => handleDelete(tx)}
                      >
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

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-primary">Detail Transaksi {selectedTransaction?.id}</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Pelanggan</p>
                  <p className="font-medium">{selectedTransaction.pelanggan}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{selectedTransaction.tanggal}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Items</p>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="font-medium">{selectedTransaction.items}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Metode</p>
                  <Badge className={getMethodColor(selectedTransaction.metode)}>
                    {selectedTransaction.metode}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedTransaction.status === 'Selesai' ? 'default' : 'secondary'}>
                    {selectedTransaction.status}
                  </Badge>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">Total</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatRupiah(selectedTransaction.total)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaksi {selectedTransaction?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Pelanggan</Label>
              <Input
                value={editFormData.pelanggan}
                onChange={(e) => setEditFormData(prev => ({ ...prev, pelanggan: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select value={editFormData.metode} onValueChange={(v) => setEditFormData(prev => ({ ...prev, metode: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Kartu">Kartu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editFormData.status} onValueChange={(v) => setEditFormData(prev => ({ ...prev, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Selesai">Selesai</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Batal">Batal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button onClick={handleSaveEdit} className="bg-gradient-primary">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus transaksi {transactionToDelete?.id}? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button 
              onClick={confirmDelete} 
              className="bg-destructive text-destructive-foreground"
            >
              Hapus
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
