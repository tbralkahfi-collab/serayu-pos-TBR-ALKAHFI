import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface StoreContextType {
  storeInfo: StoreInfo;
  printerSettings: PrinterSettings;
  stockSettings: StockSettings;
  updateStoreInfo: (info: Partial<StoreInfo>) => void;
  updatePrinterSettings: (settings: Partial<PrinterSettings>) => void;
  updateStockSettings: (settings: Partial<StockSettings>) => void;
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
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(DEFAULT_STORE_INFO);
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(DEFAULT_PRINTER_SETTINGS);
  const [stockSettings, setStockSettings] = useState<StockSettings>(DEFAULT_STOCK_SETTINGS);

  useEffect(() => {
    const savedStore = localStorage.getItem('serayu_store_info');
    const savedPrinter = localStorage.getItem('serayu_printer_settings');
    const savedStock = localStorage.getItem('serayu_stock_settings');
    
    if (savedStore) setStoreInfo(JSON.parse(savedStore));
    if (savedPrinter) setPrinterSettings(JSON.parse(savedPrinter));
    if (savedStock) setStockSettings(JSON.parse(savedStock));
  }, []);

  const updateStoreInfo = (info: Partial<StoreInfo>) => {
    const updated = { ...storeInfo, ...info };
    setStoreInfo(updated);
    localStorage.setItem('serayu_store_info', JSON.stringify(updated));
  };

  const updatePrinterSettings = (settings: Partial<PrinterSettings>) => {
    const updated = { ...printerSettings, ...settings };
    setPrinterSettings(updated);
    localStorage.setItem('serayu_printer_settings', JSON.stringify(updated));
  };

  const updateStockSettings = (settings: Partial<StockSettings>) => {
    const updated = { ...stockSettings, ...settings };
    setStockSettings(updated);
    localStorage.setItem('serayu_stock_settings', JSON.stringify(updated));
  };

  return (
    <StoreContext.Provider value={{ 
      storeInfo, 
      printerSettings, 
      stockSettings,
      updateStoreInfo, 
      updatePrinterSettings,
      updateStockSettings 
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
