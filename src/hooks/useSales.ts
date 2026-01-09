import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type SaleRow = Tables<'sales'>;

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .order('data_emissao', { ascending: false });

      if (error) {
        throw error;
      }

      return data as SaleRow[];
    },
  });
}
