-- ========================================
-- CREATE COMPLETE DATABASE STRUCTURE
-- ========================================

-- 1. Products Table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  harga_beli DECIMAL(15,2) NOT NULL,
  harga_jual DECIMAL(15,2) NOT NULL,
  stok INTEGER NOT NULL DEFAULT 0,
  satuan TEXT NOT NULL,
  min_stok INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nama TEXT NOT NULL,
  alamat TEXT,
  telepon TEXT,
  email TEXT,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Purchases Table
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID,
  supplier_name TEXT NOT NULL,
  tanggal DATE NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  dp DECIMAL(15,2) DEFAULT 0,
  metode_bayar TEXT NOT NULL,
  status TEXT NOT NULL,
  items JSONB,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tanggal DATE NOT NULL,
  pelanggan TEXT DEFAULT 'Umum',
  items JSONB NOT NULL,
  subtotal DECIMAL(15,2) NOT NULL,
  diskon DECIMAL(15,2) DEFAULT 0,
  diskon_persen DECIMAL(5,2) DEFAULT 0,
  total DECIMAL(15,2) NOT NULL,
  bayar DECIMAL(15,2) NOT NULL,
  kembalian DECIMAL(15,2) NOT NULL,
  metode TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Debts Table
CREATE TABLE IF NOT EXISTS debts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  nama TEXT NOT NULL,
  total DECIMAL(15,2) NOT NULL,
  sisa DECIMAL(15,2) NOT NULL,
  tanggal DATE NOT NULL,
  jatuh_tempo TEXT,
  keterangan TEXT,
  project_id UUID,
  payments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kategori TEXT NOT NULL,
  deskripsi TEXT,
  jumlah DECIMAL(15,2) NOT NULL,
  tanggal DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nama_proyek TEXT NOT NULL,
  pelanggan TEXT NOT NULL,
  alamat TEXT,
  telepon TEXT,
  deskripsi TEXT,
  nilai_kontrak DECIMAL(15,2) NOT NULL,
  diskon_persen DECIMAL(5,2),
  diskon_nominal DECIMAL(15,2),
  dp DECIMAL(15,2) NOT NULL,
  biaya_tenaga_kerja DECIMAL(15,2) DEFAULT 0,
  tanggal_order TEXT,
  tanggal_mulai TEXT,
  tanggal_selesai TEXT,
  status TEXT NOT NULL,
  catatan TEXT,
  materials JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Modal Awal Table
CREATE TABLE IF NOT EXISTS modal_awal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tanggal DATE NOT NULL,
  kas DECIMAL(15,2) DEFAULT 0,
  bank DECIMAL(15,2) DEFAULT 0,
  inventaris DECIMAL(15,2) DEFAULT 0,
  total DECIMAL(15,2) GENERATED ALWAYS AS (kas + bank + inventaris) STORED,
  catatan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ENABLE RLS AND CREATE POLICIES
-- ========================================

-- Enable RLS for all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE modal_awal ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables
CREATE POLICY "Users can view own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own suppliers" ON suppliers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suppliers" ON suppliers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suppliers" ON suppliers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suppliers" ON suppliers FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own purchases" ON purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own purchases" ON purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own purchases" ON purchases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own purchases" ON purchases FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own debts" ON debts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own debts" ON debts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own debts" ON debts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own debts" ON debts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own expenses" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON expenses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own modal awal" ON modal_awal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own modal awal" ON modal_awal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own modal awal" ON modal_awal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own modal awal" ON modal_awal FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- GRANT PERMISSIONS
-- ========================================

-- Grant permissions for all tables
GRANT ALL ON products TO authenticated;
GRANT ALL ON products TO service_role;
GRANT ALL ON suppliers TO authenticated;
GRANT ALL ON suppliers TO service_role;
GRANT ALL ON purchases TO authenticated;
GRANT ALL ON purchases TO service_role;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON transactions TO service_role;
GRANT ALL ON debts TO authenticated;
GRANT ALL ON debts TO service_role;
GRANT ALL ON expenses TO authenticated;
GRANT ALL ON expenses TO service_role;
GRANT ALL ON projects TO authenticated;
GRANT ALL ON projects TO service_role;
GRANT ALL ON modal_awal TO authenticated;
GRANT ALL ON modal_awal TO service_role;

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify all tables created successfully
SELECT 'Database Setup Complete' as status,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables_created;
