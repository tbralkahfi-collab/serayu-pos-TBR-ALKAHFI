import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';
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
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function Pengaturan() {
  const { storeInfo, printerSettings, stockSettings, updateStoreInfo, updatePrinterSettings, updateStockSettings } = useStore();
  const [formData, setFormData] = useState({
    name: storeInfo.name,
    address: storeInfo.address,
    phone: storeInfo.phone,
  });
  const [previewLogo, setPreviewLogo] = useState<string | null>(storeInfo.logo);
  const [isUploading, setIsUploading] = useState(false);
  const [minStock, setMinStock] = useState(stockSettings.minStockAlert.toString());
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = () => {
    updateStoreInfo({
      ...formData,
      logo: previewLogo,
    });
    toast.success('Pengaturan toko berhasil disimpan');
  };

  const handleSavePrinter = () => {
    toast.success('Pengaturan printer berhasil disimpan');
  };

  const handleSaveStock = () => {
    updateStockSettings({ minStockAlert: parseInt(minStock) || 10 });
    toast.success('Pengaturan stok berhasil disimpan');
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
          <p className="text-muted-foreground">Kelola pengaturan toko dan aplikasi</p>
        </div>
      </div>

      <Tabs defaultValue="toko" className="space-y-6">
        <TabsList>
          <TabsTrigger value="toko" className="gap-2">
            <Store className="w-4 h-4" />
            Informasi Toko
          </TabsTrigger>
          <TabsTrigger value="printer" className="gap-2">
            <Printer className="w-4 h-4" />
            Printer
          </TabsTrigger>
          <TabsTrigger value="stok" className="gap-2">
            <Package className="w-4 h-4" />
            Stok
          </TabsTrigger>
          <TabsTrigger value="aplikasi" className="gap-2">
            <Download className="w-4 h-4" />
            Aplikasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="toko" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Logo section with improved display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Logo Toko
                </CardTitle>
                <CardDescription>
                  Upload logo toko. Background putih akan dihapus otomatis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Improved logo preview */}
                <div className="relative w-44 h-44 mx-auto">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
                  <div className="relative w-full h-full rounded-2xl bg-background border-2 border-dashed border-primary/30 flex items-center justify-center overflow-hidden shadow-lg">
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">Processing...</span>
                      </div>
                    ) : previewLogo ? (
                      <div className="w-full h-full p-4 flex items-center justify-center">
                        <img
                          src={previewLogo}
                          alt="Logo Preview"
                          className="max-w-full max-h-full object-contain drop-shadow-lg"
                        />
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">Belum ada logo</span>
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
                    className="flex-1 gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4" />
                    Upload
                  </Button>
                  {previewLogo && (
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={handleRemoveLogo}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Store info section */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Informasi Toko
                </CardTitle>
                <CardDescription>
                  Informasi ini akan ditampilkan di dashboard dan struk
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Nama Toko
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama toko"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Alamat
                  </Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Masukkan alamat toko"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Nomor Telepon
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Masukkan nomor telepon"
                  />
                </div>

                <Button onClick={handleSave} className="w-full gap-2 bg-gradient-primary">
                  <Save className="w-4 h-4" />
                  Simpan Pengaturan
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview with SERAYU POS label */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Tampilan informasi toko di dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-5 p-5 rounded-xl bg-muted/50 border">
                {previewLogo ? (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/20 p-2 flex items-center justify-center ring-2 ring-primary/30 shadow-md">
                    <img
                      src={previewLogo}
                      alt="Logo"
                      className="max-w-full max-h-full object-contain drop-shadow-md"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-md">
                    <span className="text-2xl font-bold text-primary-foreground">SP</span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-lg">{formData.name || 'Nama Toko'}</h3>
                  <p className="text-xs font-medium text-primary mb-2">SERAYU POS</p>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{formData.address || 'Alamat toko'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{formData.phone || 'Nomor telepon'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="printer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Printer className="w-5 h-5" />
                Pengaturan Printer
              </CardTitle>
              <CardDescription>
                Atur jenis printer dan ukuran kertas untuk cetak nota
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Jenis Printer</Label>
                <RadioGroup 
                  value={printerSettings.type} 
                  onValueChange={(v) => updatePrinterSettings({ type: v as any })}
                  className="grid grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="thermal" id="thermal" />
                    <Label htmlFor="thermal" className="cursor-pointer">
                      <div className="font-medium">Printer Thermal</div>
                      <div className="text-sm text-muted-foreground">Untuk nota struk kecil</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="regular" id="regular" />
                    <Label htmlFor="regular" className="cursor-pointer">
                      <div className="font-medium">Printer Biasa</div>
                      <div className="text-sm text-muted-foreground">Untuk invoice A4</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Ukuran Kertas</Label>
                <RadioGroup 
                  value={printerSettings.paperWidth} 
                  onValueChange={(v) => updatePrinterSettings({ paperWidth: v as any })}
                  className="grid grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="58mm" id="58mm" />
                    <Label htmlFor="58mm" className="cursor-pointer">58mm</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="80mm" id="80mm" />
                    <Label htmlFor="80mm" className="cursor-pointer">80mm</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                    <RadioGroupItem value="A4" id="A4" />
                    <Label htmlFor="A4" className="cursor-pointer">A4</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label>Auto Print</Label>
                  <p className="text-sm text-muted-foreground">Cetak otomatis setelah transaksi</p>
                </div>
                <Switch 
                  checked={printerSettings.autoPrint}
                  onCheckedChange={(v) => updatePrinterSettings({ autoPrint: v })}
                />
              </div>

              <Button onClick={handleSavePrinter} className="w-full gap-2 bg-gradient-primary">
                <Save className="w-4 h-4" />
                Simpan Pengaturan Printer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stok" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Pengaturan Stok
              </CardTitle>
              <CardDescription>
                Atur batas minimal stok untuk peringatan restok
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Batas Minimal Stok</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Produk dengan stok di bawah angka ini akan muncul di peringatan restok di Dashboard
                </p>
                <Input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  placeholder="10"
                  min={1}
                />
              </div>

              <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                <p className="text-sm">
                  <strong>Contoh:</strong> Jika diset ke {minStock || 10}, maka produk dengan stok ≤ {minStock || 10} 
                  akan ditampilkan di peringatan "Stok Rendah" di halaman Dashboard.
                </p>
              </div>

              <Button onClick={handleSaveStock} className="w-full gap-2 bg-gradient-primary">
                <Save className="w-4 h-4" />
                Simpan Pengaturan Stok
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aplikasi">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Install Aplikasi
              </CardTitle>
              <CardDescription>
                Install SERAYU POS ke desktop atau perangkat mobile Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-6 rounded-xl bg-muted/50 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-foreground">SP</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">SERAYU POS</h3>
                <p className="text-muted-foreground mb-4">
                  Install aplikasi untuk akses lebih cepat dan pengalaman seperti aplikasi native
                </p>
                <Button onClick={handleInstallPWA} className="gap-2 bg-gradient-primary">
                  <Download className="w-4 h-4" />
                  Install Aplikasi
                </Button>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Cara Install Manual:</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Desktop (Chrome/Edge):</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Klik ikon install di address bar (sebelah bookmark)</li>
                    <li>Atau buka menu (⋮) → "Install SERAYU POS"</li>
                  </ol>
                  <p className="mt-4"><strong>Mobile:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-4">
                    <li>Buka menu browser</li>
                    <li>Pilih "Add to Home Screen" atau "Install App"</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
