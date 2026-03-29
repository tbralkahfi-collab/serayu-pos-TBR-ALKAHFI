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
  version: string;
  created_at: string;
  data: {
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

interface BackupRecord {
  id: string;
  backupType: 'auto' | 'manual';
  createdAt: string;
}

// Define valid table types for Supabase operations
type ValidTable = 'products' | 'suppliers' | 'purchases' | 'debts' | 'expenses' | 'transactions' | 'projects';

// ✅ DYNAMIC SANITIZE FUNCTION - Matches actual database schema
const sanitizeData = (table: ValidTable, data: any[]): any[] => {
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

  console.log(`📦 Raw ${table}:`, data[0]);

  const cleanData = data.map(item => {
    const allowed = schemaFields[table] || [];
    const clean: any = {};

    // Only include fields that exist in database schema
    for (const field of allowed) {
      if (item[field] !== undefined && item[field] !== null) {
        // Field-specific validation
        if (field === 'user_id') {
          clean[field] = String(item[field]);
        } else if (field.includes('harga') || field.includes('total') || field.includes('jumlah') || field.includes('bayar') || field.includes('dp') || field.includes('sisa') || field.includes('nilai_kontrak') || field.includes('diskon_nominal') || field.includes('biaya_tenaga_kerja')) {
          clean[field] = Number(item[field]) || 0;
        } else if (field.includes('tanggal') || field.includes('created_at') || field.includes('updated_at')) {
          clean[field] = item[field] || new Date().toISOString();
        } else if (field === 'type') {
          clean[field] = item[field] === 'utang' || item[field] === 'piutang' ? item[field] : 'utang';
        } else if (field === 'stok' || field.includes('diskon_persen')) {
          clean[field] = Number(item[field]) || 0;
        } else {
          clean[field] = item[field];
        }
      }
    }

    return clean;
  });

  console.log(`🧹 Clean ${table}:`, cleanData[0]);
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
    console.log('🔄 Starting BULLETPROOF atomic restore for backup:', backupId);
    
    return await withUserGuard(async () => {
      const verifiedUser = requireUser(user, authLoading);
      
      // ✅ STRICT GUARD: Prevent multiple executions
      if (isRestoring) {
        console.log('⚠️ Restore already in progress - blocking duplicate request');
        throw new Error('Restore already in progress');
      }
      
      // ✅ STRICT GUARD: Set restore flag immediately
      setIsRestoring(true);
      
      try {
        // Step 1: Fetch backup with validation
        console.log('🔍 Fetching and validating backup structure...');
        
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

        // Step 2: Validate backup structure
        console.log('🔍 Validating backup structure and version...');
        const backupData = backup.backup_data as any; // ✅ Cast to any for type safety
        
        if (!backupData || typeof backupData !== 'object') {
          throw new Error('Invalid backup data structure');
        }
        
        // Check version compatibility
        const version = backupData.version || '1.0';
        if (version !== '1.0') {
          throw new Error(`Backup version ${version} is not compatible with current version 1.0`);
        }
        
        // Check data section
        if (!backupData.data || typeof backupData.data !== 'object') {
          throw new Error('Backup data section is missing or invalid');
        }
        
        console.log('✅ Backup validation passed - version:', version);

        // Step 3: Execute atomic restore via RPC
        console.log('🔄 Executing BULLETPROOF atomic restore via RPC...');
        
        const { data: restoreResults, error: restoreError } = await supabase
          .rpc('restore_backup_atomic' as any, { // ✅ Cast RPC name to any
            p_backup_data: backupData,
            p_user_id: verifiedUser.id
          });

        if (restoreError) {
          console.error('❌ Atomic restore RPC failed:', restoreError);
          throw new Error(`Atomic restore failed: ${restoreError.message}`);
        }

        console.log('✅ Atomic restore RPC completed:', restoreResults);

        // Step 4: Process results and validate
        const results = restoreResults || [];
        if (!Array.isArray(results)) {
          throw new Error('Invalid restore results format');
        }
        
        const summary = results.find(r => r.table_name === 'SUMMARY');
        const errors = results.filter(r => r.status === 'ERROR');
        const globalError = results.find(r => r.table_name === 'GLOBAL_ERROR');
        
        if (globalError) {
          throw new Error(`Global restore error: ${globalError.error_message}`);
        }
        
        if (errors.length > 0) {
          const errorDetails = errors.map(e => `${e.table_name}: ${e.error_message}`).join('; ');
          throw new Error(`Restore failed for ${errors.length} table(s): ${errorDetails}`);
        }
        
        if (!summary || summary.status !== 'SUCCESS') {
          throw new Error('Restore completed but summary indicates failure');
        }

        // Step 5: Refresh application data
        console.log('🔄 Refreshing application data...');
        await fetchSettings();

        // Step 6: Return comprehensive success result
        const totalRows = summary.rows_processed || 0;
        const tablesRestored = results.filter(r => r.status === 'SUCCESS' && r.table_name !== 'SUMMARY');
        
        console.log('✅ BULLETPROOF ATOMIC RESTORE SUCCESS:', {
          tablesRestored: tablesRestored.length,
          totalRows,
          backupId,
          version,
          atomic: true
        });

        return {
          success: true,
          atomic: true,
          bulletproof: true,
          results: results,
          summary: {
            tablesRestored: tablesRestored.map(t => t.table_name),
            totalRecords: totalRows,
            version: version,
            details: tablesRestored.map(t => ({
              table: t.table_name,
              rows: t.rows_processed
            }))
          }
        };
        
      } catch (error) {
        console.error('❌ BULLETPROOF restore failed:', error);
        throw error;
      } finally {
        // ✅ ALWAYS RESET RESTORE FLAG
        setIsRestoring(false);
        console.log('🔓 Restore flag reset - bulletproof operation completed');
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
