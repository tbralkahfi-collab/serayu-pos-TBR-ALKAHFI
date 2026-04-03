import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase, testSupabaseConnection } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import type { 
  Product, 
  Supplier, 
  Purchase, 
  PurchaseItem,
  DebtRecord, 
  Expense, 
  Transaction, 
  TransactionItem,
  Project,
  ProjectMaterial,
  CacheData,
  DataContextType,
  PaymentHistory,
} from '@/types/data';
import { 
  loadCacheData, 
  saveCacheData, 
  clearCacheData,
  parsePayments,
  parseMaterials,
  parsePurchaseItems,
  parseTransactionItems,
  formatItemsString,
  debounce
} from '@/utils/cache';

// Re-export types for pages that import from DataContext
export type { 
  Product, Supplier, Purchase, PurchaseItem, DebtRecord, Expense, 
  Transaction, TransactionItem, Project, ProjectMaterial, PaymentHistory,
  DataContextType 
} from '@/types/data';

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isAuthLoading } = useAuth();
  const hasFetched = useRef(false);
  
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Cache wrapper functions
  const loadCache = (userId: string): CacheData | null => loadCacheData(userId);
  const saveCache = (userId: string, data: Omit<CacheData, 'timestamp'>): void => saveCacheData(userId, data);
  const clearCache = (userId?: string): void => clearCacheData(userId);

  // Helper: map DB purchase to app Purchase
  const mapPurchase = (p: any): Purchase => ({
    id: p.id,
    supplierId: p.supplier_id || '',
    supplier: p.supplier_name || '',
    date: p.tanggal || '',
    tanggal: p.tanggal || '',
    items: formatItemsString(parsePurchaseItems(p.items)),
    itemsData: parsePurchaseItems(p.items),
    total: Number(p.total) || 0,
    dp: Number(p.dp) || 0,
    paymentMethod: p.metode_bayar || 'cash',
    status: p.status || 'Pending',
    notes: p.catatan || '',
  });

  // Helper: map DB debt to app DebtRecord
  const mapDebt = (d: any): DebtRecord => ({
    id: d.id,
    type: d.type as 'utang' | 'piutang',
    nama: d.nama,
    total: Number(d.total) || 0,
    sisa: Number(d.sisa) || 0,
    tanggal: d.tanggal || '',
    jatuhTempo: d.jatuh_tempo || '',
    keterangan: d.keterangan || '',
    catatan: d.keterangan || '',
    payments: parsePayments(d.payments),
    projectId: d.project_id || undefined,
  });

  // Helper: map DB transaction to app Transaction
  const mapTransaction = (t: any): Transaction => {
    const itemsArr = parseTransactionItems(t.items);
    return {
      id: t.id,
      tanggal: t.tanggal || '',
      pelanggan: t.pelanggan || 'Umum',
      items: formatItemsString(itemsArr),
      itemsData: itemsArr,
      subtotal: Number(t.subtotal) || 0,
      diskon: Number(t.diskon) || 0,
      diskonPersen: Number(t.diskon_persen) || 0,
      total: Number(t.total) || 0,
      bayar: Number(t.bayar) || 0,
      kembalian: Number(t.kembalian) || 0,
      metode: t.metode || 'Cash',
      status: t.status || 'Selesai',
    };
  };

  // Helper: map DB project to app Project
  const mapProject = (p: any): Project => ({
    id: p.id,
    namaProyek: p.nama_proyek || '',
    pelanggan: p.pelanggan || '',
    alamat: p.alamat || '',
    telepon: p.telepon || '',
    deskripsi: p.deskripsi || '',
    nilaiKontrak: Number(p.nilai_kontrak) || 0,
    diskonPersen: Number(p.diskon_persen) || 0,
    diskonNominal: Number(p.diskon_nominal) || 0,
    dp: Number(p.dp) || 0,
    biayaTenagaKerja: Number(p.biaya_tenaga_kerja) || 0,
    tanggalOrder: p.tanggal_order || '',
    tanggalMulai: p.tanggal_mulai || '',
    tanggalSelesai: p.tanggal_selesai || '',
    status: p.status || 'Pending',
    catatan: p.catatan || '',
    materials: parseMaterials(p.materials),
  });

  // Helper: map DB supplier to app Supplier
  const mapSupplier = (s: any): Supplier => ({
    id: s.id,
    nama: s.nama || '',
    alamat: s.alamat || '',
    telepon: s.telepon || '',
    email: s.email || '',
    catatan: s.catatan || '',
  });

  // Helper: map DB expense to app Expense
  const mapExpense = (e: any): Expense => ({
    id: e.id,
    kategori: e.kategori || '',
    deskripsi: e.deskripsi || '',
    jumlah: Number(e.jumlah) || 0,
    tanggal: e.tanggal || '',
  });

  // Load functions
  const loadProducts = useCallback(async () => {
    if (isAuthLoading || !user) return;
    try {
      const { data, error } = await supabase
        .from('products').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) { console.error('Error loading products:', error); return; }
      setProducts(data.map(product => ({
        id: product.id, nama: product.nama, kategori: product.kategori,
        hargaBeli: Number(product.harga_beli), hargaJual: Number(product.harga_jual),
        stok: product.stok, satuan: product.satuan, minStok: product.min_stok ?? undefined,
      })));
    } catch (error) { console.error('Error loading products:', error); }
  }, [user, isAuthLoading]);

  const loadSuppliers = useCallback(async () => {
    if (isAuthLoading || !user) return;
    try {
      const { data, error } = await supabase
        .from('suppliers').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) { console.error('Error loading suppliers:', error); return; }
      setSuppliers((data || []).map(mapSupplier));
    } catch (error) { console.error('Error loading suppliers:', error); }
  }, [user, isAuthLoading]);

  const loadPurchases = useCallback(async () => {
    if (isAuthLoading || !user) return;
    try {
      const { data, error } = await supabase
        .from('purchases').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) { console.error('Error loading purchases:', error); return; }
      setPurchases((data || []).map(mapPurchase));
    } catch (error) { console.error('Error loading purchases:', error); }
  }, [user, isAuthLoading]);

  const loadDebts = useCallback(async () => {
    if (isAuthLoading || !user) return;
    try {
      const { data, error } = await supabase
        .from('debts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) { console.error('Error loading debts:', error); return; }
      setDebts((data || []).map(mapDebt));
    } catch (error) { console.error('Error loading debts:', error); }
  }, [user, isAuthLoading]);

  const loadExpenses = useCallback(async () => {
    if (isAuthLoading || !user) return;
    try {
      const { data, error } = await supabase
        .from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) { console.error('Error loading expenses:', error); return; }
      setExpenses((data || []).map(mapExpense));
    } catch (error) { console.error('Error loading expenses:', error); }
  }, [user, isAuthLoading]);

  const loadTransactions = useCallback(async () => {
    if (isAuthLoading || !user) return;
    try {
      const { data, error } = await supabase
        .from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) { console.error('Error loading transactions:', error); return; }
      setTransactions((data || []).map(mapTransaction));
    } catch (error) { console.error('Error loading transactions:', error); }
  }, [user, isAuthLoading]);

  const loadProjects = useCallback(async () => {
    if (isAuthLoading || !user) return;
    try {
      const { data, error } = await supabase
        .from('projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) { console.error('Error loading projects:', error); return; }
      setProjects((data || []).map(mapProject));
    } catch (error) { console.error('Error loading projects:', error); }
  }, [user, isAuthLoading]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadProducts(), loadSuppliers(), loadPurchases(), loadDebts(),
      loadExpenses(), loadTransactions(), loadProjects(),
    ]);
  }, [loadProducts, loadSuppliers, loadPurchases, loadDebts, loadExpenses, loadTransactions, loadProjects]);

  // Initial data fetch
  const fetchInitialData = useCallback(async () => {
    if (isAuthLoading || hasFetched.current) return;
    hasFetched.current = true;

    if (!user) {
      setProducts([]); setSuppliers([]); setPurchases([]); setDebts([]);
      setExpenses([]); setTransactions([]); setProjects([]);
      setIsLoading(false); setIsHydrated(false); clearCache();
      return;
    }

    try {
      const cachedData = loadCache(user.id);
      if (cachedData) {
        setProducts(cachedData.products); setSuppliers(cachedData.suppliers);
        setPurchases(cachedData.purchases); setDebts(cachedData.debts);
        setExpenses(cachedData.expenses); setTransactions(cachedData.transactions);
        setProjects(cachedData.projects);
        setIsHydrated(true); setIsLoading(false);
      }
      
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        if (!cachedData) {
          toast.error('Koneksi ke database gagal.');
          setIsLoading(false); setIsHydrated(false);
        } else {
          toast.warning('Mode offline - Menggunakan data tersimpan');
        }
        return;
      }

      await refreshData();
      setIsHydrated(true);
    } catch (error) {
      console.error('DataContext: Error in fetchInitialData:', error);
      toast.error('Gagal memuat data. Silakan refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthLoading, refreshData]);

  // Cache update
  const updateCacheAfterOperation = useCallback(() => {
    if (!user) return;
    saveCache(user.id, {
      products, suppliers, purchases, debts, expenses, transactions, projects,
      userId: user.id, version: '1.0'
    });
  }, [user, products, suppliers, purchases, debts, expenses, transactions, projects]);

  const debouncedUpdateCache = useCallback(
    debounce(updateCacheAfterOperation, 500),
    [updateCacheAfterOperation]
  );

  // ======== CRUD Functions ========

  const createProduct = async (product: Omit<Product, 'id'>) => {
    if (!user) { toast.error('User tidak terautentikasi'); throw new Error("Not authenticated"); }
    const productData: any = {
      user_id: user.id, nama: product.nama, kategori: product.kategori,
      harga_beli: product.hargaBeli, harga_jual: product.hargaJual,
      stok: product.stok, satuan: product.satuan, min_stok: product.minStok ?? null,
    };
    const { data, error } = await supabase.from("products").insert([productData]).select().single();
    if (error) { toast.error('Gagal menambah produk: ' + error.message); throw error; }
    if (data) {
      setProducts(prev => [{
        id: data.id, nama: data.nama, kategori: data.kategori,
        hargaBeli: Number(data.harga_beli), hargaJual: Number(data.harga_jual),
        stok: data.stok, satuan: data.satuan, minStok: data.min_stok ?? undefined,
      }, ...prev]);
      debouncedUpdateCache();
      toast.success('Produk berhasil ditambahkan');
    }
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    const updateData: Record<string, unknown> = {};
    if (product.nama !== undefined) updateData.nama = product.nama;
    if (product.kategori !== undefined) updateData.kategori = product.kategori;
    if (product.hargaBeli !== undefined) updateData.harga_beli = product.hargaBeli;
    if (product.hargaJual !== undefined) updateData.harga_jual = product.hargaJual;
    if (product.stok !== undefined) updateData.stok = product.stok;
    if (product.satuan !== undefined) updateData.satuan = product.satuan;
    if (product.minStok !== undefined) updateData.min_stok = product.minStok;
    const { data, error } = await supabase.from('products').update(updateData).eq('id', id).select().single();
    if (error) { toast.error('Gagal memperbarui produk'); return; }
    if (data) {
      setProducts(prev => prev.map(p => p.id === id ? {
        id: data.id, nama: data.nama, kategori: data.kategori,
        hargaBeli: Number(data.harga_beli), hargaJual: Number(data.harga_jual),
        stok: data.stok, satuan: data.satuan, minStok: data.min_stok ?? undefined,
      } : p));
      toast.success('Produk berhasil diperbarui');
      debouncedUpdateCache();
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { toast.error('Gagal menghapus produk'); return; }
    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Produk berhasil dihapus');
    debouncedUpdateCache();
  };

  const createSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('suppliers').insert({
      user_id: user.id, nama: supplier.nama, alamat: supplier.alamat,
      telepon: supplier.telepon, email: supplier.email, catatan: supplier.catatan,
    }).select().single();
    if (error) { toast.error('Gagal menambah supplier'); throw error; }
    const newSupplier = mapSupplier(data);
    setSuppliers(prev => [newSupplier, ...prev]);
    debouncedUpdateCache();
    return newSupplier;
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    const { data, error } = await supabase.from('suppliers').update(supplier).eq('id', id).select().single();
    if (error) { toast.error('Gagal memperbarui supplier'); return; }
    if (data) { setSuppliers(prev => prev.map(s => s.id === id ? mapSupplier(data) : s)); debouncedUpdateCache(); }
  };

  const deleteSupplier = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) { toast.error('Gagal menghapus supplier'); return; }
    setSuppliers(prev => prev.filter(s => s.id !== id));
    debouncedUpdateCache();
  };

  const createPurchase = async (purchase: Partial<Purchase>) => {
    if (!user) return;
    const { data, error } = await supabase.from('purchases').insert({
      user_id: user.id,
      supplier_id: purchase.supplierId || null,
      supplier_name: purchase.supplier || '',
      tanggal: purchase.date || new Date().toISOString().split('T')[0],
      total: purchase.total || 0,
      dp: purchase.dp || 0,
      metode_bayar: purchase.paymentMethod || 'cash',
      status: purchase.status || 'Pending',
      items: (purchase as any).itemsData || [] as unknown as Json,
      catatan: purchase.notes || '',
    }).select().single();
    if (error) { toast.error('Gagal menambah pembelian: ' + error.message); return; }
    if (data) { setPurchases(prev => [mapPurchase(data), ...prev]); debouncedUpdateCache(); }
  };

  const updatePurchase = async (id: string, purchase: Partial<Purchase>) => {
    if (!user) return;
    const updateData: Record<string, unknown> = {};
    if (purchase.supplierId !== undefined) updateData.supplier_id = purchase.supplierId;
    if (purchase.supplier !== undefined) updateData.supplier_name = purchase.supplier;
    if (purchase.date !== undefined) updateData.tanggal = purchase.date;
    if (purchase.total !== undefined) updateData.total = purchase.total;
    if (purchase.dp !== undefined) updateData.dp = purchase.dp;
    if (purchase.paymentMethod !== undefined) updateData.metode_bayar = purchase.paymentMethod;
    if (purchase.status !== undefined) updateData.status = purchase.status;
    if ((purchase as any).itemsData !== undefined) updateData.items = (purchase as any).itemsData;
    if (purchase.notes !== undefined) updateData.catatan = purchase.notes;
    const { data, error } = await supabase.from('purchases').update(updateData).eq('id', id).select().single();
    if (error) { toast.error('Gagal memperbarui pembelian'); return; }
    if (data) { setPurchases(prev => prev.map(p => p.id === id ? mapPurchase(data) : p)); debouncedUpdateCache(); }
  };

  const deletePurchase = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) { toast.error('Gagal menghapus pembelian'); return; }
    setPurchases(prev => prev.filter(p => p.id !== id));
    debouncedUpdateCache();
  };

  const createDebt = async (debt: Omit<DebtRecord, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('debts').insert({
      user_id: user.id, type: debt.type, nama: debt.nama,
      total: debt.total, sisa: debt.sisa || debt.total,
      tanggal: debt.tanggal || new Date().toISOString().split('T')[0],
      jatuh_tempo: debt.jatuhTempo || null,
      keterangan: debt.keterangan || '',
      project_id: debt.projectId || null,
      payments: (debt.payments || []) as unknown as Json,
    }).select().single();
    if (error) { toast.error('Gagal menambah utang/piutang'); return; }
    if (data) { setDebts(prev => [mapDebt(data), ...prev]); debouncedUpdateCache(); }
  };

  const updateDebt = async (id: string, debt: Partial<DebtRecord>) => {
    if (!user) return;
    const updateData: Record<string, unknown> = {};
    if (debt.nama !== undefined) updateData.nama = debt.nama;
    if (debt.total !== undefined) updateData.total = debt.total;
    if (debt.sisa !== undefined) updateData.sisa = debt.sisa;
    if (debt.jatuhTempo !== undefined) updateData.jatuh_tempo = debt.jatuhTempo;
    if (debt.keterangan !== undefined) updateData.keterangan = debt.keterangan;
    if (debt.payments !== undefined) updateData.payments = debt.payments as unknown as Json;
    const { data, error } = await supabase.from('debts').update(updateData).eq('id', id).select().single();
    if (error) { toast.error('Gagal memperbarui data'); return; }
    if (data) { setDebts(prev => prev.map(d => d.id === id ? mapDebt(data) : d)); debouncedUpdateCache(); }
  };

  const deleteDebt = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) { toast.error('Gagal menghapus data'); return; }
    setDebts(prev => prev.filter(d => d.id !== id));
    debouncedUpdateCache();
  };

  const createExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;
    const { data, error } = await supabase.from('expenses').insert({
      user_id: user.id, kategori: expense.kategori,
      deskripsi: expense.deskripsi, jumlah: expense.jumlah,
      tanggal: expense.tanggal || new Date().toISOString().split('T')[0],
    }).select().single();
    if (error) { toast.error('Gagal menambah biaya'); return; }
    if (data) { setExpenses(prev => [mapExpense(data), ...prev]); debouncedUpdateCache(); }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    if (!user) return;
    const { data, error } = await supabase.from('expenses').update(expense).eq('id', id).select().single();
    if (error) { toast.error('Gagal memperbarui biaya'); return; }
    if (data) { setExpenses(prev => prev.map(e => e.id === id ? mapExpense(data) : e)); debouncedUpdateCache(); }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) { toast.error('Gagal menghapus biaya'); return; }
    setExpenses(prev => prev.filter(e => e.id !== id));
    debouncedUpdateCache();
  };

  const createTransaction = async (transaction: Partial<Transaction>) => {
    if (!user) return;
    const { data, error } = await supabase.from('transactions').insert({
      user_id: user.id,
      tanggal: transaction.tanggal || new Date().toISOString(),
      pelanggan: transaction.pelanggan || 'Umum',
      items: ((transaction as any).itemsData || []) as unknown as Json,
      subtotal: transaction.subtotal || 0,
      diskon: transaction.diskon || 0,
      diskon_persen: transaction.diskonPersen || 0,
      total: transaction.total || 0,
      bayar: transaction.bayar || 0,
      kembalian: transaction.kembalian || 0,
      metode: transaction.metode || 'Cash',
      status: transaction.status || 'Selesai',
    }).select().single();
    if (error) { toast.error('Gagal menyimpan transaksi: ' + error.message); return; }
    if (data) { setTransactions(prev => [mapTransaction(data), ...prev]); debouncedUpdateCache(); }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    if (!user) return;
    const updateData: Record<string, unknown> = {};
    if (transaction.pelanggan !== undefined) updateData.pelanggan = transaction.pelanggan;
    if (transaction.metode !== undefined) updateData.metode = transaction.metode;
    if (transaction.status !== undefined) updateData.status = transaction.status;
    if (transaction.total !== undefined) updateData.total = transaction.total;
    if (transaction.bayar !== undefined) updateData.bayar = transaction.bayar;
    const { data, error } = await supabase.from('transactions').update(updateData).eq('id', id).select().single();
    if (error) { toast.error('Gagal memperbarui transaksi'); return; }
    if (data) { setTransactions(prev => prev.map(t => t.id === id ? mapTransaction(data) : t)); debouncedUpdateCache(); }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) { toast.error('Gagal menghapus transaksi'); return; }
    setTransactions(prev => prev.filter(t => t.id !== id));
    debouncedUpdateCache();
  };

  const createProject = async (project: Partial<Project>) => {
    if (!user) return;
    const { data, error } = await supabase.from('projects').insert({
      user_id: user.id,
      nama_proyek: project.namaProyek || '',
      pelanggan: project.pelanggan || '',
      alamat: project.alamat || '',
      telepon: project.telepon || '',
      deskripsi: project.deskripsi || '',
      nilai_kontrak: project.nilaiKontrak || 0,
      diskon_persen: project.diskonPersen || 0,
      diskon_nominal: project.diskonNominal || 0,
      dp: project.dp || 0,
      biaya_tenaga_kerja: project.biayaTenagaKerja || 0,
      tanggal_order: project.tanggalOrder || null,
      tanggal_mulai: project.tanggalMulai || null,
      tanggal_selesai: project.tanggalSelesai || null,
      status: project.status || 'Pending',
      catatan: project.catatan || '',
      materials: (project.materials || []) as unknown as Json,
    }).select().single();
    if (error) { toast.error('Gagal menambah proyek: ' + error.message); return; }
    if (data) { setProjects(prev => [mapProject(data), ...prev]); debouncedUpdateCache(); }
  };

  const updateProject = async (id: string, project: Partial<Project>) => {
    if (!user) return;
    const updateData: Record<string, unknown> = {};
    if (project.namaProyek !== undefined) updateData.nama_proyek = project.namaProyek;
    if (project.pelanggan !== undefined) updateData.pelanggan = project.pelanggan;
    if (project.alamat !== undefined) updateData.alamat = project.alamat;
    if (project.telepon !== undefined) updateData.telepon = project.telepon;
    if (project.deskripsi !== undefined) updateData.deskripsi = project.deskripsi;
    if (project.nilaiKontrak !== undefined) updateData.nilai_kontrak = project.nilaiKontrak;
    if (project.diskonPersen !== undefined) updateData.diskon_persen = project.diskonPersen;
    if (project.diskonNominal !== undefined) updateData.diskon_nominal = project.diskonNominal;
    if (project.dp !== undefined) updateData.dp = project.dp;
    if (project.biayaTenagaKerja !== undefined) updateData.biaya_tenaga_kerja = project.biayaTenagaKerja;
    if (project.tanggalOrder !== undefined) updateData.tanggal_order = project.tanggalOrder;
    if (project.tanggalMulai !== undefined) updateData.tanggal_mulai = project.tanggalMulai;
    if (project.tanggalSelesai !== undefined) updateData.tanggal_selesai = project.tanggalSelesai;
    if (project.status !== undefined) updateData.status = project.status;
    if (project.catatan !== undefined) updateData.catatan = project.catatan;
    if (project.materials !== undefined) updateData.materials = project.materials as unknown as Json;
    const { data, error } = await supabase.from('projects').update(updateData).eq('id', id).select().single();
    if (error) { toast.error('Gagal memperbarui proyek'); return; }
    if (data) { setProjects(prev => prev.map(p => p.id === id ? mapProject(data) : p)); debouncedUpdateCache(); }
  };

  const deleteProject = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) { toast.error('Gagal menghapus proyek'); return; }
    setProjects(prev => prev.filter(p => p.id !== id));
    debouncedUpdateCache();
  };

  // Extra functions used by pages
  const createTransactionDebt = async (trxId: string, customerName: string, amount: number) => {
    await createDebt({
      type: 'piutang', nama: customerName, total: amount, sisa: amount,
      tanggal: new Date().toISOString().split('T')[0],
      jatuhTempo: '', keterangan: `Piutang dari transaksi ${trxId}`, catatan: '',
      payments: [],
    });
  };

  const createPurchaseDebt = async (purchaseRef: string, supplierName: string, amount: number) => {
    await createDebt({
      type: 'utang', nama: supplierName, total: amount, sisa: amount,
      tanggal: new Date().toISOString().split('T')[0],
      jatuhTempo: '', keterangan: `Utang dari pembelian ${purchaseRef}`, catatan: '',
      payments: [],
    });
  };

  const addDebt = createDebt;

  const addPayment = async (debtId: string, payment: Omit<PaymentHistory, 'id'>) => {
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;
    const newPayment = { ...payment, id: crypto.randomUUID() };
    const updatedPayments = [...debt.payments, newPayment];
    const newSisa = debt.sisa - payment.jumlah;
    await updateDebt(debtId, { payments: updatedPayments as any, sisa: Math.max(0, newSisa) });
  };

  const createProjectDebt = async (projectId: string, name: string, amount: number, dueDate: string) => {
    await createDebt({
      type: 'piutang', nama: name, total: amount, sisa: amount,
      tanggal: new Date().toISOString().split('T')[0],
      jatuhTempo: dueDate, keterangan: `Piutang proyek`, catatan: '',
      payments: [], projectId,
    });
  };

  const getProjectDebts = (projectId: string): DebtRecord[] => {
    return debts.filter(d => d.projectId === projectId);
  };

  const removeRelatedDebt = async (refId: string) => {
    if (!user) return;
    // Find and delete debts related to the given reference ID
    const relatedDebts = debts.filter(d => d.keterangan?.includes(refId));
    for (const debt of relatedDebts) {
      await deleteDebt(debt.id);
    }
  };

  // Effects
  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    const productsSubscription = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProducts(prev => {
              if (prev.some(p => p.id === payload.new.id)) return prev;
              return [...prev, {
                id: payload.new.id, nama: payload.new.nama, kategori: payload.new.kategori,
                hargaBeli: Number(payload.new.harga_beli), hargaJual: Number(payload.new.harga_jual),
                stok: payload.new.stok, satuan: payload.new.satuan, minStok: payload.new.min_stok ?? undefined,
              }];
            });
          }
          if (payload.eventType === 'UPDATE') {
            setProducts(prev => prev.map(p => p.id === payload.new.id ? {
              ...p, nama: payload.new.nama, kategori: payload.new.kategori,
              hargaBeli: Number(payload.new.harga_beli), hargaJual: Number(payload.new.harga_jual),
              stok: payload.new.stok, satuan: payload.new.satuan, minStok: payload.new.min_stok ?? undefined,
            } : p));
          }
          if (payload.eventType === 'DELETE') {
            setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      ).subscribe();
    return () => { productsSubscription.unsubscribe(); };
  }, [user]);

  const value: DataContextType = {
    isLoading, isHydrated,
    products, suppliers, purchases, debts, expenses, transactions, projects,
    createProduct, updateProduct, deleteProduct,
    createSupplier, updateSupplier, deleteSupplier,
    createPurchase, updatePurchase, deletePurchase,
    createDebt, updateDebt, deleteDebt,
    createExpense, updateExpense, deleteExpense,
    createTransaction, updateTransaction, deleteTransaction,
    createProject, updateProject, deleteProject,
    createTransactionDebt, createPurchaseDebt, removeRelatedDebt, refreshData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
