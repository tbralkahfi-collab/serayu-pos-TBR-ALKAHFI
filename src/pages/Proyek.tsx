import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatRupiah } from '@/components/RupiahIcon';
import { toast } from 'sonner';
import { useData, ProjectMaterial } from '@/contexts/DataContext';
import {
  FolderKanban,
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  Eye,
  Package,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Berjalan': 'bg-blue-100 text-blue-800 border-blue-300',
  'Selesai': 'bg-green-100 text-green-800 border-green-300',
  'Dibatalkan': 'bg-red-100 text-red-800 border-red-300',
};

const statusIcons: Record<string, React.ReactNode> = {
  'Pending': <Clock className="w-3 h-3" />,
  'Berjalan': <PlayCircle className="w-3 h-3" />,
  'Selesai': <CheckCircle2 className="w-3 h-3" />,
  'Dibatalkan': <AlertCircle className="w-3 h-3" />,
};

export default function Proyek() {
  const { projects, products, addProject, updateProject, deleteProject, updateProduct, addTransaction, transactions, updateTransaction } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<typeof projects[0] | null>(null);
  const [viewingProject, setViewingProject] = useState<typeof projects[0] | null>(null);

  const [formData, setFormData] = useState({
    namaProyek: '',
    pelanggan: '',
    alamat: '',
    telepon: '',
    deskripsi: '',
    nilaiKontrak: 0,
    diskonPersen: 0,
    diskonNominal: 0,
    dp: 0,
    biayaTenagaKerja: 0,
    tanggalOrder: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    status: 'Pending' as 'Pending' | 'Berjalan' | 'Selesai' | 'Dibatalkan',
    catatan: '',
  });

  // Material state
  const [materials, setMaterials] = useState<ProjectMaterial[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [materialQty, setMaterialQty] = useState(1);

  // Calculate net contract value after discount
  const getNilaiSetelahDiskon = (nilaiKontrak: number, diskonPersen: number, diskonNominal: number) => {
    const diskonPersenValue = nilaiKontrak * (diskonPersen / 100);
    return Math.max(0, nilaiKontrak - diskonPersenValue - diskonNominal);
  };

  const nilaiSetelahDiskon = useMemo(() => {
    return getNilaiSetelahDiskon(formData.nilaiKontrak, formData.diskonPersen, formData.diskonNominal);
  }, [formData.nilaiKontrak, formData.diskonPersen, formData.diskonNominal]);

  const resetForm = () => {
    setFormData({
      namaProyek: '',
      pelanggan: '',
      alamat: '',
      telepon: '',
      deskripsi: '',
      nilaiKontrak: 0,
      diskonPersen: 0,
      diskonNominal: 0,
      dp: 0,
      biayaTenagaKerja: 0,
      tanggalOrder: '',
      tanggalMulai: '',
      tanggalSelesai: '',
      status: 'Pending',
      catatan: '',
    });
    setMaterials([]);
    setSelectedProductId('');
    setMaterialQty(1);
    setEditingProject(null);
  };

  const handleAddMaterial = () => {
    if (!selectedProductId || materialQty <= 0) {
      toast.error('Pilih produk dan masukkan jumlah');
      return;
    }
    const product = products.find(p => p.id === selectedProductId);
    if (!product) {
      toast.error('Produk tidak ditemukan');
      return;
    }

    // Check stock availability
    if (materialQty > product.stok) {
      toast.error(`Stok ${product.nama} tidak mencukupi (tersedia: ${product.stok} ${product.satuan})`);
      return;
    }

    // Use hargaJual for selling price, fallback to harga for legacy support
    const sellingPrice = product.hargaJual || product.harga || 0;

    // Check if already added
    const existing = materials.find(m => m.productId === selectedProductId);
    if (existing) {
      setMaterials(prev => prev.map(m => 
        m.productId === selectedProductId 
          ? { ...m, qty: m.qty + materialQty, harga: sellingPrice }
          : m
      ));
    } else {
      setMaterials(prev => [...prev, {
        productId: product.id,
        productName: product.nama,
        qty: materialQty,
        satuan: product.satuan,
        harga: sellingPrice,
      }]);
    }
    setSelectedProductId('');
    setMaterialQty(1);
    toast.success(`${product.nama} ditambahkan ke material`);
  };

  const handleRemoveMaterial = (productId: string) => {
    setMaterials(prev => prev.filter(m => m.productId !== productId));
  };

  // Helper function to get current product data (for real-time sync)
  const getProductInfo = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product;
  };

  // Get synced material with current product data
  const getSyncedMaterial = (mat: ProjectMaterial) => {
    const product = getProductInfo(mat.productId);
    return {
      ...mat,
      productName: product?.nama || mat.productName,
      harga: product?.hargaJual || product?.harga || mat.harga,
      satuan: product?.satuan || mat.satuan,
      currentStock: product?.stok || 0,
      productExists: !!product,
    };
  };

  const totalMaterialCost = useMemo(() => {
    return materials.reduce((sum, m) => {
      const synced = getSyncedMaterial(m);
      return sum + (m.qty * synced.harga);
    }, 0);
  }, [materials, products]);

  const handleOpenAdd = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleOpenEdit = (project: typeof projects[0]) => {
    setEditingProject(project);
    setFormData({
      namaProyek: project.namaProyek,
      pelanggan: project.pelanggan,
      alamat: project.alamat,
      telepon: project.telepon,
      deskripsi: project.deskripsi,
      nilaiKontrak: project.nilaiKontrak,
      diskonPersen: project.diskonPersen || 0,
      diskonNominal: project.diskonNominal || 0,
      dp: project.dp,
      biayaTenagaKerja: project.biayaTenagaKerja || 0,
      tanggalOrder: project.tanggalOrder,
      tanggalMulai: project.tanggalMulai,
      tanggalSelesai: project.tanggalSelesai,
      status: project.status,
      catatan: project.catatan,
    });
    setMaterials(project.materials || []);
    setShowDialog(true);
  };

  const handleViewDetail = (project: typeof projects[0]) => {
    setViewingProject(project);
    setShowDetailDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.namaProyek || !formData.pelanggan || !formData.tanggalOrder) {
      toast.error('Lengkapi data wajib: Nama Proyek, Pelanggan, Tanggal Order');
      return;
    }

    const projectData = { ...formData, materials };

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    // Avoid locale time separator that can be '.' (e.g. "08.34"), which breaks timestamptz parsing
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

    const createProjectPaymentTransaction = async (amount: number, label: string) => {
      if (amount <= 0) return;
      await addTransaction({
        tanggal: `${dateStr} ${timeStr}`,
        // IMPORTANT: pelanggan diset ke nama proyek agar masuk tab "Proyek" di menu Transaksi
        pelanggan: projectData.namaProyek,
        items: `Pembayaran Proyek: ${projectData.namaProyek} (${projectData.pelanggan}) - ${label}`,
        total: amount,
        bayar: amount,
        kembalian: 0,
        metode: 'Transfer',
        status: 'Selesai',
      });
    };

    if (editingProject) {
      // Jika nama proyek berubah, sinkronkan semua transaksi proyek lama supaya link tidak putus
      const oldProjectName = editingProject.namaProyek;
      if (oldProjectName.trim().toLowerCase() !== projectData.namaProyek.trim().toLowerCase()) {
        // Update each transaction with old project name
        const affectedTransactions = transactions.filter(
          t => t.pelanggan.trim().toLowerCase() === oldProjectName.trim().toLowerCase()
        );
        for (const t of affectedTransactions) {
          await updateTransaction(t.id, { pelanggan: projectData.namaProyek });
        }
      }

      // Restore stock from old materials
      for (const oldMat of editingProject.materials || []) {
        const product = products.find(p => p.id === oldMat.productId);
        if (product) {
          await updateProduct(product.id, { stok: product.stok + oldMat.qty });
        }
      }

      // Deduct stock for new materials
      for (const mat of materials) {
        const product = products.find(p => p.id === mat.productId);
        if (product) {
          await updateProduct(product.id, { stok: product.stok - mat.qty });
        }
      }

      // Catat pembayaran tambahan proyek sebagai transaksi (delta DP)
      const oldDP = editingProject.dp || 0;
      const newDP = projectData.dp || 0;
      const deltaDP = newDP - oldDP;
      if (deltaDP > 0) {
        await createProjectPaymentTransaction(deltaDP, oldDP === 0 ? 'DP Proyek' : 'Pembayaran Termin');
      }

      await updateProject(editingProject.id, projectData);
      toast.success('Proyek berhasil diperbarui');
    } else {
      // Deduct stock for new project
      for (const mat of materials) {
        const product = products.find(p => p.id === mat.productId);
        if (product) {
          await updateProduct(product.id, { stok: product.stok - mat.qty });
        }
      }

      await addProject(projectData);

      // Catat DP awal proyek sebagai transaksi
      if ((projectData.dp || 0) > 0) {
        await createProjectPaymentTransaction(projectData.dp, 'DP Proyek');
      }

      toast.success('Proyek baru berhasil ditambahkan');
    }

    setShowDialog(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus proyek ini?')) {
      await deleteProject(id);
      toast.success('Proyek berhasil dihapus');
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchSearch =
        project.namaProyek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.pelanggan.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === 'all' || project.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [projects, searchTerm, filterStatus]);

  const stats = useMemo(() => {
    const total = projects.length;
    const pending = projects.filter((p) => p.status === 'Pending').length;
    const berjalan = projects.filter((p) => p.status === 'Berjalan').length;
    const selesai = projects.filter((p) => p.status === 'Selesai').length;
    const totalNilai = projects.reduce((sum, p) => {
      const nilaiNet = getNilaiSetelahDiskon(p.nilaiKontrak, p.diskonPersen || 0, p.diskonNominal || 0);
      return sum + nilaiNet;
    }, 0);
    const totalDP = projects.reduce((sum, p) => sum + p.dp, 0);
    const sisaPembayaran = totalNilai - totalDP;

    return { total, pending, berjalan, selesai, totalNilai, totalDP, sisaPembayaran };
  }, [projects]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'dd MMM yyyy', { locale: id });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Manajemen Proyek</h1>
          <p className="text-sm text-muted-foreground">Kelola proyek dan kontrak pelanggan</p>
        </div>
        <Button onClick={handleOpenAdd} className="gap-2 bg-gradient-primary text-sm">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Tambah Proyek</span>
          <span className="sm:hidden">Tambah</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-4 mb-6">
        <Card className="bg-card">
          <CardContent className="p-2 md:p-4 text-center">
            <FolderKanban className="w-5 h-5 md:w-6 md:h-6 mx-auto text-primary mb-1" />
            <p className="text-lg md:text-2xl font-bold">{stats.total}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-2 md:p-4 text-center">
            <Clock className="w-5 h-5 md:w-6 md:h-6 mx-auto text-yellow-500 mb-1" />
            <p className="text-lg md:text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-2 md:p-4 text-center">
            <PlayCircle className="w-5 h-5 md:w-6 md:h-6 mx-auto text-blue-500 mb-1" />
            <p className="text-lg md:text-2xl font-bold text-blue-600">{stats.berjalan}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Berjalan</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-2 md:p-4 text-center">
            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6 mx-auto text-green-500 mb-1" />
            <p className="text-lg md:text-2xl font-bold text-green-600">{stats.selesai}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Selesai</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-2 md:p-4 text-center">
            <Wallet className="w-5 h-5 md:w-6 md:h-6 mx-auto text-secondary mb-1" />
            <p className="text-sm md:text-lg font-bold text-secondary truncate">{formatRupiah(stats.totalNilai)}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Total Nilai</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-2 md:p-4 text-center">
            <Wallet className="w-5 h-5 md:w-6 md:h-6 mx-auto text-primary mb-1" />
            <p className="text-sm md:text-lg font-bold text-primary truncate">{formatRupiah(stats.totalDP)}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Total DP</p>
          </CardContent>
        </Card>
        <Card className="bg-card col-span-2 sm:col-span-1">
          <CardContent className="p-2 md:p-4 text-center">
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6 mx-auto text-destructive mb-1" />
            <p className="text-sm md:text-lg font-bold text-destructive truncate">{formatRupiah(stats.sisaPembayaran)}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground">Sisa Bayar</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari nama proyek atau pelanggan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Berjalan">Berjalan</SelectItem>
                <SelectItem value="Selesai">Selesai</SelectItem>
                <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>ID</TableHead>
                <TableHead>Proyek</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Nilai Kontrak</TableHead>
                <TableHead>DP</TableHead>
                <TableHead>Sisa</TableHead>
                <TableHead>Tgl Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Belum ada data proyek
                  </TableCell>
                </TableRow>
              ) : (
                filteredProjects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-xs">{project.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.namaProyek}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {project.alamat}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{project.pelanggan}</p>
                        <p className="text-xs text-muted-foreground">{project.telepon}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <p>{formatRupiah(getNilaiSetelahDiskon(project.nilaiKontrak, project.diskonPersen || 0, project.diskonNominal || 0))}</p>
                        {((project.diskonPersen || 0) > 0 || (project.diskonNominal || 0) > 0) && (
                          <p className="text-xs text-muted-foreground line-through">{formatRupiah(project.nilaiKontrak)}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-secondary font-medium">{formatRupiah(project.dp)}</TableCell>
                    <TableCell className="text-destructive font-medium">
                      {formatRupiah(getNilaiSetelahDiskon(project.nilaiKontrak, project.diskonPersen || 0, project.diskonNominal || 0) - project.dp)}
                    </TableCell>
                    <TableCell>{formatDate(project.tanggalOrder)}</TableCell>
                    <TableCell>
                      <Badge className={`gap-1 ${statusColors[project.status]}`}>
                        {statusIcons[project.status]}
                        {project.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewDetail(project)}
                          title="Lihat Detail"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(project)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-primary" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDelete(project.id)}
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              {editingProject ? 'Edit Proyek' : 'Tambah Proyek Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Nama Proyek *</Label>
              <Input
                value={formData.namaProyek}
                onChange={(e) => setFormData({ ...formData, namaProyek: e.target.value })}
                placeholder="Contoh: Proyek Atap Rumah Pak Ahmad"
              />
            </div>

            <div>
              <Label>Nama Pelanggan *</Label>
              <Input
                value={formData.pelanggan}
                onChange={(e) => setFormData({ ...formData, pelanggan: e.target.value })}
                placeholder="Nama pelanggan"
              />
            </div>

            <div>
              <Label>Telepon</Label>
              <Input
                value={formData.telepon}
                onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                placeholder="08xx-xxxx-xxxx"
              />
            </div>

            <div className="col-span-2">
              <Label>Alamat Proyek</Label>
              <Textarea
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Alamat lengkap lokasi proyek"
                rows={2}
              />
            </div>

            <div className="col-span-2">
              <Label>Deskripsi Proyek</Label>
              <Textarea
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                placeholder="Detail pekerjaan, ukuran, spesifikasi..."
                rows={3}
              />
            </div>

            <div>
              <Label>Nilai Kontrak (Rp)</Label>
              <Input
                type="number"
                value={formData.nilaiKontrak || ''}
                onChange={(e) => setFormData({ ...formData, nilaiKontrak: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div>
              <Label>Diskon (%)</Label>
              <Input
                type="number"
                value={formData.diskonPersen || ''}
                onChange={(e) => setFormData({ ...formData, diskonPersen: Math.min(100, Math.max(0, Number(e.target.value))) })}
                placeholder="0"
                min={0}
                max={100}
              />
            </div>

            <div>
              <Label>Diskon Nominal (Rp)</Label>
              <Input
                type="number"
                value={formData.diskonNominal || ''}
                onChange={(e) => setFormData({ ...formData, diskonNominal: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            {(formData.diskonPersen > 0 || formData.diskonNominal > 0) && (
              <div className="col-span-2 bg-accent/50 rounded-lg p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Nilai Kontrak</span>
                  <span>{formatRupiah(formData.nilaiKontrak)}</span>
                </div>
                {formData.diskonPersen > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Diskon {formData.diskonPersen}%</span>
                    <span>- {formatRupiah(formData.nilaiKontrak * (formData.diskonPersen / 100))}</span>
                  </div>
                )}
                {formData.diskonNominal > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Diskon Nominal</span>
                    <span>- {formatRupiah(formData.diskonNominal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold border-t mt-2 pt-2">
                  <span>Nilai Setelah Diskon</span>
                  <span className="text-secondary">{formatRupiah(nilaiSetelahDiskon)}</span>
                </div>
              </div>
            )}

            <div>
              <Label>DP / Uang Muka (Rp)</Label>
              <Input
                type="number"
                value={formData.dp || ''}
                onChange={(e) => setFormData({ ...formData, dp: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div>
              <Label>Biaya Tenaga Kerja (Rp)</Label>
              <Input
                type="number"
                value={formData.biayaTenagaKerja || ''}
                onChange={(e) => setFormData({ ...formData, biayaTenagaKerja: Number(e.target.value) })}
                placeholder="0"
              />
            </div>

            <div>
              <Label>Tanggal Order *</Label>
              <Input
                type="date"
                value={formData.tanggalOrder}
                onChange={(e) => setFormData({ ...formData, tanggalOrder: e.target.value })}
              />
            </div>

            <div>
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={formData.tanggalMulai}
                onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
              />
            </div>

            <div>
              <Label>Tanggal Selesai</Label>
              <Input
                type="date"
                value={formData.tanggalSelesai}
                onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
              />
            </div>

            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val as typeof formData.status })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Berjalan">Berjalan</SelectItem>
                  <SelectItem value="Selesai">Selesai</SelectItem>
                  <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Catatan</Label>
              <Textarea
                value={formData.catatan}
                onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                placeholder="Catatan tambahan..."
                rows={2}
              />
            </div>

            {/* Material Section */}
            <div className="col-span-2 border-t pt-4 mt-2">
              <Label className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-primary" />
                Material / Produk yang Digunakan
              </Label>
              
              <div className="flex gap-2 mb-3">
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Pilih produk..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.filter(p => p.stok > 0).map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.nama} - {formatRupiah(product.hargaJual || product.harga || 0)} ({product.stok} {product.satuan})
                      </SelectItem>
                    ))}
                    {products.filter(p => p.stok > 0).length === 0 && (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Tidak ada produk dengan stok tersedia
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={materialQty}
                  onChange={(e) => setMaterialQty(Number(e.target.value))}
                  className="w-24"
                  min={1}
                  placeholder="Qty"
                />
                <Button type="button" variant="secondary" onClick={handleAddMaterial}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {materials.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Produk</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materials.map((mat) => {
                        const synced = getSyncedMaterial(mat);
                        return (
                          <TableRow key={mat.productId} className={!synced.productExists ? 'bg-destructive/10' : ''}>
                            <TableCell className="font-medium">
                              {synced.productName}
                              {!synced.productExists && (
                                <Badge variant="destructive" className="ml-2 text-[10px]">Produk Dihapus</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">{mat.qty} {synced.satuan}</TableCell>
                            <TableCell className="text-right">{formatRupiah(synced.harga)}</TableCell>
                            <TableCell className="text-right font-medium">{formatRupiah(mat.qty * synced.harga)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleRemoveMaterial(mat.productId)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={3} className="text-right font-bold">Total Biaya Material</TableCell>
                        <TableCell className="text-right font-bold text-primary">{formatRupiah(totalMaterialCost)}</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {materials.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
                  Belum ada material ditambahkan
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmit} className="bg-gradient-primary">
              {editingProject ? 'Simpan Perubahan' : 'Tambah Proyek'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              Detail Proyek
            </DialogTitle>
          </DialogHeader>

          {viewingProject && (
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold">{viewingProject.namaProyek}</h3>
                  <p className="text-sm text-muted-foreground">{viewingProject.id}</p>
                </div>
                <Badge className={`gap-1 ${statusColors[viewingProject.status]}`}>
                  {statusIcons[viewingProject.status]}
                  {viewingProject.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Pelanggan</p>
                  <p className="font-medium">{viewingProject.pelanggan}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Telepon</p>
                  <p className="font-medium">{viewingProject.telepon || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Alamat</p>
                  <p className="font-medium">{viewingProject.alamat || '-'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Deskripsi</p>
                  <p className="font-medium">{viewingProject.deskripsi || '-'}</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nilai Kontrak</span>
                  <span className="font-bold">{formatRupiah(viewingProject.nilaiKontrak)}</span>
                </div>
                {((viewingProject.diskonPersen || 0) > 0 || (viewingProject.diskonNominal || 0) > 0) && (
                  <>
                    {(viewingProject.diskonPersen || 0) > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>Diskon {viewingProject.diskonPersen}%</span>
                        <span>- {formatRupiah(viewingProject.nilaiKontrak * ((viewingProject.diskonPersen || 0) / 100))}</span>
                      </div>
                    )}
                    {(viewingProject.diskonNominal || 0) > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>Diskon Nominal</span>
                        <span>- {formatRupiah(viewingProject.diskonNominal || 0)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground font-medium">Nilai Setelah Diskon</span>
                      <span className="font-bold text-secondary">
                        {formatRupiah(getNilaiSetelahDiskon(viewingProject.nilaiKontrak, viewingProject.diskonPersen || 0, viewingProject.diskonNominal || 0))}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DP / Uang Muka</span>
                  <span className="font-bold text-secondary">{formatRupiah(viewingProject.dp)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Sisa Pembayaran</span>
                  <span className="font-bold text-destructive">
                    {formatRupiah(getNilaiSetelahDiskon(viewingProject.nilaiKontrak, viewingProject.diskonPersen || 0, viewingProject.diskonNominal || 0) - viewingProject.dp)}
                  </span>
                </div>
              </div>

              {/* Project Cost & Profit Report */}
              <div className="bg-primary/5 rounded-lg p-4 space-y-2 border border-primary/20">
                <p className="font-medium text-primary mb-2">Laporan Biaya & Keuntungan</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Biaya Material</span>
                  <span className="font-medium">
                    {formatRupiah(viewingProject.materials?.reduce((sum, m) => {
                      const synced = getSyncedMaterial(m);
                      return sum + (m.qty * synced.harga);
                    }, 0) || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Biaya Tenaga Kerja</span>
                  <span className="font-medium">{formatRupiah(viewingProject.biayaTenagaKerja || 0)}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Total Biaya</span>
                  <span className="font-bold text-destructive">
                    {formatRupiah(
                      (viewingProject.materials?.reduce((sum, m) => {
                        const synced = getSyncedMaterial(m);
                        return sum + (m.qty * synced.harga);
                      }, 0) || 0) + 
                      (viewingProject.biayaTenagaKerja || 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground font-medium">Keuntungan (Est.)</span>
                  {(() => {
                    const materialCost = viewingProject.materials?.reduce((sum, m) => {
                      const synced = getSyncedMaterial(m);
                      return sum + (m.qty * synced.harga);
                    }, 0) || 0;
                    const totalCost = materialCost + (viewingProject.biayaTenagaKerja || 0);
                    const nilaiNet = getNilaiSetelahDiskon(viewingProject.nilaiKontrak, viewingProject.diskonPersen || 0, viewingProject.diskonNominal || 0);
                    const profit = nilaiNet - totalCost;
                    return (
                      <span className={`font-bold ${profit >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                        {formatRupiah(profit)}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <Calendar className="w-4 h-4 mx-auto mb-1 text-primary" />
                  <p className="text-xs text-muted-foreground">Order</p>
                  <p className="font-medium">{formatDate(viewingProject.tanggalOrder)}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <PlayCircle className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                  <p className="text-xs text-muted-foreground">Mulai</p>
                  <p className="font-medium">{formatDate(viewingProject.tanggalMulai)}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-green-500" />
                  <p className="text-xs text-muted-foreground">Selesai</p>
                  <p className="font-medium">{formatDate(viewingProject.tanggalSelesai)}</p>
                </div>
              </div>

              {viewingProject.catatan && (
                <div>
                  <p className="text-muted-foreground text-sm">Catatan</p>
                  <p className="text-sm bg-muted/30 p-3 rounded-lg">{viewingProject.catatan}</p>
                </div>
              )}

              {/* Material Used */}
              {viewingProject.materials && viewingProject.materials.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4" />
                    Material yang Digunakan
                    {viewingProject.status !== 'Selesai' && (
                      <Badge className="bg-yellow-100 text-yellow-800 text-[10px]">
                        <Clock className="w-3 h-3 mr-1" />
                        PENDING
                      </Badge>
                    )}
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Produk</TableHead>
                          <TableHead className="text-center">Qty</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                          <TableHead className="text-center w-20">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingProject.materials.map((mat) => {
                          const synced = getSyncedMaterial(mat);
                          return (
                            <TableRow 
                              key={mat.productId} 
                              className={`${viewingProject.status !== 'Selesai' ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''} ${!synced.productExists ? 'bg-destructive/10' : ''}`}
                            >
                              <TableCell className="font-medium">
                                {synced.productName}
                                {!synced.productExists && (
                                  <Badge variant="destructive" className="ml-2 text-[10px]">Dihapus</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">{mat.qty} {synced.satuan}</TableCell>
                              <TableCell className="text-right">{formatRupiah(mat.qty * synced.harga)}</TableCell>
                              <TableCell className="text-center">
                                {!synced.productExists ? (
                                  <Badge variant="destructive" className="text-[10px]">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Error
                                  </Badge>
                                ) : viewingProject.status === 'Selesai' ? (
                                  <Badge className="bg-green-100 text-green-800 text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    OK
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800 text-[10px]">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={2} className="text-right font-bold">Total Material</TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {formatRupiah(viewingProject.materials.reduce((sum, m) => {
                              const synced = getSyncedMaterial(m);
                              return sum + (m.qty * synced.harga);
                            }, 0))}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              Tutup
            </Button>
            <Button
              onClick={() => {
                setShowDetailDialog(false);
                if (viewingProject) handleOpenEdit(viewingProject);
              }}
              className="gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Proyek
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
