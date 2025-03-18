// hooks/useProductos.ts - Optimizado para evitar renderizados innecesarios
import { useState, useEffect, useRef } from 'react';
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
  
  // Usar refs para evitar condiciones de carrera
  const loadingRef = useRef(false);
  const initializedRef = useRef(false);

  // Cargar todas las presentaciones - función simplificada
  const cargarPresentaciones = async () => {
    // Evitar cargas concurrentes
    if (loadingRef.current) {
      return presentaciones;
    }
    
    try {
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      const response = await presentacionApi.getPresentaciones();
      
      if (response && response.data && response.data.length > 0) {
        // Guardar en estado
        setPresentaciones(response.data);
        
        // Si no estamos filtrando por almacén, también actualizamos presentacionesFiltradas
        if (!filtrarPorAlmacen) {
          setPresentacionesFiltradas(response.data);
        }
        
        return response.data;
      } else {
        return [];
      }
    } catch (err) {
      setError('Error al cargar presentaciones');
      return [];
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  };

  // Filtrar presentaciones por almacén
  const filtrarPorAlmacenId = async (almacenId: string | number) => {
    if (!almacenId) return [];
    
    // Si no estamos filtrando por almacén, simplemente devolvemos todas las presentaciones
    if (!filtrarPorAlmacen) {
      setPresentacionesFiltradas(presentaciones);
      return presentaciones;
    }
    
    try {
      setIsLoading(true);
      
      // Asegurarnos de tener presentaciones cargadas
      let presentacionesAUsar = [...presentaciones];
      
      if (presentaciones.length === 0) {
        presentacionesAUsar = await cargarPresentaciones();
      }
      
      // Ahora tenemos presentaciones, procedemos con el filtrado
      if (soloConStock) {
        const inventarioRes = await inventarioApi.getInventarios(1, 100, Number(almacenId));
        
        if (inventarioRes && inventarioRes.data && inventarioRes.data.length > 0) {
          // Extraer IDs de presentaciones con stock
          const presentacionesIds = inventarioRes.data
            .filter(inv => inv.cantidad > 0)
            .map(inv => inv.presentacion_id.toString());
          
          // Filtrar presentaciones que coincidan con el inventario
          const filtradas = presentacionesAUsar.filter(p => 
            presentacionesIds.includes(p.id.toString())
          );
          
          setPresentacionesFiltradas(filtradas);
          return filtradas;
        } else {
          setPresentacionesFiltradas([]);
          return [];
        }
      } else {
        // Si no filtramos por stock, usar todas las presentaciones
        setPresentacionesFiltradas(presentacionesAUsar);
        return presentacionesAUsar;
      }
    } catch (err) {
      console.error('Error al filtrar por almacén:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Método para obtener presentaciones disponibles
  const getPresentacionesDisponibles = (detallesActuales: Array<{ presentacion_id: string }>) => {
    return presentacionesFiltradas.filter(p => {
      const presentacionId = p.id.toString();
      return !detallesActuales.some(d => d.presentacion_id === presentacionId);
    });
  };

  // Inicialización única
  useEffect(() => {
    const inicializarPresentaciones = async () => {
      // Evitar inicializaciones múltiples
      if (initializedRef.current || !cargarAlInicio) return;
      
      initializedRef.current = true;
      
      const presentacionesData = await cargarPresentaciones();
      
      if (presentacionesData.length > 0) {
        // Para ventas: filtrar por almacén del usuario si es necesario
        if (user?.almacen_id && filtrarPorAlmacen) {
          await filtrarPorAlmacenId(user.almacen_id);
        } 
        // Para pedidos: asegurarse de que las presentaciones filtradas estén establecidas
        else if (!filtrarPorAlmacen) {
          setPresentacionesFiltradas(presentacionesData);
        }
      }
    };
    
    inicializarPresentaciones();
  }, []);

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