// hooks/useProductos.ts - Manejo optimizado de carga y filtrado de productos
import { useState, useEffect } from 'react';
import { presentacionApi, inventarioApi } from '@/services/api';
import { Presentacion } from '@/models';
import { useAuth } from '@/context/AuthContext';

interface UseProductosOptions {
  filtrarPorAlmacen?: boolean;  // Si es true, filtra productos disponibles por almacén
  soloConStock?: boolean;       // Si es true, solo muestra productos con stock > 0
  cargarAlInicio?: boolean;     // Si es true, carga automáticamente al inicializar
}

export function useProductos(options: UseProductosOptions = {}) {
  const { 
    filtrarPorAlmacen = true, 
    soloConStock = false,
    cargarAlInicio = true
  } = options;
  
  const { user } = useAuth();
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([]);
  const [presentacionesFiltradas, setPresentacionesFiltradas] = useState<Presentacion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar todas las presentaciones
  const cargarPresentaciones = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await presentacionApi.getPresentaciones();
      
      if (response && response.data) {
        setPresentaciones(response.data);
        setPresentacionesFiltradas(response.data);
        return response.data;
      }
      
      return [];
    } catch (err) {
      setError('Error al cargar presentaciones');
      console.error('Error al cargar presentaciones:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar presentaciones por almacén
  const filtrarPorAlmacenId = async (almacenId: string | number) => {
    if (!almacenId) {
      console.warn("Intentando filtrar por almacén sin ID");
      return [];
    }
    
    if (!filtrarPorAlmacen) {
      setPresentacionesFiltradas(presentaciones);
      return presentaciones;
    }
    
    try {
      setIsLoading(true);
      console.log(`Filtrando presentaciones para almacén ID: ${almacenId}`);
      
      if (soloConStock) {
        // Si necesitamos filtrar por stock, consultamos el inventario
        const inventarioRes = await inventarioApi.getInventarios(1, 100, Number(almacenId));
        
        if (inventarioRes && inventarioRes.data) {
          // Filtrar por productos con stock
          const presentacionesIds = inventarioRes.data
            .filter(inv => inv.cantidad > 0)
            .map(inv => inv.presentacion_id.toString());
          
          console.log(`Se encontraron ${presentacionesIds.length} presentaciones con stock`);
          
          const filtradas = presentaciones.filter(p => 
            presentacionesIds.includes(p.id.toString())
          );
          
          console.log(`Filtrando a ${filtradas.length} presentaciones disponibles`);
          setPresentacionesFiltradas(filtradas);
          return filtradas;
        }
      }
      
      // Si no filtramos por stock o no hay datos de inventario, usar todas
      console.log(`Usando todas las ${presentaciones.length} presentaciones disponibles`);
      setPresentacionesFiltradas(presentaciones);
      return presentaciones;
    } catch (err) {
      console.error('Error al filtrar por almacén:', err);
      return presentaciones;
    } finally {
      setIsLoading(false);
    }
  };

  // Método para obtener presentaciones disponibles (no en detalles)
  const getPresentacionesDisponibles = (detallesActuales: Array<{ presentacion_id: string }>) => {
    return presentacionesFiltradas.filter(p => {
      const presentacionId = p.id.toString();
      return !detallesActuales.some(d => d.presentacion_id === presentacionId);
    });
  };

  // Cargar presentaciones al inicializar si se requiere
  useEffect(() => {
    const inicializarPresentaciones = async () => {
      if (cargarAlInicio) {
        await cargarPresentaciones();
        
        // Si el usuario tiene un almacén asignado, filtrar automáticamente
        if (user?.almacen_id && filtrarPorAlmacen) {
          console.log('Filtrando por almacén del usuario:', user.almacen_id);
          await filtrarPorAlmacenId(user.almacen_id);
        }
      }
    };
    
    inicializarPresentaciones();
  }, [user, cargarAlInicio, filtrarPorAlmacen]);

  return {
    presentaciones,
    presentacionesFiltradas,
    isLoading,
    error,
    cargarPresentaciones,
    filtrarPorAlmacenId,
    setPresentacionesFiltradas,
    getPresentacionesDisponibles
  };
}