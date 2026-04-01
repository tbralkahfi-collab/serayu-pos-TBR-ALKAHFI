import React, { useState, useMemo } from 'react';
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
  Search,
  Check,
  PlusCircle,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Purchase, Supplier, Product } from '@/contexts/DataContext';

interface PurchaseItem {
  id: string;
  productId: string;
  nama: string;
  qty: number;
  satuan: string;
  harga: number;
  isManual: boolean;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Selesai': return 'bg-secondary/10 text-secondary';
    case 'Pending': return 'bg-warning/10 text-warning';
    case 'Dikirim': return 'bg-info/10 text-info';
    default: return 'bg-muted text-muted-foreground';
  }
};

export default function Pembelian() {
  const { purchases, createPurchase, updatePurchase, deletePurchase, suppliers, createSupplier, updateSupplier, deleteSupplier, products, updateProduct, createPurchaseDebt, removeRelatedDebt } = useData();
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
  
  // Item selection state
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [openProductPopover, setOpenProductPopover] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualItem, setManualItem] = useState({ nama: '', qty: 1, satuan: '', harga: 0 });
  
  const [formData, setFormData] = useState({
    supplierId: '', supplier: '', date: '', total: '', dp: '',
    paymentMethod: 'cash' as 'cash' | 'transfer', status: 'Pending', notes: '',
    statusBayar: 'lunas' as 'lunas' | 'belum_lunas',
  });
  
  const [supplierFormData, setSupplierFormData] = useState({
    nama: '', alamat: '', telepon: '', email: '', catatan: '',
  });

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.nama.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.kategori.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [products, productSearch]);

  // Calculate total from items
  const calculatedTotal = useMemo(() => {
    return purchaseItems.reduce((sum, item) => sum + (item.qty * item.harga), 0);
  }, [purchaseItems]);

  const handleAddProduct = (product: Product) => {
    const existingItem = purchaseItems.find(item => item.productId === product.id);
    if (existingItem) {
      setPurchaseItems(prev => prev.map(item => 
        item.productId === product.id 
          ? { ...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      setPurchaseItems(prev => [...prev, {
        id: `item-${Date.now()}`,
        productId: product.id,
        nama: product.nama,
        qty: 1,
        satuan: product.satuan,
        harga: product.hargaBeli || product.harga || 0,
        isManual: false,
      }]);
    }
    setOpenProductPopover(false);
    setProductSearch('');
  };

  const handleAddManualItem = () => {
    if (!manualItem.nama || !manualItem.satuan || manualItem.harga <= 0) {
      toast.error('Lengkapi data item manual');
      return;
    }
    setPurchaseItems(prev => [...prev, {
      id: `manual-${Date.now()}`,
      productId: '',
      nama: manualItem.nama,
      qty: manualItem.qty,
      satuan: manualItem.satuan,
      harga: manualItem.harga,
      isManual: true,
    }]);
    setManualItem({ nama: '', qty: 1, satuan: '', harga: 0 });
    setShowManualInput(false);
  };

  const handleUpdateItemQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      setPurchaseItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setPurchaseItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, qty } : item
      ));
    }
  };

  const handleUpdateItemPrice = (itemId: string, harga: number) => {
    setPurchaseItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, harga: Math.max(0, harga) } : item
    ));
  };

  const handleRemoveItem = (itemId: string) => {
    setPurchaseItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddNew = () => {
    setEditingPurchase(null);
    setFormData({ supplierId: '', supplier: '', date: '', total: '', dp: '', paymentMethod: 'cash', status: 'Pending', notes: '', statusBayar: 'lunas' });
    setPurchaseItems([]);
    setShowDialog(true);
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      supplierId: purchase.supplierId, supplier: purchase.supplier, date: purchase.date,
      total: purchase.total.toString(), dp: purchase.dp.toString(),
      paymentMethod: purchase.paymentMethod, status: purchase.status, notes: purchase.notes,
      statusBayar: (purchase.dp > 0 && purchase.dp < purchase.total) ? 'belum_lunas' : 'lunas',
    });
    // Parse items string to PurchaseItem array
    const itemsArr: PurchaseItem[] = purchase.items.split(', ').map((itemStr, idx) => {
      const match = itemStr.match(/(.+) x(\d+) (.+) @(.+)/);
      if (match) {
        const nama = match[1];
        const qty = parseInt(match[2]);
        const satuan = match[3];
        const harga = parseInt(match[4].replace(/[^\d]/g, ''));
        const product = products.find(p => p.nama.toLowerCase() === nama.toLowerCase());
        return {
          id: `item-${idx}`,
          productId: product?.id || '',
          nama,
          qty,
          satuan,
          harga,
          isManual: !product,
        };
      }
      return {
        id: `item-${idx}`,
        productId: '',
        nama: itemStr,
        qty: 1,
        satuan: 'pcs',
        harga: 0,
        isManual: true,
      };
    });
    setPurchaseItems(itemsArr);
    setShowDialog(true);
  };

  const handleView = (purchase: Purchase) => { setSelectedPurchase(purchase); setShowDetailDialog(true); };
  const handleDelete = (purchase: Purchase) => { setPurchaseToDelete(purchase); setShowDeleteDialog(true); };

  const confirmDelete = async () => {
    if (purchaseToDelete) {
      // Remove related utang
      await removeRelatedDebt(purchaseToDelete.id);
      await deletePurchase(purchaseToDelete.id);
      toast.success(`Pembelian berhasil dihapus`);
      setShowDeleteDialog(false);
      setPurchaseToDelete(null);
    }
  };

  const handleSave = async () => {
    if (!formData.supplier || !formData.date || purchaseItems.length === 0) {
      toast.error('Lengkapi supplier, tanggal, dan minimal 1 item');
      return;
    }
    
    // Build items string for display
    const itemsStr = purchaseItems.map(item => 
      `${item.nama} x${item.qty} ${item.satuan} @${formatRupiah(item.harga)}`
    ).join(', ');
    
    // Build items data for database trigger
    const itemsData = purchaseItems.map(item => ({
      productId: item.productId,
      nama: item.nama,
      qty: item.qty,
      satuan: item.satuan,
      harga: item.harga,
      isManual: item.isManual,
    }));
    
    const totalAmount = calculatedTotal;
    
    if (editingPurchase) {
      await updatePurchase(editingPurchase.id, {
        supplierId: formData.supplierId, supplier: formData.supplier, date: formData.date,
        total: totalAmount, dp: parseInt(formData.dp) || 0,
        paymentMethod: formData.paymentMethod, status: formData.status, items: itemsStr, 
        itemsData, notes: formData.notes,
      });
      // Update related utang
      if (formData.statusBayar === 'belum_lunas') {
        const sisaUtang = totalAmount - (parseInt(formData.dp) || 0);
        // Remove old and create new
        await removeRelatedDebt(editingPurchase.id);
        if (sisaUtang > 0) {
          await createPurchaseDebt(editingPurchase.id, formData.supplier, sisaUtang);
        }
      } else {
        await removeRelatedDebt(editingPurchase.id);
      }
      toast.success('Pembelian berhasil diperbarui');
    } else {
      // For new purchases, we need the ID after insert - use a temp reference
      await createPurchase({
        supplierId: formData.supplierId, supplier: formData.supplier, date: formData.date,
        total: totalAmount, dp: parseInt(formData.dp) || 0,
        paymentMethod: formData.paymentMethod, status: formData.status, items: itemsStr, 
        itemsData, notes: formData.notes,
      });

      // Auto-create utang if belum lunas
      if (formData.statusBayar === 'belum_lunas') {
        const sisaUtang = totalAmount - (parseInt(formData.dp) || 0);
        if (sisaUtang > 0) {
          const purchaseRef = `PO-${Date.now().toString().slice(-8)}`;
          await createPurchaseDebt(purchaseRef, formData.supplier, sisaUtang);
          toast.success(`Pembelian ditambahkan & utang ${formatRupiah(sisaUtang)} tercatat`);
        } else {
          toast.success('Pembelian berhasil ditambahkan');
        }
      } else if (formData.status === 'Selesai') {
        toast.success('Pembelian berhasil ditambahkan & stok diperbarui');
      } else {
        toast.success('Pembelian berhasil ditambahkan');
      }
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

  const confirmDeleteSupplier = async () => {
    if (supplierToDelete) {
      await deleteSupplier(supplierToDelete.id);
      toast.success(`Supplier "${supplierToDelete.nama}" berhasil dihapus`);
      setShowDeleteSupplierDialog(false);
    }
  };

  const handleSaveSupplier = async () => {
    if (!supplierFormData.nama || !supplierFormData.telepon) {
      toast.error('Nama dan telepon wajib diisi');
      return;
    }
    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, supplierFormData);
      toast.success('Supplier berhasil diperbarui');
    } else {
      await createSupplier(supplierFormData);
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
    <div className="p-4 md:p-8 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Pembelian & Supplier</h1>
          <p className="text-sm text-muted-foreground">Kelola pembelian dan data supplier baja ringan</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
          <TabsTrigger value="pembelian" className="gap-2"><ShoppingBag className="w-4 h-4" /><span className="hidden sm:inline">Pembelian</span></TabsTrigger>
          <TabsTrigger value="supplier" className="gap-2"><Users className="w-4 h-4" /><span className="hidden sm:inline">Supplier</span></TabsTrigger>
        </TabsList>

        <TabsContent value="pembelian" className="space-y-4">
          <div className="flex justify-end">
            <Button className="gap-2 bg-gradient-primary" onClick={handleAddNew}><Plus className="w-4 h-4" />Buat Pembelian</Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Card className="border-l-4 border-l-primary"><CardContent className="p-3 md:p-4 flex items-center gap-3"><div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0"><ShoppingBag className="w-5 h-5 md:w-6 md:h-6 text-primary" /></div><div className="min-w-0"><p className="text-lg md:text-2xl font-bold">{totalPurchases}</p><p className="text-xs md:text-sm text-muted-foreground truncate">Total Pembelian</p></div></CardContent></Card>
            <Card className="border-l-4 border-l-secondary"><CardContent className="p-3 md:p-4 flex items-center gap-3"><div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0"><TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-secondary" /></div><div className="min-w-0"><p className="text-sm md:text-xl font-bold truncate">{formatRupiah(totalAmount)}</p><p className="text-xs md:text-sm text-muted-foreground truncate">Total Nilai</p></div></CardContent></Card>
            <Card className="border-l-4 border-l-warning"><CardContent className="p-3 md:p-4 flex items-center gap-3"><div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-warning/10 flex items-center justify-center flex-shrink-0"><Package className="w-5 h-5 md:w-6 md:h-6 text-warning" /></div><div className="min-w-0"><p className="text-lg md:text-2xl font-bold">{pendingCount}</p><p className="text-xs md:text-sm text-muted-foreground">Pending</p></div></CardContent></Card>
            <Card className="border-l-4 border-l-info"><CardContent className="p-3 md:p-4 flex items-center gap-3"><div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0"><Truck className="w-5 h-5 md:w-6 md:h-6 text-info" /></div><div className="min-w-0"><p className="text-lg md:text-2xl font-bold">{shippingCount}</p><p className="text-xs md:text-sm text-muted-foreground truncate">Pengiriman</p></div></CardContent></Card>
          </div>
          <Card><CardHeader><CardTitle className="text-base md:text-lg">Daftar Pembelian</CardTitle></CardHeader><CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow className="bg-muted/50"><TableHead className="min-w-[80px]">No. PO</TableHead><TableHead className="min-w-[100px]">Supplier</TableHead><TableHead className="min-w-[150px] hidden md:table-cell">Item</TableHead><TableHead className="min-w-[90px]">Tanggal</TableHead><TableHead className="text-right min-w-[100px]">Total</TableHead><TableHead className="text-right min-w-[80px] hidden sm:table-cell">DP</TableHead><TableHead className="hidden lg:table-cell">Pembayaran</TableHead><TableHead>Status</TableHead><TableHead className="text-right min-w-[100px]">Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-primary text-xs md:text-sm">{purchase.id}</TableCell>
                    <TableCell className="text-xs md:text-sm">{purchase.supplier}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate hidden md:table-cell">{purchase.items}</TableCell>
                    <TableCell className="text-muted-foreground text-xs md:text-sm">{purchase.date}</TableCell>
                    <TableCell className="text-right font-medium text-xs md:text-sm">{formatRupiah(purchase.total)}</TableCell>
                    <TableCell className="text-right font-medium text-warning text-xs md:text-sm hidden sm:table-cell">{purchase.dp > 0 ? formatRupiah(purchase.dp) : '-'}</TableCell>
                    <TableCell className="hidden lg:table-cell"><Badge variant="secondary" className={purchase.paymentMethod === 'transfer' ? 'bg-info/10 text-info' : 'bg-secondary/10 text-secondary'}>{purchase.paymentMethod === 'transfer' ? 'Transfer' : 'Cash'}</Badge></TableCell>
                    <TableCell><Badge className={`${getStatusColor(purchase.status)} text-xs`} variant="secondary">{purchase.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 hover:bg-info/10 hover:text-info" onClick={() => handleView(purchase)}><Eye className="w-3 h-3 md:w-4 md:h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 hover:bg-secondary/10 hover:text-secondary" onClick={() => handleEdit(purchase)}><Edit className="w-3 h-3 md:w-4 md:h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(purchase)}><Trash2 className="w-3 h-3 md:w-4 md:h-4" /></Button>
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
          <Card><CardHeader><CardTitle className="text-base md:text-lg">Daftar Supplier</CardTitle></CardHeader><CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead className="min-w-[60px]">ID</TableHead><TableHead className="min-w-[120px]">Nama</TableHead><TableHead className="min-w-[150px] hidden md:table-cell">Alamat</TableHead><TableHead className="min-w-[100px]">Telepon</TableHead><TableHead className="hidden sm:table-cell">Email</TableHead><TableHead className="text-right min-w-[80px]">Aksi</TableHead></TableRow></TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium text-xs md:text-sm">{supplier.id}</TableCell>
                    <TableCell className="font-medium text-xs md:text-sm">{supplier.nama}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate hidden md:table-cell">{supplier.alamat}</TableCell>
                    <TableCell className="text-xs md:text-sm">{supplier.telepon}</TableCell>
                    <TableCell className="text-muted-foreground text-xs md:text-sm hidden sm:table-cell">{supplier.email}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8" onClick={() => handleEditSupplier(supplier)}><Edit className="w-3 h-3 md:w-4 md:h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-destructive" onClick={() => handleDeleteSupplier(supplier)}><Trash2 className="w-3 h-3 md:w-4 md:h-4" /></Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>{editingPurchase ? 'Edit Pembelian' : 'Buat Pembelian Baru'}</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
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
              
              {/* Item Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Item Pembelian</Label>
                  <div className="flex gap-2">
                    <Popover open={openProductPopover} onOpenChange={setOpenProductPopover}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Search className="w-3 h-3" />
                          Pilih dari Stok
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="end">
                        <Command>
                          <CommandInput 
                            placeholder="Cari produk..." 
                            value={productSearch}
                            onValueChange={setProductSearch}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-2">Produk tidak ditemukan</p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setOpenProductPopover(false);
                                    setShowManualInput(true);
                                    setManualItem(prev => ({ ...prev, nama: productSearch }));
                                  }}
                                >
                                  <PlusCircle className="w-3 h-3 mr-1" />
                                  Tambah Manual
                                </Button>
                              </div>
                            </CommandEmpty>
                            <CommandGroup heading="Produk Tersedia">
                              {filteredProducts.map(product => (
                                <CommandItem 
                                  key={product.id} 
                                  value={product.nama}
                                  onSelect={() => handleAddProduct(product)}
                                  className="cursor-pointer"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <div>
                                      <p className="font-medium text-sm">{product.nama}</p>
                                      <p className="text-xs text-muted-foreground">{product.kategori} • Stok: {product.stok} {product.satuan}</p>
                                    </div>
                                    <p className="text-xs font-medium">{formatRupiah(product.hargaBeli || product.harga || 0)}</p>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => setShowManualInput(true)}>
                      <PlusCircle className="w-3 h-3" />
                      Manual
                    </Button>
                  </div>
                </div>

                {/* Manual Input Form */}
                {showManualInput && (
                  <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Tambah Item Manual</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowManualInput(false)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        placeholder="Nama item" 
                        value={manualItem.nama}
                        onChange={(e) => setManualItem(prev => ({ ...prev, nama: e.target.value }))}
                      />
                      <Input 
                        placeholder="Satuan (pcs, kg, btg)" 
                        value={manualItem.satuan}
                        onChange={(e) => setManualItem(prev => ({ ...prev, satuan: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        type="number" 
                        placeholder="Qty" 
                        value={manualItem.qty}
                        onChange={(e) => setManualItem(prev => ({ ...prev, qty: parseInt(e.target.value) || 1 }))}
                      />
                      <Input 
                        type="number" 
                        placeholder="Harga satuan" 
                        value={manualItem.harga || ''}
                        onChange={(e) => setManualItem(prev => ({ ...prev, harga: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <Button size="sm" className="w-full gap-1" onClick={handleAddManualItem}>
                      <Check className="w-3 h-3" />
                      Tambahkan
                    </Button>
                  </div>
                )}

                {/* Selected Items List */}
                {purchaseItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-3 py-2 text-xs font-medium grid grid-cols-12 gap-2">
                      <span className="col-span-4">Item</span>
                      <span className="col-span-2 text-center">Qty</span>
                      <span className="col-span-2">Satuan</span>
                      <span className="col-span-3 text-right">Harga</span>
                      <span className="col-span-1"></span>
                    </div>
                    <div className="divide-y">
                      {purchaseItems.map(item => (
                        <div key={item.id} className="px-3 py-2 grid grid-cols-12 gap-2 items-center text-sm">
                          <div className="col-span-4">
                            <p className="font-medium truncate">{item.nama}</p>
                            {item.isManual && <Badge variant="outline" className="text-xs mt-1">Manual</Badge>}
                          </div>
                          <div className="col-span-2">
                            <Input 
                              type="number" 
                              value={item.qty}
                              onChange={(e) => handleUpdateItemQty(item.id, parseInt(e.target.value) || 0)}
                              className="h-7 text-center text-xs"
                              min={1}
                            />
                          </div>
                          <span className="col-span-2 text-muted-foreground text-xs">{item.satuan}</span>
                          <div className="col-span-3">
                            <Input 
                              type="number" 
                              value={item.harga}
                              onChange={(e) => handleUpdateItemPrice(item.id, parseInt(e.target.value) || 0)}
                              className="h-7 text-right text-xs"
                              min={0}
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleRemoveItem(item.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-muted/30 px-3 py-2 flex justify-between items-center border-t">
                      <span className="text-sm font-medium">Total</span>
                      <span className="text-base font-bold text-primary">{formatRupiah(calculatedTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Pembayaran */}
              <div className="space-y-2">
                <Label>Status Pembayaran</Label>
                <RadioGroup value={formData.statusBayar} onValueChange={(v) => setFormData(prev => ({ ...prev, statusBayar: v as 'lunas' | 'belum_lunas' }))} className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 p-2 md:p-3 border rounded-lg cursor-pointer hover:bg-muted/50"><RadioGroupItem value="lunas" id="bayar-lunas" /><Label htmlFor="bayar-lunas" className="cursor-pointer text-sm font-medium">Lunas</Label></div>
                  <div className="flex items-center space-x-2 p-2 md:p-3 border rounded-lg cursor-pointer hover:bg-muted/50"><RadioGroupItem value="belum_lunas" id="bayar-belum" /><Label htmlFor="bayar-belum" className="cursor-pointer text-sm font-medium">Belum Lunas</Label></div>
                </RadioGroup>
              </div>

              <div className="space-y-2"><Label>DP / Uang Muka (Rp)</Label><Input type="number" placeholder="0 (opsional)" value={formData.dp} onChange={(e) => setFormData(prev => ({ ...prev, dp: e.target.value }))} /></div>
              
              {/* Show sisa utang if belum lunas */}
              {formData.statusBayar === 'belum_lunas' && calculatedTotal > 0 && (
                <div className="p-3 border border-warning/30 rounded-lg bg-warning/5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sisa (Utang)</span>
                    <span className="font-bold text-destructive">
                      {formatRupiah(Math.max(0, calculatedTotal - (parseInt(formData.dp) || 0)))}
                    </span>
                  </div>
                </div>
              )}
              <div className="space-y-3"><Label>Metode Pembayaran</Label>
                <RadioGroup value={formData.paymentMethod} onValueChange={(v) => setFormData(prev => ({ ...prev, paymentMethod: v as 'cash' | 'transfer' }))} className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 md:p-4 border rounded-lg cursor-pointer hover:bg-secondary/5"><RadioGroupItem value="cash" id="cash" /><Label htmlFor="cash" className="cursor-pointer flex-1"><div className="font-medium text-sm">Cash / Tunai</div></Label></div>
                  <div className="flex items-center space-x-3 p-3 md:p-4 border rounded-lg cursor-pointer hover:bg-info/5"><RadioGroupItem value="transfer" id="transfer" /><Label htmlFor="transfer" className="cursor-pointer flex-1"><div className="font-medium text-sm">Transfer Bank</div></Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2"><Label>Catatan</Label><Textarea placeholder="Catatan tambahan (opsional)" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} /></div>
            </div>
          </ScrollArea>
          <DialogFooter className="border-t pt-4"><Button variant="outline" onClick={() => setShowDialog(false)}><X className="w-4 h-4 mr-2" />Batal</Button><Button onClick={handleSave} className="bg-gradient-primary">{editingPurchase ? 'Simpan Perubahan' : 'Buat Pembelian'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplier Dialog */}
      <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
        <DialogContent className="max-w-lg">
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
              <div><p className="text-sm text-muted-foreground">Items</p><p className="font-medium text-sm">{selectedPurchase.items}</p></div>
              <div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-muted-foreground">Total</p><p className="font-bold text-primary">{formatRupiah(selectedPurchase.total)}</p></div><div><p className="text-sm text-muted-foreground">DP</p><p className="font-medium text-warning">{formatRupiah(selectedPurchase.dp)}</p></div></div>
              <div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-muted-foreground">Pembayaran</p><Badge variant="secondary">{selectedPurchase.paymentMethod === 'transfer' ? 'Transfer' : 'Cash'}</Badge></div><div><p className="text-sm text-muted-foreground">Status</p><Badge className={getStatusColor(selectedPurchase.status)}>{selectedPurchase.status}</Badge></div></div>
              {selectedPurchase.notes && <div><p className="text-sm text-muted-foreground">Catatan</p><p className="text-sm">{selectedPurchase.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialogs */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pembelian?</AlertDialogTitle>
            <AlertDialogDescription>Anda yakin ingin menghapus pembelian {purchaseToDelete?.id}?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button 
              onClick={confirmDelete} 
              className="bg-destructive"
            >
              Hapus
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showDeleteSupplierDialog} onOpenChange={setShowDeleteSupplierDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Supplier?</AlertDialogTitle>
            <AlertDialogDescription>Anda yakin ingin menghapus supplier "{supplierToDelete?.nama}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <Button 
              onClick={confirmDeleteSupplier} 
              className="bg-destructive"
            >
              Hapus
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
