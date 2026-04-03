// Types for DataContext - Matches what pages expect (camelCase)

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
  email: string;
  catatan: string;
}

export interface PurchaseItem {
  productId: string;
  nama: string;
  qty: number;
  harga: number;
  total?: number;
  satuan?: string;
  isManual?: boolean;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplier: string;
  date: string;
  tanggal: string;
  items: string;
  itemsData: PurchaseItem[];
  total: number;
  dp: number;
  paymentMethod: string;
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
  jatuhTempo: string;
  keterangan: string;
  catatan: string;
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
  total?: number;
  diskon?: number;
  diskonNominal?: number;
  satuan?: string;
  diskonPersen?: number;
}

export interface Transaction {
  id: string;
  tanggal: string;
  pelanggan: string;
  items: string;
  itemsData: TransactionItem[];
  subtotal: number;
  diskon: number;
  diskonPersen: number;
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
  harga: number;
  satuan?: string;
}

export interface Project {
  id: string;
  namaProyek: string;
  pelanggan: string;
  alamat: string;
  telepon: string;
  deskripsi: string;
  nilaiKontrak: number;
  diskonPersen: number;
  diskonNominal: number;
  dp: number;
  biayaTenagaKerja: number;
  tanggalOrder: string;
  tanggalMulai: string;
  tanggalSelesai: string;
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
  createPurchase: (purchase: Partial<Purchase>) => Promise<void>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  createDebt: (debt: Omit<DebtRecord, 'id'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<DebtRecord>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  createExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  createTransaction: (transaction: Partial<Transaction>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  createProject: (project: Partial<Project>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  // Extra functions
  createTransactionDebt: (trxId: string, customerName: string, amount: number) => Promise<void>;
  createPurchaseDebt: (purchaseRef: string, supplierName: string, amount: number) => Promise<void>;
  removeRelatedDebt: (refId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  // Aliases and extra functions
  addDebt: (debt: Omit<DebtRecord, 'id'>) => Promise<void>;
  addPayment: (debtId: string, payment: Omit<PaymentHistory, 'id'>) => Promise<void>;
  createProjectDebt: (projectId: string, name: string, amount: number, dueDate: string) => Promise<void>;
  getProjectDebts: (projectId: string) => DebtRecord[];
}
