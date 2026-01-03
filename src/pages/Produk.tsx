import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah } from '@/components/RupiahIcon';
import { toast } from 'sonner';
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
}

const initialProducts: Product[] = [
  { id: '1', name: 'Baja Ringan C75', sku: 'BR-C75', price: 85000, stock: 150, category: 'Rangka Atap', unit: 'batang' },
  { id: '2', name: 'Baja Ringan C100', sku: 'BR-C100', price: 110000, stock: 100, category: 'Rangka Atap', unit: 'batang' },
  { id: '3', name: 'Hollow 4x4', sku: 'HL-4x4', price: 65000, stock: 200, category: 'Hollow', unit: 'batang' },
  { id: '4', name: 'Hollow 2x4', sku: 'HL-2x4', price: 45000, stock: 180, category: 'Hollow', unit: 'batang' },
  { id: '5', name: 'Reng Baja Ringan', sku: 'BR-RNG', price: 28000, stock: 300, category: 'Rangka Atap', unit: 'batang' },
  { id: '6', name: 'Spandek 0.30mm', sku: 'SP-030', price: 75000, stock: 8, category: 'Atap', unit: 'lembar' },
  { id: '7', name: 'Spandek 0.35mm', sku: 'SP-035', price: 95000, stock: 120, category: 'Atap', unit: 'lembar' },
  { id: '8', name: 'Genteng Metal', sku: 'GM-001', price: 45000, stock: 250, category: 'Atap', unit: 'lembar' },
  { id: '9', name: 'Sekrup Baja 12mm', sku: 'SK-12', price: 85000, stock: 5, category: 'Aksesoris', unit: 'dus' },
  { id: '10', name: 'Dynabolt 10mm', sku: 'DB-10', price: 125000, stock: 3, category: 'Aksesoris', unit: 'dus' },
];

const categories = ['Rangka Atap', 'Hollow', 'Atap', 'Aksesoris'];
const units = ['batang', 'lembar', 'dus', 'pcs', 'meter'];

export default function Produk() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    stock: '',
    category: '',
    unit: '',
  });

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({ name: '', sku: '', price: '', stock: '', category: '', unit: '' });
    setShowDialog(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category,
      unit: product.unit,
    });
    setShowDialog(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      toast.success(`Produk ${productToDelete.name} berhasil dihapus`);
      setShowDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.sku || !formData.price || !formData.stock || !formData.category || !formData.unit) {
      toast.error('Semua field harus diisi');
      return;
    }

    if (editingProduct) {
      setProducts(prev => prev.map(p => 
        p.id === editingProduct.id 
          ? { 
              ...p, 
              name: formData.name,
              sku: formData.sku,
              price: parseInt(formData.price),
              stock: parseInt(formData.stock),
              category: formData.category,
              unit: formData.unit,
            }
          : p
      ));
      toast.success('Produk berhasil diperbarui');
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: formData.name,
        sku: formData.sku,
        price: parseInt(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        unit: formData.unit,
      };
      setProducts(prev => [...prev, newProduct]);
      toast.success('Produk berhasil ditambahkan');
    }
    setShowDialog(false);
  };

  const totalProducts = products.length;
  const availableStock = products.filter(p => p.stock > 10).length;
  const lowStock = products.filter(p => p.stock <= 10 && p.stock > 0).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

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
                <TableHead>SKU</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRupiah(product.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        product.stock === 0
                          ? 'text-destructive font-medium'
                          : product.stock <= 10
                          ? 'text-warning font-medium'
                          : 'text-foreground'
                      }
                    >
                      {product.stock} {product.unit}
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Produk</Label>
                <Input
                  placeholder="Contoh: Baja Ringan C75"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  placeholder="Contoh: BR-C75"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
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
                  value={formData.unit} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, unit: v }))}
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
                <Label>Harga (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Stok</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus produk "{productToDelete?.name}"? 
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
    </div>
  );
}
