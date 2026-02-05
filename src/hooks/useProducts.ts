import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Product } from '@/types';
import { toast } from 'sonner';

export function useProducts() {
  const queryClient = useQueryClient();

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Product[];
    },
  });

  const createProduct = useMutation({
    mutationFn: async (newProduct: Omit<Product, 'id'>) => {
      const { data, error } = await supabase
        .from('products')
        .insert(newProduct)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: any) => {
      toast.error('Error al crear producto', { description: error.message });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async (updatedProduct: Product) => {
      const { data, error } = await supabase
        .from('products')
        .update({
             name: updatedProduct.name,
             description: updatedProduct.description,
             price: updatedProduct.price,
             category: updatedProduct.category,
             sku: updatedProduct.sku,
             barcode: updatedProduct.barcode,
             // additionalBarcodes not yet in DB schema, ignored for now
        })
        .eq('id', updatedProduct.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto actualizado exitosamente');
    },
    onError: (error: any) => {
      toast.error('Error al actualizar producto', { description: error.message });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado');
    },
  });

  return {
    products: products || [],
    isLoading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
