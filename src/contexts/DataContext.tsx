import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

// Types
export interface Product {
  id: string;
  nama: string;
  kategori: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  satuan: string;
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
  satuan: string;
  harga: number;
  isManual: boolean;
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
  itemsData?: PurchaseItem[];
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
  satuan: string;
  diskonPersen?: number;
  diskonNominal?: number;
}

export interface Transaction {
  id: string;
  tanggal: string;
  pelanggan: string;
  items: string;
  itemsData?: TransactionItem[];
  subtotal?: number;
  diskon?: number;
  diskonPersen?: number;
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
  satuan: string;
  harga: number;
}

export interface Project {
  id: string;
  namaProyek: string;
  pelanggan: string;
  alamat: string;
  telepon: string;
  deskripsi: string;
  nilaiKontrak: number;
  diskonPersen?: number;
  diskonNominal?: number;
  dp: number;
  biayaTenagaKerja: number;
  tanggalOrder: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  status: 'Pending' | 'Berjalan' | 'Selesai' | 'Dibatalkan';
  catatan: string;
  materials: ProjectMaterial[];
}

interface DataContextType {
  isLoading: boolean;
  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  
  // Suppliers
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<Supplier>;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  // Purchases
  purchases: Purchase[];
  addPurchase: (purchase: Omit<Purchase, 'id'>) => Promise<void>;
  updatePurchase: (id: string, purchase: Partial<Purchase>) => Promise<void>;
  deletePurchase: (id: string) => Promise<void>;
  
