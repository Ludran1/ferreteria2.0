import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'sonner';

export interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  rfc: string;
}

export function useBusinessSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['businessSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .single();
      
      if (error) {
        // If row doesn't exist (should happen only if SQL script wasn't run fully), return defaults
        // or try to create it? Better to handle error gracefully.
        console.error('Error fetching settings:', error);
        return null;
      }
      return data as BusinessSettings;
    },
    // Initial data matching the static file as fallback
    initialData: {
        name: 'Ferretería El Martillo',
        rfc: 'FEM123456789',
        address: 'Av. Principal 123, Col. Centro, CP 12345',
        phone: '555-123-4567',
        email: 'contacto@ferreteria.com',
    } as BusinessSettings
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: BusinessSettings) => {
      const { data, error } = await supabase
        .from('business_settings')
        .upsert({ ...newSettings, id: true }) // Force single row
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businessSettings'] });
      toast.success('Información del negocio actualizada');
    },
    onError: (error: any) => {
      toast.error('Error al actualizar configuración', {
        description: error.message
      });
    }
  });

  return { settings, isLoading, updateSettings };
}
