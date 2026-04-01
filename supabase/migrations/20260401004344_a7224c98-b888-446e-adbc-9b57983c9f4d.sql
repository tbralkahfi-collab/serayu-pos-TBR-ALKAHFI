
-- Drop and recreate triggers on public tables only

-- Products updated_at
DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Profiles updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Transaction stock reduction
DROP TRIGGER IF EXISTS on_transaction_stock_reduction ON public.transactions;
CREATE TRIGGER on_transaction_stock_reduction
  AFTER INSERT OR UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_stock_reduction();

-- Transaction stock reversal
DROP TRIGGER IF EXISTS on_transaction_stock_reversal ON public.transactions;
CREATE TRIGGER on_transaction_stock_reversal
  AFTER UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_stock_reversal();

-- Purchase stock update
DROP TRIGGER IF EXISTS on_purchase_stock_update ON public.purchases;
CREATE TRIGGER on_purchase_stock_update
  AFTER INSERT OR UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.handle_purchase_stock_update();
