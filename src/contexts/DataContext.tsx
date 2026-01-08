import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface Product {
  id: string;
  nama: string;
  kategori: string;
  harga: number;
  stok: number;
  satuan: string;
  minStok?: number;
}

export interface Supplier {
  id: string;
  nama: string;
  alamat: string;
  telepon: string;
  email: string;
  catatan: string;
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

export interface Transaction {
  id: string;
  tanggal: string;
  pelanggan: string;
  items: string;
  total: number;
  bayar: number;
  kembalian: number;
  metode: string;
  status: string;
}

// Initial data
const initialProducts: Product[] = [
  { id: 'PRD001', nama: 'Baja Ringan C75', kategori: 'Rangka', harga: 85000, stok: 250, satuan: 'batang' },
  { id: 'PRD002', nama: 'Baja Ringan C100', kategori: 'Rangka', harga: 95000, stok: 180, satuan: 'batang' },
  { id: 'PRD003', nama: 'Spandek 0.30mm', kategori: 'Atap', harga: 85000, stok: 150, satuan: 'lembar' },
  { id: 'PRD004', nama: 'Spandek 0.35mm', kategori: 'Atap', harga: 95000, stok: 8, satuan: 'lembar' },
  { id: 'PRD005', nama: 'Hollow 4x4', kategori: 'Rangka', harga: 65000, stok: 120, satuan: 'batang' },
  { id: 'PRD006', nama: 'Reng Baja Ringan', kategori: 'Rangka', harga: 28000, stok: 5, satuan: 'batang' },
  { id: 'PRD007', nama: 'Genteng Metal', kategori: 'Atap', harga: 45000, stok: 200, satuan: 'lembar' },
  { id: 'PRD008', nama: 'Sekrup Baja 12mm', kategori: 'Aksesoris', harga: 350, stok: 5000, satuan: 'pcs' },
  { id: 'PRD009', nama: 'Dynabolt 10mm', kategori: 'Aksesoris', harga: 2500, stok: 800, satuan: 'pcs' },
  { id: 'PRD010', nama: 'Talang Air PVC', kategori: 'Aksesoris', harga: 55000, stok: 50, satuan: 'batang' },
];

const initialSuppliers: Supplier[] = [
  { id: 'SUP001', nama: 'PT Baja Steel Indonesia', alamat: 'Jl. Industri No. 45, Surabaya', telepon: '031-5551234', email: 'sales@bajasteel.co.id', catatan: 'Supplier utama baja ringan' },
  { id: 'SUP002', nama: 'CV Spandek Jaya', alamat: 'Jl. Raya Sidoarjo No. 78', telepon: '031-8881234', email: 'order@spandekjaya.com', catatan: 'Spesialisasi spandek dan genteng' },
  { id: 'SUP003', nama: 'UD Hollow Mandiri', alamat: 'Jl. Veteran No. 12, Gresik', telepon: '031-3991234', email: 'info@hollowmandiri.id', catatan: 'Hollow dan pipa besi' },
  { id: 'SUP004', nama: 'PT Atap Metal', alamat: 'Jl. Industri Rungkut, Surabaya', telepon: '031-8712345', email: 'sales@atapmetal.co.id', catatan: 'Genteng metal premium' },
  { id: 'SUP005', nama: 'CV Fastener Indo', alamat: 'Jl. Margomulyo No. 33, Surabaya', telepon: '031-7491234', email: 'order@fastenerindo.com', catatan: 'Sekrup dan dynabolt' },
];

const initialPurchases: Purchase[] = [
  { id: 'PO001', supplierId: 'SUP001', supplier: 'PT Baja Steel Indonesia', date: '2024-01-15', total: 45000000, dp: 15000000, paymentMethod: 'transfer', status: 'Selesai', items: 'Baja Ringan C75 x 500btg', notes: '' },
  { id: 'PO002', supplierId: 'SUP002', supplier: 'CV Spandek Jaya', date: '2024-01-14', total: 28500000, dp: 0, paymentMethod: 'cash', status: 'Selesai', items: 'Spandek 0.35mm x 300lbr', notes: '' },
  { id: 'PO003', supplierId: 'SUP003', supplier: 'UD Hollow Mandiri', date: '2024-01-13', total: 13000000, dp: 5000000, paymentMethod: 'transfer', status: 'Pending', items: 'Hollow 4x4 x 200btg', notes: 'Menunggu konfirmasi' },
  { id: 'PO004', supplierId: 'SUP004', supplier: 'PT Atap Metal', date: '2024-01-12', total: 22500000, dp: 10000000, paymentMethod: 'transfer', status: 'Dikirim', items: 'Genteng Metal x 500lbr', notes: 'Est. tiba 3 hari' },
  { id: 'PO005', supplierId: 'SUP005', supplier: 'CV Fastener Indo', date: '2024-01-11', total: 8500000, dp: 0, paymentMethod: 'cash', status: 'Selesai', items: 'Sekrup & Dynabolt', notes: '' },
];

const initialDebts: DebtRecord[] = [
  { 
    id: 'UTG001', type: 'utang', nama: 'PT Baja Steel Indonesia', 
    total: 25000000, sisa: 15000000, tanggal: '2024-01-10', jatuhTempo: '2024-02-10', 
    keterangan: 'Pembelian Baja Ringan C75 x 300 batang',
    payments: [
      { id: 'PAY001', tanggal: '2024-01-15', jumlah: 10000000, metode: 'Transfer', catatan: 'Pembayaran pertama' }
    ]
  },
  { 
    id: 'UTG002', type: 'utang', nama: 'CV Spandek Jaya', 
    total: 18500000, sisa: 18500000, tanggal: '2024-01-12', jatuhTempo: '2024-02-12', 
    keterangan: 'Pembelian Spandek 0.35mm x 200 lembar',
    payments: []
  },
  { 
    id: 'PTG001', type: 'piutang', nama: 'Toko Bangunan Maju', 
    total: 35000000, sisa: 20000000, tanggal: '2024-01-05', jatuhTempo: '2024-02-05', 
    keterangan: 'Penjualan material proyek perumahan',
    payments: [
      { id: 'PAY002', tanggal: '2024-01-10', jumlah: 15000000, metode: 'Transfer', catatan: 'DP awal' }
    ]
  },
  { 
    id: 'PTG002', type: 'piutang', nama: 'CV Konstruksi Jaya', 
    total: 28000000, sisa: 28000000, tanggal: '2024-01-08', jatuhTempo: '2024-02-28', 
    keterangan: 'Penjualan rangka atap proyek ruko',
    payments: []
  },
];

const initialExpenses: Expense[] = [
  { id: 'OP001', kategori: 'Listrik', deskripsi: 'Tagihan PLN Januari - Gudang & Toko', jumlah: 1850000, tanggal: '2024-01-15' },
  { id: 'OP002', kategori: 'Air', deskripsi: 'Tagihan PDAM Januari', jumlah: 350000, tanggal: '2024-01-15' },
  { id: 'OP003', kategori: 'Telepon', deskripsi: 'Tagihan Internet & Telepon Toko', jumlah: 650000, tanggal: '2024-01-10' },
  { id: 'OP004', kategori: 'Transportasi', deskripsi: 'BBM Truk Pengiriman', jumlah: 2500000, tanggal: '2024-01-12' },
  { id: 'OP005', kategori: 'Pemeliharaan', deskripsi: 'Service Forklift', jumlah: 850000, tanggal: '2024-01-08' },
  { id: 'OP006', kategori: 'Sewa', deskripsi: 'Sewa Gudang Januari', jumlah: 8000000, tanggal: '2024-01-01' },
];

const initialTransactions: Transaction[] = [
  { id: 'TRX001', tanggal: '2024-01-15 14:30', pelanggan: 'Pak Ahmad', items: 'Baja C75 x10, Spandek x20', total: 2750000, bayar: 3000000, kembalian: 250000, metode: 'Cash', status: 'Selesai' },
  { id: 'TRX002', tanggal: '2024-01-15 11:20', pelanggan: 'CV Bangun Jaya', items: 'Hollow 4x4 x50, Sekrup x1000', total: 3600000, bayar: 3600000, kembalian: 0, metode: 'Transfer', status: 'Selesai' },
  { id: 'TRX003', tanggal: '2024-01-14 16:45', pelanggan: 'Toko Maju', items: 'Reng x100, Genteng Metal x50', total: 5050000, bayar: 5100000, kembalian: 50000, metode: 'Cash', status: 'Selesai' },
  { id: 'TRX004', tanggal: '2024-01-14 09:15', pelanggan: 'Pak Budi', items: 'Baja C100 x5', total: 475000, bayar: 500000, kembalian: 25000, metode: 'Cash', status: 'Selesai' },
  { id: 'TRX005', tanggal: '2024-01-13 13:00', pelanggan: 'PT Konstruksi', items: 'Spandek 0.35mm x100', total: 9500000, bayar: 9500000, kembalian: 0, metode: 'Transfer', status: 'Selesai' },
];

interface DataContextType {
  // Products
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Suppliers
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  
  // Purchases
  purchases: Purchase[];
  setPurchases: React.Dispatch<React.SetStateAction<Purchase[]>>;
  addPurchase: (purchase: Omit<Purchase, 'id'>) => void;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => void;
  deletePurchase: (id: string) => void;
  
