-- Data Migration Script
-- This will preserve existing data while updating structure

-- 1. Backup existing data
CREATE TABLE IF NOT EXISTS backup_products AS SELECT * FROM products;
CREATE TABLE IF NOT EXISTS backup_suppliers AS SELECT * FROM suppliers;
CREATE TABLE IF NOT EXISTS backup_purchases AS SELECT * FROM purchases;
CREATE TABLE IF NOT EXISTS backup_transactions AS SELECT * FROM transactions;
CREATE TABLE IF NOT EXISTS backup_debts AS SELECT * FROM debts;
CREATE TABLE IF NOT EXISTS backup_expenses AS SELECT * FROM expenses;
CREATE TABLE IF NOT EXISTS backup_projects AS SELECT * FROM projects;
CREATE TABLE IF NOT EXISTS backup_modal_awal AS SELECT * FROM modal_awal;

-- 2. Update table structures if needed
-- (Add any new columns or modify existing ones)

-- 3. Ensure modal_awal table exists with correct structure
DROP TABLE IF EXISTS modal_awal CASCADE;

CREATE TABLE modal_awal (
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

-- 4. Restore modal_awal data if exists
INSERT INTO modal_awal (id, user_id, tanggal, kas, bank, inventaris, catatan, created_at, updated_at)
SELECT id, user_id, tanggal, kas, bank, inventaris, catatan, created_at, updated_at
FROM backup_modal_awal
WHERE EXISTS (SELECT 1 FROM backup_modal_awal);

-- 5. Enable RLS and policies
ALTER TABLE modal_awal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own modal awal" ON modal_awal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own modal awal" ON modal_awal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own modal awal" ON modal_awal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own modal awal" ON modal_awal FOR DELETE USING (auth.uid() = user_id);

-- 6. Grant permissions
GRANT ALL ON modal_awal TO authenticated;
GRANT ALL ON modal_awal TO service_role;

-- 7. Verify data integrity
SELECT 'Data Migration Complete' as status,
       (SELECT COUNT(*) FROM products) as products_count,
       (SELECT COUNT(*) FROM suppliers) as suppliers_count,
       (SELECT COUNT(*) FROM purchases) as purchases_count,
       (SELECT COUNT(*) FROM transactions) as transactions_count,
       (SELECT COUNT(*) FROM debts) as debts_count,
       (SELECT COUNT(*) FROM expenses) as expenses_count,
       (SELECT COUNT(*) FROM projects) as projects_count,
       (SELECT COUNT(*) FROM modal_awal) as modal_awal_count;
