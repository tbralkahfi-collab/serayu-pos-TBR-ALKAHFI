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

// ✅ DEBOUNCE UTILITY FOR CACHE SAVING
const debounce = <T extends (...args: any[]) => any>(func: T, delay: number): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

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

interface CacheState {
  data: CacheData | null;
  isHydrated: boolean;
  isLoading: boolean;
}

const CACHE_VERSION = '1.0';
const CACHE_KEY_PREFIX = 'app_cache_'; // ✅ REQUIRED FORMAT: app_cache_{user_id}
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days for PWA persistence
const CACHE_BACKUP_KEY = 'app_cache_backup_'; // Backup for PWA scenarios

// ✅ CACHE FUNCTIONS
const getCacheKey = (userId: string) => `${CACHE_KEY_PREFIX}${userId}`;

// ✅ PRIMARY CACHE FUNCTIONS - DEFINE DIRECTLY
const loadCache = (userId: string): CacheData | null => {
  try {
    const cacheKey = getCacheKey(userId);
    const backupKey = `${CACHE_BACKUP_KEY}${userId}`;
    
    // Try primary cache first
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const cacheData: CacheData = JSON.parse(cached);
      
      // Check expiry
      if (Date.now() - cacheData.timestamp > CACHE_EXPIRY_MS) {
        localStorage.removeItem(cacheKey);
        console.log('📦 Cache expired, checking backup...');
      } else {
        console.log('📦 Cache loaded from primary storage');
        return cacheData;
      }
    }
    
    // Try backup cache
    const backup = localStorage.getItem(backupKey);
    if (backup) {
      console.log('📦 Using backup cache');
      const cacheData: CacheData = JSON.parse(backup);
      
      if (cacheData.userId === userId && cacheData.version === CACHE_VERSION) {
        // Restore backup to primary cache
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
    
    // Save to primary cache
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    
    // Also save to backup for PWA reliability
    localStorage.setItem(backupKey, JSON.stringify(cacheData));
    
    console.log('📦 Cache saved to primary and backup');
  } catch (error) {
    console.error('📦 Cache save error:', error);
  }
};

const clearCache = (userId?: string): void => {
  try {
    if (userId) {
      // Clear specific user cache
      const cacheKey = getCacheKey(userId);
      const backupKey = `${CACHE_BACKUP_KEY}${userId}`;
      localStorage.removeItem(cacheKey);
      localStorage.removeItem(backupKey);
    } else {
      // Clear all cache
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
  isHydrated: boolean; // ✅ ADD HYDRATION FLAG
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
  deletePurchase: (id: string) => Promise<boolean>;
  
  // Debts CRUD
  addDebt: (debt: Omit<DebtRecord, 'id' | 'payments'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<DebtRecord>) => Promise<void>;
  deleteDebt: (id: string) => Promise<boolean>;
  addPayment: (debtId: string, payment: Omit<PaymentHistory, 'id'>) => Promise<void>;
  
  // Expenses CRUD
  createExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<boolean>;
  
  // Transactions CRUD
  createTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<boolean>;
  
  // Projects CRUD
  createProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<boolean>;
  
  // Helpers
  getProjectDebts: (projectId: string) => DebtRecord[];
  createProjectDebt: (projectId: string, projectName: string, amount: number, dueDate: string) => Promise<void>;
  createTransactionDebt: (transactionId: string, customerName: string, amount: number) => Promise<void>;
  createPurchaseDebt: (purchaseId: string, supplierName: string, amount: number) => Promise<void>;
  removeRelatedDebt: (keteranganSearch: string) => Promise<boolean>;
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
  const { user, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const hasFetched = useRef(false);
  
  // ✅ DEBUG: Log auth state changes
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
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Load functions dengan cache
  const loadProducts = useCallback(async () => {
    // Prevent loading during auth initialization
    if (isAuthLoading || !user) return;
    
    console.log(' Loading products for user:', user.id);
    
    // 1 Load dari cache dulu untuk instant UI
    try {
      const cached = localStorage.getItem(`products_${user.id}`);
      if (cached) {
        const cachedData = JSON.parse(cached);
        const cacheAge = Date.now() - cachedData.timestamp;
        
        // Cache valid selama 5 menit
        if (cacheAge < 5 * 60 * 1000) {
          console.log(' Using cached products (age:', Math.round(cacheAge / 1000), 'seconds)');
          setProducts(cachedData.products);
        } else {
          console.log(' Cache expired, fetching fresh data');
          localStorage.removeItem(`products_${user.id}`);
        }
      }
    } catch (error) {
      console.error(' Cache load error:', error);
    }
    
    // 2 Fetch fresh data dari Supabase
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('nama');

    if (error) {
      console.error(' Error loading products:', error);
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
      
      console.log(' Products loaded from Supabase:', products.length);
      setProducts(products);
      
      // 3 Update cache dengan fresh data
      try {
        localStorage.setItem(`products_${user.id}`, JSON.stringify({
          products,
          timestamp: Date.now()
        }));
        console.log(' Products cached to localStorage');
      } catch (error) {
        console.error(' Cache save error:', error);
      }
    }
  }, [user, isAuthLoading]);

  const loadSuppliers = useCallback(async () => {
    // Prevent loading during auth initialization
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
  }, []);

  const loadPurchases = useCallback(async () => {
    // Prevent loading during auth initialization
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
    // Prevent loading during auth initialization
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
    // Prevent loading during auth initialization
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
    // Prevent loading during auth initialization
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
    // Prevent loading during auth initialization
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
      console.log('📊 DataContext: Projects loaded from DB', { count: data.length, projects: data.map(p => ({ id: p.id, nama: p.nama_proyek })) });
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

  // Initial data fetch - runs only once when auth is resolved
  const fetchInitialData = useCallback(async () => {
    console.log('📊 DataContext: fetchInitialData called', { 
      isAuthLoading, 
      hasFetched: hasFetched.current, 
      userId: user?.id 
    });
    
    // ✅ MANDATORY: Prevent ANY operation during auth loading
    if (isAuthLoading) {
      console.log('📊 DataContext: Auth loading, returning early');
      return;
    }
    
    // ✅ MANDATORY: Prevent multiple fetches for same user
    if (hasFetched.current) {
      console.log('📊 DataContext: Already fetched for this user, skipping');
      return;
    }

    // ✅ CORRECT: Only clear state if user is truly logged out (not during auth loading)
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
      // Clear cache for logged out user
      clearCache();
      return;
    }

    // ✅ MARK FETCH STARTED for this user
    hasFetched.current = true;
    console.log('📊 DataContext: Starting fetch for user', user.id);
    setIsLoading(true);
    
    try {
      // ✅ STEP 1: LOAD FROM CACHE FIRST (Instant UI)
      console.log('📦 DataContext: Loading data from cache...');
      const cachedData = loadCache(user.id);
      
      if (cachedData) {
        console.log('📦 DataContext: Cache hit - hydrating state instantly');
        // ✅ HYDRATION: Load cached data immediately
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
      
      // ✅ STEP 2: TEST SUPABASE CONNECTION
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        console.error('📊 DataContext: Supabase connection failed');
        if (!cachedData) {
          // Only show error if no cached data available
          toast.error('Koneksi ke database gagal. Silakan periksa konfigurasi Supabase.');
          setIsLoading(false);
          setIsHydrated(false);
        } else {
          // ✅ FAILSAFE: Show offline mode warning if cache available
          toast.warning('Mode offline - Menggunakan data tersimpan');
        }
        return;
      }

      console.log('📊 DataContext: Connection successful, fetching fresh data');
      
      // ✅ STEP 3: FETCH FRESH DATA FROM SERVER
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
      
      // ✅ STEP 4: UPDATE CACHE WITH FRESH DATA
      console.log('📦 DataContext: Updating cache with fresh data...');
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
      
      // ✅ STEP 5: MARK HYDRATION COMPLETE
      setIsHydrated(true);
      console.log('📊 DataContext: Hydration cycle completed');
      
    } catch (error) {
      console.error('📊 DataContext: Error loading initial data:', error);
      toast.error('Gagal memuat data');
    }
  }, [user, products, projects]);

  // ✅ PWA VISIBILITY MANAGEMENT - Handle app backgrounding/foregrounding
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      console.log('📱 PWA: Visibility changed', {
        hidden: document.hidden,
        state: document.visibilityState,
        userId: user.id
      });

      if (!document.hidden && document.visibilityState === 'visible') {
        // ✅ PWA: App came to foreground, refresh data if needed
        console.log('📱 PWA: App came to foreground, checking cache...');
        const cachedData = loadCache(user.id);
        
        if (!cachedData) {
          console.log('📱 PWA: No cache available, fetching fresh data...');
          fetchInitialData();
        } else {
          console.log('📱 PWA: Cache available, keeping current state');
        }
      } else if (document.hidden) {
        // ✅ PWA: App going to background, ensure cache is saved
        console.log('📱 PWA: App going to background, saving cache...');
        updateCacheAfterOperation();
      }
    };

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also listen for page hide/show events (more reliable for PWA)
    document.addEventListener('pagehide', () => {
      console.log('📱 PWA: Page hiding, saving cache...');
      updateCacheAfterOperation();
    });
    
    document.addEventListener('pageshow', (event) => {
      console.log('📱 PWA: Page showing', { persisted: event.persisted });
      if (event.persisted) {
        // Page was restored from back/forward cache
        console.log('📱 PWA: Page restored from cache, checking data...');
        const cachedData = loadCache(user.id);
        if (!cachedData) {
          console.log('📱 PWA: No cache after page restore, fetching...');
          fetchInitialData();
        }
      }
    });

    return () => {
      // Cleanup listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, updateCacheAfterOperation]);

  // ✅ CORRECT: useEffect depends only on user.id to prevent loops
  useEffect(() => {
    console.log('📊 DataContext: useEffect triggered', { 
      userId: user?.id, 
      isAuthLoading 
    });
    
    // ✅ MANDATORY: Reset fetch guard when user changes
    if (user) {
      hasFetched.current = false;
      console.log('📊 DataContext: Reset hasFetched for new user');
    }
    
    fetchInitialData();
  }, [user?.id]); // ✅ ONLY depend on user.id

  // Realtime subscriptions - USER-SPECIFIC WITH FILTERING AND AUTH GUARD
  useEffect(() => {
    // Prevent subscription during auth loading or if no user
    if (isAuthLoading || !user) return;

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
  }, [user, isAuthLoading]);

  // ✅ DEBOUNCED CACHE SAVING (500ms as required)
  const debouncedUpdateCache = useCallback(
    debounce(updateCacheAfterOperation, 500),
    [updateCacheAfterOperation]
  );

  const createProduct = async (product: Omit<Product, 'id'>) => {
    // ✅ STEP 2: VALIDATE AUTH
    if (!user) {
      console.error("❌ User not authenticated");
      toast.error('User tidak terautentikasi');
      throw new Error("User not authenticated");
    }
    
    console.log("✅ User authenticated:", user.id);
    
    // ✅ STEP 3: VALIDATE DATA STRUCTURE
    const productData = {
      user_id: user.id, // ✅ Attach user_id
      nama: product.nama,
      kategori: product.kategori,
      harga_beli: product.hargaBeli,
      harga_jual: product.hargaJual,
      stok: product.stok,
      satuan: product.satuan,
      min_stok: product.minStok ?? null, // ✅ Handle undefined
    };
    
    // ✅ Remove undefined/null fields
    const cleanData = Object.fromEntries(
      Object.entries(productData).filter(([_, value]) => value !== undefined && value !== null)
    );
    
    console.log("📝 Before insert - Product data:", cleanData);
    
    // ✅ STEP 4: INSERT TO SUPABASE
    try {
      const { data, error } = await supabase
        .from("products")
        .insert([cleanData])
        .select()
        .single();

      // ✅ Add error logging
      if (error) {
        console.error("❌ Insert error:", error);
        toast.error('Gagal menambah produk: ' + error.message);
        throw error;
      }
      
      console.log("✅ After insert - Supabase response:", data);
      
      // ✅ STEP 5: UPDATE LOCAL STATE (CRITICAL)
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
        
        console.log("✅ After state update - Products count:", prev => prev.length + 1);
        
        // ✅ STEP 6: UPDATE CACHE
        console.log("💾 Updating cache...");
        debouncedUpdateCache();
        
        // ✅ STEP 7: UI FEEDBACK
        toast.success('Produk berhasil ditambahkan');
        
        // ✅ STEP 8: RESET FORM (handled by UI component)
        console.log("🎉 Product creation completed successfully");
      }
    } catch (error) {
      // ✅ STEP 8: HANDLE FAILURES
      console.error("❌ Product creation failed:", error);
      toast.error('Gagal menambah produk');
      throw error;
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
      
      // ✅ DEBOUNCED CACHE SAVING (500ms)
      debouncedUpdateCache();
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
    toast.success('Produk berhasil dihapus');
    
    // ✅ DEBOUNCED CACHE SAVING (500ms)
    debouncedUpdateCache();
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
    if (!user) return false;
    
    const { error } = await supabase
      .from('purchases')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Gagal menghapus pembelian');
      console.error(error);
      return false;
    }
    // Immediate local state update
    setPurchases(prev => prev.filter(p => p.id !== id));
    toast.success('Pembelian berhasil dihapus');
  };

  const addDebt = async (debt: Omit<DebtRecord, 'id' | 'payments'>) => {
    console.log('💰 DataContext: addDebt called', { type: debt.type, nama: debt.nama, total: debt.total });
    
    if (!user) {
      console.error('💰 DataContext: Create debt failed - no user');
      return;
    }
    
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
      console.error('💰 DataContext: Create debt error', error);
      toast.error('Gagal menambah utang/piutang');
      return;
    }
    
    console.log('💰 DataContext: Create debt successful');
    toast.success('Utang/piutang berhasil ditambahkan');
  };

  const updateDebt = async (id: string, debt: Partial<DebtRecord>) => {
    console.log('💰 DataContext: updateDebt called', { id, debt });
    
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

    console.log('💰 DataContext: Executing Supabase update', updateData);
    const { error } = await supabase.from('debts').update(updateData).eq('id', id);
    if (error) {
      console.error('💰 DataContext: Update debt error', error);
      toast.error('Gagal memperbarui utang/piutang');
      return;
    }
    
    console.log('💰 DataContext: Update debt successful');
    toast.success('Utang/piutang berhasil diperbarui');
  };

  const deleteDebt = async (id: string): Promise<boolean> => {
    console.log('💰 DataContext: deleteDebt called', { id, userId: user?.id });
    
    if (!user) {
      console.error('💰 DataContext: Delete debt failed - no user');
      toast.error('User not authenticated');
      return false;
    }
    
    try {
      // First verify the debt belongs to the user
      console.log('💰 DataContext: Verifying debt ownership', id);
      const { data: verifyData, error: verifyError } = await supabase
        .from('debts')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (verifyError || !verifyData) {
        console.error('💰 DataContext: Debt verification failed', { verifyError, verifyData });
        toast.error('Utang/piutang tidak ditemukan atau tidak memiliki akses');
        return false;
      }

      console.log('💰 DataContext: Debt verified, executing delete');
      // Delete the debt
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('💰 DataContext: Delete debt error', error);
        toast.error(`Gagal menghapus utang/piutang: ${error.message}`);
        return false;
      }

      console.log('💰 DataContext: Delete successful, updating local state');
      // Immediate local state update
      setDebts(prev => prev.filter(d => d.id !== id));
      toast.success('Utang/piutang berhasil dihapus');
      return true;
    } catch (err) {
      console.error('💰 DataContext: Unexpected error during debt deletion', err);
      toast.error('Terjadi kesalahan yang tidak terduga saat menghapus utang/piutang');
      return false;
    }
  };

  const addPayment = async (debtId: string, payment: Omit<PaymentHistory, 'id'>) => {
    console.log('💰 DataContext: addPayment called', { debtId, payment });
    
    const debt = debts.find(d => d.id === debtId);
    if (!debt) {
      console.error('💰 DataContext: Add payment failed - debt not found', debtId);
      return;
    }

    const newPayment: PaymentHistory = {
      ...payment,
      id: `PAY${Date.now()}`,
    };
    const updatedPayments = [...debt.payments, newPayment];
    const newSisa = debt.sisa - payment.jumlah;
    
    console.log('💰 DataContext: Adding payment', { 
      debtId, 
      paymentAmount: payment.jumlah,
      oldSisa: debt.sisa,
      newSisa,
      totalPayments: updatedPayments.length 
    });

    await updateDebt(debtId, { 
      payments: updatedPayments,
      sisa: Math.max(0, newSisa),
    });
    
    console.log('💰 DataContext: Payment added successfully');
    toast.success('Pembayaran berhasil ditambahkan');
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
    if (!user) return false;
    
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Gagal menghapus pengeluaran');
      console.error(error);
      return false;
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

  const deleteTransaction = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('User not authenticated');
      return false;
    }
    
    try {
      // First verify the transaction belongs to the user
      const { data: verifyData, error: verifyError } = await supabase
        .from('transactions')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (verifyError || !verifyData) {
        toast.error('Transaksi tidak ditemukan atau tidak memiliki akses');
        console.error('Transaction verification error:', verifyError);
        return false;
      }

      // Delete the transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Transaction deletion error:', error);
        toast.error(`Gagal menghapus transaksi: ${error.message}`);
        return false;
      }

      // Immediate local state update
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaksi berhasil dihapus dan stok dikembalikan');
      return true;
    } catch (err) {
      console.error('Unexpected error during transaction deletion:', err);
      toast.error('Terjadi kesalahan yang tidak terduga saat menghapus transaksi');
      return false;
    }
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

  const deleteProject = async (id: string): Promise<boolean> => {
    console.log('🗑️ DataContext: deleteProject called', { id, userId: user?.id });
    
    if (!user) {
      console.error('🗑️ DataContext: Delete failed - no user');
      return false;
    }
    
    console.log('🗑️ DataContext: Executing Supabase delete for project', id);
    const { error, data } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
      .select();
      
    console.log('🗑️ DataContext: Supabase delete response', { error, data });
    
    if (error) {
      console.error('🗑️ DataContext: Delete error', error);
      toast.error('Gagal menghapus proyek');
      return false;
    }
    
    // ✅ CRITICAL: Verify delete actually worked
    if (!data || data.length === 0) {
      console.error('🗑️ DataContext: Delete failed - no data returned', { data });
      toast.error('Proyek tidak ditemukan atau sudah dihapus');
      return false;
    }
    
    console.log('🗑️ DataContext: Delete successful, updating local state', { deletedProject: data[0] });
    // ✅ IMMEDIATE: Update local state to prevent refetch override
    setProjects(prev => prev.filter(p => p.id !== id));
    toast.success('Proyek berhasil dihapus');
    return true;
  };

  // Helper functions
  const getProjectDebts = (projectId: string) => debts.filter(d => d.projectId === projectId);
  
  const createProjectDebt = async (projectId: string, projectName: string, amount: number, dueDate: string) => {
    await addDebt({
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
    await addDebt({
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
    await addDebt({
      type: 'utang',
      nama: supplierName,
      total: amount,
      sisa: amount,
      tanggal: new Date().toISOString().split('T')[0],
      jatuhTempo: '',
      keterangan: `Utang dari pembelian: ${purchaseId}`,
    });
  };

  const removeRelatedDebt = async (keteranganSearch: string): Promise<boolean> => {
    try {
      const relatedDebt = debts.find(d => d.keterangan.includes(keteranganSearch));
      if (relatedDebt) {
        await deleteDebt(relatedDebt.id);
        return true;
      }
      return true; // No related debt found, which is fine
    } catch (error) {
      console.error('Error removing related debt:', error);
      return false;
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
      isHydrated,
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
      addDebt,
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
