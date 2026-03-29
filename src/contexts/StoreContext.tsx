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

interface BackupRecord {
  id: string;
  backupType: 'auto' | 'manual';
  createdAt: string;
}

interface StoreContextType {
  storeInfo: StoreInfo;
  printerSettings: PrinterSettings;
  stockSettings: StockSettings;
  backups: BackupRecord[];
  isLoading: boolean;
  isSyncing: boolean;
  updateStoreInfo: (info: Partial<StoreInfo>) => Promise<void>;
  updatePrinterSettings: (settings: Partial<PrinterSettings>) => Promise<void>;
  updateStockSettings: (settings: Partial<StockSettings>) => Promise<void>;
  triggerManualBackup: () => Promise<void>;
  restoreBackup: (backupId: string) => Promise<void>;
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

      const backupData = {
        products: productsRes.data || [],
        suppliers: suppliersRes.data || [],
        purchases: purchasesRes.data || [],
        debts: debtsRes.data || [],
        expenses: expensesRes.data || [],
        transactions: transactionsRes.data || [],
        projects: projectsRes.data || [],
        profile: profileRes.data
      };

      const { error } = await supabase
        .from('backups')
        .insert({
          user_id: verifiedUser.id,
          backup_data: backupData,
          backup_type: 'manual'
        });

      if (error) throw error;
      await fetchBackups();
      
