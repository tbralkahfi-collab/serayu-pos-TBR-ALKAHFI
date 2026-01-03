import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface StoreInfo {
  name: string;
  address: string;
  phone: string;
  logo: string | null;
}

interface StoreContextType {
  storeInfo: StoreInfo;
  updateStoreInfo: (info: Partial<StoreInfo>) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_STORE_INFO: StoreInfo = {
  name: 'SERAYU POS',
  address: 'Jl. Contoh No. 123, Kota, Indonesia',
  phone: '+62 812 3456 7890',
  logo: null,
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(DEFAULT_STORE_INFO);

  useEffect(() => {
    const saved = localStorage.getItem('serayu_store_info');
    if (saved) {
      setStoreInfo(JSON.parse(saved));
    }
  }, []);

  const updateStoreInfo = (info: Partial<StoreInfo>) => {
    const updated = { ...storeInfo, ...info };
    setStoreInfo(updated);
    localStorage.setItem('serayu_store_info', JSON.stringify(updated));
  };

  return (
    <StoreContext.Provider value={{ storeInfo, updateStoreInfo }}>
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
