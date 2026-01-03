import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatRupiah } from '@/components/RupiahIcon';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Package,
  Filter,
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

const sampleProducts = [
  { id: '1', name: 'Indomie Goreng', sku: 'SKU001', price: 3500, stock: 150, category: 'Makanan' },
  { id: '2', name: 'Aqua 600ml', sku: 'SKU002', price: 4000, stock: 200, category: 'Minuman' },
  { id: '3', name: 'Roti Tawar', sku: 'SKU003', price: 15000, stock: 25, category: 'Makanan' },
  { id: '4', name: 'Teh Botol 450ml', sku: 'SKU004', price: 5000, stock: 100, category: 'Minuman' },
  { id: '5', name: 'Sabun Mandi', sku: 'SKU005', price: 8500, stock: 75, category: 'Perawatan' },
  { id: '6', name: 'Shampoo Sachet', sku: 'SKU006', price: 1500, stock: 300, category: 'Perawatan' },
  { id: '7', name: 'Kopi Sachet', sku: 'SKU007', price: 2000, stock: 500, category: 'Minuman' },
  { id: '8', name: 'Biskuit Roma', sku: 'SKU008', price: 12000, stock: 45, category: 'Makanan' },
];

export default function Produk() {
  const [search, setSearch] = useState('');

  const filteredProducts = sampleProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produk</h1>
          <p className="text-muted-foreground">Kelola daftar produk toko Anda</p>
        </div>
        <Button className="gap-2 bg-gradient-primary">
          <Plus className="w-4 h-4" />
          Tambah Produk
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">156</p>
              <p className="text-sm text-muted-foreground">Total Produk</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">142</p>
              <p className="text-sm text-muted-foreground">Stok Tersedia</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">10</p>
              <p className="text-sm text-muted-foreground">Stok Menipis</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">4</p>
              <p className="text-sm text-muted-foreground">Stok Habis</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and filter */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Cari produk atau SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produk</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-right">Stok</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatRupiah(product.price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        product.stock < 30
                          ? 'text-destructive font-medium'
                          : product.stock < 50
                          ? 'text-warning font-medium'
                          : 'text-foreground'
                      }
                    >
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
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
    </div>
  );
}
