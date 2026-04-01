import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase, testSupabaseConnection } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// ✅ TYPES DEFINED FIRST - BEFORE USAGE
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

// ✅ LOCAL CACHE LAYER - State persistence across refresh
interface CacheData {
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  debts: DebtRecord[];
  expenses: Expense[];
  transactions: Transaction[];
  projects: Project[];
  userId: string;
  timestamp: number;
  version: string;
}

const CACHE_VERSION = '1.0';
const CACHE_KEY_PREFIX = 'app_cache_';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_BACKUP_KEY = 'app_cache_backup_';

// ✅ CACHE FUNCTIONS
const getCacheKey = (userId: string) => `${CACHE_KEY_PREFIX}${userId}`;

const loadCache = (userId: string): CacheData | null => {
  try {
    const cacheKey = getCacheKey(userId);
    const backupKey = `${CACHE_BACKUP_KEY}${userId}`;
    
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const cacheData: CacheData = JSON.parse(cached);
      
      if (Date.now() - cacheData.timestamp > CACHE_EXPIRY_MS) {
        localStorage.removeItem(cacheKey);
        console.log('📦 Cache expired, checking backup...');
      } else {
        console.log('📦 Cache loaded from primary storage');
        return cacheData;
      }
    }
    
    const backup = localStorage.getItem(backupKey);
    if (backup) {
      console.log('📦 Using backup cache');
      const cacheData: CacheData = JSON.parse(backup);
      
      if (cacheData.userId === userId && cacheData.version === CACHE_VERSION) {
        saveCache(userId, cacheData);
        console.log('📦 Cache: Backup recovery successful');
        return cacheData;
      }
    }
    
    return null;
  } catch (error) {
    console.error('📦 Cache load error:', error);
    return null;
  }
};

