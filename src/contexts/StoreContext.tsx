import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

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
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(DEFAULT_STORE_INFO);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);
  const [stockSettings, setStockSettings] = useState<StockSettings>(DEFAULT_STOCK_SETTINGS);
  const [backups, setBackups] = useState<BackupRecord[]>([]);

  // Fetch profile settings from Supabase
  const fetchSettings = useCallback(async () => {
    if (!user) {
      // Fallback to localStorage for non-authenticated users
      const savedStore = localStorage.getItem('serayu_store_info');
      const savedPrinter = localStorage.getItem('serayu_printer_settings');
      const savedStock = localStorage.getItem('serayu_stock_settings');
      
      if (savedStore) setStoreInfo(JSON.parse(savedStore));
      if (savedPrinter) setPrinterSettings(JSON.parse(savedPrinter));
      if (savedStock) setStockSettings(JSON.parse(savedStock));
      setIsLoading(false);
      return;
    }

    try {
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
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch backups list
  const fetchBackups = useCallback(async () => {
    if (!user) return;

    try {
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
    } catch (error) {
      console.error('Error fetching backups:', error);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
    fetchBackups();
  }, [fetchSettings, fetchBackups]);

  // Realtime subscription for profiles
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('store-settings')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, () => {
        fetchSettings();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'backups',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchBackups();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSettings, fetchBackups]);

  const updateStoreInfo = async (info: Partial<StoreInfo>) => {
    const updated = { ...storeInfo, ...info };
    setStoreInfo(updated);

    if (!user) {
      localStorage.setItem('serayu_store_info', JSON.stringify(updated));
      return;
    }

    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          store_name: updated.name,
          store_address: updated.address,
          store_phone: updated.phone,
          store_logo: updated.logo,
        } as any)
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating store info:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const updatePrinterSettings = async (settings: Partial<PrinterSettings>) => {
    const updated = { ...printerSettings, ...settings };
    setPrinterSettings(updated);

    if (!user) {
      localStorage.setItem('serayu_printer_settings', JSON.stringify(updated));
      return;
    }

    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          printer_type: updated.type,
          paper_width: updated.paperWidth,
          auto_print: updated.autoPrint,
        } as any)
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating printer settings:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const updateStockSettings = async (settings: Partial<StockSettings>) => {
    const updated = { ...stockSettings, ...settings };
    setStockSettings(updated);

    if (!user) {
      localStorage.setItem('serayu_stock_settings', JSON.stringify(updated));
      return;
    }

    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          min_stock_alert: updated.minStockAlert,
        } as any)
        .eq('id', user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating stock settings:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const triggerManualBackup = async () => {
    if (!user) throw new Error('Not authenticated');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('auto-backup', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.error) throw response.error;
    await fetchBackups();
  };

  const restoreBackup = async (backupId: string) => {
    if (!user) throw new Error('Not authenticated');

    // Fetch backup data
    const { data: backup, error: fetchError } = await supabase
      .from('backups')
      .select('backup_data')
      .eq('id', backupId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !backup) throw fetchError || new Error('Backup not found');

    const backupData = backup.backup_data as any;

    // Clear existing data and restore from backup
    await Promise.all([
      supabase.from('products').delete().eq('user_id', user.id),
      supabase.from('suppliers').delete().eq('user_id', user.id),
      supabase.from('purchases').delete().eq('user_id', user.id),
      supabase.from('debts').delete().eq('user_id', user.id),
      supabase.from('expenses').delete().eq('user_id', user.id),
      supabase.from('transactions').delete().eq('user_id', user.id),
      supabase.from('projects').delete().eq('user_id', user.id),
    ]);

    // Insert backup data
    if (backupData.products?.length) {
      await supabase.from('products').insert(backupData.products);
    }
    if (backupData.suppliers?.length) {
      await supabase.from('suppliers').insert(backupData.suppliers);
    }
    if (backupData.purchases?.length) {
      await supabase.from('purchases').insert(backupData.purchases);
    }
    if (backupData.debts?.length) {
      await supabase.from('debts').insert(backupData.debts);
    }
    if (backupData.expenses?.length) {
      await supabase.from('expenses').insert(backupData.expenses);
    }
    if (backupData.transactions?.length) {
      await supabase.from('transactions').insert(backupData.transactions);
    }
    if (backupData.projects?.length) {
      await supabase.from('projects').insert(backupData.projects);
    }

    // Restore profile settings
    if (backupData.profile) {
      await supabase.from('profiles').update({
        store_name: backupData.profile.store_name,
        store_address: backupData.profile.store_address,
        store_phone: backupData.profile.store_phone,
        store_logo: backupData.profile.store_logo,
        printer_type: backupData.profile.printer_type,
        paper_width: backupData.profile.paper_width,
        auto_print: backupData.profile.auto_print,
        min_stock_alert: backupData.profile.min_stock_alert,
      } as any).eq('id', user.id);
    }


    
    // Refresh settings
    await fetchSettings();
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
