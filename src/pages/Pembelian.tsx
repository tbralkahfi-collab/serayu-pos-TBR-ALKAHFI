import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatRupiah } from '@/components/RupiahIcon';
import { toast } from 'sonner';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Purchase {
  id: string;
  supplier: string;
  date: string;
  total: number;
  dp: number;
  paymentMethod: 'cash' | 'transfer';
  status: string;
  items: string;
  notes: string;
}

const initialPurchases: Purchase[] = [
  { id: 'PO001', supplier: 'PT Baja Steel Indonesia', date: '2024-01-15', total: 45000000, dp: 15000000, paymentMethod: 'transfer', status: 'Selesai', items: 'Baja Ringan C75 x 500btg', notes: '' },
  { id: 'PO002', supplier: 'CV Spandek Jaya', date: '2024-01-14', total: 28500000, dp: 0, paymentMethod: 'cash', status: 'Selesai', items: 'Spandek 0.35mm x 300lbr', notes: '' },
  { id: 'PO003', supplier: 'UD Hollow Mandiri', date: '2024-01-13', total: 13000000, dp: 5000000, paymentMethod: 'transfer', status: 'Pending', items: 'Hollow 4x4 x 200btg', notes: 'Menunggu konfirmasi' },
  { id: 'PO004', supplier: 'PT Atap Metal', date: '2024-01-12', total: 22500000, dp: 10000000, paymentMethod: 'transfer', status: 'Dikirim', items: 'Genteng Metal x 500lbr', notes: 'Est. tiba 3 hari' },
  { id: 'PO005', supplier: 'CV Fastener Indo', date: '2024-01-11', total: 8500000, dp: 0, paymentMethod: 'cash', status: 'Selesai', items: 'Sekrup & Dynabolt', notes: '' },
];