const saveCache = (userId: string, data: Omit<CacheData, 'timestamp'>): void => {
  try {
    const cacheKey = getCacheKey(userId);
    const backupKey = `${CACHE_BACKUP_KEY}${userId}`;
    
    const cacheData: CacheData = {
      ...data,
      timestamp: Date.now(),
      userId,
      version: CACHE_VERSION,
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    localStorage.setItem(backupKey, JSON.stringify(cacheData));
    
    console.log('📦 Cache saved to primary and backup');
  } catch (error) {
    console.error('📦 Cache save error:', error);
  }
};

const clearCache = (userId?: string): void => {
  try {
    if (userId) {
      const cacheKey = getCacheKey(userId);
      const backupKey = `${CACHE_BACKUP_KEY}${userId}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(backupKey);
    } else {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX) || key.startsWith(CACHE_BACKUP_KEY)) {
          localStorage.removeItem(key);
        }
      });
    }
    console.log('📦 Cache cleared');
  } catch (error) {
    console.error('📦 Cache clear error:', error);
  }
};

interface DataContextType {
  isLoading: boolean;
  isHydrated: boolean;
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  debts: DebtRecord[];
  expenses: Expense[];
  transactions: Transaction[];
  projects: Project[];
  
  createProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  createSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  createPurchase: (purchase: Omit<Purchase, 'id'>) => Promise<void>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<boolean>;
  
  addDebt: (debt: Omit<DebtRecord, 'id' | 'payments'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<DebtRecord>) => Promise<void>;
  deleteDebt: (id: string) => Promise<boolean>;
  addPayment: (debtId: string, payment: Omit<PaymentHistory, 'id'>) => Promise<void>;
  
  createExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<boolean>;
  
  createTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<boolean>;
  
  createProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<boolean>;
  
  getProjectDebts: (projectId: string) => DebtRecord[];
  createProjectDebt: (projectId: string, projectName: string, amount: number, dueDate: string) => Promise<void>;
  createTransactionDebt: (transactionId: string, customerName: string, amount: number) => Promise<void>;
  createPurchaseDebt: (purchaseId: string, supplierName: string, amount: number) => Promise<void>;
  removeRelatedDebt: (keteranganSearch: string) => Promise<boolean>;
  updateRelatedDebt: (keteranganSearch: string, newAmount: number) => Promise<void>;
  
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
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const hasFetched = useRef(false);
  
  console.log('📊 DataContext: Auth state', { 
    userId: user?.id, 
    isAuthLoading,
    hasFetched: hasFetched.current 
  });
  
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
    if (isAuthLoading || !user) return;
    
    console.log('📦 Loading products for user:', user.id);
    
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('nama');

    if (error) {
      console.error('❌ Error loading products:', error);
      toast.error('Gagal memuat data produk');
      return;
    }

    if (data) {
      const products = data.map(p => ({
        id: p.id,
        nama: p.nama,
        kategori: p.kategori,
        hargaBeli: Number(p.harga_beli),
        hargaJual: Number(p.harga_jual),
        stok: p.stok,
        satuan: p.satuan,
        minStok: p.min_stok ?? undefined,
      }));
      
      console.log('✅ Products loaded from Supabase:', products.length);
      setProducts(products);
    }
  }, [user, isAuthLoading]);

  const loadSuppliers = useCallback(async () => {
    if (isAuthLoading || !user) return;
    
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
  }, [user, isAuthLoading]);

  const loadPurchases = useCallback(async () => {
    if (isAuthLoading || !user) return;
    
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
  }, [user, isAuthLoading]);

  const loadDebts = useCallback(async () => {
    if (isAuthLoading || !user) return;
    
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
  }, [user, isAuthLoading]);

  const loadExpenses = useCallback(async () => {
    if (isAuthLoading || !user) return;
    
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
  }, [user, isAuthLoading]);

  const loadTransactions = useCallback(async () => {
    if (isAuthLoading || !user) return;
    
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
  }, [user, isAuthLoading]);

  const loadProjects = useCallback(async () => {
    if (isAuthLoading || !user) return;
    
    console.log('📊 DataContext: loadProjects called', { userId: user.id });
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('📊 DataContext: Error loading projects:', error);
      return;
    }

    if (data) {
      console.log('📊 DataContext: Projects loaded from DB', { count: data.length });
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
  }, [user, isAuthLoading]);

  // Initial data fetch
  const fetchInitialData = useCallback(async () => {
    console.log('📊 DataContext: fetchInitialData called', { 
      isAuthLoading, 
      hasFetched: hasFetched.current, 
      userId: user?.id 
    });
    
    if (isAuthLoading) {
      console.log('📊 DataContext: Auth loading, returning early');
      return;
    }
    
    if (hasFetched.current) {
      console.log('📊 DataContext: Already fetched for this user, skipping');
      return;
    }

    if (!user) {
      console.log('📊 DataContext: User logged out, clearing state');
      setProducts([]);
      setSuppliers([]);
      setPurchases([]);
      setDebts([]);
      setExpenses([]);
      setTransactions([]);
      setProjects([]);
      setIsLoading(false);
      setIsHydrated(false);
      clearCache();
      return;
    }

    hasFetched.current = true;
    console.log('📊 DataContext: Starting fetch for user', user.id);
    setIsLoading(true);
    
    try {
      const cachedData = loadCache(user.id);
      
      if (cachedData) {
        console.log('📦 DataContext: Cache hit - hydrating state instantly');
        setProducts(cachedData.products);
        setSuppliers(cachedData.suppliers);
        setPurchases(cachedData.purchases);
        setDebts(cachedData.debts);
        setExpenses(cachedData.expenses);
        setTransactions(cachedData.transactions);
        setProjects(cachedData.projects);
        setIsHydrated(true);
        setIsLoading(false);
        
        console.log('📦 DataContext: Hydration completed - UI is now instant');
      }
      
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        console.error('📊 DataContext: Supabase connection failed');
        if (!cachedData) {
          toast.error('Koneksi ke database gagal. Silakan periksa konfigurasi Supabase.');
          setIsLoading(false);
          setIsHydrated(false);
        } else {
          toast.warning('Mode offline - Menggunakan data tersimpan');
        }
        return;
      }

      console.log('📊 DataContext: Connection successful, fetching fresh data');
      
      await Promise.all([
        loadProducts(),
        loadSuppliers(),
        loadPurchases(),
        loadDebts(),
        loadExpenses(),
        loadTransactions(),
        loadProjects(),
      ]);
      
      console.log('📊 DataContext: Fresh data fetched successfully');
      
      saveCache(user.id, {
        products,
        suppliers,
        purchases,
        debts,
        expenses,
        transactions,
        projects,
        userId: user.id,
        version: CACHE_VERSION
      });
      
      setIsHydrated(true);
      console.log('📊 DataContext: Hydration cycle completed');
      
    } catch (error) {
      console.error('📊 DataContext: Error loading initial data:', error);
      toast.error('Gagal memuat data');
    }
  }, [user]);

  // useEffect for data fetching
  useEffect(() => {
    console.log('📊 DataContext: useEffect triggered', { 
      userId: user?.id, 
      isAuthLoading 
    });
    
    if (user) {
      hasFetched.current = false;
      console.log('📊 DataContext: Reset hasFetched for new user');
    }
    
    fetchInitialData();
  }, [user?.id]);

  // CRUD Functions (simplified)
  const createProduct = async (product: Omit<Product, 'id'>) => {
    if (!user) {
      console.error("❌ User not authenticated");
      toast.error('User tidak terautentikasi');
      throw new Error("User not authenticated");
    }
    
    console.log("✅ User authenticated:", user.id);
    
    const productData = {
      user_id: user.id,
      nama: product.nama,
      kategori: product.kategori,
      harga_beli: product.hargaBeli,
      harga_jual: product.hargaJual,
      stok: product.stok,
      satuan: product.satuan,
      min_stok: product.minStok ?? null,
    };
    
    console.log("📝 Before insert - Product data:", productData);
    
    try {
      const { data, error } = await supabase
        .from("products")
        .insert([productData])
        .select()
        .single();

      if (error) {
        console.error("❌ Insert error:", error);
        toast.error('Gagal menambah produk: ' + error.message);
        throw error;
      }
      
      console.log("✅ After insert - Supabase response:", data);
      
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
        
        console.log("🔄 Updating local state with:", newProduct);
        setProducts(prev => [newProduct, ...prev]);
        
        console.log("✅ After state update - Products count increased");
        console.log("✅ Product creation completed successfully");
      }
    } catch (error) {
      console.error("❌ Unexpected error in createProduct:", error);
      toast.error('Terjadi kesalahan saat menambah produk');
      throw error;
    }
  };

  // Other CRUD functions (simplified for now)
  const updateProduct = async (id: string, product: Partial<Product>) => {
    // Implementation
  };

  const deleteProduct = async (id: string) => {
    // Implementation
  };

  const createSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
    // Implementation
    return {} as Supplier;
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    // Implementation
  };

  const deleteSupplier = async (id: string) => {
    // Implementation
  };

  const createPurchase = async (purchase: Omit<Purchase, 'id'>) => {
    // Implementation
  };

  const updatePurchase = async (id: string, purchase: Partial<Purchase>) => {
    // Implementation
  };

  const deletePurchase = async (id: string): Promise<boolean> => {
    // Implementation
    return true;
  };

  const addDebt = async (debt: Omit<DebtRecord, 'id' | 'payments'>) => {
    // Implementation
  };

  const updateDebt = async (id: string, debt: Partial<DebtRecord>) => {
    // Implementation
  };

  const deleteDebt = async (id: string): Promise<boolean> => {
    // Implementation
    return true;
  };

  const addPayment = async (debtId: string, payment: Omit<PaymentHistory, 'id'>) => {
    // Implementation
  };

  const createExpense = async (expense: Omit<Expense, 'id'>) => {
    // Implementation
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    // Implementation
  };

  const deleteExpense = async (id: string): Promise<boolean> => {
    // Implementation
    return true;
  };

  const createTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    // Implementation
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    // Implementation
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    // Implementation
    return true;
  };

  const createProject = async (project: Omit<Project, 'id'>) => {
    // Implementation
  };

  const updateProject = async (id: string, project: Partial<Project>) => {
    // Implementation
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    // Implementation
    return true;
  };

  const getProjectDebts = (projectId: string) => {
    return debts.filter(d => d.projectId === projectId);
  };

  const createProjectDebt = async (projectId: string, projectName: string, amount: number, dueDate: string) => {
    // Implementation
  };

  const createTransactionDebt = async (transactionId: string, customerName: string, amount: number) => {
    // Implementation
  };

  const createPurchaseDebt = async (purchaseId: string, supplierName: string, amount: number) => {
    // Implementation
  };

  const removeRelatedDebt = async (keteranganSearch: string): Promise<boolean> => {
    // Implementation
    return true;
  };

  const updateRelatedDebt = async (keteranganSearch: string, newAmount: number) => {
    // Implementation
  };

  return (
    <DataContext.Provider value={{
      isLoading,
      isHydrated,
      products,
      suppliers,
      purchases,
      debts,
      expenses,
      transactions,
      projects,
      
      createProduct,
      updateProduct,
      deleteProduct,
      
      createSupplier,
      updateSupplier,
      deleteSupplier,
      
      createPurchase,
      updatePurchase,
      deletePurchase,
      
      addDebt,
      updateDebt,
      deleteDebt,
      addPayment,
      
      createExpense,
      updateExpense,
      deleteExpense,
      
      createTransaction,
      updateTransaction,
      deleteTransaction,
      
      createProject,
      updateProject,
      deleteProject,
      
      getProjectDebts,
      createProjectDebt,
      createTransactionDebt,
      createPurchaseDebt,
      removeRelatedDebt,
      updateRelatedDebt,
      
      refreshData: fetchInitialData,
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
