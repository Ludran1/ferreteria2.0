-- Migration: Add SUNAT electronic invoicing fields to sales table
-- Run this in Supabase SQL Editor

-- Add SUNAT metadata columns
ALTER TABLE sales ADD COLUMN IF NOT EXISTS document_type TEXT; -- 'boleta' or 'factura'
ALTER TABLE sales ADD COLUMN IF NOT EXISTS document_serie TEXT; -- 'B001' or 'F001'
ALTER TABLE sales ADD COLUMN IF NOT EXISTS document_number INTEGER; -- correlativo
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sunat_estado TEXT; -- 'ACEPTADO', 'PENDIENTE', 'RECHAZADO'
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sunat_hash TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sunat_pdf_url TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sunat_xml_url TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_document TEXT; -- DNI or RUC
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_address TEXT;

-- Create a sequence helper: function to get next correlativo per serie
CREATE OR REPLACE FUNCTION get_next_document_number(p_serie TEXT, p_tenant_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  next_num INTEGER;
BEGIN
  -- Get the current max number for this serie and increment
  SELECT COALESCE(MAX(document_number), 0) + 1
  INTO next_num
  FROM sales
  WHERE document_serie = p_serie;
  
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;
