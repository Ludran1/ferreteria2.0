import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { RemissionGuide, Product } from '@/types';
import { useToast } from './use-toast';

export function useRemissionGuides() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: guides, isLoading } = useQuery({
    queryKey: ['remission_guides'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('remission_guides')
        .select(`
          *,
          remission_items (
            quantity,
            products (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: 'Error al cargar guías',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      return data.map((guide: any) => ({
        id: guide.id,
        saleId: guide.sale_id,
        customerName: guide.customer_name,
        address: guide.address,
        date: new Date(guide.created_at),
        status: guide.status,
        items: guide.remission_items.map((item: any) => ({
          product: item.products,
          quantity: item.quantity,
        })),
      })) as RemissionGuide[];
    },
  });

  const createGuide = useMutation({
    mutationFn: async (guide: Omit<RemissionGuide, 'id' | 'date' | 'status'>) => {
      // 1. Create Guide
      const { data: newGuide, error: guideError } = await supabase
        .from('remission_guides')
        .insert({
          sale_id: guide.saleId,
          customer_name: guide.customerName,
          address: guide.address,
          status: 'pending',
        })
        .select()
        .single();

      if (guideError) throw guideError;

      // 2. Create Items
      const itemsToInsert = guide.items.map((item) => ({
        remission_id: newGuide.id,
        product_id: item.product.id,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from('remission_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      return newGuide;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remission_guides'] });
      toast({
        title: 'Guía creada',
        description: 'La guía de remisión se ha registrado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error al crear guía',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'pending' | 'delivered' }) => {
      const { error } = await supabase
        .from('remission_guides')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remission_guides'] });
      toast({
        title: 'Estado actualizado',
        description: 'El estado de la guía ha sido actualizado.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error al actualizar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    guides: guides || [],
    isLoading,
    createGuide,
    updateStatus,
  };
}
