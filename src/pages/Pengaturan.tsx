import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Pengaturan() {
  const { storeInfo, updateStoreInfo } = useStore();
  const [formData, setFormData] = useState({
    name: storeInfo.name,
    address: storeInfo.address,
    phone: storeInfo.phone,
  });
  const [previewLogo, setPreviewLogo] = useState<string | null>(storeInfo.logo);
  const [isUploading, setIsUploading] = useState(false);
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
      // Read and convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        // Create image element for processing
        const img = new Image();
        img.onload = () => {
          // Create canvas to process image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            setPreviewLogo(base64);
            setIsUploading(false);
            return;
          }

          // Set canvas size to image size
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image
          ctx.drawImage(img, 0, 0);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Simple background removal: make white/near-white pixels transparent
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Check if pixel is white or near-white
            if (r > 240 && g > 240 && b > 240) {
              data[i + 3] = 0; // Set alpha to 0 (transparent)
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
    toast.success('Pengaturan berhasil disimpan');
  };

  const handleInstallPWA = async () => {
    // Check if the app is installable
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
          <TabsTrigger value="aplikasi" className="gap-2">
            <Download className="w-4 h-4" />
            Aplikasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="toko" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Logo section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Logo Toko
                </CardTitle>
                <CardDescription>
                  Upload logo toko Anda. Background akan dihapus otomatis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative w-40 h-40 mx-auto rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-dashed border-border">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Processing...</span>
                    </div>
                  ) : previewLogo ? (
                    <img
                      src={previewLogo}
                      alt="Logo Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Belum ada logo</span>
                    </div>
                  )}
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

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>Tampilan informasi toko di dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
                {previewLogo ? (
                  <img
                    src={previewLogo}
                    alt="Logo"
                    className="w-16 h-16 rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center">
                    <span className="text-xl font-bold text-primary-foreground">SP</span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{formData.name || 'Nama Toko'}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>{formData.address || 'Alamat toko'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span>{formData.phone || 'Nomor telepon'}</span>
                  </div>
                </div>
              </div>
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
