// Types for DataContext - Separate file to avoid circular dependency

export interface Product {
  id: string;
  nama: string;
  kategori: string;
  satuan: string;
  stok: number;
  hargaBeli: number;
  hargaJual: number;
  minStok?: number;
  harga?: number; // Legacy support
}

export interface Supplier {
  id: string;
  nama: string;
  alamat: string;
  telepon: string;
  catatan: string;
}

export interface PurchaseItem {
  productId: string;
  nama: string;
  qty: number;
  harga: number;
  total: number;
  isManual: boolean;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplier: string;
  tanggal: string;
  items: PurchaseItem[];
  total: number;
  status: string;
  notes: string;
}

export interface DebtRecord {
  id: string;
  type: 'utang' | 'piutang';
  nama: string;
  total: number;
  sisa: number;
  tanggal: string;
  catatan: string;
  payments?: PaymentHistory[];
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
  total: number;
  diskon?: number;
  diskonNominal?: number;
}

export interface Transaction {
  id: string;
  tanggal: string;
  pelanggan: string;
  items: TransactionItem[];
  total: number;
  bayar: number;
  kembalian: number;
  status: string;
}

export interface ProjectMaterial {
  productId: string;
  productName: string;
  qty: number;
  harga: number;
}

export interface Project {
  id: string;
  namaProyek: string;
  pelanggan: string;
  tanggal: string;
  totalBiaya: number;
  status: string;
  catatan: string;
  materials: ProjectMaterial[];
}

export interface CacheData {
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

export interface CacheState {
  data: CacheData | null;
  isHydrated: boolean;
  isLoading: boolean;
}

export interface DataContextType {
  isLoading: boolean;
  isHydrated: boolean;
  // Data
  products: Product[];
  suppliers: Supplier[];
  purchases: Purchase[];
  debts: DebtRecord[];
  expenses: Expense[];
  transactions: Transaction[];
  projects: Project[];
  // CRUD Functions
  createProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  createPurchase: (purchase: Omit<Purchase, 'id'>) => Promise<void>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  createDebt: (debt: Omit<DebtRecord, 'id'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<DebtRecord>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  createExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  createTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  createProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
}