  // Debts
  debts: DebtRecord[];
  setDebts: React.Dispatch<React.SetStateAction<DebtRecord[]>>;
  addDebt: (debt: Omit<DebtRecord, 'id' | 'payments'>) => void;
  updateDebt: (id: string, debt: Partial<DebtRecord>) => void;
  deleteDebt: (id: string) => void;
  addPayment: (debtId: string, payment: Omit<PaymentHistory, 'id'>) => void;
  
  // Expenses
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  
  // Transactions
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEYS = {
  products: 'serayu_products',
  suppliers: 'serayu_suppliers',
  purchases: 'serayu_purchases',
  debts: 'serayu_debts',
  expenses: 'serayu_expenses',
  transactions: 'serayu_transactions',
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.products);
    return saved ? JSON.parse(saved) : initialProducts;
  });
  
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.suppliers);
    return saved ? JSON.parse(saved) : initialSuppliers;
  });
  
  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.purchases);
    return saved ? JSON.parse(saved) : initialPurchases;
  });
  
  const [debts, setDebts] = useState<DebtRecord[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.debts);
    return saved ? JSON.parse(saved) : initialDebts;
  });
  
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.expenses);
    return saved ? JSON.parse(saved) : initialExpenses;
  });
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.transactions);
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  }, [products]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.suppliers, JSON.stringify(suppliers));
  }, [suppliers]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.purchases, JSON.stringify(purchases));
  }, [purchases]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.debts, JSON.stringify(debts));
  }, [debts]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(expenses));
  }, [expenses]);
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  }, [transactions]);

  // Product functions
  const addProduct = (product: Omit<Product, 'id'>) => {
    const id = `PRD${String(products.length + 1).padStart(3, '0')}`;
    setProducts(prev => [...prev, { ...product, id }]);
  };
  
  const updateProduct = (id: string, product: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...product } : p));
  };
  
  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  // Supplier functions
  const addSupplier = (supplier: Omit<Supplier, 'id'>): Supplier => {
    const id = `SUP${String(suppliers.length + 1).padStart(3, '0')}`;
    const newSupplier = { ...supplier, id };
    setSuppliers(prev => [...prev, newSupplier]);
    return newSupplier;
  };
  
  const updateSupplier = (id: string, supplier: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...supplier } : s));
  };
  
  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  // Purchase functions
  const addPurchase = (purchase: Omit<Purchase, 'id'>) => {
    const id = `PO${String(purchases.length + 1).padStart(3, '0')}`;
    setPurchases(prev => [...prev, { ...purchase, id }]);
  };
  
  const updatePurchase = (id: string, purchase: Partial<Purchase>) => {
    setPurchases(prev => prev.map(p => p.id === id ? { ...p, ...purchase } : p));
  };
  
  const deletePurchase = (id: string) => {
    setPurchases(prev => prev.filter(p => p.id !== id));
  };

  // Debt functions
  const addDebt = (debt: Omit<DebtRecord, 'id' | 'payments'>) => {
    const prefix = debt.type === 'utang' ? 'UTG' : 'PTG';
    const count = debts.filter(d => d.type === debt.type).length + 1;
    const id = `${prefix}${String(count).padStart(3, '0')}`;
    setDebts(prev => [...prev, { ...debt, id, payments: [] }]);
  };
  
  const updateDebt = (id: string, debt: Partial<DebtRecord>) => {
    setDebts(prev => prev.map(d => d.id === id ? { ...d, ...debt } : d));
  };
  
  const deleteDebt = (id: string) => {
    setDebts(prev => prev.filter(d => d.id !== id));
  };
  
  const addPayment = (debtId: string, payment: Omit<PaymentHistory, 'id'>) => {
    setDebts(prev => prev.map(debt => {
      if (debt.id !== debtId) return debt;
      const paymentId = `PAY${String(debt.payments.length + 1).padStart(3, '0')}`;
      const newPayment = { ...payment, id: paymentId };
      const newSisa = debt.sisa - payment.jumlah;
      return {
        ...debt,
        sisa: Math.max(0, newSisa),
        payments: [...debt.payments, newPayment],
      };
    }));
  };

  // Expense functions
  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const id = `OP${String(expenses.length + 1).padStart(3, '0')}`;
    setExpenses(prev => [...prev, { ...expense, id }]);
  };
  
  const updateExpense = (id: string, expense: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...expense } : e));
  };
  
  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Transaction functions
  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const id = `TRX${String(transactions.length + 1).padStart(3, '0')}`;
    setTransactions(prev => [...prev, { ...transaction, id }]);
  };
  
  const updateTransaction = (id: string, transaction: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...transaction } : t));
  };
  
  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return (
    <DataContext.Provider value={{
      products, setProducts, addProduct, updateProduct, deleteProduct,
      suppliers, setSuppliers, addSupplier, updateSupplier, deleteSupplier,
      purchases, setPurchases, addPurchase, updatePurchase, deletePurchase,
      debts, setDebts, addDebt, updateDebt, deleteDebt, addPayment,
      expenses, setExpenses, addExpense, updateExpense, deleteExpense,
      transactions, setTransactions, addTransaction, updateTransaction, deleteTransaction,
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
