-- =============================================
-- REVERSE STOCK WHEN PURCHASE IS DELETED (HAPUS PEMBELIAN)
-- When a purchase with status 'Selesai' is deleted, subtract its items from product stock.
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_purchase_stock_reversal_on_delete()
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
  -- Only reverse stock when the deleted purchase had status 'Selesai'
  IF (TG_OP = 'DELETE' AND OLD.status = 'Selesai') THEN
    FOR item IN SELECT * FROM jsonb_array_elements(OLD.items)
    LOOP
      product_id_val := (item->>'productId')::UUID;
      qty_val := (item->>'qty')::INTEGER;

      IF product_id_val IS NOT NULL AND qty_val IS NOT NULL AND qty_val > 0 THEN
        UPDATE public.products
        SET stok = GREATEST(0, stok - qty_val)
        WHERE id = product_id_val AND user_id = OLD.user_id;
      END IF;
    END LOOP;
    RETURN OLD;
  END IF;

  RETURN OLD;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_purchase_stock_reversal_on_delete ON public.purchases;
CREATE TRIGGER trigger_purchase_stock_reversal_on_delete
  AFTER DELETE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_purchase_stock_reversal_on_delete();
