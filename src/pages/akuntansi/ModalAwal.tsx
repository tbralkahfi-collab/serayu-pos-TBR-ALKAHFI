import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { Calculator, Save, CheckCircle, Loader2 } from 'lucide-react';

export default function ModalAwal() {
  const { modalAwal, addModalAwal, updateModalAwal } = useData();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    tanggal: modalAwal?.tanggal || new Date().toISOString().split('T')[0],
    kas: modalAwal?.kas || 0,
    bank: modalAwal?.bank || 0,
    inventaris: modalAwal?.inventaris || 0,
    catatan: modalAwal?.catatan || '',
  });

  useEffect(() => {
    if (modalAwal) {
      setFormData({
        tanggal: modalAwal.tanggal,
        kas: modalAwal.kas,
        bank: modalAwal.bank,
        inventaris: modalAwal.inventaris,
        catatan: modalAwal.catatan,
      });
    }
  }, [modalAwal]);

  const handleSave = async () => {
    if (!formData.tanggal) {
      toast.error('Tanggal wajib diisi');
      return;
    }

    const hasAnyValue = formData.kas > 0 || formData.bank > 0 || formData.inventaris > 0;
    if (!hasAnyValue) {
      toast.error('Minimal satu nilai modal harus diisi');
      return;
    }

    setIsSaving(true);
    try {
      const total = formData.kas + formData.bank + formData.inventaris;
      const data = { ...formData, total };

      if (modalAwal) {
        await updateModalAwal(data);
      } else {
        await addModalAwal(data);
      }

      toast.success('Modal awal berhasil disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan modal awal');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Modal Awal</h1>
          <p className="text-muted-foreground">Setup modal awal untuk perhitungan akuntansi yang akurat</p>
        </div>

        {/* Main Card */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Calculator className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-primary font-bold">MODAL AWAL</div>
                <div className="text-xs text-muted-foreground font-normal">Setup awal untuk akuntansi</div>
              </div>
            </CardTitle>
            {!modalAwal && (
              <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded-lg text-sm">
                ⚠️ Belum disetup - Wajib diisi untuk laporan akuntansi
              </div>
            )}
            {modalAwal && (
              <div className="bg-green-100 border border-green-300 text-green-800 px-3 py-2 rounded-lg text-sm">
                ✅ Sudah disetup - {new Date(modalAwal.createdAt).toLocaleDateString('id-ID')}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tanggal" className="text-sm font-medium">Tanggal Mulai Usaha</Label>
                <Input
                  id="tanggal"
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) => setFormData(prev => ({ ...prev, tanggal: e.target.value }))}
                  className="w-full border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catatan" className="text-sm font-medium">Catatan</Label>
                <Input
                  id="catatan"
                  placeholder="Opsional: Deskripsi modal awal"
                  value={formData.catatan}
                  onChange={(e) => setFormData(prev => ({ ...prev, catatan: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="kas" className="text-sm font-medium">Kas</Label>
                <Input
                  id="kas"
                  type="number"
                  placeholder="0"
                  value={formData.kas || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, kas: Number(e.target.value) || 0 }))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank" className="text-sm font-medium">Bank</Label>
                <Input
                  id="bank"
                  type="number"
                  placeholder="0"
                  value={formData.bank || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bank: Number(e.target.value) || 0 }))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventaris" className="text-sm font-medium">Inventaris</Label>
                <Input
                  id="inventaris"
                  type="number"
                  placeholder="0"
                  value={formData.inventaris || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, inventaris: Number(e.target.value) || 0 }))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total Modal Awal</p>
                  <p className="text-xs text-muted-foreground">Jumlah semua modal</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    Rp {(formData.kas + formData.bank + formData.inventaris).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || !formData.tanggal}
                className={`gap-3 px-6 py-3 text-base font-bold ${!formData.tanggal ? 'opacity-50 cursor-not-allowed' : ''} bg-gradient-primary shadow-lg hover:shadow-xl transform hover:scale-105 transition-all`}
                size="lg"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {modalAwal ? 'UPDATE MODAL AWAL' : 'SIMPAN MODAL AWAL'}
              </Button>
              
              {modalAwal && (
                <Badge variant="secondary" className="gap-2 px-3 py-2 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Sudah Disetup
                </Badge>
              )}
            </div>

            {modalAwal && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Status:</strong> Modal awal sudah disetup pada {new Date(modalAwal.createdAt).toLocaleDateString('id-ID')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
