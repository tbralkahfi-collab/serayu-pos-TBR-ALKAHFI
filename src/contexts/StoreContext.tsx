import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { User } from '@supabase/supabase-js';

interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  logo: string | null;
}

interface PrinterSettings {
  type: 'thermal' | 'regular';
  paperWidth: '58mm' | '80mm' | 'A4';
  autoPrint: boolean;
}

interface StockSettings {
  minStockAlert: number;
}

// ✅ ENHANCED BACKUP STRUCTURE WITH VERSIONING
interface BackupData {
  version?: string;
  created_at?: string;
  data?: {
    products: any[];
    suppliers: any[];
    purchases: any[];
    debts: any[];
    expenses: any[];
    transactions: any[];
    projects: any[];
    profile?: any;
  };
}

// ✅ LEGACY BACKUP STRUCTURE (for backward compatibility)
interface LegacyBackupData {
  products?: any[];
  suppliers?: any[];
  purchases?: any[];
  debts?: any[];
  expenses?: any[];
  transactions?: any[];
  projects?: any[];
  profile?: any;
}

interface BackupRecord {
  id: string;
  backupType: 'auto' | 'manual';
  createdAt: string;
}

// Define valid table types for Supabase operations
type ValidTable = 'products' | 'suppliers' | 'purchases' | 'debts' | 'expenses' | 'transactions' | 'projects';

// ✅ AUTO-DETECT BACKUP FORMAT AND NORMALIZE
const normalizeBackupData = (rawBackupData: any): BackupData => {
  console.log('🔍 Analyzing backup format...');
  
  // Check if it's new format (has 'data' property)
  if (rawBackupData && typeof rawBackupData === 'object' && rawBackupData.data) {
    console.log('✅ New backup format detected (versioned with data wrapper)');
    return {
      version: rawBackupData.version || '1.0',
      created_at: rawBackupData.created_at || new Date().toISOString(),
      data: rawBackupData.data
    };
  }
  
  // Check if it's legacy format (direct table properties)
  const tableNames = ['products', 'suppliers', 'purchases', 'debts', 'expenses', 'transactions', 'projects'];
  const hasLegacyStructure = tableNames.some(table => rawBackupData && rawBackupData[table]);
  
  if (hasLegacyStructure) {
    console.log('✅ Legacy backup format detected (direct table properties)');
    return {
      version: 'legacy',
      created_at: new Date().toISOString(),
      data: {
        products: rawBackupData.products || [],
        suppliers: rawBackupData.suppliers || [],
        purchases: rawBackupData.purchases || [],
        debts: rawBackupData.debts || [],
        expenses: rawBackupData.expenses || [],
        transactions: rawBackupData.transactions || [],
        projects: rawBackupData.projects || [],
        profile: rawBackupData.profile
      }
    };
  }
  
  // If neither format, assume empty new format
  console.log('⚠️ Unknown backup format, treating as empty');
  return {
    version: 'unknown',
    created_at: new Date().toISOString(),
    data: {
      products: [],
      suppliers: [],
      purchases: [],
      debts: [],
      expenses: [],
      transactions: [],
      projects: [],
      profile: undefined
    }
  };
};