  // Debts
  debts: DebtRecord[];
  addDebt: (debt: Omit<DebtRecord, 'id' | 'payments'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<DebtRecord>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  addPayment: (debtId: string, payment: Omit<PaymentHistory, 'id'>) => Promise<void>;
  
  // Expenses
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Projects
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Project debt relation
  getProjectDebts: (projectId: string) => DebtRecord[];
  createProjectDebt: (projectId: string, projectName: string, amount: number, dueDate: string) => Promise<void>;
  
  // Refresh
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to parse payment history
const parsePayments = (payments: Json): PaymentHistory[] => {
  if (!Array.isArray(payments)) return [];
  return payments as unknown as PaymentHistory[];
};

// Helper to parse materials
const parseMaterials = (materials: Json): ProjectMaterial[] => {
  if (!Array.isArray(materials)) return [];
  return materials as unknown as ProjectMaterial[];
};

// Helper to parse purchase items from JSON
const parsePurchaseItems = (items: Json): PurchaseItem[] => {
  if (!Array.isArray(items)) return [];
  return items as unknown as PurchaseItem[];
};

// Helper to parse transaction items from JSON
const parseTransactionItems = (items: Json): TransactionItem[] => {
  if (!Array.isArray(items)) return [];
  return items as unknown as TransactionItem[];
};

// Helper to format items string from items data
const formatItemsString = (itemsData: PurchaseItem[] | TransactionItem[]): string => {
  return itemsData.map(item => `${item.nama} x${item.qty}`).join(', ');
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [debts, setDebts] = useState<DebtRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!user) {
      setProducts([]);
      setSuppliers([]);
      setPurchases([]);
      setDebts([]);
      setExpenses([]);
      setTransactions([]);
      setProjects([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [
        productsRes,
        suppliersRes,
        purchasesRes,
        debtsRes,
        expensesRes,
        transactionsRes,
        projectsRes,
      ] = await Promise.all([
        supabase.from('products').select('*').order('nama'),
        supabase.from('suppliers').select('*').order('nama'),
        supabase.from('purchases').select('*').order('tanggal', { ascending: false }),
        supabase.from('debts').select('*').order('tanggal', { ascending: false }),
        supabase.from('expenses').select('*').order('tanggal', { ascending: false }),
        supabase.from('transactions').select('*').order('tanggal', { ascending: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
      ]);

      if (productsRes.data) {
        setProducts(productsRes.data.map(p => ({
          id: p.id,
          nama: p.nama,
          kategori: p.kategori,
          hargaBeli: Number(p.harga_beli),
          hargaJual: Number(p.harga_jual),
          stok: p.stok,
          satuan: p.satuan,
          minStok: p.min_stok ?? undefined,
        })));
      }

      if (suppliersRes.data) {
        setSuppliers(suppliersRes.data.map(s => ({
          id: s.id,
          nama: s.nama,
          alamat: s.alamat || '',
          telepon: s.telepon || '',
          email: s.email || '',
          catatan: s.catatan || '',
        })));
      }

      if (purchasesRes.data) {
        setPurchases(purchasesRes.data.map(p => {
          const itemsData = parsePurchaseItems(p.items);
          return {
            id: p.id,
            supplierId: p.supplier_id || '',
            supplier: p.supplier_name,
            date: p.tanggal,
            total: Number(p.total),
            dp: Number(p.dp),
            paymentMethod: p.metode_bayar as 'cash' | 'transfer',
            status: p.status,
            items: formatItemsString(itemsData),
            itemsData,
            notes: p.catatan || '',
          };
        }));
      }

      if (debtsRes.data) {
        setDebts(debtsRes.data.map(d => ({
          id: d.id,
          type: d.type as 'utang' | 'piutang',
          nama: d.nama,
          total: Number(d.total),
          sisa: Number(d.sisa),
          tanggal: d.tanggal,
          jatuhTempo: d.jatuh_tempo || '',
          keterangan: d.keterangan || '',
          payments: parsePayments(d.payments),
          projectId: d.project_id ?? undefined,
        })));
      }

      if (expensesRes.data) {
        setExpenses(expensesRes.data.map(e => ({
          id: e.id,
          kategori: e.kategori,
          deskripsi: e.deskripsi || '',
          jumlah: Number(e.jumlah),
          tanggal: e.tanggal,
        })));
      }

      if (transactionsRes.data) {
        setTransactions(transactionsRes.data.map(t => {
          const itemsData = parseTransactionItems(t.items);
          return {
            id: t.id,
            tanggal: t.tanggal,
            pelanggan: t.pelanggan || 'Umum',
            items: formatItemsString(itemsData),
            itemsData,
            subtotal: Number(t.subtotal),
            diskon: Number(t.diskon),
            diskonPersen: Number(t.diskon_persen),
            total: Number(t.total),
            bayar: Number(t.bayar),
            kembalian: Number(t.kembalian),
            metode: t.metode,
            status: t.status,
          };
        }));
      }

      if (projectsRes.data) {
        setProjects(projectsRes.data.map(p => ({
          id: p.id,
          namaProyek: p.nama_proyek,
          pelanggan: p.pelanggan,
          alamat: p.alamat || '',
          telepon: p.telepon || '',
          deskripsi: p.deskripsi || '',
          nilaiKontrak: Number(p.nilai_kontrak),
          diskonPersen: p.diskon_persen ? Number(p.diskon_persen) : undefined,
          diskonNominal: p.diskon_nominal ? Number(p.diskon_nominal) : undefined,
          dp: Number(p.dp),
          biayaTenagaKerja: Number(p.biaya_tenaga_kerja || 0),
          tanggalOrder: p.tanggal_order || '',
          tanggalMulai: p.tanggal_mulai || '',
          tanggalSelesai: p.tanggal_selesai || '',
          status: p.status as Project['status'],
          catatan: p.catatan || '',
          materials: parseMaterials(p.materials),
        })));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suppliers' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debts' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  // ==================== PRODUCTS ====================
  const addProduct = async (product: Omit<Product, 'id'>) => {
    if (!user) return;
    const { error } = await supabase.from('products').insert({
      user_id: user.id,
      nama: product.nama,
      kategori: product.kategori,
      harga_beli: product.hargaBeli,
      harga_jual: product.hargaJual,
      stok: product.stok,
      satuan: product.satuan,
      min_stok: product.minStok ?? null,
    });
    if (error) {
      toast.error('Gagal menambah produk');
      console.error(error);
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

    const { error } = await supabase.from('products').update(updateData).eq('id', id);
    if (error) {
      toast.error('Gagal memperbarui produk');
      console.error(error);
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus produk');
      console.error(error);
    }
  };

  // ==================== SUPPLIERS ====================
  const addSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<Supplier> => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('suppliers').insert({
      user_id: user.id,
      nama: supplier.nama,
      alamat: supplier.alamat,
      telepon: supplier.telepon,
      email: supplier.email,
      catatan: supplier.catatan,
    }).select().single();
    
    if (error) {
      toast.error('Gagal menambah supplier');
      throw error;
    }
    return {
      id: data.id,
      nama: data.nama,
      alamat: data.alamat || '',
      telepon: data.telepon || '',
      email: data.email || '',
      catatan: data.catatan || '',
    };
  };

  const updateSupplier = async (id: string, supplier: Partial<Supplier>) => {
    const { error } = await supabase.from('suppliers').update(supplier).eq('id', id);
    if (error) {
      toast.error('Gagal memperbarui supplier');
      console.error(error);
    }
  };

  const deleteSupplier = async (id: string) => {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus supplier');
      console.error(error);
    }
  };

  // ==================== PURCHASES ====================
  const addPurchase = async (purchase: Omit<Purchase, 'id'>) => {
    if (!user) return;
    
    // Parse items string to JSON array for database trigger
    const itemsData: PurchaseItem[] = purchase.itemsData || [];
    
    const { error } = await supabase.from('purchases').insert({
      user_id: user.id,
      supplier_id: purchase.supplierId || null,
      supplier_name: purchase.supplier,
      tanggal: purchase.date,
      total: purchase.total,
      dp: purchase.dp,
      metode_bayar: purchase.paymentMethod,
      status: purchase.status,
      items: itemsData as unknown as Json,
      catatan: purchase.notes,
    });
    if (error) {
      toast.error('Gagal menambah pembelian');
      console.error(error);
    }
  };

  const updatePurchase = async (id: string, purchase: Partial<Purchase>) => {
    const updateData: Record<string, unknown> = {};
    if (purchase.supplierId !== undefined) updateData.supplier_id = purchase.supplierId || null;
    if (purchase.supplier !== undefined) updateData.supplier_name = purchase.supplier;
    if (purchase.date !== undefined) updateData.tanggal = purchase.date;
    if (purchase.total !== undefined) updateData.total = purchase.total;
    if (purchase.dp !== undefined) updateData.dp = purchase.dp;
    if (purchase.paymentMethod !== undefined) updateData.metode_bayar = purchase.paymentMethod;
    if (purchase.status !== undefined) updateData.status = purchase.status;
    if (purchase.itemsData !== undefined) updateData.items = purchase.itemsData as unknown as Json;
    if (purchase.notes !== undefined) updateData.catatan = purchase.notes;

    const { error } = await supabase.from('purchases').update(updateData).eq('id', id);
    if (error) {
      toast.error('Gagal memperbarui pembelian');
      console.error(error);
    }
  };

  const deletePurchase = async (id: string) => {
    const { error } = await supabase.from('purchases').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus pembelian');
      console.error(error);
    }
  };

  // ==================== DEBTS ====================
  const addDebt = async (debt: Omit<DebtRecord, 'id' | 'payments'>) => {
    if (!user) return;
    const { error } = await supabase.from('debts').insert({
      user_id: user.id,
      type: debt.type,
      nama: debt.nama,
      total: debt.total,
      sisa: debt.sisa,
      tanggal: debt.tanggal,
      jatuh_tempo: debt.jatuhTempo || null,
      keterangan: debt.keterangan,
      project_id: debt.projectId || null,
      payments: [] as unknown as Json,
    });
    if (error) {
      toast.error('Gagal menambah utang/piutang');
      console.error(error);
    }
  };

  const updateDebt = async (id: string, debt: Partial<DebtRecord>) => {
    const updateData: Record<string, unknown> = {};
    if (debt.type !== undefined) updateData.type = debt.type;
    if (debt.nama !== undefined) updateData.nama = debt.nama;
    if (debt.total !== undefined) updateData.total = debt.total;
    if (debt.sisa !== undefined) updateData.sisa = debt.sisa;
    if (debt.tanggal !== undefined) updateData.tanggal = debt.tanggal;
    if (debt.jatuhTempo !== undefined) updateData.jatuh_tempo = debt.jatuhTempo;
    if (debt.keterangan !== undefined) updateData.keterangan = debt.keterangan;
    if (debt.payments !== undefined) updateData.payments = debt.payments as unknown as Json;
    if (debt.projectId !== undefined) updateData.project_id = debt.projectId;

    const { error } = await supabase.from('debts').update(updateData).eq('id', id);
    if (error) {
      toast.error('Gagal memperbarui utang/piutang');
      console.error(error);
    }
  };

  const deleteDebt = async (id: string) => {
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus utang/piutang');
      console.error(error);
    }
  };

  const addPayment = async (debtId: string, payment: Omit<PaymentHistory, 'id'>) => {
    const debt = debts.find(d => d.id === debtId);
    if (!debt) return;

    const newPayment: PaymentHistory = {
      ...payment,
      id: `PAY${Date.now()}`,
    };
    const updatedPayments = [...debt.payments, newPayment];
    const newSisa = debt.sisa - payment.jumlah;

    await updateDebt(debtId, { 
      payments: updatedPayments,
      sisa: Math.max(0, newSisa),
    });
  };

  // ==================== EXPENSES ====================
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!user) return;
    const { error } = await supabase.from('expenses').insert({
      user_id: user.id,
      kategori: expense.kategori,
      deskripsi: expense.deskripsi,
      jumlah: expense.jumlah,
      tanggal: expense.tanggal,
    });
    if (error) {
      toast.error('Gagal menambah pengeluaran');
      console.error(error);
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    const { error } = await supabase.from('expenses').update(expense).eq('id', id);
    if (error) {
      toast.error('Gagal memperbarui pengeluaran');
      console.error(error);
    }
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus pengeluaran');
      console.error(error);
    }
  };

  // ==================== TRANSACTIONS ====================
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;
    
    // Build items data for database trigger
    const itemsData: TransactionItem[] = transaction.itemsData || [];
    
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      tanggal: transaction.tanggal,
      pelanggan: transaction.pelanggan || 'Umum',
      items: itemsData as unknown as Json,
      subtotal: transaction.subtotal || transaction.total,
      diskon: transaction.diskon || 0,
      diskon_persen: transaction.diskonPersen || 0,
      total: transaction.total,
      bayar: transaction.bayar,
      kembalian: transaction.kembalian,
      metode: transaction.metode,
      status: transaction.status,
    });
    if (error) {
      toast.error('Gagal menyimpan transaksi');
      console.error(error);
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    const updateData: Record<string, unknown> = {};
    if (transaction.tanggal !== undefined) updateData.tanggal = transaction.tanggal;
    if (transaction.pelanggan !== undefined) updateData.pelanggan = transaction.pelanggan;
    if (transaction.itemsData !== undefined) updateData.items = transaction.itemsData as unknown as Json;
    if (transaction.subtotal !== undefined) updateData.subtotal = transaction.subtotal;
    if (transaction.diskon !== undefined) updateData.diskon = transaction.diskon;
    if (transaction.diskonPersen !== undefined) updateData.diskon_persen = transaction.diskonPersen;
    if (transaction.total !== undefined) updateData.total = transaction.total;
    if (transaction.bayar !== undefined) updateData.bayar = transaction.bayar;
    if (transaction.kembalian !== undefined) updateData.kembalian = transaction.kembalian;
    if (transaction.metode !== undefined) updateData.metode = transaction.metode;
    if (transaction.status !== undefined) updateData.status = transaction.status;

    const { error } = await supabase.from('transactions').update(updateData).eq('id', id);
    if (error) {
      toast.error('Gagal memperbarui transaksi');
      console.error(error);
    }
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus transaksi');
      console.error(error);
    }
  };

  // ==================== PROJECTS ====================
  const addProject = async (project: Omit<Project, 'id'>) => {
    if (!user) return;
    const { error } = await supabase.from('projects').insert({
      user_id: user.id,
      nama_proyek: project.namaProyek,
      pelanggan: project.pelanggan,
      alamat: project.alamat,
      telepon: project.telepon,
      deskripsi: project.deskripsi,
      nilai_kontrak: project.nilaiKontrak,
      diskon_persen: project.diskonPersen || 0,
      diskon_nominal: project.diskonNominal || 0,
      dp: project.dp,
      biaya_tenaga_kerja: project.biayaTenagaKerja,
      tanggal_order: project.tanggalOrder || null,
      tanggal_mulai: project.tanggalMulai || null,
      tanggal_selesai: project.tanggalSelesai || null,
      status: project.status,
      catatan: project.catatan,
      materials: project.materials as unknown as Json,
    });
    if (error) {
      toast.error('Gagal menambah proyek');
      console.error(error);
    }
  };

  const updateProject = async (id: string, project: Partial<Project>) => {
    const updateData: Record<string, unknown> = {};
    if (project.namaProyek !== undefined) updateData.nama_proyek = project.namaProyek;
    if (project.pelanggan !== undefined) updateData.pelanggan = project.pelanggan;
    if (project.alamat !== undefined) updateData.alamat = project.alamat;
    if (project.telepon !== undefined) updateData.telepon = project.telepon;
    if (project.deskripsi !== undefined) updateData.deskripsi = project.deskripsi;
    if (project.nilaiKontrak !== undefined) updateData.nilai_kontrak = project.nilaiKontrak;
    if (project.diskonPersen !== undefined) updateData.diskon_persen = project.diskonPersen;
    if (project.diskonNominal !== undefined) updateData.diskon_nominal = project.diskonNominal;
    if (project.dp !== undefined) updateData.dp = project.dp;
    if (project.biayaTenagaKerja !== undefined) updateData.biaya_tenaga_kerja = project.biayaTenagaKerja;
    if (project.tanggalOrder !== undefined) updateData.tanggal_order = project.tanggalOrder || null;
    if (project.tanggalMulai !== undefined) updateData.tanggal_mulai = project.tanggalMulai || null;
    if (project.tanggalSelesai !== undefined) updateData.tanggal_selesai = project.tanggalSelesai || null;
    if (project.status !== undefined) updateData.status = project.status;
    if (project.catatan !== undefined) updateData.catatan = project.catatan;
    if (project.materials !== undefined) updateData.materials = project.materials as unknown as Json;

    const { error } = await supabase.from('projects').update(updateData).eq('id', id);
    if (error) {
      toast.error('Gagal memperbarui proyek');
      console.error(error);
    }
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      toast.error('Gagal menghapus proyek');
      console.error(error);
    }
  };

  // Project debt helpers
  const getProjectDebts = (projectId: string) => debts.filter(d => d.projectId === projectId);
  
  const createProjectDebt = async (projectId: string, projectName: string, amount: number, dueDate: string) => {
    await addDebt({
      type: 'piutang',
      nama: projectName,
      total: amount,
      sisa: amount,
      tanggal: new Date().toISOString().split('T')[0],
      jatuhTempo: dueDate,
      keterangan: `Piutang dari proyek: ${projectName}`,
      projectId,
    });
  };

  return (
    <DataContext.Provider value={{
      isLoading,
      products,
      addProduct,
      updateProduct,
      deleteProduct,
      suppliers,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      purchases,
      addPurchase,
      updatePurchase,
      deletePurchase,
      debts,
      addDebt,
      updateDebt,
      deleteDebt,
      addPayment,
      expenses,
      addExpense,
      updateExpense,
      deleteExpense,
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      projects,
      addProject,
      updateProject,
      deleteProject,
      getProjectDebts,
      createProjectDebt,
      refreshData: fetchData,
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
