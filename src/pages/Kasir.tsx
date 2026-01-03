import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRupiah } from '@/components/RupiahIcon';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface CartItem extends Product {
  qty: number;
}

const sampleProducts: Product[] = [
  { id: '1', name: 'Indomie Goreng', price: 3500, category: 'Makanan' },
  { id: '2', name: 'Aqua 600ml', price: 4000, category: 'Minuman' },
  { id: '3', name: 'Roti Tawar', price: 15000, category: 'Makanan' },
  { id: '4', name: 'Teh Botol 450ml', price: 5000, category: 'Minuman' },
  { id: '5', name: 'Sabun Mandi', price: 8500, category: 'Perawatan' },
  { id: '6', name: 'Shampoo Sachet', price: 1500, category: 'Perawatan' },
  { id: '7', name: 'Kopi Sachet', price: 2000, category: 'Minuman' },
  { id: '8', name: 'Biskuit Roma', price: 12000, category: 'Makanan' },
];

export default function Kasir() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');

  const filteredProducts = sampleProducts.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Products section */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-4">Kasir</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Cari produk..."
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
                <div className="w-full h-20 rounded-lg bg-muted flex items-center justify-center mb-3">
                  <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground truncate">{product.name}</h3>
                <p className="text-sm text-muted-foreground">{product.category}</p>
                <p className="text-lg font-bold text-primary mt-2">{formatRupiah(product.price)}</p>
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
                  <div>
                    <h4 className="font-medium text-foreground">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{formatRupiah(item.price)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
                    <span className="w-8 text-center font-medium">{item.qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQty(item.id, 1)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="font-semibold text-foreground">
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
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pajak (10%)</span>
              <span className="font-medium">{formatRupiah(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatRupiah(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="gap-2" disabled={cart.length === 0}>
              <CreditCard className="w-4 h-4" />
              Kartu
            </Button>
            <Button className="gap-2 bg-gradient-primary" disabled={cart.length === 0}>
              <Banknote className="w-4 h-4" />
              Tunai
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