const suppliers = [
  'PT Baja Steel Indonesia',
  'CV Spandek Jaya',
  'UD Hollow Mandiri',
  'PT Atap Metal',
  'CV Fastener Indo',
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Selesai':
      return 'bg-secondary/10 text-secondary';
    case 'Pending':
      return 'bg-warning/10 text-warning';
    case 'Dikirim':
      return 'bg-info/10 text-info';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function Pembelian() {
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [formData, setFormData] = useState({
    supplier: '',
    date: '',
    total: '',
    dp: '',
    paymentMethod: 'cash' as 'cash' | 'transfer',
    status: 'Pending',
    items: '',
    notes: '',
  });

  const handleAddNew = () => {
    setEditingPurchase(null);
    setFormData({ supplier: '', date: '', total: '', dp: '', paymentMethod: 'cash', status: 'Pending', items: '', notes: '' });
    setShowDialog(true);
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setFormData({
      supplier: purchase.supplier,
      date: purchase.date,
      total: purchase.total.toString(),
      dp: purchase.dp.toString(),
      paymentMethod: purchase.paymentMethod,
      status: purchase.status,
      items: purchase.items,
      notes: purchase.notes,
    });
    setShowDialog(true);
  };

  const handleView = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowDetailDialog(true);
  };

  const handleDelete = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (purchaseToDelete) {
      setPurchases(prev => prev.filter(p => p.id !== purchaseToDelete.id));
      toast.success(`Pembelian ${purchaseToDelete.id} berhasil dihapus`);
      setShowDeleteDialog(false);
      setPurchaseToDelete(null);
    }
  };

  const handleSave = () => {
    if (!formData.supplier || !formData.date || !formData.total || !formData.items) {
      toast.error('Lengkapi semua field yang diperlukan');
      return;
    }

    if (editingPurchase) {
      setPurchases(prev => prev.map(p => 
        p.id === editingPurchase.id 
          ? { 
              ...p,
              supplier: formData.supplier,
              date: formData.date,
              total: parseInt(formData.total),
              dp: parseInt(formData.dp) || 0,
              paymentMethod: formData.paymentMethod,
              status: formData.status,
              items: formData.items,
              notes: formData.notes,
            }
          : p
      ));
      toast.success('Pembelian berhasil diperbarui');
    } else {
      const newPurchase: Purchase = {
        id: `PO${String(purchases.length + 1).padStart(3, '0')}`,
        supplier: formData.supplier,
        date: formData.date,
        total: parseInt(formData.total),
        dp: parseInt(formData.dp) || 0,
        paymentMethod: formData.paymentMethod,
        status: formData.status,
        items: formData.items,
        notes: formData.notes,
      };
      setPurchases(prev => [...prev, newPurchase]);
      toast.success('Pembelian berhasil ditambahkan');
    }
    setShowDialog(false);
  };

  const totalPurchases = purchases.length;
  const totalAmount = purchases.reduce((sum, p) => sum + p.total, 0);
  const totalDP = purchases.reduce((sum, p) => sum + p.dp, 0);
  const pendingCount = purchases.filter(p => p.status === 'Pending').length;
  const shippingCount = purchases.filter(p => p.status === 'Dikirim').length;

  return (
    <div className="p-8 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pembelian</h1>
          <p className="text-muted-foreground">Kelola pembelian dan supplier baja ringan</p>
        </div>
        <Button className="gap-2 bg-gradient-primary" onClick={handleAddNew}>
          <Plus className="w-4 h-4" />
          Buat Pembelian
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-primary bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalPurchases}</p>
              <p className="text-sm text-muted-foreground">Total Pembelian</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-secondary bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-xl font-bold">{formatRupiah(totalAmount)}</p>
              <p className="text-sm text-muted-foreground">Total Nilai</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-warning bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-info bg-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
              <Truck className="w-6 h-6 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">{shippingCount}</p>
              <p className="text-sm text-muted-foreground">Dalam Pengiriman</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase list */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle>Daftar Pembelian</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>No. PO</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">DP</TableHead>
                <TableHead>Pembayaran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchases.map((purchase) => (
                <TableRow key={purchase.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium text-primary">{purchase.id}</TableCell>
                  <TableCell>{purchase.supplier}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                    {purchase.items}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{purchase.date}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRupiah(purchase.total)}
                  </TableCell>
                  <TableCell className="text-right font-medium text-warning">
                    {purchase.dp > 0 ? formatRupiah(purchase.dp) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={purchase.paymentMethod === 'transfer' ? 'bg-info/10 text-info' : 'bg-secondary/10 text-secondary'}>
                      {purchase.paymentMethod === 'transfer' ? 'Transfer' : 'Cash'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(purchase.status)} variant="secondary">
                      {purchase.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-info/10 hover:text-info" onClick={() => handleView(purchase)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary/10 hover:text-secondary" onClick={() => handleEdit(purchase)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(purchase)}>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPurchase ? 'Edit Pembelian' : 'Buat Pembelian Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select 
                value={formData.supplier} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, supplier: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(sup => (
                    <SelectItem key={sup} value={sup}>{sup}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Dikirim">Dikirim</SelectItem>
                    <SelectItem value="Selesai">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Item Pembelian</Label>
              <Input
                placeholder="Contoh: Baja Ringan C75 x 100btg"
                value={formData.items}
                onChange={(e) => setFormData(prev => ({ ...prev, items: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.total}
                  onChange={(e) => setFormData(prev => ({ ...prev, total: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>DP / Uang Muka (Rp)</Label>
                <Input
                  type="number"
                  placeholder="0 (opsional)"
                  value={formData.dp}
                  onChange={(e) => setFormData(prev => ({ ...prev, dp: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Metode Pembayaran</Label>
              <RadioGroup 
                value={formData.paymentMethod} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, paymentMethod: v as 'cash' | 'transfer' }))}
                className="grid grid-cols-2 gap-4"
              >
                <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-secondary/5 hover:border-secondary">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="cursor-pointer flex-1">
                    <div className="font-medium">Cash / Tunai</div>
                    <div className="text-sm text-muted-foreground">Bayar langsung</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-info/5 hover:border-info">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer" className="cursor-pointer flex-1">
                    <div className="font-medium">Transfer Bank</div>
                    <div className="text-sm text-muted-foreground">Via rekening</div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                placeholder="Catatan tambahan (opsional)"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              {editingPurchase ? 'Simpan Perubahan' : 'Buat Pembelian'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-primary">Detail Pembelian {selectedPurchase?.id}</DialogTitle>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Supplier</p>
                  <p className="font-medium">{selectedPurchase.supplier}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium">{selectedPurchase.date}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Item</p>
                <p className="font-medium">{selectedPurchase.items}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-medium text-lg">{formatRupiah(selectedPurchase.total)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">DP</p>
                  <p className="font-medium text-lg text-warning">{selectedPurchase.dp > 0 ? formatRupiah(selectedPurchase.dp) : '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Sisa Bayar</p>
                  <p className="font-medium text-lg text-primary">{formatRupiah(selectedPurchase.total - selectedPurchase.dp)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Metode</p>
                  <Badge variant="secondary" className={selectedPurchase.paymentMethod === 'transfer' ? 'bg-info/10 text-info' : 'bg-secondary/10 text-secondary'}>
                    {selectedPurchase.paymentMethod === 'transfer' ? 'Transfer' : 'Cash'}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(selectedPurchase.status)}>{selectedPurchase.status}</Badge>
              </div>
              {selectedPurchase.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Catatan</p>
                  <p className="font-medium">{selectedPurchase.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pembelian?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus pembelian "{purchaseToDelete?.id}"? 
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