import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Types
export interface Product {
  id: string;
  nama: string;
  kategori: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  satuan: string;
  minStok?: number;
  harga?: number; // Legacy support
}

export interface Supplier {
  id: string;
  nama: string;
  alamat: string;
  telepon: string;
  email: string;
  catatan: string;
}

export interface PurchaseItem {
  productId: string;
  nama: string;
  qty: number;
  satuan: string;
  harga: number;
  isManual: boolean;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplier: string;
  date: string;
  total: number;
  dp: number;
  paymentMethod: 'cash' | 'transfer';
  status: string;
  items: string;
  itemsData?: PurchaseItem[];
  notes: string;
}

export interface DebtRecord {
  id: string;
  type: 'utang' | 'piutang';
  nama: string;
  total: number;
  sisa: number;
  tanggal: string;
  jatuhTempo: string;
  keterangan: string;
  payments: PaymentHistory[];
  projectId?: string;
}

export interface PaymentHistory {
  id: string;
  tanggal: string;
  jumlah: number;
  metode: string;
  catatan: string;
}

export interface Expense {
  id: string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
  tanggal: string;
}

export interface TransactionItem {
  productId: string;
  nama: string;
  qty: number;
  harga: number;
  satuan: string;
  diskonPersen?: number;
  diskonNominal?: number;
}

export interface Transaction {
  id: string;
  tanggal: string;
  pelanggan: string;
  items: string;
  itemsData?: TransactionItem[];
  subtotal?: number;
  diskon?: number;
  diskonPersen?: number;
  total: number;
  bayar: number;
  kembalian: number;
  metode: string;
  status: string;
}

export interface ProjectMaterial {
  productId: string;
  productName: string;
  qty: number;
  satuan: string;
  harga: number;
}

export interface Project {
  id: string;
  namaProyek: string;
  pelanggan: string;
  alamat: string;
  telepon: string;
  deskripsi: string;
  nilaiKontrak: number;
  diskonPersen?: number;
  diskonNominal?: number;
  dp: number;
  biayaTenagaKerja: number;
  tanggalOrder: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: 'Pending' | 'Berjalan' | 'Selesai' | 'Dibatalkan';
  catatan: string;
  materials: ProjectMaterial[];
}

interface DataContextType {
  isLoading: boolean;
  // Data
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  debts: DebtRecord[];
  expenses: Expense[];
  transactions: Transaction[];
  projects: Project[];
  
