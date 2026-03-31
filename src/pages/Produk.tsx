import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah } from '@/components/RupiahIcon';
import { toast } from 'sonner';
import { useData, Product } from '@/contexts/DataContext';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  Filter,
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

const categories = ['Rangka', 'Atap', 'Aksesoris', 'Hollow'];
const units = ['batang', 'lembar', 'dus', 'pcs', 'meter'];

export default function Produk() {
  const { products, createProduct, updateProduct, deleteProduct } = useData();
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    hargaBeli: '',
    hargaJual: '',
    stok: '',
    kategori: '',
    satuan: '',
  });

  const filteredProducts = products.filter(
    (p) =>
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.kategori.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddNew = () => {
    console.log('🔘 Tambah Produk button clicked - DEBUG');
    console.log('🔘 Current state:', { showDialog, showDeleteDialog, isLoading });
    
    // Reset semua state dialog
    setEditingProduct(null);
    setFormData({ nama: '', hargaBeli: '', hargaJual: '', stok: '', kategori: '', satuan: '' });
    setShowDialog(true);
    
    // Force cleanup untuk dialog yang mungkin stuck
    setTimeout(() => {
      const dialogs = document.querySelectorAll('[role="dialog"]');
      const overlays = document.querySelectorAll('[data-state="open"]');
      console.log('🔘 Dialog elements found:', dialogs.length, overlays.length);
      
      // Check untuk overlay yang mungkin menutupi button
      const elements = document.elementsFromPoint(window.innerWidth / 2, 200);
      console.log('🔘 Elements at button position:', elements);
    }, 100);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      nama: product.nama,
      hargaBeli: product.hargaBeli.toString(),
      hargaJual: product.hargaJual.toString(),
      stok: product.stok.toString(),
      kategori: product.kategori,
      satuan: product.satuan,
    });
    setShowDialog(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete.id);
      toast.success(`Produk ${productToDelete.nama} berhasil dihapus`);
      setShowDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // ✅ DEBUG LOG: Form submission
    console.log("Submitting product:", formData);
    
    if (!formData.nama || !formData.hargaBeli || !formData.hargaJual || !formData.stok || !formData.kategori || !formData.satuan) {
      toast.error('Semua field harus diisi');
      return;
    }

    const hargaBeli = parseInt(formData.hargaBeli);
    const hargaJual = parseInt(formData.hargaJual);

    if (hargaJual < hargaBeli) {
      toast.error('Harga jual tidak boleh lebih kecil dari harga beli');
      return;
    }

    try {
      if (editingProduct) {
        console.log("Updating product:", editingProduct.id, formData);
        await updateProduct(editingProduct.id, {
          nama: formData.nama,
          hargaBeli,
          hargaJual,
          stok: parseInt(formData.stok),
          kategori: formData.kategori,
          satuan: formData.satuan,
        });
        toast.success('Produk berhasil diperbarui');
      } else {
        console.log("Adding new product:", formData);
        await createProduct({
          nama: formData.nama,
          hargaBeli,
          hargaJual,
          stok: parseInt(formData.stok),
          kategori: formData.kategori,
          satuan: formData.satuan,
        });
        toast.success('Produk berhasil ditambahkan');
      }
      
      // ✅ STEP 7: RESET FORM AFTER SUCCESS
      setFormData({ 
        nama: '', 
        hargaBeli: '', 
        hargaJual: '', 
        stok: '', 
        kategori: '', 
        satuan: '' 
      });
      setEditingProduct(null);
      setShowDialog(false);
      
    } catch (error) {
      // ✅ STEP 8: HANDLE FAILURES - Error already shown in DataContext
      console.error("Form submission failed:", error);
    }
  };

  const totalProducts = products.length;
  const availableStock = products.filter(p => p.stok > 10).length;
  const lowStock = products.filter(p => p.stok <= 10 && p.stok > 0).length;
  const outOfStock = products.filter(p => p.stok === 0).length;

  // Calculate margin
  const getMargin = (product: Product) => {
    if (!product.hargaBeli || product.hargaBeli === 0) return 0;
    return ((product.hargaJual - product.hargaBeli) / product.hargaBeli) * 100;
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produk</h1>
          <p className="text-muted-foreground">Kelola daftar produk baja ringan</p>
        </div>
        <Button className="gap-2 bg-gradient-primary" onClick={handleAddNew}>
          <Plus className="w-4 h-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalProducts}</p>
              <p className="text-sm text-muted-foreground">Total Produk</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{availableStock}</p>
              <p className="text-sm text-muted-foreground">Stok Tersedia</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{lowStock}</p>
              <p className="text-sm text-muted-foreground">Stok Menipis</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{outOfStock}</p>
              <p className="text-sm text-muted-foreground">Stok Habis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filter */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Cari produk atau SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga Beli</TableHead>
                <TableHead className="text-right">Harga Jual</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.nama}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.kategori}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatRupiah(product.hargaBeli)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-secondary">
                    {formatRupiah(product.hargaJual)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-secondary">
                      {getMargin(product).toFixed(0)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        product.stok === 0
                          ? 'text-destructive font-medium'
                          : product.stok <= 10
                          ? 'text-warning font-medium'
                          : 'text-foreground'
                      }
                    >
                      {product.stok} {product.satuan}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(product)}
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

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Produk</Label>
                <Input
                  placeholder="Contoh: Baja Ringan C75"
                  value={formData.nama}
                  onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select 
                    value={formData.kategori} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, kategori: v }))}
                    required
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
                  <Label>Satuan</Label>
                  <Select 
                    value={formData.satuan} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, satuan: v }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih satuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(unit => (
                        <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Harga Beli (Rp)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.hargaBeli}
                    onChange={(e) => setFormData(prev => ({ ...prev, hargaBeli: e.target.value }))}
                    required
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Harga Jual (Rp)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.hargaJual}
                    onChange={(e) => setFormData(prev => ({ ...prev, hargaJual: e.target.value }))}
                    required
                    min="0"
                  />
                </div>
              </div>
              {formData.hargaBeli && formData.hargaJual && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Margin: <span className="font-bold text-secondary">
                      {(((parseInt(formData.hargaJual) - parseInt(formData.hargaBeli)) / parseInt(formData.hargaBeli)) * 100).toFixed(1)}%
                    </span> ({formatRupiah(parseInt(formData.hargaJual) - parseInt(formData.hargaBeli))} per unit)
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Stok</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.stok}
                  onChange={(e) => setFormData(prev => ({ ...prev, stok: e.target.value }))}
                  required
                  min="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                <X className="w-4 h-4 mr-2" />
                Batal
              </Button>
              <Button type="submit" className="bg-gradient-primary">
                {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus produk "{productToDelete?.nama}"? 
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
