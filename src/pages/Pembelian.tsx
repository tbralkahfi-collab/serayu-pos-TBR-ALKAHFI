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
  ShoppingBag,
  TrendingUp,
  Package,
  Truck,
  Edit,
  Trash2,
  X,
  Eye,
  Users,
} from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Purchase, Supplier } from '@/contexts/DataContext';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Selesai': return 'bg-secondary/10 text-secondary';
    case 'Pending': return 'bg-warning/10 text-warning';
    case 'Dikirim': return 'bg-info/10 text-info';
    default: return 'bg-muted text-muted-foreground';
  }
};

export default function Pembelian() {
  const { purchases, addPurchase, updatePurchase, deletePurchase, suppliers, addSupplier, updateSupplier, deleteSupplier } = useData();
  const [activeTab, setActiveTab] = useState('pembelian');
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showSupplierDialog, setShowSupplierDialog] = useState(false);
  const [showDeleteSupplierDialog, setShowDeleteSupplierDialog] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  
  const [formData, setFormData] = useState({
    supplierId: '', supplier: '', date: '', total: '', dp: '',
    paymentMethod: 'cash' as 'cash' | 'transfer', status: 'Pending', items: '', notes: '',
  });
  
  const [supplierFormData, setSupplierFormData] = useState({
    nama: '', alamat: '', telepon: '', email: '', catatan: '',
  });

  const handleAddNew = () => {
    setEditingPurchase(null);
    setFormData({ supplierId: '', supplier: '', date: '', total: '', dp: '', paymentMethod: 'cash', status: 'Pending', items: '', notes: '' });
    setShowDialog(true);
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      supplierId: purchase.supplierId, supplier: purchase.supplier, date: purchase.date,
      total: purchase.total.toString(), dp: purchase.dp.toString(),
      paymentMethod: purchase.paymentMethod, status: purchase.status, items: purchase.items, notes: purchase.notes,
    });
    setShowDialog(true);
  };

  const handleView = (purchase: Purchase) => { setSelectedPurchase(purchase); setShowDetailDialog(true); };
  const handleDelete = (purchase: Purchase) => { setPurchaseToDelete(purchase); setShowDeleteDialog(true); };

  const confirmDelete = () => {
    if (purchaseToDelete) {
      deletePurchase(purchaseToDelete.id);
      toast.success(`Pembelian ${purchaseToDelete.id} berhasil dihapus`);
      setShowDeleteDialog(false);
    }
  };

  const handleSave = () => {
    if (!formData.supplier || !formData.date || !formData.total || !formData.items) {
      toast.error('Lengkapi semua field yang diperlukan');
      return;
    }
    if (editingPurchase) {
      updatePurchase(editingPurchase.id, {
        supplierId: formData.supplierId, supplier: formData.supplier, date: formData.date,
        total: parseInt(formData.total), dp: parseInt(formData.dp) || 0,
        paymentMethod: formData.paymentMethod, status: formData.status, items: formData.items, notes: formData.notes,
      });
      toast.success('Pembelian berhasil diperbarui');
    } else {
      addPurchase({
        supplierId: formData.supplierId, supplier: formData.supplier, date: formData.date,
        total: parseInt(formData.total), dp: parseInt(formData.dp) || 0,
        paymentMethod: formData.paymentMethod, status: formData.status, items: formData.items, notes: formData.notes,
      });
      toast.success('Pembelian berhasil ditambahkan');
    }
    setShowDialog(false);
  };

  // Supplier handlers
  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierFormData({ nama: '', alamat: '', telepon: '', email: '', catatan: '' });
    setShowSupplierDialog(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({ nama: supplier.nama, alamat: supplier.alamat, telepon: supplier.telepon, email: supplier.email, catatan: supplier.catatan });
    setShowSupplierDialog(true);
  };

  const handleDeleteSupplier = (supplier: Supplier) => { setSupplierToDelete(supplier); setShowDeleteSupplierDialog(true); };

  const confirmDeleteSupplier = () => {
    if (supplierToDelete) {
      deleteSupplier(supplierToDelete.id);
      toast.success(`Supplier "${supplierToDelete.nama}" berhasil dihapus`);
      setShowDeleteSupplierDialog(false);
    }
  };

  const handleSaveSupplier = () => {
    if (!supplierFormData.nama || !supplierFormData.telepon) {
      toast.error('Nama dan telepon wajib diisi');
      return;
    }
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierFormData);
      toast.success('Supplier berhasil diperbarui');
    } else {
      addSupplier(supplierFormData);
      toast.success('Supplier berhasil ditambahkan');
    }
    setShowSupplierDialog(false);
  };

  const handleSelectSupplier = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setFormData(prev => ({ ...prev, supplierId: supplier.id, supplier: supplier.nama }));
    }
  };

  const totalPurchases = purchases.length;
  const totalAmount = purchases.reduce((sum, p) => sum + p.total, 0);
  const pendingCount = purchases.filter(p => p.status === 'Pending').length;
  const shippingCount = purchases.filter(p => p.status === 'Dikirim').length;

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pembelian & Supplier</h1>
          <p className="text-muted-foreground">Kelola pembelian dan data supplier baja ringan</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pembelian" className="gap-2"><ShoppingBag className="w-4 h-4" />Pembelian</TabsTrigger>
          <TabsTrigger value="supplier" className="gap-2"><Users className="w-4 h-4" />Supplier</TabsTrigger>
        </TabsList>

        <TabsContent value="pembelian" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2 bg-gradient-primary" onClick={handleAddNew}><Plus className="w-4 h-4" />Buat Pembelian</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-primary"><CardContent className="p-4 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><ShoppingBag className="w-6 h-6 text-primary" /></div><div><p className="text-2xl font-bold">{totalPurchases}</p><p className="text-sm text-muted-foreground">Total Pembelian</p></div></CardContent></Card>
            <Card className="border-l-4 border-l-secondary"><CardContent className="p-4 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-secondary" /></div><div><p className="text-xl font-bold">{formatRupiah(totalAmount)}</p><p className="text-sm text-muted-foreground">Total Nilai</p></div></CardContent></Card>
            <Card className="border-l-4 border-l-warning"><CardContent className="p-4 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center"><Package className="w-6 h-6 text-warning" /></div><div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-sm text-muted-foreground">Pending</p></div></CardContent></Card>
            <Card className="border-l-4 border-l-info"><CardContent className="p-4 flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center"><Truck className="w-6 h-6 text-info" /></div><div><p className="text-2xl font-bold">{shippingCount}</p><p className="text-sm text-muted-foreground">Dalam Pengiriman</p></div></CardContent></Card>
          </div>
          <Card><CardHeader><CardTitle>Daftar Pembelian</CardTitle></CardHeader><CardContent>
            <Table>
              <TableHeader><TableRow className="bg-muted/50"><TableHead>No. PO</TableHead><TableHead>Supplier</TableHead><TableHead>Item</TableHead><TableHead>Tanggal</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">DP</TableHead><TableHead>Pembayaran</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-primary">{purchase.id}</TableCell>
                    <TableCell>{purchase.supplier}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{purchase.items}</TableCell>
                    <TableCell className="text-muted-foreground">{purchase.date}</TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(purchase.total)}</TableCell>
                    <TableCell className="text-right font-medium text-warning">{purchase.dp > 0 ? formatRupiah(purchase.dp) : '-'}</TableCell>
                    <TableCell><Badge variant="secondary" className={purchase.paymentMethod === 'transfer' ? 'bg-info/10 text-info' : 'bg-secondary/10 text-secondary'}>{purchase.paymentMethod === 'transfer' ? 'Transfer' : 'Cash'}</Badge></TableCell>
                    <TableCell><Badge className={getStatusColor(purchase.status)} variant="secondary">{purchase.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-info/10 hover:text-info" onClick={() => handleView(purchase)}><Eye className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary/10 hover:text-secondary" onClick={() => handleEdit(purchase)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(purchase)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="supplier" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2 bg-gradient-primary" onClick={handleAddSupplier}><Plus className="w-4 h-4" />Tambah Supplier</Button>
          </div>
          <Card><CardHeader><CardTitle>Daftar Supplier</CardTitle></CardHeader><CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nama</TableHead><TableHead>Alamat</TableHead><TableHead>Telepon</TableHead><TableHead>Email</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.id}</TableCell>
                    <TableCell className="font-medium">{supplier.nama}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{supplier.alamat}</TableCell>
                    <TableCell>{supplier.telepon}</TableCell>
                    <TableCell className="text-muted-foreground">{supplier.email}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSupplier(supplier)}><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteSupplier(supplier)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Purchase Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingPurchase ? 'Edit Pembelian' : 'Buat Pembelian Baru'}</DialogTitle></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={formData.supplierId} onValueChange={handleSelectSupplier}>
                <SelectTrigger><SelectValue placeholder="Pilih supplier" /></SelectTrigger>
                <SelectContent>{suppliers.map(sup => (<SelectItem key={sup.id} value={sup.id}>{sup.nama}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Tanggal</Label><Input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Status</Label><Select value={formData.status} onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pending">Pending</SelectItem><SelectItem value="Dikirim">Dikirim</SelectItem><SelectItem value="Selesai">Selesai</SelectItem></SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Item Pembelian</Label><Input placeholder="Contoh: Baja Ringan C75 x 100btg" value={formData.items} onChange={(e) => setFormData(prev => ({ ...prev, items: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Total (Rp)</Label><Input type="number" placeholder="0" value={formData.total} onChange={(e) => setFormData(prev => ({ ...prev, total: e.target.value }))} /></div>
              <div className="space-y-2"><Label>DP / Uang Muka (Rp)</Label><Input type="number" placeholder="0 (opsional)" value={formData.dp} onChange={(e) => setFormData(prev => ({ ...prev, dp: e.target.value }))} /></div>
            </div>
            <div className="space-y-3"><Label>Metode Pembayaran</Label>
              <RadioGroup value={formData.paymentMethod} onValueChange={(v) => setFormData(prev => ({ ...prev, paymentMethod: v as 'cash' | 'transfer' }))} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/5"><RadioGroupItem value="cash" id="cash" /><Label htmlFor="cash" className="cursor-pointer flex-1"><div className="font-medium">Cash / Tunai</div></Label></div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-info/5"><RadioGroupItem value="transfer" id="transfer" /><Label htmlFor="transfer" className="cursor-pointer flex-1"><div className="font-medium">Transfer Bank</div></Label></div>
              </RadioGroup>
            </div>
            <div className="space-y-2"><Label>Catatan</Label><Textarea placeholder="Catatan tambahan (opsional)" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowDialog(false)}><X className="w-4 h-4 mr-2" />Batal</Button><Button onClick={handleSave} className="bg-gradient-primary">{editingPurchase ? 'Simpan Perubahan' : 'Buat Pembelian'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Dialog */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingSupplier ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Nama Supplier *</Label><Input placeholder="Nama perusahaan" value={supplierFormData.nama} onChange={(e) => setSupplierFormData(prev => ({ ...prev, nama: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Alamat</Label><Textarea placeholder="Alamat lengkap" value={supplierFormData.alamat} onChange={(e) => setSupplierFormData(prev => ({ ...prev, alamat: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Telepon *</Label><Input placeholder="08xx-xxxx-xxxx" value={supplierFormData.telepon} onChange={(e) => setSupplierFormData(prev => ({ ...prev, telepon: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Email</Label><Input placeholder="email@company.com" value={supplierFormData.email} onChange={(e) => setSupplierFormData(prev => ({ ...prev, email: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Catatan</Label><Textarea placeholder="Catatan tentang supplier" value={supplierFormData.catatan} onChange={(e) => setSupplierFormData(prev => ({ ...prev, catatan: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowSupplierDialog(false)}><X className="w-4 h-4 mr-2" />Batal</Button><Button onClick={handleSaveSupplier} className="bg-gradient-primary">{editingSupplier ? 'Simpan Perubahan' : 'Tambah Supplier'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent><DialogHeader><DialogTitle>Detail Pembelian {selectedPurchase?.id}</DialogTitle></DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-muted-foreground">Supplier</p><p className="font-medium">{selectedPurchase.supplier}</p></div><div><p className="text-sm text-muted-foreground">Tanggal</p><p className="font-medium">{selectedPurchase.date}</p></div></div>
              <div><p className="text-sm text-muted-foreground">Items</p><p className="font-medium">{selectedPurchase.items}</p></div>
              <div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-muted-foreground">Total</p><p className="font-bold text-primary">{formatRupiah(selectedPurchase.total)}</p></div><div><p className="text-sm text-muted-foreground">DP</p><p className="font-medium text-warning">{formatRupiah(selectedPurchase.dp)}</p></div></div>
              <div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-muted-foreground">Pembayaran</p><Badge variant="secondary">{selectedPurchase.paymentMethod === 'transfer' ? 'Transfer' : 'Cash'}</Badge></div><div><p className="text-sm text-muted-foreground">Status</p><Badge className={getStatusColor(selectedPurchase.status)}>{selectedPurchase.status}</Badge></div></div>
              {selectedPurchase.notes && <div><p className="text-sm text-muted-foreground">Catatan</p><p className="text-sm">{selectedPurchase.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialogs */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Pembelian?</AlertDialogTitle><AlertDialogDescription>Anda yakin ingin menghapus pembelian {purchaseToDelete?.id}?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} className="bg-destructive">Hapus</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={showDeleteSupplierDialog} onOpenChange={setShowDeleteSupplierDialog}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Hapus Supplier?</AlertDialogTitle><AlertDialogDescription>Anda yakin ingin menghapus supplier "{supplierToDelete?.nama}"?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Batal</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteSupplier} className="bg-destructive">Hapus</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}
