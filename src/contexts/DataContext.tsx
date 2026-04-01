import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase, testSupabaseConnection } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';
import type { 
  Product, 
  Supplier, 
  Purchase, 
  DebtRecord, 
  Expense, 
  Transaction, 
  Project,
  CacheData,
  DataContextType 
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
  const loadCache = (userId: string): CacheData | null => {
    return loadCacheData(userId);
  };

  const saveCache = (userId: string, data: Omit<CacheData, 'timestamp'>): void => {
    saveCacheData(userId, data);
  };

  const clearCache = (userId?: string): void => {
    clearCacheData(userId);
  };

  // Load functions
  const loadProducts = useCallback(async () => {
    if (isAuthLoading || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading products:', error);
        return;
      }

      const formattedProducts = data.map(product => ({
        id: product.id,
        nama: product.nama,
        kategori: product.kategori,
        hargaBeli: Number(product.harga_beli),
        hargaJual: Number(product.harga_jual),
        stok: product.stok,
        satuan: product.satuan,
        minStok: product.min_stok ?? undefined,
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }, [user, isAuthLoading]);

  const loadSuppliers = useCallback(async () => {
    if (isAuthLoading || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading suppliers:', error);
        return;
      }

      setSuppliers(data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  }, [user, isAuthLoading]);

  const loadPurchases = useCallback(async () => {
    if (isAuthLoading || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading purchases:', error);
        return;
      }

      const formattedPurchases = data.map(purchase => ({
        ...purchase,
        items: parsePurchaseItems(purchase.items),
        tanggal: purchase.created_at,
      }));

      setPurchases(formattedPurchases);
    } catch (error) {
      console.error('Error loading purchases:', error);
    }
  }, [user, isAuthLoading]);

  const loadDebts = useCallback(async () => {
    if (isAuthLoading || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading debts:', error);
        return;
      }

      const formattedDebts = data.map(debt => ({
        ...debt,
        payments: parsePayments(debt.payments),
      }));

      setDebts(formattedDebts);
    } catch (error) {
      console.error('Error loading debts:', error);
    }
  }, [user, isAuthLoading]);

  const loadExpenses = useCallback(async () => {
    if (isAuthLoading || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading expenses:', error);
        return;
      }

      setExpenses(data || []);
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  }, [user, isAuthLoading]);

  const loadTransactions = useCallback(async () => {
    if (isAuthLoading || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }

      const formattedTransactions = data.map(transaction => ({
        ...transaction,
        items: parseTransactionItems(transaction.items),
      }));

      setTransactions(formattedTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }, [user, isAuthLoading]);

  const loadProjects = useCallback(async () => {
    if (isAuthLoading || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading projects:', error);
        return;
      }

      const formattedProjects = data.map(project => ({
        ...project,
        materials: parseMaterials(project.materials),
      }));

      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }, [user, isAuthLoading]);

  // Initial data fetch
  const fetchInitialData = useCallback(async () => {
    if (isAuthLoading || hasFetched.current) return;

    console.log('📊 DataContext: fetchInitialData called', { 
      isAuthLoading, 
      hasFetched: hasFetched.current, 
      userId: user?.id 
    });

    hasFetched.current = true;

    if (!user) {
      console.log('📊 DataContext: No user, clearing state');
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

    try {
      // Load from cache first
      console.log('📦 DataContext: Loading data from cache...');
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
      
      // Test Supabase connection
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
      
      // Fetch fresh data from server
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
      
      // Update cache with fresh data
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
        version: '1.0'
      });
      
      // Mark hydration complete
      setIsHydrated(true);
      console.log('📊 DataContext: Hydration cycle completed');
    } catch (error) {
      console.error('📊 DataContext: Error in fetchInitialData:', error);
      toast.error('Gagal memuat data. Silakan refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthLoading, loadProducts, loadSuppliers, loadPurchases, loadDebts, loadExpenses, loadTransactions, loadProjects, products, suppliers, purchases, debts, expenses, transactions, projects, loadCache, saveCache, clearCache]);

  // CRUD Functions
  const updateCacheAfterOperation = useCallback(() => {
    if (!user) return;
    
    console.log('📦 DataContext: Updating cache after operation...');
    saveCache(user.id, {
      products,
      suppliers,
      purchases,
      debts,
      expenses,
      transactions,
      projects,
      userId: user.id,
      version: '1.0'
    });
  }, [user, products, suppliers, purchases, debts, expenses, transactions, projects, saveCache]);

  // Debounced cache saving
  const debouncedUpdateCache = useCallback(
    debounce(updateCacheAfterOperation, 500),
    [updateCacheAfterOperation]
  );

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
    
    const cleanData = Object.fromEntries(
      Object.entries(productData).filter(([_, value]) => value !== undefined && value !== null)
    );
    
    console.log("📝 Before insert - Product data:", cleanData);
    
    try {
      const { data, error } = await supabase
        .from("products")
        .insert([cleanData])
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
        
        console.log("✅ After state update - Products count updated");
        
        console.log("💾 Updating cache...");
        debouncedUpdateCache();
        
        toast.success('Produk berhasil ditambahkan');
        
        console.log("🎉 Product creation completed successfully");
      }
    } catch (error) {
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
      const updatedProduct = {
        id: data.id,
        nama: data.nama,
        kategori: data.kategori,
        hargaBeli: Number(data.harga_beli),
        hargaJual: Number(data.harga_jual),
        stok: data.stok,
        satuan: data.satuan,
        minStok: data.min_stok ?? undefined,
      };
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));
      toast.success('Produk berhasil diperbarui');
      
      debouncedUpdateCache();
    }
  };

  const deleteProduct = async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Gagal menghapus produk');
      console.error(error);
      return;
    }

    setProducts(prev => prev.filter(p => p.id !== id));
    toast.success('Produk berhasil dihapus');
    
    debouncedUpdateCache();
  };

  // Placeholder functions for other CRUD operations
  const createSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
    if (!user) throw new Error('Not authenticated');
    
    const { data, error } = await supabase.from('suppliers').insert({
      user_id: user.id,
      ...supplier
    }).select().single();
    
    if (error) {
      toast.error('Gagal menambah supplier');
      throw error;
    }
    
    const newSupplier = data as Supplier;
    setSuppliers(prev => [newSupplier, ...prev]);
    debouncedUpdateCache();
    
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
      setSuppliers(prev => prev.map(s => s.id === id ? data as Supplier : s));
      debouncedUpdateCache();
    }
  };

  const deleteSupplier = async (id: string) => {
    if (!user) return;
    
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus supplier');
      console.error(error);
      return;
    }
    
    setSuppliers(prev => prev.filter(s => s.id !== id));
    debouncedUpdateCache();
  };

  // Placeholder functions for other entities
  const createPurchase = async (purchase: Omit<Purchase, 'id'>) => {
    console.log('createPurchase called', purchase);
  };

  const updatePurchase = async (id: string, purchase: Partial<Purchase>) => {
    console.log('updatePurchase called', id, purchase);
  };

  const deletePurchase = async (id: string) => {
    console.log('deletePurchase called', id);
  };

  const createDebt = async (debt: Omit<DebtRecord, 'id'>) => {
    console.log('createDebt called', debt);
  };

  const updateDebt = async (id: string, debt: Partial<DebtRecord>) => {
    console.log('updateDebt called', id, debt);
  };

  const deleteDebt = async (id: string) => {
    console.log('deleteDebt called', id);
  };

  const createExpense = async (expense: Omit<Expense, 'id'>) => {
    console.log('createExpense called', expense);
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    console.log('updateExpense called', id, expense);
  };

  const deleteExpense = async (id: string) => {
    console.log('deleteExpense called', id);
  };

  const createTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    console.log('createTransaction called', transaction);
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    console.log('updateTransaction called', id, transaction);
  };

  const deleteTransaction = async (id: string) => {
    console.log('deleteTransaction called', id);
  };

  const createProject = async (project: Omit<Project, 'id'>) => {
    console.log('createProject called', project);
  };

  const updateProject = async (id: string, project: Partial<Project>) => {
    console.log('updateProject called', id, project);
  };

  const deleteProject = async (id: string) => {
    console.log('deleteProject called', id);
  };

  // Effects
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;

    // Products subscription
    const productsSubscription = supabase
      .channel('products-changes')
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
      .subscribe();

    return () => {
      productsSubscription.unsubscribe();
    };
  }, [user]);

  const value: DataContextType = {
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
    createDebt,
    updateDebt,
    deleteDebt,
    createExpense,
    updateExpense,
    deleteExpense,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createProject,
    updateProject,
    deleteProject,
  };

  return (
    <DataContext.Provider value={value}>
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