  // Products CRUD
  createProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Suppliers CRUD
  createSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  // Purchases CRUD
  createPurchase: (purchase: Omit<Purchase, 'id'>) => Promise<void>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  
  // Debts CRUD
  createDebt: (debt: Omit<DebtRecord, 'id' | 'payments'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<DebtRecord>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  addPayment: (debtId: string, payment: Omit<PaymentHistory, 'id'>) => Promise<void>;
  
  // Expenses CRUD
  createExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Transactions CRUD
  createTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  
  // Projects CRUD
  createProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Helpers
  getProjectDebts: (projectId: string) => DebtRecord[];
  createProjectDebt: (projectId: string, projectName: string, amount: number, dueDate: string) => Promise<void>;
  createTransactionDebt: (transactionId: string, customerName: string, amount: number) => Promise<void>;
  createPurchaseDebt: (purchaseId: string, supplierName: string, amount: number) => Promise<void>;
  removeRelatedDebt: (keteranganSearch: string) => Promise<void>;
  updateRelatedDebt: (keteranganSearch: string, newAmount: number) => Promise<void>;
  
  // Manual refresh
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper functions
const parsePayments = (payments: Json): PaymentHistory[] => {
  if (!Array.isArray(payments)) return [];
  return payments as unknown as PaymentHistory[];
};

const parseMaterials = (materials: Json): ProjectMaterial[] => {
  if (!Array.isArray(materials)) return [];
  return materials as unknown as ProjectMaterial[];
};

const parsePurchaseItems = (items: Json): PurchaseItem[] => {
  if (!Array.isArray(items)) return [];
  return items as unknown as PurchaseItem[];
};

const parseTransactionItems = (items: Json): TransactionItem[] => {
  if (!Array.isArray(items)) return [];
  return items as unknown as TransactionItem[];
};

const formatItemsString = (itemsData: PurchaseItem[] | TransactionItem[]): string => {
  return itemsData.map(item => `${item.nama} x${item.qty}`).join(', ');
};

const normalizeTimestamptzInput = (value: string): string => {
  const v = (value || '').trim();
  if (!v) return v;
  if (v.includes('T')) return v;

  const m = v.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2})[.:](\d{2})(?::(\d{2}))?$/);
  if (m) {
    const [, date, hh, mm, ss] = m;
    const hh2 = hh.padStart(2, '0');
    return `${date} ${hh2}:${mm}${ss ? `:${ss}` : ''}`;
  }

  return v.replace(/(\d{4}-\d{2}-\d{2})\s+(\d{2})\.(\d{2})/, '$1 $2:$3');
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Load functions
  const loadProducts = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('nama');

    if (error) {
      console.error('Error loading products:', error);
      return;
    }

    if (data) {
      setProducts(data.map(p => ({
        id: p.id,
        nama: p.nama,
        kategori: p.kategori,
        hargaBeli: Number(p.harga_beli),
        hargaJual: Number(p.harga_jual),
        stok: p.stok,
        satuan: p.satuan,
        minStok: p.min_stok ?? undefined,
      })));
    }
  }, []);

  const loadSuppliers = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', user.id)
      .order('nama');

    if (error) {
      console.error('Error loading suppliers:', error);
      return;
    }

    if (data) {
      setSuppliers(data.map(s => ({
        id: s.id,
        nama: s.nama,
        alamat: s.alamat || '',
        telepon: s.telepon || '',
        email: s.email || '',
        catatan: s.catatan || '',
      })));
    }
  }, []);

  const loadPurchases = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .order('tanggal', { ascending: false });

    if (error) {
      console.error('Error loading purchases:', error);
      return;
    }

    if (data) {
      setPurchases(data.map(p => {
        const itemsData = parsePurchaseItems(p.items);
        return {
          id: p.id,
          supplierId: p.supplier_id || '',
          supplier: p.supplier_name,
          date: p.tanggal,
          total: Number(p.total),
          dp: Number(p.dp),
          paymentMethod: p.metode_bayar as 'cash' | 'transfer',
          status: p.status,
          items: formatItemsString(itemsData),
          itemsData,
          notes: p.catatan || '',
        };
      }));
    }
  }, [user]);

  const loadDebts = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading debts:', error);
      return;
    }

    if (data) {
      setDebts(data.map(d => ({
        id: d.id,
        type: d.type as 'utang' | 'piutang',
        nama: d.nama,
        total: Number(d.total),
        sisa: Number(d.sisa),
        tanggal: d.tanggal,
        jatuhTempo: d.jatuh_tempo || '',
        keterangan: d.keterangan || '',
        payments: parsePayments(d.payments),
        projectId: d.project_id ?? undefined,
      })));
    }
  }, []);

  const loadExpenses = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('tanggal', { ascending: false });

    if (error) {
      console.error('Error loading expenses:', error);
      return;
    }

    if (data) {
      setExpenses(data.map(e => ({
        id: e.id,
        kategori: e.kategori,
        deskripsi: e.deskripsi || '',
        jumlah: Number(e.jumlah),
        tanggal: e.tanggal,
      })));
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('tanggal', { ascending: false });

    if (error) {
      console.error('Error loading transactions:', error);
      return;
    }

    if (data) {
      setTransactions(data.map(t => {
        const itemsData = parseTransactionItems(t.items);
        return {
          id: t.id,
          tanggal: t.tanggal,
          pelanggan: t.pelanggan || 'Umum',
          items: formatItemsString(itemsData),
          itemsData,
          subtotal: Number(t.subtotal),
          diskon: Number(t.diskon),
          diskonPersen: Number(t.diskon_persen),
          total: Number(t.total),
          bayar: Number(t.bayar),
          kembalian: Number(t.kembalian),
          metode: t.metode,
          status: t.status,
        };
      }));
    }
  }, []);

  const loadProjects = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading projects:', error);
      return;
    }

    if (data) {
      setProjects(data.map(p => ({
        id: p.id,
        namaProyek: p.nama_proyek,
        pelanggan: p.pelanggan,
        alamat: p.alamat || '',
        telepon: p.telepon || '',
        deskripsi: p.deskripsi || '',
        nilaiKontrak: Number(p.nilai_kontrak),
        diskonPersen: p.diskon_persen ? Number(p.diskon_persen) : undefined,
        diskonNominal: p.diskon_nominal ? Number(p.diskon_nominal) : undefined,
        dp: Number(p.dp),
        biayaTenagaKerja: Number(p.biaya_tenaga_kerja || 0),
        tanggalOrder: p.tanggal_order || '',
        tanggalMulai: p.tanggal_mulai || '',
        tanggalSelesai: p.tanggal_selesai || '',
        status: p.status as Project['status'],
        catatan: p.catatan || '',
        materials: parseMaterials(p.materials),
      })));
    }
  }, []);

  // Initial data fetch - runs only once when user changes
  const fetchInitialData = useCallback(async () => {
    if (!user) {
      setProducts([]);
      setSuppliers([]);
      setPurchases([]);
      setDebts([]);
      setExpenses([]);
      setTransactions([]);
      setProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all([
        loadProducts(),
        loadSuppliers(),
        loadPurchases(),
        loadDebts(),
        loadExpenses(),
        loadTransactions(),
        loadProjects(),
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [user, loadProducts, loadSuppliers, loadPurchases, loadDebts, loadExpenses, loadTransactions, loadProjects]);

  // Single useEffect for initial fetch - NO LOOPS
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Realtime subscriptions - USER-SPECIFIC WITH FILTERING
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`db-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProducts(prev => {
              const exists = prev.some(p => p.id === payload.new.id);
              if (exists) return prev;
              return [...prev, {
                id: payload.new.id,
                nama: payload.new.nama,
                kategori: payload.new.kategori,
                hargaBeli: Number(payload.new.harga_beli),
                hargaJual: Number(payload.new.harga_jual),
                stok: payload.new.stok,
                satuan: payload.new.satuan,
                minStok: payload.new.min_stok ?? undefined,
              }];
            });
          }

          if (payload.eventType === 'UPDATE') {
            setProducts(prev =>
              prev.map(p => p.id === payload.new.id ? {
                ...p,
                nama: payload.new.nama,
                kategori: payload.new.kategori,
                hargaBeli: Number(payload.new.harga_beli),
                hargaJual: Number(payload.new.harga_jual),
                stok: payload.new.stok,
                satuan: payload.new.satuan,
                minStok: payload.new.min_stok ?? undefined,
              } : p)
            );
          }

          if (payload.eventType === 'DELETE') {
            setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProjects(prev => {
              const exists = prev.some(p => p.id === payload.new.id);
              if (exists) return prev;
              return [...prev, {
                id: payload.new.id,
                namaProyek: payload.new.nama_proyek,
                pelanggan: payload.new.pelanggan,
                alamat: payload.new.alamat || '',
                telepon: payload.new.telepon || '',
                deskripsi: payload.new.deskripsi || '',
                nilaiKontrak: Number(payload.new.nilai_kontrak),
                diskonPersen: payload.new.diskon_persen ? Number(payload.new.diskon_persen) : undefined,
                diskonNominal: payload.new.diskon_nominal ? Number(payload.new.diskon_nominal) : undefined,
                dp: Number(payload.new.dp),
                biayaTenagaKerja: Number(payload.new.biaya_tenaga_kerja || 0),
                tanggalOrder: payload.new.tanggal_order || '',
                tanggalMulai: payload.new.tanggal_mulai || '',
                tanggalSelesai: payload.new.tanggal_selesai || '',
                status: payload.new.status as Project['status'],
                catatan: payload.new.catatan || '',
                materials: parseMaterials(payload.new.materials),
              }];
            });
          }

          if (payload.eventType === 'UPDATE') {
            setProjects(prev =>
              prev.map(p => p.id === payload.new.id ? {
                ...p,
                namaProyek: payload.new.nama_proyek,
                pelanggan: payload.new.pelanggan,
                alamat: payload.new.alamat || '',
                telepon: payload.new.telepon || '',
                deskripsi: payload.new.deskripsi || '',
                nilaiKontrak: Number(payload.new.nilai_kontrak),
                diskonPersen: payload.new.diskon_persen ? Number(payload.new.diskon_persen) : undefined,
                diskonNominal: payload.new.diskon_nominal ? Number(payload.new.diskon_nominal) : undefined,
                dp: Number(payload.new.dp),
                biayaTenagaKerja: Number(payload.new.biaya_tenaga_kerja || 0),
                tanggalOrder: payload.new.tanggal_order || '',
                tanggalMulai: payload.new.tanggal_mulai || '',
                tanggalSelesai: payload.new.tanggal_selesai || '',
                status: payload.new.status as Project['status'],
                catatan: payload.new.catatan || '',
                materials: parseMaterials(payload.new.materials),
              } : p)
            );
          }

          if (payload.eventType === 'DELETE') {
            setProjects(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const itemsData = parseTransactionItems(payload.new.items);
            setTransactions(prev => {
              const exists = prev.some(t => t.id === payload.new.id);
              if (exists) return prev;
              return [...prev, {
                id: payload.new.id,
                tanggal: payload.new.tanggal,
                pelanggan: payload.new.pelanggan || 'Umum',
                items: formatItemsString(itemsData),
                itemsData,
                subtotal: Number(payload.new.subtotal),
                diskon: Number(payload.new.diskon),
                diskonPersen: Number(payload.new.diskon_persen),
                total: Number(payload.new.total),
                bayar: Number(payload.new.bayar),
                kembalian: Number(payload.new.kembalian),
                metode: payload.new.metode,
                status: payload.new.status,
              }];
            });
          }

          if (payload.eventType === 'UPDATE') {
            setTransactions(prev =>
              prev.map(t => t.id === payload.new.id ? {
                ...t,
                tanggal: payload.new.tanggal,
                pelanggan: payload.new.pelanggan || 'Umum',
                items: formatItemsString(parseTransactionItems(payload.new.items)),
                itemsData: parseTransactionItems(payload.new.items),
                subtotal: Number(payload.new.subtotal),
                diskon: Number(payload.new.diskon),
                diskonPersen: Number(payload.new.diskon_persen),
                total: Number(payload.new.total),
                bayar: Number(payload.new.bayar),
                kembalian: Number(payload.new.kembalian),
                metode: payload.new.metode,
                status: payload.new.status,
              } : t)
            );
          }

          if (payload.eventType === 'DELETE') {
            setTransactions(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchases',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const itemsData = parsePurchaseItems(payload.new.items);
            setPurchases(prev => {
              const exists = prev.some(p => p.id === payload.new.id);
              if (exists) return prev;
              return [...prev, {
                id: payload.new.id,
                supplierId: payload.new.supplier_id || '',
                supplier: payload.new.supplier_name,
                date: payload.new.tanggal,
                total: Number(payload.new.total),
                dp: Number(payload.new.dp),
                paymentMethod: payload.new.metode_bayar as 'cash' | 'transfer',
                status: payload.new.status,
                items: formatItemsString(itemsData),
                itemsData,
                notes: payload.new.catatan || '',
              }];
            });
          }

          if (payload.eventType === 'UPDATE') {
            setPurchases(prev =>
              prev.map(p => p.id === payload.new.id ? {
                ...p,
                supplierId: payload.new.supplier_id || '',
                supplier: payload.new.supplier_name,
                date: payload.new.tanggal,
                total: Number(payload.new.total),
                dp: Number(payload.new.dp),
                paymentMethod: payload.new.metode_bayar as 'cash' | 'transfer',
                status: payload.new.status,
                items: formatItemsString(parsePurchaseItems(payload.new.items)),
                itemsData: parsePurchaseItems(payload.new.items),
                notes: payload.new.catatan || '',
              } : p)
            );
          }

          if (payload.eventType === 'DELETE') {
            setPurchases(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // CRUD Functions - NO FETCH CALLS
  const createProduct = async (product: Omit<Product, 'id'>) => {
    if (!user) return;
    
    const { data, error } = await supabase.from('products').insert({
      user_id: user.id,
      nama: product.nama,
      kategori: product.kategori,
      harga_beli: product.hargaBeli,
      harga_jual: product.hargaJual,
      stok: product.stok,
      satuan: product.satuan,
      min_stok: product.minStok ?? null,
    }).select().single();

    if (error) {
      toast.error('Gagal menambah produk');
      console.error(error);
      return;
    }
    
    if (data) {
      const newProduct = {
        id: data.id,
        nama: data.nama,
        kategori: data.kategori,
        hargaBeli: Number(data.harga_beli),
        hargaJual: Number(data.harga_jual),
        stok: data.stok,
        satuan: data.satuan,
        minStok: data.min_stok ?? undefined,
      };
      setProducts(prev => [newProduct, ...prev]);
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
    if (error) {
      toast.error('Gagal memperbarui produk');
      console.error(error);
      return;
    }
    
    if (data) {
      setProducts(prev => prev.map(p => p.id === id ? {
        ...p,
        nama: data.nama,
        kategori: data.kategori,
        hargaBeli: Number(data.harga_beli),
        hargaJual: Number(data.harga_jual),
        stok: data.stok,
        satuan: data.satuan,
        minStok: data.min_stok ?? undefined,
      } : p));
      toast.success('Produk berhasil diperbarui');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Gagal menghapus produk');
      console.error(error);
      return;
    }
    // Immediate local state update
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const createSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase.from('suppliers').insert({
      user_id: user.id,
      nama: supplier.nama,
      alamat: supplier.alamat,
      telepon: supplier.telepon,
      email: supplier.email,
      catatan: supplier.catatan,
    }).select().single();
    
    if (error) {
      toast.error('Gagal menambah supplier');
      throw error;
    }
    
    const newSupplier = {
      id: data.id,
      nama: data.nama,
      alamat: data.alamat || '',
      telepon: data.telepon || '',
      email: data.email || '',
      catatan: data.catatan || '',
    };
    setSuppliers(prev => [newSupplier, ...prev]);
    toast.success('Supplier berhasil ditambahkan');
    return newSupplier;
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    const { data, error } = await supabase.from('suppliers').update(supplier).eq('id', id).select().single();
    if (error) {
      toast.error('Gagal memperbarui supplier');
      console.error(error);
      return;
    }
    
    if (data) {
      setSuppliers(prev => prev.map(s => s.id === id ? {
        ...s,
        nama: data.nama,
        alamat: data.alamat || '',
        telepon: data.telepon || '',
        email: data.email || '',
        catatan: data.catatan || '',
      } : s));
      toast.success('Supplier berhasil diperbarui');
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Gagal menghapus supplier');
      console.error(error);
      return;
    }
    // Immediate local state update
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const createPurchase = async (purchase: Omit<Purchase, 'id'>) => {
    if (!user) return;
    
    const itemsData: PurchaseItem[] = purchase.itemsData || [];
    
    const { data, error } = await supabase.from('purchases').insert({
      user_id: user.id,
      supplier_id: purchase.supplierId || null,
      supplier_name: purchase.supplier,
      tanggal: purchase.date,
      total: purchase.total,
      dp: purchase.dp,
      metode_bayar: purchase.paymentMethod,
      status: purchase.status,
      items: itemsData as unknown as Json,
      catatan: purchase.notes,
    }).select().single();

    if (error) {
      toast.error('Gagal menambah pembelian');
      console.error(error);
      return;
    }
    
    if (data) {
      const newPurchase = {
        id: data.id,
        supplierId: data.supplier_id || '',
        supplier: data.supplier_name,
        date: data.tanggal,
        total: Number(data.total),
        dp: Number(data.dp),
        paymentMethod: data.metode_bayar as 'cash' | 'transfer',
        status: data.status,
        items: formatItemsString(itemsData),
        itemsData,
        notes: data.catatan || '',
      };
      setPurchases(prev => [newPurchase, ...prev]);
      toast.success('Pembelian berhasil ditambahkan');
    }
  };

  const updatePurchase = async (id: string, purchase: Partial<Purchase>) => {
    const updateData: Record<string, unknown> = {};
    if (purchase.supplierId !== undefined) updateData.supplier_id = purchase.supplierId || null;
    if (purchase.supplier !== undefined) updateData.supplier_name = purchase.supplier;
    if (purchase.date !== undefined) updateData.tanggal = purchase.date;
    if (purchase.total !== undefined) updateData.total = purchase.total;
    if (purchase.dp !== undefined) updateData.dp = purchase.dp;
    if (purchase.paymentMethod !== undefined) updateData.metode_bayar = purchase.paymentMethod;
    if (purchase.status !== undefined) updateData.status = purchase.status;
    if (purchase.itemsData !== undefined) updateData.items = purchase.itemsData as unknown as Json;
    if (purchase.notes !== undefined) updateData.catatan = purchase.notes;

    const { data, error } = await supabase.from('purchases').update(updateData).eq('id', id).select().single();
    if (error) {
      toast.error('Gagal memperbarui pembelian');
      console.error(error);
      return;
    }
    
    if (data) {
      const itemsData = parsePurchaseItems(data.items);
      setPurchases(prev => prev.map(p => p.id === id ? {
        ...p,
        supplierId: data.supplier_id || '',
        supplier: data.supplier_name,
        date: data.tanggal,
        total: Number(data.total),
        dp: Number(data.dp),
        paymentMethod: data.metode_bayar as 'cash' | 'transfer',
        status: data.status,
        items: formatItemsString(itemsData),
        itemsData,
        notes: data.catatan || '',
      } : p));
      toast.success('Pembelian berhasil diperbarui');
    }
  };

  const deletePurchase = async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Gagal menghapus pembelian');
      console.error(error);
      return;
    }
    // Immediate local state update
    setPurchases(prev => prev.filter(p => p.id !== id));
    toast.success('Pembelian berhasil dihapus');
  };

  const createDebt = async (debt: Omit<DebtRecord, 'id' | 'payments'>) => {
    if (!user) return;
    
    const { error } = await supabase.from('debts').insert({
      user_id: user.id,
      type: debt.type,
      nama: debt.nama,
      total: debt.total,
      sisa: debt.sisa,
      tanggal: debt.tanggal,
      jatuh_tempo: debt.jatuhTempo || null,
      keterangan: debt.keterangan,
      project_id: debt.projectId || null,
      payments: [] as unknown as Json,
    });

    if (error) {
      toast.error('Gagal menambah utang/piutang');
      console.error(error);
    }
  };

  const updateDebt = async (id: string, debt: Partial<DebtRecord>) => {
    const updateData: Record<string, unknown> = {};
    if (debt.type !== undefined) updateData.type = debt.type;
    if (debt.nama !== undefined) updateData.nama = debt.nama;
    if (debt.total !== undefined) updateData.total = debt.total;
    if (debt.sisa !== undefined) updateData.sisa = debt.sisa;
    if (debt.tanggal !== undefined) updateData.tanggal = debt.tanggal;
    if (debt.jatuhTempo !== undefined) updateData.jatuh_tempo = debt.jatuhTempo;
    if (debt.keterangan !== undefined) updateData.keterangan = debt.keterangan;
    if (debt.payments !== undefined) updateData.payments = debt.payments as unknown as Json;
    if (debt.projectId !== undefined) updateData.project_id = debt.projectId;

    const { error } = await supabase.from('debts').update(updateData).eq('id', id);
    if (error) {
      toast.error('Gagal memperbarui utang/piutang');
      console.error(error);
    }
  };

  const deleteDebt = async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('debts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Gagal menghapus utang/piutang');
      console.error(error);
      return;
    }
    // Immediate local state update
    setDebts(prev => prev.filter(d => d.id !== id));
  };

  const addPayment = async (debtId: string, payment: Omit<PaymentHistory, 'id'>) => {
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;

    const newPayment: PaymentHistory = {
      ...payment,
      id: `PAY${Date.now()}`,
    };
    const updatedPayments = [...debt.payments, newPayment];
    const newSisa = debt.sisa - payment.jumlah;

    await updateDebt(debtId, { 
      payments: updatedPayments,
      sisa: Math.max(0, newSisa),
    });
  };

  const createExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;
    
    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      kategori: expense.kategori,
      deskripsi: expense.deskripsi,
      jumlah: expense.jumlah,
      tanggal: expense.tanggal,
    });

    if (error) {
      toast.error('Gagal menambah pengeluaran');
      console.error(error);
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    const { error } = await supabase.from('expenses').update(expense).eq('id', id);
    if (error) {
      toast.error('Gagal memperbarui pengeluaran');
      console.error(error);
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Gagal menghapus pengeluaran');
      console.error(error);
      return;
    }
    // Immediate local state update
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const createTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;
    
    const itemsData: TransactionItem[] = transaction.itemsData || [];
    
    const { data, error } = await supabase.from('transactions').insert({
      user_id: user.id,
      tanggal: normalizeTimestamptzInput(transaction.tanggal),
      pelanggan: transaction.pelanggan || 'Umum',
      items: itemsData as unknown as Json,
      subtotal: transaction.subtotal || transaction.total,
      diskon: transaction.diskon || 0,
      diskon_persen: transaction.diskonPersen || 0,
      total: transaction.total,
      bayar: transaction.bayar,
      kembalian: transaction.kembalian,
      metode: transaction.metode,
      status: transaction.status,
    }).select().single();

    if (error) {
      toast.error('Gagal menyimpan transaksi');
      console.error(error);
      return;
    }
    
    if (data) {
      const newTransaction = {
        id: data.id,
        tanggal: data.tanggal,
        pelanggan: data.pelanggan || 'Umum',
        items: formatItemsString(itemsData),
        itemsData,
        subtotal: Number(data.subtotal),
        diskon: Number(data.diskon),
        diskonPersen: Number(data.diskon_persen),
        total: Number(data.total),
        bayar: Number(data.bayar),
        kembalian: Number(data.kembalian),
        metode: data.metode,
        status: data.status,
      };
      setTransactions(prev => [newTransaction, ...prev]);
      toast.success('Transaksi berhasil disimpan');
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    const updateData: Record<string, unknown> = {};
    if (transaction.tanggal !== undefined) updateData.tanggal = normalizeTimestamptzInput(transaction.tanggal);
    if (transaction.pelanggan !== undefined) updateData.pelanggan = transaction.pelanggan;
    if (transaction.itemsData !== undefined) updateData.items = transaction.itemsData as unknown as Json;
    if (transaction.subtotal !== undefined) updateData.subtotal = transaction.subtotal;
    if (transaction.diskon !== undefined) updateData.diskon = transaction.diskon;
    if (transaction.diskonPersen !== undefined) updateData.diskon_persen = transaction.diskonPersen;
    if (transaction.total !== undefined) updateData.total = transaction.total;
    if (transaction.bayar !== undefined) updateData.bayar = transaction.bayar;
    if (transaction.kembalian !== undefined) updateData.kembalian = transaction.kembalian;
    if (transaction.metode !== undefined) updateData.metode = transaction.metode;
    if (transaction.status !== undefined) updateData.status = transaction.status;

    const { data, error } = await supabase.from('transactions').update(updateData).eq('id', id).select().single();
    if (error) {
      toast.error('Gagal memperbarui transaksi');
      console.error(error);
      return;
    }
    
    if (data) {
      const itemsData = parseTransactionItems(data.items);
      setTransactions(prev => prev.map(t => t.id === id ? {
        ...t,
        tanggal: data.tanggal,
        pelanggan: data.pelanggan || 'Umum',
        items: formatItemsString(itemsData),
        itemsData,
        subtotal: Number(data.subtotal),
        diskon: Number(data.diskon),
        diskonPersen: Number(data.diskon_persen),
        total: Number(data.total),
        bayar: Number(data.bayar),
        kembalian: Number(data.kembalian),
        metode: data.metode,
        status: data.status,
      } : t));
      toast.success('Transaksi berhasil diperbarui');
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Gagal menghapus transaksi');
      console.error(error);
      return;
    }
    // Immediate local state update
    setTransactions(prev => prev.filter(t => t.id !== id));
    toast.success('Transaksi berhasil dihapus');
  };

  const createProject = async (project: Omit<Project, 'id'>) => {
    if (!user) return;
    
    const { data, error } = await supabase.from('projects').insert({
      user_id: user.id,
      nama_proyek: project.namaProyek,
      pelanggan: project.pelanggan,
      alamat: project.alamat,
      telepon: project.telepon,
      deskripsi: project.deskripsi,
      nilai_kontrak: project.nilaiKontrak,
      diskon_persen: project.diskonPersen || 0,
      diskon_nominal: project.diskonNominal || 0,
      dp: project.dp,
      biaya_tenaga_kerja: project.biayaTenagaKerja,
      tanggal_order: project.tanggalOrder || null,
      tanggal_mulai: project.tanggalMulai || null,
      tanggal_selesai: project.tanggalSelesai || null,
      status: project.status,
      catatan: project.catatan,
      materials: project.materials as unknown as Json,
    }).select().single();

    if (error) {
      toast.error('Gagal menambah proyek');
      console.error(error);
      return;
    }
    
    if (data) {
      const newProject = {
        id: data.id,
        namaProyek: data.nama_proyek,
        pelanggan: data.pelanggan,
        alamat: data.alamat || '',
        telepon: data.telepon || '',
        deskripsi: data.deskripsi || '',
        nilaiKontrak: Number(data.nilai_kontrak),
        diskonPersen: data.diskon_persen ? Number(data.diskon_persen) : undefined,
        diskonNominal: data.diskon_nominal ? Number(data.diskon_nominal) : undefined,
        dp: Number(data.dp),
        biayaTenagaKerja: Number(data.biaya_tenaga_kerja || 0),
        tanggalOrder: data.tanggal_order || '',
        tanggalMulai: data.tanggal_mulai || '',
        tanggalSelesai: data.tanggal_selesai || '',
        status: data.status as Project['status'],
        catatan: data.catatan || '',
        materials: parseMaterials(data.materials),
      };
      setProjects(prev => [newProject, ...prev]);
      toast.success('Proyek berhasil ditambahkan');
    }
  };

  const updateProject = async (id: string, project: Partial<Project>) => {
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
    if (project.tanggalOrder !== undefined) updateData.tanggal_order = project.tanggalOrder || null;
    if (project.tanggalMulai !== undefined) updateData.tanggal_mulai = project.tanggalMulai || null;
    if (project.tanggalSelesai !== undefined) updateData.tanggal_selesai = project.tanggalSelesai || null;
    if (project.status !== undefined) updateData.status = project.status;
    if (project.catatan !== undefined) updateData.catatan = project.catatan;
    if (project.materials !== undefined) updateData.materials = project.materials as unknown as Json;

    const { data, error } = await supabase.from('projects').update(updateData).eq('id', id).select().single();
    if (error) {
      toast.error('Gagal memperbarui proyek');
      console.error(error);
      return;
    }
    
    if (data) {
      setProjects(prev => prev.map(p => p.id === id ? {
        ...p,
        namaProyek: data.nama_proyek,
        pelanggan: data.pelanggan,
        alamat: data.alamat || '',
        telepon: data.telepon || '',
        deskripsi: data.deskripsi || '',
        nilaiKontrak: Number(data.nilai_kontrak),
        diskonPersen: data.diskon_persen ? Number(data.diskon_persen) : undefined,
        diskonNominal: data.diskon_nominal ? Number(data.diskon_nominal) : undefined,
        dp: Number(data.dp),
        biayaTenagaKerja: Number(data.biaya_tenaga_kerja || 0),
        tanggalOrder: data.tanggal_order || '',
        tanggalMulai: data.tanggal_mulai || '',
        tanggalSelesai: data.tanggal_selesai || '',
        status: data.status as Project['status'],
        catatan: data.catatan || '',
        materials: parseMaterials(data.materials),
      } : p));
      toast.success('Proyek berhasil diperbarui');
    }
  };

  const deleteProject = async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Gagal menghapus proyek');
      console.error(error);
      return;
    }
    // Immediate local state update
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success('Proyek berhasil dihapus');
  };

  // Helper functions
  const getProjectDebts = (projectId: string) => debts.filter(d => d.projectId === projectId);
  
  const createProjectDebt = async (projectId: string, projectName: string, amount: number, dueDate: string) => {
    await createDebt({
      type: 'piutang',
      nama: projectName,
      total: amount,
      sisa: amount,
      tanggal: new Date().toISOString().split('T')[0],
      jatuhTempo: dueDate,
      keterangan: `Piutang dari proyek: ${projectName}`,
      projectId,
    });
  };

  const createTransactionDebt = async (transactionId: string, customerName: string, amount: number) => {
    if (amount <= 0) return;
    await createDebt({
      type: 'piutang',
      nama: customerName,
      total: amount,
      sisa: amount,
      tanggal: new Date().toISOString().split('T')[0],
      jatuhTempo: '',
      keterangan: `Piutang dari penjualan: ${transactionId}`,
    });
  };

  const createPurchaseDebt = async (purchaseId: string, supplierName: string, amount: number) => {
    if (amount <= 0) return;
    await createDebt({
      type: 'utang',
      nama: supplierName,
      total: amount,
      sisa: amount,
      tanggal: new Date().toISOString().split('T')[0],
      jatuhTempo: '',
      keterangan: `Utang dari pembelian: ${purchaseId}`,
    });
  };

  const removeRelatedDebt = async (keteranganSearch: string) => {
    const relatedDebt = debts.find(d => d.keterangan.includes(keteranganSearch));
    if (relatedDebt) {
      await deleteDebt(relatedDebt.id);
    }
  };

  const updateRelatedDebt = async (keteranganSearch: string, newAmount: number) => {
    const relatedDebt = debts.find(d => d.keterangan.includes(keteranganSearch));
    if (relatedDebt) {
      if (newAmount <= 0) {
        await deleteDebt(relatedDebt.id);
      } else {
        const paidSoFar = relatedDebt.total - relatedDebt.sisa;
        const newSisa = Math.max(0, newAmount - paidSoFar);
        await updateDebt(relatedDebt.id, { total: newAmount, sisa: newSisa });
      }
    }
  };

  const refreshData = async () => {
    await fetchInitialData();
  };

  return (
    <DataContext.Provider value={{
      isLoading,
      products,
      suppliers,
      purchases,
      debts,
      expenses,
      transactions,
      projects,
      
      // Products CRUD
      createProduct,
      updateProduct,
      deleteProduct,
      
      // Suppliers CRUD
      createSupplier,
      updateSupplier,
      deleteSupplier,
      
      // Purchases CRUD
      createPurchase,
      updatePurchase,
      deletePurchase,
      
      // Debts CRUD
      createDebt,
      updateDebt,
      deleteDebt,
      addPayment,
      
      // Expenses CRUD
      createExpense,
      updateExpense,
      deleteExpense,
      
      // Transactions CRUD
      createTransaction,
      updateTransaction,
      deleteTransaction,
      
      // Projects CRUD
      createProject,
      updateProject,
      deleteProject,
      
      // Helpers
      getProjectDebts,
      createProjectDebt,
      createTransactionDebt,
      createPurchaseDebt,
      removeRelatedDebt,
      updateRelatedDebt,
      refreshData,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
