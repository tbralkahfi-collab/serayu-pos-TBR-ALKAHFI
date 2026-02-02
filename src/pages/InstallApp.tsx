import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Download, 
  Check, 
  Share, 
  Plus, 
  ArrowRight,
  Monitor,
  Tablet,
  Chrome,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallApp() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isHarmonyOS, setIsHarmonyOS] = useState(false);
  const [isWindows, setIsWindows] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect device
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    setIsHarmonyOS(/harmonyos|huawei|hmscore/.test(userAgent));
    setIsWindows(/windows/.test(userAgent));

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Install error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-primary-foreground">SP</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">SERAYU POS</h1>
          <p className="text-muted-foreground">Aplikasi Kasir Toko Baja Ringan</p>
        </div>

        {isInstalled ? (
          /* Already Installed */
          <Card className="border-green-200 bg-green-50 mb-6">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-green-800 mb-2">Aplikasi Sudah Terinstal!</h2>
              <p className="text-green-700 mb-4">
                SERAYU POS sudah tersedia di perangkat Anda. Buka dari home screen untuk pengalaman terbaik.
              </p>
              <Button onClick={() => navigate('/dashboard')} className="gap-2 bg-green-600 hover:bg-green-700">
                Buka Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Installation Options */
          <>
            {/* Direct Install Button (Chrome/Edge on Android/Windows) */}
            {deferredPrompt && (
              <Card className="border-primary/30 bg-primary/5 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Download className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">Install Sekarang</h3>
                      <p className="text-sm text-muted-foreground">Akses cepat dari home screen / desktop</p>
                    </div>
                    <Button onClick={handleInstall} className="gap-2 bg-gradient-primary">
                      <Download className="w-4 h-4" />
                      Install
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Device-specific instructions */}
            <div className="grid gap-4">
              {/* Windows Instructions */}
              <Card className={isWindows && !deferredPrompt ? 'border-primary/30' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Monitor className="w-5 h-5 text-muted-foreground" />
                    Windows (PC / Laptop)
                    {isWindows && <Badge className="ml-2 bg-info text-info-foreground">Perangkat Anda</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-info">1</span>
                      <span>Buka di <strong>Microsoft Edge</strong> atau <strong>Google Chrome</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-info">2</span>
                      <span className="flex items-center gap-1">
                        Klik ikon <Download className="w-4 h-4 inline" /> di address bar (pojok kanan)
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-info">3</span>
                      <span>Atau klik menu <strong>⋮</strong> → <strong>Install SERAYU POS</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-info">4</span>
                      <span>Klik <strong>Install</strong> untuk konfirmasi</span>
                    </li>
                  </ol>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      💡 Setelah terinstal, aplikasi akan muncul di Start Menu dan dapat di-pin ke Taskbar
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Android Instructions */}
              <Card className={isAndroid && !isHarmonyOS && !deferredPrompt ? 'border-primary/30' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Tablet className="w-5 h-5 text-muted-foreground" />
                    Android (HP / Tablet)
                    {isAndroid && !isHarmonyOS && <Badge className="ml-2 bg-secondary text-secondary-foreground">Perangkat Anda</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-secondary">1</span>
                      <span className="flex items-center gap-1">
                        Buka di <Chrome className="w-4 h-4 inline text-blue-500" /> <strong>Chrome</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-secondary">2</span>
                      <span>Ketuk menu <strong>⋮</strong> (tiga titik) di pojok kanan atas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-secondary">3</span>
                      <span className="flex items-center gap-1">
                        Pilih <Download className="w-4 h-4 inline" /> <strong>Install app</strong> atau <strong>Add to Home screen</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-secondary">4</span>
                      <span>Konfirmasi dengan menekan <strong>Install</strong></span>
                    </li>
                  </ol>
                </CardContent>
              </Card>

              {/* Huawei / HarmonyOS Instructions */}
              <Card className={isHarmonyOS ? 'border-warning/50' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    Huawei / HarmonyOS
                    {isHarmonyOS && <Badge className="ml-2 bg-warning text-warning-foreground">Perangkat Anda</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-warning">1</span>
                      <span>Buka di <strong>Huawei Browser</strong> atau <strong>Chrome</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-warning">2</span>
                      <span>Ketuk menu <strong>⋮</strong> di pojok kanan bawah/atas</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-warning">3</span>
                      <span>Pilih <strong>Add to Home screen</strong> atau <strong>Tambah ke layar utama</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-warning">4</span>
                      <span>Ketuk <strong>Add</strong> untuk konfirmasi</span>
                    </li>
                  </ol>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      💡 Untuk HarmonyOS 3.0+, aplikasi akan berjalan dalam mode standalone seperti aplikasi native
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* iOS Instructions */}
              <Card className={isIOS ? 'border-primary/30' : ''}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    iPhone / iPad
                    {isIOS && <Badge className="ml-2 bg-primary text-primary-foreground">Perangkat Anda</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-primary">1</span>
                      <span>Buka aplikasi di <strong>Safari</strong> (browser bawaan iOS)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-primary">2</span>
                      <span className="flex items-center gap-1">
                        Ketuk tombol <Share className="w-4 h-4 inline text-blue-500" /> <strong>Share</strong> di bawah layar
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-primary">3</span>
                      <span className="flex items-center gap-1">
                        Scroll dan pilih <Plus className="w-4 h-4 inline" /> <strong>Add to Home Screen</strong>
                      </span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-primary">4</span>
                      <span>Ketuk <strong>Add</strong> untuk konfirmasi</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Features */}
        <Card className="mt-6 bg-card">
          <CardHeader>
            <CardTitle className="text-base">Keuntungan Install Aplikasi</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Akses cepat dari home screen</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Tampilan fullscreen tanpa browser</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Bekerja offline</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Loading lebih cepat</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Responsif untuk tablet & HP</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                <span>Support Windows, Android & Huawei</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Back to app */}
        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <Globe className="w-4 h-4" />
            Lanjut ke Aplikasi Web
          </Button>
        </div>
      </div>
    </div>
  );
}
