import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Client, Payment } from '@/types';
import { useToast } from './use-toast';

export function useClients() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Map DB snake_case to Client camelCase
      return (data || []).map((client: any) => ({
          id: client.id,
          name: client.name,
          documentType: client.document_type,
          documentId: client.document_id,
          phone: client.phone,
          email: client.email,
          address: client.address,
          notes: client.notes
      })) as Client[];
    },
  });

  const createClient = useMutation({
    mutationFn: async (client: Omit<Client, 'id'>) => {
      // 1. Check if client exists
      if (client.documentId) {
        const { data: existing } = await supabase
            .from('clients')
            .select('id')
            .eq('document_id', client.documentId)
            .maybeSingle(); // Use maybeSingle to avoid error if not found (returns null)

        if (existing) {
            throw new Error(`El cliente con documento ${client.documentId} ya existe.`);
        }
      }

      // Map Client camelCase to DB snake_case
      const dbClient = {
          name: client.name,
          document_type: client.documentType,
          document_id: client.documentId,
          phone: client.phone,
          email: client.email,
          address: client.address,
          notes: client.notes
      };

      const { data, error } = await supabase
        .from('clients')
        .insert(dbClient)
        .select()
        .single();

      if (error) throw error;
      
      // Map back result to Client
      return {
          id: data.id,
          name: data.name,
          documentType: data.document_type,
          documentId: data.document_id,
          phone: data.phone,
          email: data.email,
          address: data.address,
          notes: data.notes
      } as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Cliente creado exitosamente' });
    },
    onError: (error) => {
      toast({ 
        title: 'Error al crear cliente', 
        description: error.message, 
        variant: 'destructive' 
      });
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      // Map updates to snake_case
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.documentType !== undefined) dbUpdates.document_type = updates.documentType;
      if (updates.documentId !== undefined) dbUpdates.document_id = updates.documentId;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { data, error } = await supabase
        .from('clients')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Cliente actualizado' });
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({ title: 'Cliente eliminado correctamente' });
    },
    onError: (error: any) => {
      const msg = error.code === '23503' 
        ? 'No se puede eliminar el cliente porque tiene ventas o pagos registrados.' 
        : error.message;
      
      toast({ 
        title: 'Error al eliminar', 
        description: msg, 
        variant: 'destructive' 
      });
    },
  });

  return {
    clients: clientsQuery.data || [],
    isLoading: clientsQuery.isLoading,
    createClient,
    updateClient,
    deleteClient,
  };
}

export function useClientPayments(clientId?: string) {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch payments for a specific client
    const paymentsQuery = useQuery({
        queryKey: ['payments', clientId],
        queryFn: async () => {
            if (!clientId) return [];
            const { data, error } = await supabase
                .from('payments')
                .select('*')
                .eq('client_id', clientId)
                .order('date', { ascending: false });
            
            if (error) throw error;
            
            // Map DB snake_case to Payment camelCase
            return (data || []).map((p: any) => ({
                id: p.id,
                clientId: p.client_id,
                saleId: p.sale_id,
                amount: p.amount,
                paymentMethod: p.payment_method,
                date: new Date(p.date),
                notes: p.notes
            })) as Payment[];
        },
        enabled: !!clientId,
    });
    
    // Generic add payment
    const addPayment = useMutation({
        mutationFn: async (payment: Omit<Payment, 'id'>) => {
            // 1. Insert Payment
            const { data: paymentData, error: paymentError } = await supabase
                .from('payments')
                .insert({
                    client_id: payment.clientId,
                    sale_id: payment.saleId,
                    amount: payment.amount,
                    payment_method: payment.paymentMethod,
                    date: payment.date.toISOString(),
                    notes: payment.notes
                })
                .select()
                .single();
            
            if (paymentError) throw paymentError;

            // 2. Update Sale Balance if saleId exists
            if (payment.saleId) {
                const { data: saleData } = await supabase
                    .from('sales')
                    .select('balance')
                    .eq('id', payment.saleId)
                    .single();

                if (saleData) {
                    const currentBalance = Number(saleData.balance) || 0;
                    const newBalance = currentBalance - payment.amount;

                    const { error: updateError } = await supabase
                        .from('sales')
                        .update({ balance: newBalance })
                        .eq('id', payment.saleId);
                        
                    if (updateError) console.error("Error updating sale balance:", updateError);
                }
            }

            return paymentData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['payments'] });
            queryClient.invalidateQueries({ queryKey: ['client-sales'] }); // Correct key for client sales list
            toast({ title: 'Pago registrado' });
        },
        onError: (error) => {
            toast({ 
                title: 'Error al registrar pago', 
                description: error.message, 
                variant: 'destructive' 
            });
        }
    });

    return {
        payments: paymentsQuery.data || [],
        isLoading: paymentsQuery.isLoading,
        addPayment
    };
}

export function useClientSales(clientId?: string) {
    const { toast } = useToast();

    const salesQuery = useQuery({
        queryKey: ['client-sales', clientId],
        queryFn: async () => {
            if (!clientId) return [];
            const { data, error } = await supabase
                .from('sales')
                .select(`
                    id, 
                    created_at, 
                    customer_name, 
                    total, 
                    payment_method, 
                    payment_type, 
                    client_id, 
                    balance, 
                    date,
                    invoice_number
                `)
                .eq('client_id', clientId)
                .order('date', { ascending: false });
            
            if (error) throw error;
            
            // Map to Sale interface
            return (data || []).map((s: any) => ({
                id: s.id,
                customerName: s.customer_name,
                total: s.total,
                paymentMethod: s.payment_method,
                paymentType: s.payment_type,
                clientId: s.client_id,
                balance: s.balance,
                date: new Date(s.date),
                invoiceNumber: s.invoice_number,
                items: [] // We don't need items for the list view
            })) as any[]; // Using any to avoid strict type mismatch with full Sale object if not needed
        },
        enabled: !!clientId,
    });

    return {
        sales: salesQuery.data || [],
        isLoading: salesQuery.isLoading
    };
}
