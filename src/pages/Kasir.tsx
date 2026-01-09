import React, { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRupiah } from '@/components/RupiahIcon';
import { useStore } from '@/contexts/StoreContext';
import { useData, Product } from '@/contexts/DataContext';
import { toast } from 'sonner';
import { 
  Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, 
  Printer, Save, X, User, Package
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface CartItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
  qty: number;
}

export default function Kasir() {
  const { storeInfo, printerSettings } = useStore();
  const { products, addTransaction, updateProduct } = useData();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'transfer' | 'kartu'>('tunai');
  const [cashAmount, setCashAmount] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.nama.toLowerCase().includes(search.toLowerCase()) ||
      p.kategori.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stok) {
          toast.error(`Stok ${product.nama} tidak mencukupi`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { 
        id: product.id, 
        name: product.nama, 
        price: product.harga, 
        unit: product.satuan, 
        stock: product.stok,
        qty: 1 
      }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = Math.max(0, item.qty + delta);
            if (newQty > item.stock) {
              toast.error(`Stok ${item.name} tidak mencukupi`);
              return item;
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const setQty = (id: string, qty: number) => {
    const product = cart.find(item => item.id === id);
    if (!product) return;
    
    if (qty > product.stock) {
      toast.error(`Stok ${product.name} hanya ${product.stock} ${product.unit}`);
      return;
    }
    
    if (qty <= 0) {
      setCart(prev => prev.filter(item => item.id !== id));
    } else {
      setCart(prev => prev.map(item => 
        item.id === id ? { ...item, qty } : item
      ));
    }
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = 0; // No tax for baja ringan store
  const total = subtotal + tax;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Keranjang masih kosong');
      return;
    }
    setShowCheckout(true);
  };

  const generateReceipt = () => {
    const date = new Date();
    const receiptId = `TRX${date.getTime().toString().slice(-8)}`;
    
    return {
      id: receiptId,
      date: date.toLocaleDateString('id-ID'),
      time: date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      customer: customerName || 'Umum',
      items: cart,
      subtotal,
      tax,
      total,
      paymentMethod,
      cashAmount: paymentMethod === 'tunai' ? parseInt(cashAmount) || total : total,
      change: paymentMethod === 'tunai' ? (parseInt(cashAmount) || total) - total : 0,
    };
  };

  const handlePrint = () => {
    const receipt = generateReceipt();
    
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup diblokir. Izinkan popup untuk mencetak.');
      return;
    }

    const paperWidth = printerSettings.paperWidth === '58mm' ? '58mm' : 
                       printerSettings.paperWidth === '80mm' ? '80mm' : '210mm';
    const fontSize = printerSettings.type === 'thermal' ? '10px' : '12px';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nota - ${receipt.id}</title>
        <style>
          @page { 
            size: ${paperWidth} auto; 
            margin: 2mm; 
          }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: ${fontSize}; 
            width: ${paperWidth};
            margin: 0;
            padding: 4mm;
          }
          .header { text-align: center; margin-bottom: 8px; }
          .store-name { font-weight: bold; font-size: 14px; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .item { display: flex; justify-content: space-between; margin: 2px 0; }
          .item-detail { font-size: 9px; color: #666; }
          .total-section { margin-top: 8px; }
          .total-row { display: flex; justify-content: space-between; font-weight: bold; }
          .footer { text-align: center; margin-top: 12px; font-size: 9px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="store-name">${storeInfo.name}</div>
          <div>SERAYU POS</div>
          <div style="font-size: 9px;">${storeInfo.address}</div>
          <div style="font-size: 9px;">${storeInfo.phone}</div>
        </div>
        <div class="divider"></div>
        <div>
          <div class="item"><span>No:</span><span>${receipt.id}</span></div>
          <div class="item"><span>Tgl:</span><span>${receipt.date} ${receipt.time}</span></div>
          <div class="item"><span>Kasir:</span><span>Admin</span></div>
          <div class="item"><span>Pelanggan:</span><span>${receipt.customer}</span></div>
        </div>
        <div class="divider"></div>
        ${receipt.items.map(item => `
          <div>
            <div>${item.name}</div>
            <div class="item">
              <span class="item-detail">${item.qty} ${item.unit} x Rp ${item.price.toLocaleString('id-ID')}</span>
              <span>Rp ${(item.qty * item.price).toLocaleString('id-ID')}</span>
            </div>
          </div>
        `).join('')}
        <div class="divider"></div>
        <div class="total-section">
          <div class="item"><span>Subtotal:</span><span>Rp ${receipt.subtotal.toLocaleString('id-ID')}</span></div>
          <div class="divider"></div>
          <div class="total-row"><span>TOTAL:</span><span>Rp ${receipt.total.toLocaleString('id-ID')}</span></div>
          <div class="item"><span>Bayar (${receipt.paymentMethod}):</span><span>Rp ${receipt.cashAmount.toLocaleString('id-ID')}</span></div>
          ${receipt.change > 0 ? `<div class="item"><span>Kembalian:</span><span>Rp ${receipt.change.toLocaleString('id-ID')}</span></div>` : ''}
        </div>
        <div class="divider"></div>
        <div class="footer">
          <div>Terima kasih atas kunjungan Anda</div>
          <div>Barang yang sudah dibeli tidak dapat dikembalikan</div>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const handleSaveTransaction = () => {
    const receipt = generateReceipt();
    // Save to localStorage for now
    const savedTransactions = JSON.parse(localStorage.getItem('serayu_transactions') || '[]');
    savedTransactions.push({
      ...receipt,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('serayu_transactions', JSON.stringify(savedTransactions));
    
    toast.success(`Transaksi ${receipt.id} berhasil disimpan`);
    setCart([]);
    setCustomerName('');
    setCashAmount('');
    setShowCheckout(false);
  };

  const handlePrintAndSave = () => {
    handlePrint();
    handleSaveTransaction();
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Products section */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">Kasir</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Cari produk baja ringan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-card-hover hover:border-primary/50 transition-all"
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-4">
                <div className="w-full h-16 rounded-lg bg-muted flex items-center justify-center mb-3">
                  <Package className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground text-sm truncate">{product.nama}</h3>
                <p className="text-xs text-muted-foreground">{product.kategori}</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-bold text-primary">{formatRupiah(product.harga)}</p>
                  <span className="text-xs text-muted-foreground">{product.stok} {product.satuan}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart section */}
      <div className="w-96 bg-card border-l border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Keranjang
            {cart.length > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {cart.reduce((sum, item) => sum + item.qty, 0)}
              </span>
            )}
          </h2>
          {/* Customer name input */}
          <div className="mt-4 relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Nama Pelanggan (opsional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keranjang kosong</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{formatRupiah(item.price)}/{item.unit}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(item.id, -1)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    {/* Editable quantity input */}
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={(e) => setQty(item.id, parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center text-sm"
                      min={1}
                      max={item.stock}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(item.id, 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="font-semibold text-foreground text-sm">
                    {formatRupiah(item.price * item.qty)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals and payment */}
        <div className="p-4 border-t border-border space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatRupiah(total)}</span>
            </div>
          </div>

          <Button 
            className="w-full gap-2 bg-gradient-primary" 
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            <Banknote className="w-4 h-4" />
            Proses Pembayaran
          </Button>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Bayar</span>
                <span className="text-primary">{formatRupiah(total)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(v) => setPaymentMethod(v as any)}
                className="grid grid-cols-3 gap-2"
              >
                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="tunai" id="tunai" />
                  <Label htmlFor="tunai" className="cursor-pointer flex items-center gap-1">
                    <Banknote className="w-4 h-4" /> Tunai
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer" className="cursor-pointer">Transfer</Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="kartu" id="kartu" />
                  <Label htmlFor="kartu" className="cursor-pointer flex items-center gap-1">
                    <CreditCard className="w-4 h-4" /> Kartu
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === 'tunai' && (
              <div className="space-y-2">
                <Label>Jumlah Uang</Label>
                <Input
                  type="number"
                  placeholder="Masukkan jumlah uang"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                />
                {cashAmount && parseInt(cashAmount) >= total && (
                  <p className="text-sm text-success">
                    Kembalian: {formatRupiah(parseInt(cashAmount) - total)}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowCheckout(false)} className="gap-2">
              <X className="w-4 h-4" />
              Batal
            </Button>
            <Button variant="outline" onClick={handleSaveTransaction} className="gap-2">
              <Save className="w-4 h-4" />
              Simpan Saja
            </Button>
            <Button onClick={handlePrintAndSave} className="gap-2 bg-gradient-primary">
              <Printer className="w-4 h-4" />
              Cetak & Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
