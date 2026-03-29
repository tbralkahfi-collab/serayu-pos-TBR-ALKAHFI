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
  Printer, Save, X, User, Package, Percent, Tag
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
  costPrice: number;
  unit: string;
  stock: number;
  qty: number;
  diskonPersen: number;
  diskonNominal: number;
}

export default function Kasir() {
  const { storeInfo, printerSettings } = useStore();
  const { products, createTransaction, updateProduct, createTransactionDebt } = useData();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'tunai' | 'transfer' | 'kartu'>('tunai');
  const [cashAmount, setCashAmount] = useState('');
  const [diskonPersen, setDiskonPersen] = useState(0);
  const [diskonNominal, setDiskonNominal] = useState(0);
  const [statusBayar, setStatusBayar] = useState<'lunas' | 'belum_lunas'>('lunas');
  const [jumlahBayarParsial, setJumlahBayarParsial] = useState('');
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
      // Use hargaJual (selling price) consistently
      const sellingPrice = product.hargaJual || 0;
      const costPrice = product.hargaBeli || 0;
      
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
        price: sellingPrice,
        costPrice: costPrice,
        unit: product.satuan, 
        stock: product.stok,
        qty: 1,
        diskonPersen: 0,
        diskonNominal: 0,
      }];
    });
  };

  const updateItemDiskon = (id: string, type: 'persen' | 'nominal', value: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (type === 'persen') {
            return { ...item, diskonPersen: Math.min(100, Math.max(0, value)) };
          } else {
            return { ...item, diskonNominal: Math.max(0, value) };
          }
        }
        return item;
      })
    );
  };

  const getItemSubtotal = (item: CartItem) => {
    const basePrice = item.price * item.qty;
    const diskonFromPersen = Math.round(basePrice * (item.diskonPersen / 100));
    const totalItemDiskon = diskonFromPersen + item.diskonNominal;
    return Math.max(0, basePrice - totalItemDiskon);
  };

  const getItemTotalDiskon = (item: CartItem) => {
    const basePrice = item.price * item.qty;
    const diskonFromPersen = Math.round(basePrice * (item.diskonPersen / 100));
    return diskonFromPersen + item.diskonNominal;
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
    
    // Input validation
    if (qty <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }
    
    if (product.price < 0) {
      toast.error('Harga tidak boleh negatif');
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

  // Subtotal sebelum diskon global (setelah diskon per item)
  const subtotalAfterItemDiskon = cart.reduce((sum, item) => sum + getItemSubtotal(item), 0);
  const totalItemDiskon = cart.reduce((sum, item) => sum + getItemTotalDiskon(item), 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = 0; // No tax for baja ringan store
  
  // Calculate global discount
  const diskonFromPersen = Math.round(subtotalAfterItemDiskon * (diskonPersen / 100));
  const globalDiskon = diskonFromPersen + diskonNominal;
  const totalDiskon = totalItemDiskon + globalDiskon;
  const total = Math.max(0, subtotalAfterItemDiskon - globalDiskon + tax);

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
      diskon: totalDiskon,
      itemDiskon: totalItemDiskon,
      globalDiskon: globalDiskon,
      diskonPersen: diskonPersen,
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
        ${receipt.items.map(item => {
          const itemDiskon = (item.diskonPersen > 0 ? Math.round(item.price * item.qty * item.diskonPersen / 100) : 0) + (item.diskonNominal || 0);
          const itemTotal = item.qty * item.price - itemDiskon;
          return `
          <div>
            <div>${item.name}</div>
            <div class="item">
              <span class="item-detail">${item.qty} ${item.unit} x Rp ${item.price.toLocaleString('id-ID')}</span>
              <span>Rp ${(item.qty * item.price).toLocaleString('id-ID')}</span>
            </div>
            ${itemDiskon > 0 ? `<div class="item" style="color: #dc2626; font-size: 8px;"><span>Disk${item.diskonPersen > 0 ? ` ${item.diskonPersen}%` : ''}:</span><span>-Rp ${itemDiskon.toLocaleString('id-ID')}</span></div>` : ''}
          </div>
          `;
        }).join('')}
        <div class="divider"></div>
        <div class="total-section">
          <div class="item"><span>Subtotal:</span><span>Rp ${receipt.subtotal.toLocaleString('id-ID')}</span></div>
          ${receipt.itemDiskon > 0 ? `<div class="item" style="color: #dc2626;"><span>Diskon Item:</span><span>-Rp ${receipt.itemDiskon.toLocaleString('id-ID')}</span></div>` : ''}
          ${receipt.globalDiskon > 0 ? `<div class="item" style="color: #dc2626;"><span>Diskon Global${receipt.diskonPersen > 0 ? ` (${receipt.diskonPersen}%)` : ''}:</span><span>-Rp ${receipt.globalDiskon.toLocaleString('id-ID')}</span></div>` : ''}
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

  const handleSaveTransaction = async () => {
    // Validate: if belum lunas, customer name is required
    if (statusBayar === 'belum_lunas' && !customerName.trim()) {
      toast.error('Nama pelanggan wajib diisi untuk transaksi belum lunas');
      return;
    }

    const receipt = generateReceipt();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    
    const itemsData = cart.map(item => ({
      productId: item.id,
      nama: item.name,
      qty: item.qty,
      harga: item.price,
      satuan: item.unit,
      diskonPersen: item.diskonPersen,
      diskonNominal: item.diskonNominal,
    }));

    // Determine actual payment amount
    let actualBayar = receipt.cashAmount;
    let actualKembalian = receipt.change;
    if (statusBayar === 'belum_lunas') {
      actualBayar = parseInt(jumlahBayarParsial) || 0;
      actualKembalian = 0;
    }
    
    // Save transaction with status 'Selesai' so stock trigger fires
    await createTransaction({
      tanggal: `${dateStr} ${timeStr}`,
      pelanggan: receipt.customer,
      items: cart.map(item => `${item.name} x${item.qty}`).join(', '),
      itemsData,
      subtotal: receipt.subtotal,
      diskon: receipt.diskon,
      diskonPersen: receipt.diskonPersen,
      total: receipt.total,
      bayar: actualBayar,
      kembalian: actualKembalian,
      metode: receipt.paymentMethod === 'tunai' ? 'Cash' : receipt.paymentMethod === 'transfer' ? 'Transfer' : 'Kartu',
      status: 'Selesai',
    });

    // Auto-create piutang if belum lunas
    if (statusBayar === 'belum_lunas') {
      const sisaBayar = total - (parseInt(jumlahBayarParsial) || 0);
      if (sisaBayar > 0) {
        const trxId = `TRX${now.getTime().toString().slice(-8)}`;
        await createTransactionDebt(trxId, customerName, sisaBayar);
        toast.success(`Transaksi disimpan & piutang ${formatRupiah(sisaBayar)} tercatat`);
      }
    } else {
      toast.success(`Transaksi berhasil disimpan & stok diperbarui`);
    }
    
    setCart([]);
    setCustomerName('');
    setCashAmount('');
    setDiskonPersen(0);
    setDiskonNominal(0);
    setStatusBayar('lunas');
    setJumlahBayarParsial('');
    setShowCheckout(false);
  };

  const handlePrintAndSave = async () => {
    handlePrint();
    await handleSaveTransaction();
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Products section */}
      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <div className="mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">Kasir</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <Input
              placeholder="Cari produk baja ringan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 md:pl-10 text-sm md:text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer hover:shadow-card-hover hover:border-primary/50 transition-all"
              onClick={() => addToCart(product)}
            >
              <CardContent className="p-3 md:p-4">
                <div className="w-full h-12 md:h-16 rounded-lg bg-muted flex items-center justify-center mb-2 md:mb-3">
                  <Package className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground text-xs md:text-sm truncate">{product.nama}</h3>
                <p className="text-xs text-muted-foreground truncate">{product.kategori}</p>
                <div className="flex items-center justify-between mt-1 md:mt-2">
                  <p className="text-xs md:text-sm font-bold text-primary">{formatRupiah(product.hargaJual || 0)}</p>
                  <span className="text-xs text-muted-foreground">{product.stok} {product.satuan}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart section - Fixed on mobile, sidebar on desktop */}
      <div className="w-full md:w-80 lg:w-96 bg-card border-t md:border-l md:border-t-0 border-border flex flex-col max-h-[50vh] md:max-h-full">
        <div className="p-4 md:p-6 border-b border-border">
          <h2 className="text-base md:text-lg font-semibold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />
            Keranjang
            {cart.length > 0 && (
              <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {cart.reduce((sum, item) => sum + item.qty, 0)}
              </span>
            )}
          </h2>
          {/* Customer name input */}
          <div className="mt-3 md:mt-4 relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Nama Pelanggan (opsional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-3 md:p-4 space-y-2 md:space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-8 md:py-12 text-muted-foreground">
              <ShoppingCart className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-50" />
              <p className="text-sm">Keranjang kosong</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="bg-muted/50 rounded-lg p-2 md:p-3">
                <div className="flex items-start justify-between mb-1 md:mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-xs md:text-sm truncate">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{formatRupiah(item.price)}/{item.unit}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 md:h-7 md:w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 md:h-8 md:w-8"
                      onClick={() => updateQty(item.id, -1)}
                    >
                      <Minus className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                    <Input
                      type="number"
                      value={item.qty}
                      onChange={(e) => setQty(item.id, parseInt(e.target.value) || 0)}
                      className="w-12 md:w-16 h-7 md:h-8 text-center text-xs md:text-sm"
                      min={1}
                      max={item.stock}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 md:h-8 md:w-8"
                      onClick={() => updateQty(item.id, 1)}
                    >
                      <Plus className="w-3 h-3 md:w-4 md:h-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground text-xs md:text-sm">
                      {formatRupiah(item.price * item.qty)}
                    </p>
                    {getItemTotalDiskon(item) > 0 && (
                      <p className="text-xs text-destructive">-{formatRupiah(getItemTotalDiskon(item))}</p>
                    )}
                  </div>
                </div>
                {/* Per-item discount */}
                <div className="flex items-center gap-1 pt-1 border-t border-border/50">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Disk:</span>
                  <div className="flex-1 relative">
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.diskonPersen || ''}
                      onChange={(e) => updateItemDiskon(item.id, 'persen', parseInt(e.target.value) || 0)}
                      className="pr-5 text-xs h-6"
                      min={0}
                      max={100}
                    />
                    <Percent className="absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Rp"
                      value={item.diskonNominal || ''}
                      onChange={(e) => updateItemDiskon(item.id, 'nominal', parseInt(e.target.value) || 0)}
                      className="text-xs h-6"
                      min={0}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discount & Totals */}
        <div className="p-3 md:p-4 border-t border-border space-y-3 md:space-y-4">
          {/* Discount Section */}
          {cart.length > 0 && (
            <div className="space-y-2 p-2 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Tag className="w-3 h-3" /> Diskon Global
              </p>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    placeholder="0"
                    value={diskonPersen || ''}
                    onChange={(e) => setDiskonPersen(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="pr-7 text-xs h-8"
                    min={0}
                    max={100}
                  />
                  <Percent className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                </div>
                <div className="flex-1 relative">
                  <Input
                    type="number"
                    placeholder="Rp 0"
                    value={diskonNominal || ''}
                    onChange={(e) => setDiskonNominal(Math.max(0, parseInt(e.target.value) || 0))}
                    className="text-xs h-8"
                    min={0}
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-1 md:space-y-2">
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatRupiah(subtotal)}</span>
            </div>
            {totalItemDiskon > 0 && (
              <div className="flex justify-between text-xs md:text-sm text-destructive">
                <span>Diskon Item</span>
                <span>-{formatRupiah(totalItemDiskon)}</span>
              </div>
            )}
            {globalDiskon > 0 && (
              <div className="flex justify-between text-xs md:text-sm text-destructive">
                <span>Diskon Global{diskonPersen > 0 ? ` (${diskonPersen}%)` : ''}</span>
                <span>-{formatRupiah(globalDiskon)}</span>
              </div>
            )}
            <div className="flex justify-between text-base md:text-lg font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatRupiah(total)}</span>
            </div>
          </div>

          <Button 
            className="w-full gap-2 bg-gradient-primary text-sm md:text-base" 
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
        <DialogContent className="max-w-md mx-4 md:mx-auto">
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

            {/* Status Pembayaran */}
            <div className="space-y-2">
              <Label>Status Pembayaran</Label>
              <RadioGroup 
                value={statusBayar} 
                onValueChange={(v) => setStatusBayar(v as 'lunas' | 'belum_lunas')}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2 p-2 md:p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="lunas" id="lunas" />
                  <Label htmlFor="lunas" className="cursor-pointer text-xs md:text-sm font-medium">Lunas</Label>
                </div>
                <div className="flex items-center space-x-2 p-2 md:p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="belum_lunas" id="belum_lunas" />
                  <Label htmlFor="belum_lunas" className="cursor-pointer text-xs md:text-sm font-medium">Belum Lunas</Label>
                </div>
              </RadioGroup>
            </div>

            {/* If belum lunas, show partial payment input */}
            {statusBayar === 'belum_lunas' && (
              <div className="space-y-2 p-3 border border-warning/30 rounded-lg bg-warning/5">
                <Label>Jumlah Bayar (sebagian)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={jumlahBayarParsial}
                  onChange={(e) => setJumlahBayarParsial(e.target.value)}
                />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sisa (Piutang)</span>
                  <span className="font-bold text-destructive">
                    {formatRupiah(Math.max(0, total - (parseInt(jumlahBayarParsial) || 0)))}
                  </span>
                </div>
                {!customerName.trim() && (
                  <p className="text-xs text-destructive">* Nama pelanggan wajib diisi</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={(v) => setPaymentMethod(v as any)}
                className="grid grid-cols-3 gap-2"
              >
                <div className="flex items-center space-x-2 p-2 md:p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="tunai" id="tunai" />
                  <Label htmlFor="tunai" className="cursor-pointer flex items-center gap-1 text-xs md:text-sm">
                    <Banknote className="w-3 h-3 md:w-4 md:h-4" /> Tunai
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-2 md:p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer" className="cursor-pointer text-xs md:text-sm">Transfer</Label>
                </div>
                <div className="flex items-center space-x-2 p-2 md:p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="kartu" id="kartu" />
                  <Label htmlFor="kartu" className="cursor-pointer flex items-center gap-1 text-xs md:text-sm">
                    <CreditCard className="w-3 h-3 md:w-4 md:h-4" /> Kartu
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === 'tunai' && statusBayar === 'lunas' && (
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
