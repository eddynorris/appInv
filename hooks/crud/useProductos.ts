// hooks/useProductos.ts - Versión optimizada para reducir peticiones API
import { useState, useEffect, useRef, useCallback } from 'react';
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
  
  // Usar refs para controlar el estado de carga y evitar condiciones de carrera
  const loadingRef = useRef(false);
  const initializedRef = useRef(false);
  
  // Ref para almacenar el último almacén filtrado y evitar filtrados duplicados
  const lastAlmacenIdRef = useRef<string | null>(null);
  
  // Caché de datos por almacén para reducir llamadas a la API
  const [inventarioCache, setInventarioCache] = useState<Record<string, any[]>>({});
  
  // Cargar todas las presentaciones - función optimizada
  const cargarPresentaciones = useCallback(async (): Promise<Presentacion[]> => {
    // Evitar cargas duplicadas usando la ref
    if (loadingRef.current) {
      console.log("Carga de presentaciones en progreso, evitando duplicación");
      return presentaciones;
    }
    
    // Si ya tenemos presentaciones cargadas, usarlas
    if (presentaciones.length > 0) {
      console.log(`Usando ${presentaciones.length} presentaciones ya cargadas`);
      return presentaciones;
    }
    
    try {
      console.log("Iniciando carga de presentaciones desde la API");
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      const response = await presentacionApi.getPresentaciones();
      
      if (response?.data && response.data.length > 0) {
        console.log(`Cargadas ${response.data.length} presentaciones`);
        
        // Guardar en estado
        setPresentaciones(response.data);
        
        // Si no estamos filtrando por almacén, también actualizamos presentacionesFiltradas
        if (!filtrarPorAlmacen) {
          setPresentacionesFiltradas(response.data);
        }
        
        return response.data;
      } else {
        console.log("No se encontraron presentaciones");
        return [];
      }
    } catch (err) {
      console.error("Error cargando presentaciones:", err);
      setError('Error al cargar presentaciones');
      return [];
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [presentaciones, filtrarPorAlmacen]);

  // Filtrar presentaciones por almacén con caché
  const filtrarPorAlmacenId = useCallback(async (almacenId: string | number): Promise<Presentacion[]> => {
    // Validar almacenId
    if (!almacenId) {
      console.log("ID de almacén inválido");
      setPresentacionesFiltradas([]);
      return [];
    }
    
    // Convertir a string para comparación consistente
    const almacenIdStr = almacenId.toString();
    
    // Si ya filtramos para este almacén y tenemos presentaciones, evitar filtrado redundante
    if (lastAlmacenIdRef.current === almacenIdStr && presentacionesFiltradas.length > 0) {
      console.log(`Usando filtro existente para almacén ${almacenIdStr} (${presentacionesFiltradas.length} items)`);
      return presentacionesFiltradas;
    }
    
    console.log(`Filtrando productos para almacén: ${almacenIdStr}`);
    
    try {
      setIsLoading(true);
      
      // Actualizar referencia del último almacén filtrado
      lastAlmacenIdRef.current = almacenIdStr;
      
      // Asegurarnos de tener presentaciones cargadas
      let presentacionesDisponibles = [...presentaciones];
      
      if (presentacionesDisponibles.length === 0) {
        console.log("Cargando presentaciones antes de filtrar");
        presentacionesDisponibles = await cargarPresentaciones();
      }
      
      // Limpiar presentaciones filtradas antes de asignar las nuevas
      setPresentacionesFiltradas([]);
      
      // Verificar si tenemos este inventario en caché
      if (inventarioCache[almacenIdStr] && inventarioCache[almacenIdStr].length > 0) {
        console.log(`Usando caché de inventario para almacén ${almacenIdStr}`);
        
        if (soloConStock) {
          // Filtrar por productos con stock usando la caché
          const presentacionesIds = inventarioCache[almacenIdStr]
            .filter(inv => inv.cantidad > 0)
            .map(inv => inv.presentacion_id.toString());
          
          const filtradas = presentacionesDisponibles.filter(p => 
            presentacionesIds.includes(p.id.toString())
          );
          
          setPresentacionesFiltradas(filtradas);
          console.log(`Filtrados ${filtradas.length} productos con stock del caché`);
          return filtradas;
        } else {
          // Si no filtramos por stock, usar todas las presentaciones
          setPresentacionesFiltradas(presentacionesDisponibles);
          return presentacionesDisponibles;
        }
      }
      
      // Si no tenemos caché o necesitamos actualizar, buscar en la API
      const inventarioRes = await inventarioApi.getInventarios(1, 100, Number(almacenId));
      
      // Guardar resultado en caché
      if (inventarioRes?.data) {
        setInventarioCache(prev => ({
          ...prev,
          [almacenIdStr]: inventarioRes.data
        }));
      }
      
      if (soloConStock) {
        // Ahora filtrar con los datos de la API
        if (inventarioRes?.data && inventarioRes.data.length > 0) {
          // Extraer IDs de presentaciones con stock
          const presentacionesIds = inventarioRes.data
            .filter(inv => inv.cantidad > 0)
            .map(inv => inv.presentacion_id.toString());
          
          // Filtrar presentaciones que coincidan con el inventario
          const filtradas = presentacionesDisponibles.filter(p => 
            presentacionesIds.includes(p.id.toString())
          );
          
          setPresentacionesFiltradas(filtradas);
          console.log(`Filtradas ${filtradas.length} presentaciones con stock para almacén ${almacenIdStr}`);
          return filtradas;
        } else {
          console.log(`No hay inventario con stock para almacén ${almacenIdStr}`);
          setPresentacionesFiltradas([]);
          return [];
        }
      } else {
        // Si no filtramos por stock, usar todas las presentaciones
        setPresentacionesFiltradas(presentacionesDisponibles);
        return presentacionesDisponibles;
      }
    } catch (err) {
      console.error(`Error al filtrar por almacén ${almacenIdStr}:`, err);
      setError(`Error al filtrar productos por almacén: ${err}`);
      setPresentacionesFiltradas([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [filtrarPorAlmacen, soloConStock, presentaciones, cargarPresentaciones, presentacionesFiltradas.length, inventarioCache]);

  // Método para obtener presentaciones disponibles (no incluidas en detalles actuales)
  const getPresentacionesDisponibles = useCallback((detallesActuales: Array<{ presentacion_id: string }>) => {
    // Crear un Set de IDs para búsqueda más eficiente
    const idsEnDetalles = new Set(detallesActuales.map(d => d.presentacion_id));
    
    // Filtrar usando el Set para mejor rendimiento
    return presentacionesFiltradas.filter(p => 
      !idsEnDetalles.has(p.id.toString())
    );
  }, [presentacionesFiltradas]);

  // Inicialización controlada usando useEffect
  useEffect(() => {
    const inicializarPresentaciones = async () => {
      // Evitar inicializaciones múltiples
      if (initializedRef.current || !cargarAlInicio) return;
      
      initializedRef.current = true;
      console.log("Inicializando presentaciones automáticamente");
      
      const presentacionesData = await cargarPresentaciones();
      
      if (presentacionesData.length > 0) {
        if (user?.almacen_id && filtrarPorAlmacen) {
          console.log(`Filtrando automáticamente por almacén del usuario: ${user.almacen_id}`);
          await filtrarPorAlmacenId(user.almacen_id);
        } else if (!filtrarPorAlmacen) {
          setPresentacionesFiltradas(presentacionesData);
        }
      }
    };
    
    inicializarPresentaciones();
  }, [cargarAlInicio, cargarPresentaciones, filtrarPorAlmacen, filtrarPorAlmacenId, user]);

  // Función para limpiar la caché y forzar recarga
  const invalidarCache = useCallback(() => {
    setInventarioCache({});
    lastAlmacenIdRef.current = null;
    
    // Si hay almacén actual, recargar
    if (lastAlmacenIdRef.current) {
      filtrarPorAlmacenId(lastAlmacenIdRef.current);
    }
  }, [filtrarPorAlmacenId]);

  return {
    presentaciones,
    presentacionesFiltradas,
    isLoading,
    error,
    
    // Funciones principales
    cargarPresentaciones,
    filtrarPorAlmacenId,
    getPresentacionesDisponibles,
    
    // Modificadores de estado
    setPresentacionesFiltradas,
    
    // Caché
    invalidarCache
  };
}