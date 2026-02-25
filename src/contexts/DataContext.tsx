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

export interface ModalAwal {
  id: string;
  tanggal: string;
  kas: number;
  bank: number;
  inventaris: number;
  total: number;
  catatan: string;
  createdAt: string;
  updatedAt: string;
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

  // Modal Awal
  modalAwal: ModalAwal | null;
  addModalAwal: (modalAwal: Omit<ModalAwal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateModalAwal: (modalAwal: Partial<ModalAwal>) => Promise<void>;
  getModalAwal: () => Promise<ModalAwal | null>;
  fetchData: () => Promise<void>;

  // Project debt relation
  getProjectDebts: (projectId: string) => DebtRecord[];
  createProjectDebt: (projectId: string, projectName: string, amount: number, dueDate: string) => Promise<void>;
  
  // Transaction debt helpers
  createTransactionDebt: (transactionId: string, customerName: string, amount: number) => Promise<void>;
  createPurchaseDebt: (purchaseId: string, supplierName: string, amount: number) => Promise<void>;
  removeRelatedDebt: (keteranganSearch: string) => Promise<void>;
  updateRelatedDebt: (keteranganSearch: string, newAmount: number) => Promise<void>;
  
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

// Normalize timestamp input for timestamptz columns.
// Fixes locale time separator like "08.34" -> "08:34".
const normalizeTimestamptzInput = (value: string): string => {
  const v = (value || '').trim();
  if (!v) return v;
  // If it's already ISO-ish, let it pass
  if (v.includes('T')) return v;

  // Match: YYYY-MM-DD HH.mm or YYYY-MM-DD HH:mm or with seconds
  const m = v.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{1,2})[.:](\d{2})(?::(\d{2}))?$/);
  if (m) {
    const [, date, hh, mm, ss] = m;
    const hh2 = hh.padStart(2, '0');
    return `${date} ${hh2}:${mm}${ss ? `:${ss}` : ''}`;
  }

  // Fallback replace for the common dot separator
  return v.replace(/(\d{4}-\d{2}-\d{2})\s+(\d{2})\.(\d{2})/, '$1 $2:$3');
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
  const [modalAwal, setModalAwal] = useState<ModalAwal | null>(null);

