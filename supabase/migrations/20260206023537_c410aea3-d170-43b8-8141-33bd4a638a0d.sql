-- Add settings columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS store_address text DEFAULT '',
ADD COLUMN IF NOT EXISTS store_phone text DEFAULT '',
ADD COLUMN IF NOT EXISTS store_logo text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS printer_type text DEFAULT 'thermal',
ADD COLUMN IF NOT EXISTS paper_width text DEFAULT '58mm',
ADD COLUMN IF NOT EXISTS auto_print boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS min_stock_alert integer DEFAULT 10;

-- Create backups table
CREATE TABLE IF NOT EXISTS public.backups (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  backup_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  backup_type text NOT NULL DEFAULT 'manual',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on backups table
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for backups
CREATE POLICY "Users can view own backups" 
ON public.backups 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own backups" 
ON public.backups 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own backups" 
ON public.backups 
FOR DELETE 
USING (auth.uid() = user_id);

-- Enable realtime for profiles table (for settings sync)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Enable realtime for backups table
ALTER PUBLICATION supabase_realtime ADD TABLE public.backups;