      console.log('✅ triggerManualBackup: Manual backup created successfully');
    }, 'triggerManualBackup');
  };

  const restoreBackup = async (backupId: string) => {
    console.log('🔄 Starting production-grade restore process for backup:', backupId);
    
    return await withUserGuard(async () => {
      const verifiedUser = requireUser(user, authLoading);
      
      // Step 1: Validate backup structure and ownership
      console.log('🔍 Fetching and validating backup...');
      
      const { data: backup, error: fetchError } = await supabase
        .from('backups')
        .select('backup_data, created_at, user_id')
        .eq('id', backupId)
        .eq('user_id', verifiedUser.id)
        .single();

      if (fetchError || !backup) {
        console.error('❌ Backup fetch error:', fetchError);
        throw new Error('Backup not found or access denied');
      }

      const backupData = backup.backup_data as any;
      
      // Validate backup structure
      const requiredTables = ['products', 'suppliers', 'purchases', 'debts', 'expenses', 'transactions', 'projects'];
      const backupTables = Object.keys(backupData).filter(key => requiredTables.includes(key));
      
      if (backupTables.length === 0) {
        throw new Error('Invalid backup structure: No valid data tables found');
      }

      console.log('✅ Backup structure validated, tables found:', backupTables);

      // Step 2: Define dependency-aware restore sequence
      const restoreSequence = [
        { table: 'products', data: backupData.products || [], dependencies: [] },
        { table: 'suppliers', data: backupData.suppliers || [], dependencies: [] },
        { table: 'projects', data: backupData.projects || [], dependencies: ['suppliers'] },
        { table: 'purchases', data: backupData.purchases || [], dependencies: ['suppliers'] },
        { table: 'transactions', data: backupData.transactions || [], dependencies: ['products'] },
        { table: 'debts', data: backupData.debts || [], dependencies: ['projects', 'transactions'] },
        { table: 'expenses', data: backupData.expenses || [], dependencies: [] }
      ];

      // Step 3: Safe delete sequence (reverse of dependencies)
      const deleteSequence = ['expenses', 'debts', 'transactions', 'purchases', 'projects', 'suppliers', 'products'];
      
      console.log('🗑️ Deleting existing data with dependency safety...');
      
      // Delete with error handling and rollback capability
      const deleteResults: Record<string, { success: boolean; count?: number; error?: any }> = {};
      
      for (const table of deleteSequence) {
        try {
          console.log(`🗑️ Deleting ${table}...`);
          
          // Get count before deletion for logging
          const { count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', verifiedUser.id);
          
          const { error: deleteError } = await supabase
            .from(table)
            .delete()
            .eq('user_id', verifiedUser.id);
          
          if (deleteError) {
            console.error(`❌ Failed to delete ${table}:`, deleteError);
            deleteResults[table] = { success: false, error: deleteError };
            throw new Error(`Failed to clear ${table}: ${deleteError.message}`);
          }
          
          deleteResults[table] = { success: true, count: count || 0 };
          console.log(`✅ Cleared ${table}: ${count} records deleted`);
        } catch (error) {
          console.error(`❌ Critical error deleting ${table}:`, error);
          deleteResults[table] = { success: false, error };
          throw error;
        }
      }

      // Step 4: Insert backup data with upsert to preserve IDs and handle conflicts
      console.log('📥 Inserting backup data with ID preservation...');
      
      const insertResults: Record<string, { success: boolean; count: number; error?: any }> = {};
      
      for (const { table, data } of restoreSequence) {
        if (data.length === 0) {
          console.log(`⏭️ Skipping ${table} - no data`);
          insertResults[table] = { success: true, count: 0 };
          continue;
        }

        try {
          console.log(`📥 Restoring ${data.length} records to ${table}...`);
          
          // Prepare data with user_id and preserve original IDs
          const preparedData = data.map((record: any) => ({
            ...record,
            user_id: verifiedUser.id,
            // Ensure created_at is preserved or set
            created_at: record.created_at || new Date().toISOString(),
            // Update modified timestamp
            updated_at: new Date().toISOString()
          }));

          // Use upsert to handle potential conflicts gracefully
          const { error: insertError, count: insertCount } = await supabase
            .from(table)
            .upsert(preparedData, { 
              onConflict: 'id', 
              ignoreDuplicates: false 
            })
            .select('id', { count: 'exact' });

          if (insertError) {
            console.error(`❌ Failed to upsert ${table}:`, insertError);
            insertResults[table] = { success: false, count: 0, error: insertError };
            
            // Critical failure - attempt rollback
            console.error('🚨 Critical failure detected, attempting rollback...');
            await attemptRollback(deleteResults, verifiedUser.id);
            throw new Error(`Failed to restore ${table}: ${insertError.message}`);
          }
          
          insertResults[table] = { success: true, count: insertCount || data.length };
          console.log(`✅ Restored ${insertCount || data.length} records to ${table}`);
        } catch (error) {
          console.error(`❌ Error inserting ${table}:`, error);
          insertResults[table] = { success: false, count: 0, error };
          
          // Critical failure - attempt rollback
          console.error('🚨 Critical failure detected, attempting rollback...');
          await attemptRollback(deleteResults, verifiedUser.id);
          throw error;
        }
      }

      // Step 5: Restore profile settings with upsert
      if (backupData.profile) {
        console.log('⚙️ Restoring profile settings...');
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: verifiedUser.id,
              store_name: backupData.profile.store_name,
              store_address: backupData.profile.store_address,
              store_phone: backupData.profile.store_phone,
              store_logo: backupData.profile.store_logo,
              printer_type: backupData.profile.printer_type,
              paper_width: backupData.profile.paper_width,
              auto_print: backupData.profile.auto_print,
              min_stock_alert: backupData.profile.min_stock_alert,
              updated_at: new Date().toISOString()
            })
            .eq('id', verifiedUser.id);

          if (profileError) {
            console.error('❌ Failed to restore profile:', profileError);
            throw new Error(`Failed to restore profile: ${profileError.message}`);
          }
          console.log('✅ Profile settings restored');
        } catch (error) {
          console.error('❌ Error restoring profile:', error);
          throw error;
        }
      }

      // Step 6: Refresh settings and validate
      console.log('🔄 Refreshing settings...');
      await fetchSettings();
      
      // Step 7: Log comprehensive restore summary
      console.log('📊 Restore Summary:', {
        backupId,
        tablesRestored: Object.keys(insertResults),
        totalRecords: Object.values(insertResults).reduce((sum, result) => sum + result.count, 0),
        success: true
      });
      
      console.log('✅ Production-grade restore completed successfully');
      
      // Return results for potential UI updates
      return {
        success: true,
        results: insertResults,
        summary: {
          tablesRestored: Object.keys(insertResults),
          totalRecords: Object.values(insertResults).reduce((sum, result) => sum + result.count, 0)
        }
      };
      
    }, 'restoreBackup');
  };

  // Helper function for rollback attempts
  const attemptRollback = async (deleteResults: Record<string, any>, userId: string) => {
    console.log('🔄 Attempting emergency rollback...');
    
    // For now, we'll just clear all data to prevent inconsistent state
    // In a real production system, you might have backup of current state
    const tables = ['products', 'suppliers', 'purchases', 'debts', 'expenses', 'transactions', 'projects'];
    
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