  // Fetch all data
  const fetchData = useCallback(async () => {
    console.log('[DataContext] fetchData called');
    console.log('[DataContext] Current user:', user);
    console.log('[DataContext] Supabase URL:', supabase.supabaseUrl);
    
    if (!user) {
      console.log('[DataContext] No user, clearing data');
      setProducts([]);
      setSuppliers([]);
      setPurchases([]);
      setDebts([]);
      setExpenses([]);
      setTransactions([]);
      setProjects([]);
      setModalAwal(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    console.log('[DataContext] Fetching data for user:', user.id);
    try {
      const [
        productsRes,
        suppliersRes,
        purchasesRes,
        debtsRes,
        expensesRes,
        transactionsRes,
        projectsRes,
        modalAwalRes,
      ] = await Promise.all([
        supabase.from('products').select('*').order('nama'),
        supabase.from('suppliers').select('*').order('nama'),
        supabase.from('purchases').select('*').order('tanggal', { ascending: false }),
        supabase.from('debts').select('*').order('tanggal', { ascending: false }),
        supabase.from('expenses').select('*').order('tanggal', { ascending: false }),
        supabase.from('transactions').select('*').order('tanggal', { ascending: false }),
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('modal_awal').select('*').single(),
      ]);

      console.log('[DataContext] Products response:', productsRes.error || `${productsRes.data?.length || 0} items`);
      console.log('[DataContext] Transactions response:', transactionsRes.error || `${transactionsRes.data?.length || 0} items`);
      console.log('[DataContext] Purchases response:', purchasesRes.error || `${purchasesRes.data?.length || 0} items`);

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

      console.log('[DataContext] Modal awal query response:', { error: modalAwalRes.error, data: modalAwalRes.data });
      
      if (modalAwalRes.error) {
        console.log('[DataContext] Modal awal table not found:', modalAwalRes.error);
        // Table might not exist yet, don't show error for first time
        setModalAwal(null);
      } else if (modalAwalRes.data) {
        console.log('[DataContext] Modal awal data found:', modalAwalRes.data);
        setModalAwal({
          id: modalAwalRes.data.id,
          tanggal: modalAwalRes.data.tanggal,
          kas: Number(modalAwalRes.data.kas),
          bank: Number(modalAwalRes.data.bank),
          inventaris: Number(modalAwalRes.data.inventaris),
          total: Number(modalAwalRes.data.total),
          catatan: modalAwalRes.data.catatan || '',
          createdAt: modalAwalRes.data.created_at,
          updatedAt: modalAwalRes.data.updated_at,
        });
      } else {
        console.log('[DataContext] No modal awal data found');
        setModalAwal(null);
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

  // Add modal awal to context
  useEffect(() => {
    console.log('[DataContext] modalAwal state changed:', modalAwal);
  }, [modalAwal]);

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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modal_awal' }, () => fetchData())
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
      tanggal: normalizeTimestamptzInput(transaction.tanggal),
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
    if (transaction.tanggal !== undefined) updateData.tanggal = normalizeTimestamptzInput(transaction.tanggal);
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

  // ==================== TRANSACTION DEBT HELPERS ====================
  const createTransactionDebt = async (transactionId: string, customerName: string, amount: number) => {
    if (amount <= 0) return;
    await addDebt({
      type: 'piutang',
      nama: customerName,
      total: amount,
      sisa: amount,
      tanggal: new Date().toISOString().split('T')[0],
      jatuhTempo: '',
      keterangan: `Piutang dari penjualan: ${transactionId}`,
    });
  };

  const createPurchaseDebt = async (purchaseId: string, supplierName: string, amount: number) => {
    if (amount <= 0) return;
    await addDebt({
      type: 'utang',
      nama: supplierName,
      total: amount,
      sisa: amount,
      tanggal: new Date().toISOString().split('T')[0],
      jatuhTempo: '',
      keterangan: `Utang dari pembelian: ${purchaseId}`,
    });
  };

  const removeRelatedDebt = async (keteranganSearch: string) => {
    const relatedDebt = debts.find(d => d.keterangan.includes(keteranganSearch));
    if (relatedDebt) {
      await deleteDebt(relatedDebt.id);
    }
  };

  const updateRelatedDebt = async (keteranganSearch: string, newAmount: number) => {
    const relatedDebt = debts.find(d => d.keterangan.includes(keteranganSearch));
    if (relatedDebt) {
      if (newAmount <= 0) {
        await deleteDebt(relatedDebt.id);
      } else {
        const paidSoFar = relatedDebt.total - relatedDebt.sisa;
        const newSisa = Math.max(0, newAmount - paidSoFar);
        await updateDebt(relatedDebt.id, { total: newAmount, sisa: newSisa });
      }
    }
  };

  // ==================== MODAL AWAL ====================
  const addModalAwal = async (modalAwalData: Omit<ModalAwal, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('addModalAwal called with data:', modalAwalData);
    
    if (!user) {
      console.error('No user found');
      toast.error('User tidak ditemukan');
      return;
    }
    
    console.log('Inserting modal awal for user:', user.id);
    console.log('Supabase client:', supabase);
    console.log('Supabase URL:', supabase.supabaseUrl);
    
    try {
      // First check if table exists
      console.log('Checking if modal_awal table exists...');
      const { error: tableCheckError } = await supabase.from('modal_awal').select('count').head();
      
      if (tableCheckError) {
        console.error('Table check error:', tableCheckError);
        if (tableCheckError.code === 'PGRST116') {
          toast.error('Table modal_awal tidak ditemukan. Silakan buat table di Supabase dashboard.');
          return;
        }
      }
      
      console.log('Table exists, proceeding with insert...');
      
      const { error, data } = await supabase.from('modal_awal').insert({
        user_id: user.id,
        tanggal: modalAwalData.tanggal,
        kas: modalAwalData.kas,
        bank: modalAwalData.bank,
        inventaris: modalAwalData.inventaris,
        total: modalAwalData.total,
        catatan: modalAwalData.catatan,
      }).select();

      console.log('Insert result:', { error, data });

      if (error) {
        console.error('Detailed error:', error);
        toast.error('Gagal menyimpan modal awal: ' + error.message);
        
        // Check specific error types
        if (error.code === 'PGRST116') {
          toast.error('Table modal_awal tidak ditemukan. Silakan buat table di Supabase.');
        } else if (error.code === '42501') {
          toast.error('Permission denied. Cek RLS policies di Supabase.');
        }
      } else {
        toast.success('Modal awal berhasil disimpan');
        console.log('Modal awal inserted successfully:', data);
        
        // Trigger refresh data
        await fetchData();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Error tidak terduga saat menyimpan modal awal');
    }
  };

  const updateModalAwal = async (modalAwalData: Partial<ModalAwal>) => {
    if (!user || !modalAwal?.id) return;
    
    const updateData: Record<string, unknown> = {};
    if (modalAwalData.tanggal !== undefined) updateData.tanggal = modalAwalData.tanggal;
    if (modalAwalData.kas !== undefined) updateData.kas = modalAwalData.kas;
    if (modalAwalData.bank !== undefined) updateData.bank = modalAwalData.bank;
    if (modalAwalData.inventaris !== undefined) updateData.inventaris = modalAwalData.inventaris;
    if (modalAwalData.total !== undefined) updateData.total = modalAwalData.total;
    if (modalAwalData.catatan !== undefined) updateData.catatan = modalAwalData.catatan;

    const { error } = await supabase.from('modal_awal').update(updateData).eq('id', modalAwal.id);
    
    if (error) {
      toast.error('Gagal memperbarui modal awal');
      console.error(error);
    } else {
      toast.success('Modal awal berhasil diperbarui');
    }
  };

  const getModalAwal = async (): Promise<ModalAwal | null> => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('modal_awal')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching modal awal:', error);
      return null;
    }
    
    return data ? {
      id: data.id,
      tanggal: data.tanggal,
      kas: Number(data.kas),
      bank: Number(data.bank),
      inventaris: Number(data.inventaris),
      total: Number(data.total),
      catatan: data.catatan || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } : null;
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
      createTransactionDebt,
      createPurchaseDebt,
      removeRelatedDebt,
      updateRelatedDebt,
      modalAwal,
      addModalAwal,
      updateModalAwal,
      getModalAwal,
      fetchData,
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
