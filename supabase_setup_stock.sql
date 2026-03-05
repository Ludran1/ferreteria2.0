-- Ejecutar este comando en el SQL Editor de tu panel de Supabase
-- para permitir que el frontend pueda descontar stock atómicamente

CREATE OR REPLACE FUNCTION decrement_product_stock(product_id UUID, qty_to_deduct INT)
RETURNS void AS $$
BEGIN
  UPDATE products
  SET stock = stock - qty_to_deduct
  WHERE id = product_id AND track_stock = true;
END;
$$ LANGUAGE plpgsql;
