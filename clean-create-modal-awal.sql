-- Clean existing table and policies
DROP TABLE IF EXISTS modal_awal CASCADE;

-- Create fresh table
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

-- Enable RLS
ALTER TABLE modal_awal ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own modal awal" ON modal_awal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own modal awal" ON modal_awal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own modal awal" ON modal_awal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own modal awal" ON modal_awal FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON modal_awal TO authenticated;
GRANT ALL ON modal_awal TO service_role;

-- Force refresh PostgREST cache
NOTIFY pgrst, 'reload schema';

-- Verify table
SELECT 'Modal awal table created successfully' as status;
