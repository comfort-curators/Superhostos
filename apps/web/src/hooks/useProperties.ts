import { useQuery } from '@tanstack/react-query';
import { fetchProperties } from '../api/client';

export function useProperties() {
  return useQuery({
    queryKey: ['properties'],
    queryFn: fetchProperties
  });
}
