import { useCallback, useEffect, useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export const useMovements = () => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const loadMovements = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/movements');

      if (!res.ok) {
        const error = await res.json().catch(() => ({
          message: 'Error al cargar los movimientos',
        }));

        showToast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      const json = await res.json();
      setItems(json.data);
    } catch {
      showToast({
        title: 'Error de conexión',
        description: 'No se pudo conectar con el servidor',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadMovements();
  }, [loadMovements]);

  return { items, isLoading, reload: loadMovements };
};