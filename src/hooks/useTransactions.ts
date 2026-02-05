import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Quote, Sale, QuoteItem } from '@/types';
import { toast } from 'sonner';

// Helper to transform database items to frontend items
const transformItems = (items: any[]): QuoteItem[] => {
  return items.map((item) => ({
    product: item.products, // Joined product data
    quantity: item.quantity,
    customPrice: item.custom_price || item.price_at_sale,
  }));
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
            quantity,
            custom_price,
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
      const itemsToInsert = quote.items.map((item) => ({
        quote_id: newQuote.id,
        product_id: item.product.id,
        quantity: item.quantity,
        custom_price: item.customPrice,
      }));

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
            quantity,
            price_at_sale,
            products (*)
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      return data.map((sale: any) => ({
        ...sale,
        items: transformItems(sale.sale_items),
        date: new Date(sale.date),
        customerName: sale.customer_name, // Map snake_case to camelCase
        paymentMethod: sale.payment_method, 
        invoiceNumber: sale.invoice_number,
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
         invoice_number: sale.invoiceNumber,
         date: sale.date.toISOString(),
       })
       .select()
       .single();

     if (saleError) throw saleError;

     // 2. Create Items
     const itemsToInsert = sale.items.map((item) => ({
       sale_id: newSale.id,
       product_id: item.product.id,
       quantity: item.quantity,
       price_at_sale: item.customPrice || item.product.price,
     }));

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
      toast.success('Venta registrada');
    },
    onError: (err: any) => toast.error('Error al registrar venta', { description: err.message }),
  });

  return { sales: sales || [], isLoading, createSale };
}