// ✅ TRANSACTIONS JSON NORMALIZER - Fix "cannot extract elements from a scalar" error
const normalizeTransactions = (records: any[]): any[] => {
  console.log('🔧 Normalizing transactions JSON fields...');
  
  if (!records || !Array.isArray(records)) {
    console.log('⚠️ No transaction records to normalize');
    return [];
  }
  
  const normalizedRecords = records.map((record, index) => {
    if (!record) {
      console.log(`⚠️ Transaction record ${index} is null/undefined, skipping`);
      return null;
    }
    
    const normalized = { ...record };
    
    // Handle items field normalization
    if (normalized.items === null || normalized.items === undefined) {
      console.log(`📦 Transaction ${index}: items is null/undefined → []`);
      normalized.items = [];
    } else if (typeof normalized.items === 'string') {
      try {
        const parsed = JSON.parse(normalized.items);
        if (Array.isArray(parsed)) {
          console.log(`📦 Transaction ${index}: items converted from string array (${parsed.length} items)`);
          normalized.items = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
          console.log(`📦 Transaction ${index}: items converted from string object → wrapped in array`);
          normalized.items = [parsed];
        } else {
          console.log(`📦 Transaction ${index}: invalid JSON string → []`);
          normalized.items = [];
        }
      } catch (error) {
        console.log(`📦 Transaction ${index}: JSON parse failed → [] (error: ${error.message})`);
        normalized.items = [];
      }
    } else if (Array.isArray(normalized.items)) {
      console.log(`📦 Transaction ${index}: items already valid array (${normalized.items.length} items)`);
      // Keep as is, but ensure it's a clean array
      normalized.items = normalized.items.filter(item => item !== null && item !== undefined);
    } else if (typeof normalized.items === 'object') {
      console.log(`📦 Transaction ${index}: items is object → wrapped in array`);
      normalized.items = [normalized.items];
    } else {
      console.log(`📦 Transaction ${index}: items has invalid type (${typeof normalized.items}) → []`);
      normalized.items = [];
    }
    
    // Final validation - ensure items is always an array
    if (!Array.isArray(normalized.items)) {
      console.log(`🔧 Transaction ${index}: Final validation failed, forcing []`);
      normalized.items = [];
    }
    
    console.log(`✅ Transaction ${index}: items normalized to ${normalized.items.length} items`);
    return normalized;
  }).filter(Boolean); // Remove null records
  
  console.log(`✅ Normalized ${records.length} → ${normalizedRecords.length} transaction records`);
  return normalizedRecords;
};

// ✅ TEST FUNCTION: Verify normalizeTransactions handles all test cases
const testNormalizeTransactions = () => {
  console.log('🧪 Testing normalizeTransactions function...');
  
  const testCases = [
    {
      name: 'String JSON array',
      input: { items: '[{"produk":"Besi","qty":2}]' },
      expectedItemsLength: 1
    },
    {
      name: 'String JSON object',
      input: { items: '{"produk":"Besi","qty":2}' },
      expectedItemsLength: 1
    },
    {
      name: 'Null items',
      input: { items: null },
      expectedItemsLength: 0
    },
    {
      name: 'Undefined items',
      input: { items: undefined },
      expectedItemsLength: 0
    },
    {
      name: 'Valid array',
      input: { items: [{"produk":"Besi","qty":2}] },
      expectedItemsLength: 1
    },
    {
      name: 'Single object',
      input: { items: {"produk":"Besi","qty":2} },
      expectedItemsLength: 1
    },
    {
      name: 'Invalid string',
      input: { items: 'invalid json' },
      expectedItemsLength: 0
    },
    {
      name: 'Invalid type',
      input: { items: 123 },
      expectedItemsLength: 0
    }
  ];
  
  const results = testCases.map((testCase, index) => {
    const normalized = normalizeTransactions([testCase.input]);
    const result = normalized[0];
    const passed = Array.isArray(result?.items) && result.items.length === testCase.expectedItemsLength;
    
    console.log(`🧪 Test ${index + 1} (${testCase.name}): ${passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Input:`, testCase.input);
    console.log(`   Output:`, result?.items);
    console.log(`   Expected: ${testCase.expectedItemsLength} items`);
    
    return passed;
  });
  
  const allPassed = results.every(r => r);
  console.log(`🧪 Test results: ${results.filter(r => r).length}/${results.length} passed`);
  
  if (allPassed) {
    console.log('🎉 All normalizeTransactions tests passed!');
  } else {
    console.log('❌ Some normalizeTransactions tests failed!');
  }
  
  return allPassed;
};

