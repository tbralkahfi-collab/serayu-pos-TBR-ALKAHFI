import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatRupiah } from '@/components/RupiahIcon';
import { toast } from 'sonner';
import { useData } from '@/contexts/DataContext';
import {
  Plus,
  Building2,
  Zap,
  Droplets,
  Phone,
  Car,
  Wrench,
  TrendingDown,
  Edit,
  Trash2,
  X,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Expense } from '@/contexts/DataContext';

const categoryIcons: Record<string, any> = {
  'Listrik': Zap,
  'Air': Droplets,
  'Telepon': Phone,
  'Transportasi': Car,
  'Pemeliharaan': Wrench,
  'Sewa': Building2,
  'Lainnya': TrendingDown,
};

const categories = ['Listrik', 'Air', 'Telepon', 'Transportasi', 'Pemeliharaan', 'Sewa', 'Lainnya'];

const getCategoryColor = (kategori: string) => {
  switch (kategori) {
    case 'Listrik':
      return 'bg-warning/10 text-warning';
    case 'Air':
      return 'bg-info/10 text-info';
    case 'Telepon':
      return 'bg-primary/10 text-primary';
    case 'Transportasi':
      return 'bg-accent/10 text-accent';
    case 'Pemeliharaan':
      return 'bg-muted text-muted-foreground';
    case 'Sewa':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function Operasional() {
  const { expenses, createExpense, updateExpense, deleteExpense } = useData();
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    kategori: '',
    deskripsi: '',
    jumlah: '',
    tanggal: '',
  });

  const totalOperasional = expenses.reduce((sum, e) => sum + e.jumlah, 0);
  const listrikTotal = expenses.filter(e => e.kategori === 'Listrik').reduce((sum, e) => sum + e.jumlah, 0);
  const sewaTotal = expenses.filter(e => e.kategori === 'Sewa').reduce((sum, e) => sum + e.jumlah, 0);

  const handleAddNew = () => {
    setEditingExpense(null);
    setFormData({ kategori: '', deskripsi: '', jumlah: '', tanggal: '' });
    setShowDialog(true);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormData({
      kategori: expense.kategori,
      deskripsi: expense.deskripsi,
      jumlah: expense.jumlah.toString(),
      tanggal: expense.tanggal,
    });
    setShowDialog(true);
  };

  const handleDelete = (expense: Expense) => {
    setExpenseToDelete(expense);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (expenseToDelete) {
      await deleteExpense(expenseToDelete.id);
      toast.success(`Biaya "${expenseToDelete.deskripsi}" berhasil dihapus`);
      setShowDeleteDialog(false);
      setExpenseToDelete(null);
    }
  };

  const handleSave = async () => {
    if (!formData.kategori || !formData.deskripsi || !formData.jumlah || !formData.tanggal) {
      toast.error('Lengkapi semua field');
      return;
    }

    if (editingExpense) {
      await updateExpense(editingExpense.id, {
        kategori: formData.kategori,
        deskripsi: formData.deskripsi,
        jumlah: parseInt(formData.jumlah),
        tanggal: formData.tanggal,
      });
      toast.success('Biaya berhasil diperbarui');
    } else {
      await addExpense({
        kategori: formData.kategori,
        deskripsi: formData.deskripsi,
        jumlah: parseInt(formData.jumlah),
        tanggal: formData.tanggal,
      });
      toast.success('Biaya berhasil ditambahkan');
    }
    setShowDialog(false);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operasional</h1>
          <p className="text-muted-foreground">Kelola biaya operasional toko baja ringan</p>
        </div>
        <Button className="gap-2 bg-gradient-primary" onClick={handleAddNew}>
          <Plus className="w-4 h-4" />
          Tambah Biaya
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="md:col-span-2">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">{formatRupiah(totalOperasional)}</p>
              <p className="text-sm text-muted-foreground">Total Biaya Bulan Ini</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatRupiah(listrikTotal)}</p>
              <p className="text-sm text-muted-foreground">Listrik</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatRupiah(sewaTotal)}</p>
              <p className="text-sm text-muted-foreground">Sewa</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expense list */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Biaya Operasional</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => {
                const IconComponent = categoryIcons[expense.kategori] || TrendingDown;
                return (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.id}</TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(expense.kategori)} variant="secondary">
                        <IconComponent className="w-3 h-3 mr-1" />
                        {expense.kategori}
                      </Badge>
                    </TableCell>
                    <TableCell>{expense.deskripsi}</TableCell>
                    <TableCell className="text-muted-foreground">{expense.tanggal}</TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {formatRupiah(expense.jumlah)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(expense)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(expense)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExpense ? 'Edit Biaya' : 'Tambah Biaya Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select 
                  value={formData.kategori} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, kategori: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi biaya"
                value={formData.deskripsi}
                onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Jumlah (Rp)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.jumlah}
                onChange={(e) => setFormData(prev => ({ ...prev, jumlah: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              {editingExpense ? 'Simpan Perubahan' : 'Tambah Biaya'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Biaya?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus biaya "{expenseToDelete?.deskripsi}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Hapus
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
