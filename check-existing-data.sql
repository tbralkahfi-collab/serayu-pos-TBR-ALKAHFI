-- Check all existing tables
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check data in key tables
SELECT 'products' as table_name, COUNT(*) as record_count FROM products
UNION ALL
SELECT 'suppliers' as table_name, COUNT(*) as record_count FROM suppliers
UNION ALL
SELECT 'purchases' as table_name, COUNT(*) as record_count FROM purchases
UNION ALL
SELECT 'transactions' as table_name, COUNT(*) as record_count FROM transactions
UNION ALL
SELECT 'debts' as table_name, COUNT(*) as record_count FROM debts
UNION ALL
SELECT 'expenses' as table_name, COUNT(*) as record_count FROM expenses
UNION ALL
SELECT 'projects' as table_name, COUNT(*) as record_count FROM projects
UNION ALL
SELECT 'modal_awal' as table_name, COUNT(*) as record_count FROM modal_awal;

-- Check sample data structure
SELECT 'products' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' AND table_schema = 'public'
ORDER BY ordinal_position;