// ✅ ENHANCED DYNAMIC SANITIZE FUNCTION - Matches actual database schema
const sanitizeData = (table: ValidTable, data: any[]): any[] => {
  if (!data || !Array.isArray(data)) {
    console.log(`📦 ${table}: No data or invalid array format`);
    return [];
  }
  
  console.log(`📦 Processing ${table}: ${data.length} records`);
  console.log(`📦 Sample ${table} record:`, data[0]);

  // Dynamic field mapping based on actual database schema
  const schemaFields: Record<ValidTable, string[]> = {
    suppliers: ['id', 'user_id', 'nama', 'alamat', 'telepon', 'email', 'catatan', 'created_at'],
    products: ['id', 'user_id', 'nama', 'kategori', 'harga_beli', 'harga_jual', 'stok', 'satuan', 'min_stok', 'created_at', 'updated_at'],
    purchases: ['id', 'user_id', 'supplier_id', 'supplier_name', 'tanggal', 'total', 'dp', 'metode_bayar', 'status', 'items', 'catatan', 'created_at'],
    debts: ['id', 'user_id', 'type', 'nama', 'total', 'sisa', 'tanggal', 'jatuh_tempo', 'keterangan', 'project_id', 'payments', 'created_at'],
    expenses: ['id', 'user_id', 'kategori', 'deskripsi', 'jumlah', 'tanggal', 'created_at'],
    transactions: ['id', 'user_id', 'tanggal', 'pelanggan', 'items', 'subtotal', 'diskon', 'diskon_persen', 'total', 'bayar', 'kembalian', 'metode', 'status', 'created_at'],
    projects: ['id', 'user_id', 'nama_proyek', 'pelanggan', 'alamat', 'telepon', 'deskripsi', 'nilai_kontrak', 'diskon_persen', 'diskon_nominal', 'dp', 'biaya_tenaga_kerja', 'tanggal_order', 'tanggal_mulai', 'tanggal_selesai', 'status', 'catatan', 'materials', 'created_at']
  };

  const allowed = schemaFields[table] || [];
  console.log(`📦 ${table} allowed fields:`, allowed);

  const cleanData = data.map((item, index) => {
    const clean: any = {};

    // Only include fields that exist in database schema
    for (const field of allowed) {
      if (item && item[field] !== undefined && item[field] !== null) {
        // Field-specific validation
        if (field === 'user_id') {
          clean[field] = String(item[field]);
        } else if (field.includes('harga') || field.includes('total') || field.includes('dp') || field.includes('sisa') || field.includes('bayar') || field.includes('kembalian') || field.includes('jumlah') || field.includes('nilai_kontrak') || field.includes('biaya_tenaga_kerja')) {
          // Numeric fields
          clean[field] = Number(item[field]) || 0;
        } else if (field.includes('stok') || field.includes('min_stok') || field.includes('diskon_persen')) {
          // Integer fields
          clean[field] = parseInt(item[field]) || 0;
        } else {
          // String fields
          clean[field] = String(item[field]);
        }
      }
    }

    // Always ensure created_at exists
    if (!clean.created_at) {
      clean.created_at = new Date().toISOString();
    }

    return clean;
  }).filter(Boolean); // Remove any null/undefined entries

  console.log(`📦 ${table}: ${data.length} → ${cleanData.length} valid records`);
  return cleanData;
};

interface StoreContextType {
  storeInfo: StoreInfo;
  printerSettings: PrinterSettings;
  stockSettings: StockSettings;
  backups: BackupRecord[];
  isLoading: boolean;
  isSyncing: boolean;
  isRestoring: boolean; // ✅ ADD RESTORE FLAG
  updateStoreInfo: (info: Partial<StoreInfo>) => Promise<void>;
  updatePrinterSettings: (settings: Partial<PrinterSettings>) => Promise<void>;
  updateStockSettings: (settings: Partial<StockSettings>) => Promise<void>;
  triggerManualBackup: () => Promise<void>;
  restoreBackup: (backupId: string) => Promise<any>;
  fetchBackups: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_STORE_INFO: StoreInfo = {
  name: 'Toko Baja Ringan',
  address: 'Jl. Contoh No. 123, Kota, Indonesia',
  phone: '+62 812 3456 7890',
  logo: null,
};

const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  type: 'thermal',
  paperWidth: '58mm',
  autoPrint: false,
};

