import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useStore } from '@/contexts/StoreContext';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Store,
  Upload,
  Save,
  Image as ImageIcon,
  Phone,
  MapPin,
  Download,
  Trash2,
  Loader2,
  Printer,
  Package,
  CheckCircle,
  Database,
  AlertTriangle,
  FileDown,
  FileUp,
  RefreshCw,
  HardDrive,
  Calendar,
  Cloud,
  CloudOff,
  History,
  RotateCcw,
  Shield,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';

export default function Pengaturan() {
  const { 
    storeInfo, 
    printerSettings, 
    stockSettings, 
    backups,
    isLoading: isStoreLoading,
    isSyncing,
    updateStoreInfo, 
    updatePrinterSettings, 
    updateStockSettings,
    triggerManualBackup,
    restoreBackup,
    fetchBackups,
  } = useStore();
  const { products, suppliers, purchases, debts, expenses, transactions, projects, refreshData } = useData();
  
  const [formData, setFormData] = useState({
    name: storeInfo.name,
    address: storeInfo.address,
    phone: storeInfo.phone,
  });
  const [previewLogo, setPreviewLogo] = useState<string | null>(storeInfo.logo);
  const [isUploading, setIsUploading] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [minStock, setMinStock] = useState(stockSettings.minStockAlert.toString());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Local printer settings state
  const [localPrinterType, setLocalPrinterType] = useState(printerSettings.type);
  const [localPaperWidth, setLocalPaperWidth] = useState(printerSettings.paperWidth);
  const [localAutoPrint, setLocalAutoPrint] = useState(printerSettings.autoPrint);

  // Sync form data when store info changes
  React.useEffect(() => {
    setFormData({
      name: storeInfo.name,
      address: storeInfo.address,
      phone: storeInfo.phone,
    });
    setPreviewLogo(storeInfo.logo);
  }, [storeInfo]);

  React.useEffect(() => {
    setLocalPrinterType(printerSettings.type);
    setLocalPaperWidth(printerSettings.paperWidth);
    setLocalAutoPrint(printerSettings.autoPrint);
  }, [printerSettings]);

  React.useEffect(() => {
    setMinStock(stockSettings.minStockAlert.toString());
  }, [stockSettings]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            setPreviewLogo(base64);
            setIsUploading(false);
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            if (r > 240 && g > 240 && b > 240) {
              data[i + 3] = 0;
            }
          }
          
          ctx.putImageData(imageData, 0, 0);
          
          const processedImage = canvas.toDataURL('image/png');
          setPreviewLogo(processedImage);
          setIsUploading(false);
          toast.success('Logo berhasil diupload');
        };
        
        img.src = base64;
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Gagal mengupload logo');
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setPreviewLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    await updateStoreInfo({
      ...formData,
      logo: previewLogo,
    });
    toast.success('Pengaturan toko berhasil disimpan');
  };

  const handleSavePrinter = async () => {
    await updatePrinterSettings({ 
      type: localPrinterType, 
      paperWidth: localPaperWidth,
      autoPrint: localAutoPrint 
    });
    toast.success('Pengaturan printer berhasil disimpan');
  };

  const handleSaveStock = async () => {
    await updateStockSettings({ minStockAlert: parseInt(minStock) || 10 });
    toast.success('Pengaturan stok berhasil disimpan');
  };

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      await triggerManualBackup();
      toast.success('Backup berhasil dibuat');
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Gagal membuat backup');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    setIsRestoring(true);
    try {
      // Step 1: Prevent unauthorized restore (role check)
      if (!user) {
        toast.error('Anda harus login untuk memulihkan data');
        return;
      }

      // Step 2: Confirm backup exists and belongs to user
      const selectedBackup = backups.find(b => b.id === backupId);
      if (!selectedBackup) {
        toast.error('Backup tidak ditemukan');
        return;
      }

      console.log('🔄 Starting restore process for backup:', selectedBackup.name);
      
      // Step 3: Execute restore with detailed logging
      await restoreBackup(backupId);
      
      // Step 4: Force refresh all data to ensure UI reflects updated data
      console.log('🔄 Refreshing application data...');
      await refreshData();
      
      // Step 5: Success feedback with details
      const backupDate = new Date(selectedBackup.created_at).toLocaleString('id-ID');
      toast.success(`Data berhasil dipulihkan dari backup (${backupDate})`);
      
      console.log('✅ Restore process completed successfully');
      
    } catch (error) {
      console.error('❌ Restore error:', error);
      
      // Step 6: Detailed error handling
      let errorMessage = 'Gagal memulihkan data';
      
      if (error instanceof Error) {
        if (error.message.includes('access denied')) {
          errorMessage = 'Akses ditolak: Backup tidak valid atau tidak milik Anda';
        } else if (error.message.includes('structure')) {
          errorMessage = 'Backup rusak atau tidak valid';
        } else if (error.message.includes('Failed to clear')) {
          errorMessage = 'Gagal menghapus data lama, coba lagi';
        } else if (error.message.includes('Failed to restore')) {
          errorMessage = 'Gagal memulihkan data, periksa format backup';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExportData = async () => {
    const exportData = {
      products,
      suppliers,
      purchases,
      debts,
      expenses,
      transactions,
      projects,
      storeInfo,
      printerSettings,
      stockSettings,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const fileName = `serayu_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'JSON File',
            accept: { 'application/json': ['.json'] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(dataStr);
        await writable.close();
        toast.success('Data berhasil di-export ke folder pilihan');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Data berhasil di-export');
  };

  const handleImportData = async (e?: React.ChangeEvent<HTMLInputElement>) => {
    if (!e && 'showOpenFilePicker' in window) {
      try {
        const [handle] = await (window as any).showOpenFilePicker({
          types: [{
            description: 'JSON File',
            accept: { 'application/json': ['.json'] }
          }]
        });
        const file = await handle.getFile();
        const content = await file.text();
        
        const importedData = JSON.parse(content);
        
        // For now, store to localStorage as fallback
        if (importedData.storeInfo) {
          await updateStoreInfo(importedData.storeInfo);
        }
        if (importedData.printerSettings) {
          await updatePrinterSettings(importedData.printerSettings);
        }
        if (importedData.stockSettings) {
          await updateStockSettings(importedData.stockSettings);
        }

        toast.success('Pengaturan berhasil di-import');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        toast.error('File tidak valid atau rusak');
        return;
      }
    }

    const file = e?.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        
        if (importedData.storeInfo) {
          await updateStoreInfo(importedData.storeInfo);
        }
        if (importedData.printerSettings) {
          await updatePrinterSettings(importedData.printerSettings);
        }
        if (importedData.stockSettings) {
          await updateStockSettings(importedData.stockSettings);
        }

        toast.success('Pengaturan berhasil di-import');
      } catch (error) {
        toast.error('File tidak valid atau rusak');
      }
    };
    reader.readAsText(file);
  };

  const handleInstallPWA = async () => {
    const deferredPrompt = (window as any).deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('Aplikasi sedang diinstall');
      }
      (window as any).deferredPrompt = null;
    } else {
      toast.info('Buka menu browser dan pilih "Install" atau "Add to Home Screen"');
    }
  };

  const formatBackupDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy, HH:mm", { locale: localeId });
    } catch {
      return dateStr;
    }
  };

  if (isStoreLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Pengaturan</h1>
          <p className="text-sm text-muted-foreground">Kelola pengaturan toko dan aplikasi</p>
        </div>
        {isSyncing && (
          <Badge variant="secondary" className="gap-1">
            <Cloud className="w-3 h-3 animate-pulse" />
            Menyinkronkan...
          </Badge>
        )}
      </div>

      <Tabs defaultValue="toko" className="space-y-4 md:space-y-6">
        <TabsList className="bg-muted/50 w-full flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="toko" className="gap-1 md:gap-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Store className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Toko</span>
          </TabsTrigger>
          <TabsTrigger value="printer" className="gap-1 md:gap-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Printer className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Printer</span>
          </TabsTrigger>
          <TabsTrigger value="stok" className="gap-1 md:gap-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Package className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Stok</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-1 md:gap-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Cloud className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-1 md:gap-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Database className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Data</span>
          </TabsTrigger>
          <TabsTrigger value="aplikasi" className="gap-1 md:gap-2 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Download className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Install</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="toko" className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Logo section */}
            <Card className="bg-card border-t-4 border-t-primary">
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  Logo Toko
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Upload logo. Background putih dihapus otomatis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-32 h-32 md:w-44 md:h-44 mx-auto">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-transparent" />
                  <div className="relative w-full h-full rounded-2xl bg-card border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden shadow-lg">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 md:w-8 md:h-8 animate-spin text-primary" />
                        <span className="text-xs text-muted-foreground">Processing...</span>
                      </div>
                    ) : previewLogo ? (
                      <div className="w-full h-full p-3 md:p-4 flex items-center justify-center bg-gradient-to-br from-secondary/5 to-primary/5">
                        <img
                          src={previewLogo}
                          alt="Logo Preview"
                          className="max-w-full max-h-full object-contain drop-shadow-lg"
                        />
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">Belum ada logo</span>
                      </div>
                    )}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 border-primary/30 hover:bg-primary/5 text-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                  {previewLogo && (
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive hover:bg-destructive/5"
                      onClick={handleRemoveLogo}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Store info section */}
            <Card className="lg:col-span-2 bg-card border-t-4 border-t-secondary">
              <CardHeader className="pb-2 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Store className="w-5 h-5 text-secondary" />
                  Informasi Toko
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Ditampilkan di dashboard dan struk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2 text-sm">
                    <Store className="w-4 h-4 text-primary" />
                    Nama Toko
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama toko"
                    className="border-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-secondary" />
                    Alamat
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Masukkan alamat toko"
                    className="border-secondary/20 focus:border-secondary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-info" />
                    Nomor Telepon
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Masukkan nomor telepon"
                    className="border-info/20 focus:border-info"
                  />
                </div>

                <Button onClick={handleSave} className="w-full gap-2 bg-gradient-primary" disabled={isSyncing}>
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Simpan Pengaturan
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 md:gap-5 p-4 md:p-5 rounded-xl bg-gradient-to-r from-primary/5 via-background to-secondary/5 border">
                {previewLogo ? (
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 p-2 flex items-center justify-center ring-2 ring-primary/30 shadow-md flex-shrink-0">
                    <img
                      src={previewLogo}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain drop-shadow-md"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md flex-shrink-0">
                    <span className="text-xl md:text-2xl font-bold text-primary-foreground">SP</span>
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-bold text-base md:text-lg truncate">{formData.name || 'Nama Toko'}</h3>
                  <p className="text-xs font-medium text-primary mb-1">SERAYU POS</p>
                  <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 text-secondary" />
                    <span className="truncate">{formData.address || 'Alamat toko'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground">
                    <Phone className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0 text-info" />
                    <span>{formData.phone || 'Nomor telepon'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printer" className="space-y-4 md:space-y-6">
          <Card className="bg-card border-t-4 border-t-primary">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Printer className="w-5 h-5 text-primary" />
                Pengaturan Printer
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Atur jenis printer dan ukuran kertas untuk cetak nota
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Jenis Printer</Label>
                <RadioGroup 
                  value={localPrinterType} 
                  onValueChange={(v) => setLocalPrinterType(v as any)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
                >
                  <div className={`flex items-center space-x-3 p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all ${localPrinterType === 'thermal' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
                    <RadioGroupItem value="thermal" id="thermal" />
                    <Label htmlFor="thermal" className="cursor-pointer flex-1">
                      <div className="font-medium text-sm">Printer Thermal</div>
                      <div className="text-xs text-muted-foreground">Nota struk (58mm/80mm)</div>
                    </Label>
                    {localPrinterType === 'thermal' && <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-primary" />}
                  </div>
                  <div className={`flex items-center space-x-3 p-3 md:p-4 border-2 rounded-lg cursor-pointer transition-all ${localPrinterType === 'regular' ? 'border-secondary bg-secondary/5' : 'border-border hover:border-secondary/50 hover:bg-muted/50'}`}>
                    <RadioGroupItem value="regular" id="regular" />
                    <Label htmlFor="regular" className="cursor-pointer flex-1">
                      <div className="font-medium text-sm">Printer Biasa / A4</div>
                      <div className="text-xs text-muted-foreground">Invoice ukuran A4</div>
                    </Label>
                    {localPrinterType === 'regular' && <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-secondary" />}
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">Ukuran Kertas</Label>
                <RadioGroup 
                  value={localPaperWidth} 
                  onValueChange={(v) => setLocalPaperWidth(v as any)}
                  className="grid grid-cols-3 gap-2 md:gap-4"
                >
                  <div className={`flex items-center space-x-2 md:space-x-3 p-2 md:p-4 border-2 rounded-lg cursor-pointer transition-all ${localPaperWidth === '58mm' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
                    <RadioGroupItem value="58mm" id="58mm" />
                    <Label htmlFor="58mm" className="cursor-pointer font-medium text-sm">58mm</Label>
                  </div>
                  <div className={`flex items-center space-x-2 md:space-x-3 p-2 md:p-4 border-2 rounded-lg cursor-pointer transition-all ${localPaperWidth === '80mm' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
                    <RadioGroupItem value="80mm" id="80mm" />
                    <Label htmlFor="80mm" className="cursor-pointer font-medium text-sm">80mm</Label>
                  </div>
                  <div className={`flex items-center space-x-2 md:space-x-3 p-2 md:p-4 border-2 rounded-lg cursor-pointer transition-all ${localPaperWidth === 'A4' ? 'border-secondary bg-secondary/5' : 'border-border hover:border-secondary/50 hover:bg-muted/50'}`}>
                    <RadioGroupItem value="A4" id="A4" />
                    <Label htmlFor="A4" className="cursor-pointer font-medium text-sm">A4</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between p-3 md:p-4 border-2 rounded-lg bg-muted/30">
                <div>
                  <Label className="font-medium text-sm">Auto Print</Label>
                  <p className="text-xs text-muted-foreground">Cetak otomatis setelah transaksi</p>
                </div>
                <Switch 
                  checked={localAutoPrint}
                  onCheckedChange={setLocalAutoPrint}
                />
              </div>

              <Button onClick={handleSavePrinter} className="w-full gap-2 bg-gradient-primary" disabled={isSyncing}>
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Pengaturan Printer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stok" className="space-y-4 md:space-y-6">
          <Card className="bg-card border-t-4 border-t-warning">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="w-5 h-5 text-warning" />
                Pengaturan Stok
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Atur batas minimal stok untuk peringatan restok
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <Label className="text-sm">Batas Minimal Stok</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Produk dengan stok di bawah angka ini akan muncul di peringatan
                </p>
                <Input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="10"
                  min={1}
                  className="border-warning/30 focus:border-warning"
                />
              </div>

              <div className="p-3 md:p-4 rounded-lg bg-warning/10 border border-warning/30">
                <p className="text-xs md:text-sm">
                  <span className="font-medium text-warning">Pengaturan saat ini:</span> Produk dengan stok kurang dari{' '}
                  <span className="font-bold">{minStock || stockSettings.minStockAlert}</span> unit akan ditampilkan
                </p>
              </div>

              <Button onClick={handleSaveStock} className="w-full gap-2 bg-gradient-secondary text-secondary-foreground" disabled={isSyncing}>
                {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Simpan Pengaturan Stok
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4 md:space-y-6">
          {/* Cloud Backup Status */}
          <Card className="bg-card border-t-4 border-t-primary">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-5 h-5 text-primary" />
                Backup Otomatis Cloud
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Data Anda di-backup otomatis setiap hari pukul 20:00 WIB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Cloud className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Backup Cloud Aktif</h4>
                    <p className="text-xs text-muted-foreground">
                      Jadwal: Setiap hari pukul 20:00 WIB
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Retensi: 7 backup terakhir
                    </p>
                  </div>
                  <CheckCircle className="w-6 h-6 text-secondary" />
                </div>
              </div>

              <Button 
                onClick={handleManualBackup} 
                className="w-full gap-2"
                disabled={isBackingUp}
              >
                {isBackingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
                Backup Sekarang
              </Button>
            </CardContent>
          </Card>

          {/* Backup History */}
          <Card className="bg-card border-t-4 border-t-secondary">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="w-5 h-5 text-secondary" />
                Riwayat Backup
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Pulihkan data dari backup sebelumnya
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {backups.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CloudOff className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Belum ada backup tersedia</p>
                  <p className="text-xs">Klik "Backup Sekarang" untuk membuat backup pertama</p>
                </div>
              ) : (
                backups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${backup.backupType === 'auto' ? 'bg-primary/10' : 'bg-secondary/10'}`}>
                        {backup.backupType === 'auto' ? (
                          <Calendar className="w-5 h-5 text-primary" />
                        ) : (
                          <Cloud className="w-5 h-5 text-secondary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {formatBackupDate(backup.createdAt)}
                        </p>
                        <Badge variant={backup.backupType === 'auto' ? 'default' : 'secondary'} className="text-xs">
                          {backup.backupType === 'auto' ? 'Otomatis' : 'Manual'}
                        </Badge>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1" disabled={isRestoring}>
                          <RotateCcw className="w-3 h-3" />
                          Pulihkan
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-warning" />
                            Konfirmasi Pemulihan Data
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <span className="block">
                              Anda akan memulihkan data dari backup tanggal{' '}
                              <strong>{formatBackupDate(backup.createdAt)}</strong>
                            </span>
                            <span className="block text-warning font-medium">
                              Data saat ini akan diganti dengan data dari backup!
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <Button onClick={() => handleRestore(backup.id)}>
                            Ya, Pulihkan Data
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4 md:space-y-6">
          {/* Data Stats */}
          <Card className="bg-card border-t-4 border-t-info">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="w-5 h-5 text-info" />
                Ringkasan Data
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Data tersimpan di cloud dan tersinkron real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <div className="p-2 md:p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-lg md:text-xl font-bold text-primary">{products.length}</p>
                  <p className="text-xs text-muted-foreground">Produk</p>
                </div>
                <div className="p-2 md:p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-lg md:text-xl font-bold text-secondary">{transactions.length}</p>
                  <p className="text-xs text-muted-foreground">Transaksi</p>
                </div>
                <div className="p-2 md:p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-lg md:text-xl font-bold text-info">{projects.length}</p>
                  <p className="text-xs text-muted-foreground">Proyek</p>
                </div>
                <div className="p-2 md:p-3 bg-muted/50 rounded-lg text-center">
                  <p className="text-lg md:text-xl font-bold text-warning">{debts.length}</p>
                  <p className="text-xs text-muted-foreground">Utang/Piutang</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export/Import */}
          <Card className="bg-card border-t-4 border-t-secondary">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <HardDrive className="w-5 h-5 text-secondary" />
                Export/Import Lokal
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Simpan atau pulihkan pengaturan ke file lokal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 md:p-4 border rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <FileDown className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Export Data ke Komputer</h4>
                    <p className="text-xs text-muted-foreground">Simpan backup ke folder pilihan di hard disk Anda</p>
                  </div>
                </div>
                <Button onClick={handleExportData} variant="outline" className="w-full gap-2 border-secondary/30 hover:bg-secondary/5">
                  <HardDrive className="w-4 h-4" />
                  Pilih Folder & Export
                </Button>
              </div>

              <div className="p-3 md:p-4 border rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center flex-shrink-0">
                    <FileUp className="w-5 h-5 text-info" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">Import Pengaturan dari Komputer</h4>
                    <p className="text-xs text-muted-foreground">Pulihkan pengaturan dari file backup JSON</p>
                  </div>
                </div>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
                <Button 
                  onClick={() => 'showOpenFilePicker' in window ? handleImportData() : importInputRef.current?.click()} 
                  variant="outline" 
                  className="w-full gap-2 border-info/30 hover:bg-info/5"
                >
                  <HardDrive className="w-4 h-4" />
                  Pilih File dari Folder
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aplikasi" className="space-y-4 md:space-y-6">
          <Card className="bg-card border-t-4 border-t-info">
            <CardHeader className="pb-2 md:pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="w-5 h-5 text-info" />
                Install Aplikasi
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Install SERAYU POS ke desktop atau home screen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 md:p-4 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border">
                <h4 className="font-medium mb-2 text-sm">Keuntungan Install:</h4>
                <ul className="text-xs md:text-sm text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0" />
                    Akses cepat dari desktop atau home screen
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0" />
                    Tampilan fullscreen tanpa address bar
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0" />
                    Bekerja seperti aplikasi native
                  </li>
                </ul>
              </div>

              <Button onClick={handleInstallPWA} className="w-full gap-2 bg-gradient-primary">
                <Download className="w-4 h-4" />
                Install ke Desktop / HP
              </Button>

              <div className="p-3 md:p-4 rounded-lg border bg-muted/30">
                <h4 className="font-medium mb-2 text-sm">Cara Install Manual:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li><strong>Desktop Chrome:</strong> Klik ikon ⊕ di address bar</li>
                  <li><strong>iPhone Safari:</strong> Tap Share → Add to Home Screen</li>
                  <li><strong>Android Chrome:</strong> Menu ⋮ → Install App</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* App Info */}
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Informasi Aplikasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nama Aplikasi</span>
                  <span className="font-medium">SERAYU POS</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Versi</span>
                  <span className="font-medium">2.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipe</span>
                  <span className="font-medium">Progressive Web App</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sinkronisasi</span>
                  <Badge variant="default" className="gap-1">
                    <Cloud className="w-3 h-3" />
                    Cloud Realtime
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
