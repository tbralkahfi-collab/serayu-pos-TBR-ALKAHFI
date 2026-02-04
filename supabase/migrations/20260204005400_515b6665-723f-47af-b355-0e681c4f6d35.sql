-- =============================================
-- STOCK SYNCHRONIZATION TRIGGERS
-- =============================================

-- 1. Function to update stock when purchase status changes to 'Selesai'
CREATE OR REPLACE FUNCTION public.handle_purchase_stock_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  item JSONB;
  product_id_val UUID;
  qty_val INTEGER;
BEGIN
  -- Only process when status changes to 'Selesai'
  IF (TG_OP = 'UPDATE' AND NEW.status = 'Selesai' AND (OLD.status IS DISTINCT FROM 'Selesai')) THEN
    -- Loop through items array
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      product_id_val := (item->>'productId')::UUID;
      qty_val := (item->>'qty')::INTEGER;
      
      -- Only update if product_id exists
      IF product_id_val IS NOT NULL AND qty_val IS NOT NULL THEN
        UPDATE public.products 
        SET stok = stok + qty_val
        WHERE id = product_id_val AND user_id = NEW.user_id;
      END IF;
    END LOOP;
  END IF;
  
  -- Handle new insert with status 'Selesai'
  IF (TG_OP = 'INSERT' AND NEW.status = 'Selesai') THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      product_id_val := (item->>'productId')::UUID;
      qty_val := (item->>'qty')::INTEGER;
      
      IF product_id_val IS NOT NULL AND qty_val IS NOT NULL THEN
        UPDATE public.products 
        SET stok = stok + qty_val
        WHERE id = product_id_val AND user_id = NEW.user_id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for purchase stock update
DROP TRIGGER IF EXISTS trigger_purchase_stock_update ON public.purchases;
CREATE TRIGGER trigger_purchase_stock_update
  AFTER INSERT OR UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_purchase_stock_update();

-- 2. Function to reverse stock when transaction is deleted or cancelled
CREATE OR REPLACE FUNCTION public.handle_transaction_stock_reversal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  item JSONB;
  product_id_val UUID;
  qty_val INTEGER;
BEGIN
  -- Handle DELETE - reverse stock (add back)
  IF (TG_OP = 'DELETE' AND OLD.status = 'Selesai') THEN
    FOR item IN SELECT * FROM jsonb_array_elements(OLD.items)
    LOOP
      product_id_val := (item->>'productId')::UUID;
      qty_val := (item->>'qty')::INTEGER;
      
      IF product_id_val IS NOT NULL AND qty_val IS NOT NULL THEN
        UPDATE public.products 
        SET stok = stok + qty_val
        WHERE id = product_id_val AND user_id = OLD.user_id;
      END IF;
    END LOOP;
    RETURN OLD;
  END IF;
  
  -- Handle UPDATE - if status changes FROM 'Selesai' to something else, reverse stock
  IF (TG_OP = 'UPDATE' AND OLD.status = 'Selesai' AND NEW.status != 'Selesai') THEN
    FOR item IN SELECT * FROM jsonb_array_elements(OLD.items)
    LOOP
      product_id_val := (item->>'productId')::UUID;
      qty_val := (item->>'qty')::INTEGER;
      
      IF product_id_val IS NOT NULL AND qty_val IS NOT NULL THEN
        UPDATE public.products 
        SET stok = stok + qty_val
        WHERE id = product_id_val AND user_id = OLD.user_id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for transaction stock reversal
DROP TRIGGER IF EXISTS trigger_transaction_stock_reversal ON public.transactions;
CREATE TRIGGER trigger_transaction_stock_reversal
  AFTER UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_transaction_stock_reversal();

-- 3. Function to reduce stock when new transaction is created with status 'Selesai'
CREATE OR REPLACE FUNCTION public.handle_transaction_stock_reduction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  item JSONB;
  product_id_val UUID;
  qty_val INTEGER;
BEGIN
  -- Handle INSERT with status 'Selesai' - reduce stock
  IF (TG_OP = 'INSERT' AND NEW.status = 'Selesai') THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      product_id_val := (item->>'productId')::UUID;
      qty_val := (item->>'qty')::INTEGER;
      
      IF product_id_val IS NOT NULL AND qty_val IS NOT NULL THEN
        UPDATE public.products 
        SET stok = stok - qty_val
        WHERE id = product_id_val AND user_id = NEW.user_id;
      END IF;
    END LOOP;
  END IF;
  
  -- Handle UPDATE - if status changes TO 'Selesai', reduce stock
  IF (TG_OP = 'UPDATE' AND NEW.status = 'Selesai' AND OLD.status != 'Selesai') THEN
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
      product_id_val := (item->>'productId')::UUID;
      qty_val := (item->>'qty')::INTEGER;
      
      IF product_id_val IS NOT NULL AND qty_val IS NOT NULL THEN
        UPDATE public.products 
        SET stok = stok - qty_val
        WHERE id = product_id_val AND user_id = NEW.user_id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for transaction stock reduction
DROP TRIGGER IF EXISTS trigger_transaction_stock_reduction ON public.transactions;
CREATE TRIGGER trigger_transaction_stock_reduction
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_transaction_stock_reduction();

-- =============================================
-- ENABLE REALTIME FOR KEY TABLES
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.purchases;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.debts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;