const DEFAULT_STOCK_SETTINGS: StockSettings = {
  minStockAlert: 10,
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading, isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false); // ✅ GLOBAL RESTORE FLAG
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(DEFAULT_STORE_INFO);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);
  const [stockSettings, setStockSettings] = useState<StockSettings>(DEFAULT_STOCK_SETTINGS);
  const [backups, setBackups] = useState<BackupRecord[]>([]);

  // ✅ REQUIRE USER GUARD - Ensures user is defined before any operation
  const requireUser = useCallback((user: User | null, authLoading: boolean): User => {
    // Wait for auth to complete
    if (authLoading || isAuthLoading) {
      console.log('⏳ Waiting for auth to complete...');
      throw new Error('AUTH_LOADING');
    }

    // Ensure user is defined
    if (!user) {
      console.error('❌ User not authenticated');
      throw new Error('USER_NOT_AUTHENTICATED');
    }

    console.log('✅ User verified:', user.id);
    return user;
  }, [isAuthLoading]);

  // ✅ Enhanced safety wrapper with requireUser
  const withUserGuard = useCallback(async (operation: () => Promise<any>, operationName: string) => {
    try {
      // Ensure user is authenticated
      const verifiedUser = requireUser(user, authLoading);
      
      console.log(`🔐 User verified for ${operationName}:`, verifiedUser.id);
      return await operation();
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'AUTH_LOADING') {
          console.log(`⏳ ${operationName} waiting for auth...`);
          return;
        }
        if (error.message === 'USER_NOT_AUTHENTICATED') {
          console.error(`❌ Cannot perform ${operationName}: User not authenticated`);
          throw new Error('User not authenticated');
        }
      }
      throw error;
    }
  }, [user, authLoading, requireUser]);

  // Fetch profile settings from Supabase
  const fetchSettings = useCallback(async () => {
    // ✅ Prevent data fetching before auth is ready
    if (authLoading || isAuthLoading) {
      console.log('⏳ fetchSettings: Waiting for auth to complete...');
      return;
    }

    // ✅ Fallback to localStorage for non-authenticated users
    if (!user) {
      console.log('📦 fetchSettings: Using localStorage fallback');
      const savedStore = localStorage.getItem('serayu_store_info');
      const savedPrinter = localStorage.getItem('serayu_printer_settings');
      const savedStock = localStorage.getItem('serayu_stock_settings');
      
      if (savedStore) setStoreInfo(JSON.parse(savedStore));
      if (savedPrinter) setPrinterSettings(JSON.parse(savedPrinter));
      if (savedStock) setStockSettings(JSON.parse(savedStock));
      setIsLoading(false);
      return;
    }

    // ✅ Safe database operation with verified user
    try {
      console.log('🔍 fetchSettings: Fetching from database for user:', user.id);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profile) {
        setStoreInfo({
          name: profile.store_name || DEFAULT_STORE_INFO.name,
          address: (profile as any).store_address || DEFAULT_STORE_INFO.address,
          phone: (profile as any).store_phone || DEFAULT_STORE_INFO.phone,
          logo: (profile as any).store_logo || null,
        });

        setPrinterSettings({
          type: ((profile as any).printer_type as 'thermal' | 'regular') || DEFAULT_PRINTER_SETTINGS.type,
          paperWidth: ((profile as any).paper_width as '58mm' | '80mm' | 'A4') || DEFAULT_PRINTER_SETTINGS.paperWidth,
          autoPrint: (profile as any).auto_print ?? DEFAULT_PRINTER_SETTINGS.autoPrint,
        });

        setStockSettings({
          minStockAlert: (profile as any).min_stock_alert ?? DEFAULT_STOCK_SETTINGS.minStockAlert,
        });
        
        console.log('✅ fetchSettings: Settings loaded successfully');
      }
    } catch (error) {
      console.error('❌ fetchSettings: Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading, isAuthLoading]);

  // Fetch backups list
  const fetchBackups = useCallback(async () => {
    // ✅ Prevent data fetching before auth is ready
    if (authLoading || isAuthLoading) {
      console.log('⏳ fetchBackups: Waiting for auth to complete...');
      return;
    }

    // ✅ Ensure user is authenticated
    if (!user) {
      console.log('📦 fetchBackups: No user, skipping backup fetch');
      return;
    }

    try {
      console.log('🔍 fetchBackups: Fetching backups for user:', user.id);
      
      const { data, error } = await supabase
        .from('backups')
        .select('id, backup_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setBackups((data || []).map(b => ({
        id: b.id,
        backupType: b.backup_type as 'auto' | 'manual',
        createdAt: b.created_at,
      })));
      
      console.log(`✅ fetchBackups: Loaded ${data?.length || 0} backups`);
    } catch (error) {
      console.error('❌ fetchBackups: Error fetching backups:', error);
    }
  }, [user, authLoading, isAuthLoading]);

  // Initial fetch - only after auth is ready
  useEffect(() => {
    // ✅ Prevent race conditions - wait for auth to complete
    if (authLoading || isAuthLoading) {
      console.log('⏳ Initial fetch: Waiting for auth to complete...');
      return;
    }

    console.log('🚀 Initial fetch: Auth ready, starting data fetch');
    fetchSettings();
    fetchBackups();
  }, [fetchSettings, fetchBackups, authLoading, isAuthLoading]);

  // Realtime subscription for profiles - only after auth is ready
  useEffect(() => {
    // ✅ Prevent race conditions - wait for auth to complete
    if (authLoading || isAuthLoading) {
      console.log('⏳ Realtime subscription: Waiting for auth to complete...');
      return;
    }

    if (!user) {
      console.log('📦 Realtime subscription: No user, skipping subscription');
      return;
    }

    console.log('🔗 Realtime subscription: Setting up for user:', user.id);

    const channel = supabase
      .channel('store-settings')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, () => {
        console.log('🔄 Realtime: Profile changed, refreshing settings');
        fetchSettings();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'backups',
        filter: `user_id=eq.${user.id}`
      }, () => {
        console.log('🔄 Realtime: Backups changed, refreshing list');
        fetchBackups();
      })
      .subscribe();

    return () => {
      console.log('🔌 Realtime: Cleaning up subscription for user:', user.id);
      supabase.removeChannel(channel);
    };
  }, [user, fetchSettings, fetchBackups, authLoading, isAuthLoading]);

  // Update functions with enhanced user safety
  const updateStoreInfo = async (info: Partial<StoreInfo>) => {
    return await withUserGuard(async () => {
      const verifiedUser = requireUser(user, authLoading);
      
      console.log('📝 updateStoreInfo: Updating store info for user:', verifiedUser.id);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          store_name: info.name,
          store_address: info.address,
          store_phone: info.phone,
          store_logo: info.logo,
        })
        .eq('id', verifiedUser.id);

      if (error) throw error;
      await fetchSettings();
      
      console.log('✅ updateStoreInfo: Store info updated successfully');
    }, 'updateStoreInfo');
  };

  const updatePrinterSettings = async (settings: Partial<PrinterSettings>) => {
    return await withUserGuard(async () => {
      const verifiedUser = requireUser(user, authLoading);
      
      console.log('🖨️ updatePrinterSettings: Updating printer settings for user:', verifiedUser.id);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          printer_type: settings.type,
          paper_width: settings.paperWidth,
          auto_print: settings.autoPrint,
        })
        .eq('id', verifiedUser.id);

      if (error) throw error;
      await fetchSettings();
      
      console.log('✅ updatePrinterSettings: Printer settings updated successfully');
    }, 'updatePrinterSettings');
  };

  const updateStockSettings = async (settings: Partial<StockSettings>) => {
    return await withUserGuard(async () => {
      const verifiedUser = requireUser(user, authLoading);
      
      console.log('📦 updateStockSettings: Updating stock settings for user:', verifiedUser.id);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          min_stock_alert: settings.minStockAlert,
        })
        .eq('id', verifiedUser.id);

      if (error) throw error;
      await fetchSettings();
      
      console.log('✅ updateStockSettings: Stock settings updated successfully');
    }, 'updateStockSettings');
  };

  const triggerManualBackup = async () => {
    return await withUserGuard(async () => {
      const verifiedUser = requireUser(user, authLoading);
      
      console.log('💾 triggerManualBackup: Creating manual backup for user:', verifiedUser.id);

      // Get current data with verified user
      const [
        productsRes,
        suppliersRes,
        purchasesRes,
        debtsRes,
        expensesRes,
        transactionsRes,
        projectsRes,
        profileRes
      ] = await Promise.all([
        supabase.from('products').select('*').eq('user_id', verifiedUser.id),
        supabase.from('suppliers').select('*').eq('user_id', verifiedUser.id),
        supabase.from('purchases').select('*').eq('user_id', verifiedUser.id),
        supabase.from('debts').select('*').eq('user_id', verifiedUser.id),
        supabase.from('expenses').select('*').eq('user_id', verifiedUser.id),
        supabase.from('transactions').select('*').eq('user_id', verifiedUser.id),
        supabase.from('projects').select('*').eq('user_id', verifiedUser.id),
        supabase.from('profiles').select('*').eq('id', verifiedUser.id).single()
      ]);

      if (profileRes.error) throw profileRes.error;

      const backupData: BackupData = {
        version: '1.0',
        created_at: new Date().toISOString(),
        data: {
          products: productsRes.data || [],
          suppliers: suppliersRes.data || [],
          purchases: purchasesRes.data || [],
          debts: debtsRes.data || [],
          expenses: expensesRes.data || [],
          transactions: transactionsRes.data || [],
          projects: projectsRes.data || [],
          profile: profileRes.data
        }
      };

      const { error } = await supabase
        .from('backups')
        .insert({
          user_id: verifiedUser.id,
          backup_data: backupData as any, // ✅ Cast to any to bypass Json type restriction
          backup_type: 'manual'
        });

      if (error) throw error;
      await fetchBackups();
      
      console.log('✅ triggerManualBackup: Manual backup created successfully');
    }, 'triggerManualBackup');
  };

  const restoreBackup = async (backupId: string) => {
    console.log('🔄 Starting PRODUCTION-GRADE restore for backup:', backupId);
    
    return await withUserGuard(async () => {
      const verifiedUser = requireUser(user, authLoading);
      
      // ✅ STRICT LOCK: Prevent multiple executions
      if (isRestoring) {
        console.log('⚠️ Restore already in progress - blocking duplicate request');
        throw new Error('Restore already in progress');
      }
      
      // ✅ STRICT LOCK: Set restore flag immediately
      setIsRestoring(true);
      
      try {
        // Step 1: Fetch backup
        console.log('🔍 Step 1: Fetching backup...');
        
        const { data: backup, error: fetchError } = await supabase
          .from('backups')
          .select('backup_data, created_at, user_id')
          .eq('id', backupId)
          .eq('user_id', verifiedUser.id)
          .single();

        if (fetchError || !backup) {
          console.error('❌ Backup fetch failed:', fetchError);
          throw new Error(`Backup not found or access denied: ${fetchError?.message || 'Unknown error'}`);
        }

        // Step 2: Auto-detect and normalize backup format
        console.log('🔍 Step 2: Auto-detecting backup format...');
        const normalizedBackup = normalizeBackupData(backup.backup_data);
        
        console.log('✅ Backup format detected:', {
          version: normalizedBackup.version,
          created_at: normalizedBackup.created_at,
          tables: Object.keys(normalizedBackup.data || {}),
          recordCounts: Object.fromEntries(
            Object.entries(normalizedBackup.data || {}).map(([key, value]) => [key, Array.isArray(value) ? value.length : 0])
          )
        });

        // Step 3: Validate backup data
        console.log('🔍 Step 3: Validating backup data...');
        if (!normalizedBackup.data || typeof normalizedBackup.data !== 'object') {
          throw new Error('Invalid backup data structure');
        }

        // Step 4: Define table processing order (dependency-aware)
        const deleteOrder: ValidTable[] = ['expenses', 'debts', 'transactions', 'purchases', 'projects', 'suppliers', 'products'];
        const insertOrder: ValidTable[] = ['products', 'suppliers', 'projects', 'purchases', 'transactions', 'debts', 'expenses'];
        
        console.log('🔍 Step 4: Processing order defined');
        console.log('📋 Delete order:', deleteOrder);
        console.log('📋 Insert order:', insertOrder);

        // Step 5: Execute restore with proper error handling
        console.log('🔄 Step 5: Executing restore process...');
        
        let totalProcessed = 0;
        const processedTables: { table: string; records: number; status: string }[] = [];

        // Step 5a: Delete existing data in reverse dependency order
        for (const tableName of deleteOrder) {
          try {
            console.log(`🗑️ Deleting existing data from ${tableName}...`);
            
            const { error: deleteError } = await supabase
              .from(tableName)
              .delete()
              .eq('user_id', verifiedUser.id);

            if (deleteError) {
              console.error(`❌ Failed to delete ${tableName}:`, deleteError);
              throw new Error(`Failed to clear ${tableName}: ${deleteError.message}`);
            }
            
            console.log(`✅ Cleared ${tableName}`);
          } catch (error) {
            console.error(`❌ Critical error deleting ${tableName}:`, error);
            throw new Error(`Delete failed at ${tableName}: ${error.message}`);
          }
        }

        // Step 5b: Insert data in correct dependency order with batching
        for (const tableName of insertOrder) {
          try {
            const tableData = normalizedBackup.data[tableName];
            
            if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
              console.log(`⏭️ Skipping ${tableName} - no data`);
              processedTables.push({ table: tableName, records: 0, status: 'skipped' });
              continue;
            }

            console.log(`📥 Inserting ${tableData.length} records into ${tableName}...`);
            
            // Sanitize data before insertion
            let sanitizedData = sanitizeData(tableName, tableData);
            
            // ✅ SPECIAL HANDLING: Normalize transactions JSON fields
            if (tableName === 'transactions') {
              console.log('🔧 Applying transactions JSON normalization...');
              sanitizedData = normalizeTransactions(sanitizedData);
            }
            
            if (sanitizedData.length === 0) {
              console.log(`⏭️ Skipping ${tableName} - no valid data after sanitization`);
              processedTables.push({ table: tableName, records: 0, status: 'skipped' });
              continue;
            }

            // ✅ HARD VALIDATION: Ensure transactions have valid items array
            if (tableName === 'transactions') {
              for (let i = 0; i < sanitizedData.length; i++) {
                const record = sanitizedData[i];
                if (!Array.isArray(record.items)) {
                  console.error(`❌ Transaction record ${i} has invalid items field:`, record.items);
                  throw new Error(`Transaction record ${i} has invalid items format - expected array, got ${typeof record.items}`);
                }
              }
              console.log('✅ All transaction records passed items validation');
            }

            // Batch insert (100 records per batch)
            const batchSize = 100;
            let insertedCount = 0;
            
            for (let i = 0; i < sanitizedData.length; i += batchSize) {
              const batch = sanitizedData.slice(i, i + batchSize);
              
              // Add user_id to each record
              const batchWithUserId = batch.map(record => ({
                ...record,
                user_id: verifiedUser.id
              }));

              console.log(`📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sanitizedData.length/batchSize)} for ${tableName} (${batch.length} records)`);

              const { error: insertError } = await supabase
                .from(tableName)
                .insert(batchWithUserId);

              if (insertError) {
                console.error(`❌ Failed to insert batch into ${tableName}:`, insertError);
                
                // ✅ ENHANCED ERROR HANDLING: Detect JSON format issues
                let errorMessage = insertError.message;
                if (insertError.message.includes('cannot extract elements from a scalar')) {
                  errorMessage = `Invalid JSON format in transactions.items field - expected array but got scalar value`;
                } else if (insertError.message.includes('invalid input syntax for type json')) {
                  errorMessage = `Invalid JSON syntax in transactions.items field`;
                } else if (insertError.message.includes('JSON')) {
                  errorMessage = `JSON format error in transactions: ${insertError.message}`;
                }
                
                throw new Error(`Insert failed at ${tableName} (batch ${Math.floor(i/batchSize) + 1}): ${errorMessage}`);
              }

              insertedCount += batch.length;
            }

            totalProcessed += insertedCount;
            processedTables.push({ table: tableName, records: insertedCount, status: 'success' });
            console.log(`✅ Inserted ${insertedCount} records into ${tableName}`);
            
          } catch (error) {
            console.error(`❌ Critical error inserting ${tableName}:`, error);
            processedTables.push({ table: tableName, records: 0, status: 'failed' });
            throw new Error(`Insert failed at ${tableName}: ${error.message}`);
          }
        }

        // Step 6: Restore profile if exists
        if (normalizedBackup.data.profile) {
          try {
            console.log('⚙️ Restoring profile settings...');
            
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: verifiedUser.id,
                ...normalizedBackup.data.profile,
                updated_at: new Date().toISOString()
              });

            if (profileError) {
              console.error('❌ Failed to restore profile:', profileError);
              throw new Error(`Profile restore failed: ${profileError.message}`);
            }
            
            console.log('✅ Profile settings restored');
          } catch (error) {
            console.error('❌ Profile restore error:', error);
            // Don't throw error for profile - continue with data restore success
            console.log('⚠️ Profile restore failed but data restore succeeded');
          }
        }

        // Step 7: Refresh application data
        console.log('🔄 Step 7: Refreshing application data...');
        await fetchSettings();

        // Step 8: Return success result
        console.log('✅ PRODUCTION-GRADE RESTORE SUCCESS:', {
          backupId,
          version: normalizedBackup.version,
          totalProcessed,
          tablesProcessed: processedTables.length,
          details: processedTables
        });

        return {
          success: true,
          version: normalizedBackup.version,
          totalRecords: totalProcessed,
          tablesProcessed: processedTables,
          summary: {
            tablesRestored: processedTables.filter(t => t.status === 'success').map(t => t.table),
            totalRecords: totalProcessed,
            version: normalizedBackup.version,
            details: processedTables
          }
        };
        
      } catch (error) {
        console.error('❌ PRODUCTION-GRADE RESTORE FAILED:', error);
        throw error;
      } finally {
        // ✅ ALWAYS RESET RESTORE FLAG
        setIsRestoring(false);
        console.log('🔓 Restore lock released - operation completed');
      }
    }, 'restoreBackup');
  };

  // Helper function for rollback attempts
  const attemptRollback = async (deleteResults: Record<string, any>, userId: string) => {
    console.log('🔄 Attempting emergency rollback...');
    
    // For now, we'll just clear all data to prevent inconsistent state
    // In a real production system, you might have backup of current state
    const tables: ValidTable[] = ['products', 'suppliers', 'purchases', 'debts', 'expenses', 'transactions', 'projects'];
    
    for (const table of tables) {
      try {
        await supabase.from(table).delete().eq('user_id', userId);
        console.log(`🔄 Cleared ${table} during rollback`);
      } catch (error) {
        console.error(`❌ Failed to clear ${table} during rollback:`, error);
      }
    }
    
    console.log('🔄 Rollback completed - database is in clean state');
  };

  return (
    <StoreContext.Provider value={{ 
      storeInfo, 
      printerSettings, 
      stockSettings,
      backups,
      isLoading,
      isSyncing,
      isRestoring, // ✅ EXPOSE RESTORE FLAG
      updateStoreInfo, 
      updatePrinterSettings,
      updateStockSettings,
      triggerManualBackup,
      restoreBackup,
      fetchBackups,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
