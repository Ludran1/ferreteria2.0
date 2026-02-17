import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Quote, Sale, QuoteItem } from '@/types';
import { toast } from 'sonner';

// Helper to transform database items to frontend items
const transformItems = (items: any[]): QuoteItem[] => {
  return items.map((item) => {
    // If product exists (normal item), use it.
    // If product is null (manual item), create a "Virtual" product from product_name
    const isManual = !item.products;
    const manualId = item.id ? `manual-${item.id}` : `manual-${Date.now()}-${Math.random()}`;

    const productData = item.products || {
      id: manualId,
      name: item.product_name || 'Item Manual',
      description: 'Item agregado manualmente',
      price: item.price_at_sale || item.custom_price || 0,
      category: 'Manual',
      sku: 'MANUAL'
    };

    return {
      product: productData, 
      quantity: item.quantity,
      customPrice: item.custom_price || item.price_at_sale,
    };
  });
};

export function useQuotes() {
  const queryClient = useQueryClient();

  // Fetch Quotes with joined items and products
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          quote_items (
            id,
            quantity,
            custom_price,
            product_name,
            products (*)
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      return data.map((quote: any) => ({
        ...quote,
        items: transformItems(quote.quote_items),
        date: new Date(quote.date),
        customerName: quote.customer_name,
        customerPhone: quote.customer_phone,
        customerEmail: quote.customer_email,
        quoteNumber: quote.quote_number,
      })) as Quote[];
    },
  });

  const createQuote = useMutation({
    mutationFn: async (quote: Omit<Quote, 'id'>) => {
      // 1. Create Quote
      const { data: newQuote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          customer_name: quote.customerName,
          customer_phone: quote.customerPhone,
          customer_email: quote.customerEmail,
          status: quote.status,
          total: quote.total,
          date: quote.date.toISOString(),
        })
        .select()
        .single();

      if (quoteError) throw quoteError;

      // 2. Create Items
      // Handle Manual Items (no ID) vs Product Items
      const itemsToInsert = quote.items.map((item) => {
        const isManual = item.product.id.startsWith('manual');
        return {
          quote_id: newQuote.id,
          product_id: isManual ? null : item.product.id,
          product_name: isManual ? item.product.name : null, // Store name if manual
          quantity: item.quantity,
          custom_price: item.customPrice ?? item.product.price, // Always store the price at time of quote
        };
      });

      const { error: itemsError } = await supabase
        .from('quote_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;
      
      return newQuote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Cotización guardada');
    },
    onError: (err: any) => toast.error('Error al guardar cotización', { description: err.message }),
  });

  return { quotes: quotes || [], isLoading, createQuote };
}

// Get the next correlativo for a document serie
export async function getNextDocumentNumber(serie: string): Promise<number> {
  const { data, error } = await supabase
    .rpc('get_next_document_number', { p_serie: serie });

  if (error) {
    console.error('Error getting next document number:', error);
    return 1; // fallback
  }
  return data as number;
}

export function useSales() {
  const queryClient = useQueryClient();

  const { data: sales, isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            id,
            quantity,
            price_at_sale,
            product_name,
            products (*)
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      return data.map((sale: any) => ({
        ...sale,
        items: transformItems(sale.sale_items),
        date: new Date(sale.date),
        customerName: sale.customer_name,
        paymentMethod: sale.payment_method, 
        invoiceNumber: sale.invoice_number,
        documentType: sale.document_type,
        documentSerie: sale.document_serie,
        documentNumber: sale.document_number,
        sunatEstado: sale.sunat_estado,
        sunatHash: sale.sunat_hash,
        customerDocument: sale.customer_document,
      })) as Sale[];
    },
  });

  const createSale = useMutation({
    mutationFn: async (sale: Omit<Sale, 'id'>) => {
       // 1. Create Sale
       const { data: newSale, error: saleError } = await supabase
       .from('sales')
       .insert({
         customer_name: sale.customerName,
         total: sale.total,
         payment_method: sale.paymentMethod,
         payment_type: sale.paymentType,
         client_id: sale.clientId,
         balance: sale.balance,
         // invoice_number generated by trigger
         date: sale.date.toISOString(),
         // SUNAT fields
         document_type: (sale as any).documentType || null,
         document_serie: (sale as any).documentSerie || null,
         document_number: (sale as any).documentNumber || null,
         sunat_estado: (sale as any).sunatEstado || null,
         sunat_hash: (sale as any).sunatHash || null,
         sunat_pdf_url: (sale as any).sunatPdfUrl || null,
         sunat_xml_url: (sale as any).sunatXmlUrl || null,
         customer_document: (sale as any).customerDocument || null,
         customer_address: (sale as any).customerAddress || null,
       })
       .select()
       .single();

     if (saleError) throw saleError;

     // 2. Create Items
     const itemsToInsert = sale.items.map((item) => {
        const isManual = item.product.id.startsWith('manual');
        return {
          sale_id: newSale.id,
          product_id: isManual ? null : item.product.id,
          product_name: isManual ? item.product.name : null,
          quantity: item.quantity,
          price_at_sale: item.customPrice || item.product.price,
        };
     });

     const { error: itemsError } = await supabase
       .from('sale_items')
       .insert(itemsToInsert);

     if (itemsError) throw itemsError;
     
     return newSale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      // Invalidate products as stock might change (if we implement stock tracking)
      queryClient.invalidateQueries({ queryKey: ['products'] }); 
      // Toast handled by the caller (POSVentas emission flow)
    },
    onError: (err: any) => toast.error('Error al registrar venta', { description: err.message }),
  });

  return { sales: sales || [], isLoading, createSale };
}
