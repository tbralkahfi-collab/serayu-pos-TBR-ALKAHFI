
-- Tabel untuk mencatat modal awal, penambahan modal, dan penarikan modal
CREATE TABLE public.capital (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'modal_awal', -- modal_awal, penambahan, penarikan
  jumlah NUMERIC NOT NULL DEFAULT 0,
  tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
  keterangan TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.capital ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can CRUD own capital"
  ON public.capital
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.capital;
