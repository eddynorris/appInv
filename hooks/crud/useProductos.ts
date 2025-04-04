// hooks/useProductos.ts - Optimizado para evitar bucles infinitos
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
  
  // Ref para controlar si ya se han cargado las presentaciones
  const presentacionesCargadasRef = useRef(false);

  // Cargar todas las presentaciones - función simplificada y optimizada
  const cargarPresentaciones = useCallback(async (): Promise<Presentacion[]> => {
    // Evitar cargas duplicadas usando la ref
    if (loadingRef.current) {
      console.log("Carga de presentaciones en progreso, saltando solicitud duplicada");
      return presentaciones;
    }
    
    // Si ya están cargadas, devolver las existentes
    if (presentacionesCargadasRef.current && presentaciones.length > 0) {
      console.log("Presentaciones ya cargadas, usando datos existentes");
      return presentaciones;
    }
    
    try {
      console.log("Iniciando carga de presentaciones");
      loadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      const response = await presentacionApi.getPresentaciones();
      
      if (response && response.data && response.data.length > 0) {
        console.log(`Presentaciones cargadas: ${response.data.length}`);
        // Marcar como cargadas
        presentacionesCargadasRef.current = true;
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

  // Filtrar presentaciones por almacén - optimizada para evitar filtrados innecesarios
  const filtrarPorAlmacenId = useCallback(async (almacenId: string | number): Promise<Presentacion[]> => {
    // Validar almacenId
    if (!almacenId) {
      console.log("ID de almacén inválido, no se puede filtrar");
      setPresentacionesFiltradas([]);
      return [];
    }
    
    // Convertir a string para comparación
    const almacenIdStr = almacenId.toString();
    console.log(`Iniciando filtrado para almacén: ${almacenIdStr}`);
    
    try {
      setIsLoading(true);
      
      // Actualizar referencia del último almacén filtrado
      lastAlmacenIdRef.current = almacenIdStr;
      
      // Asegurarnos de tener presentaciones cargadas
      let presentacionesAUsar = [...presentaciones];
      
      if (presentacionesAUsar.length === 0) {
        console.log("Cargando presentaciones antes de filtrar");
        presentacionesAUsar = await cargarPresentaciones();
      }
      
      // Limpiar presentaciones filtradas antes de asignar las nuevas
      // Esto evita que se muestren productos de almacenes anteriores
      setPresentacionesFiltradas([]);
      
      // Ahora tenemos presentaciones, procedemos con el filtrado
      if (soloConStock) {
        console.log(`Filtrando productos con stock para almacén: ${almacenIdStr}`);
        const inventarioRes = await inventarioApi.getInventarios(1, 100, Number(almacenId));
        
        if (inventarioRes && inventarioRes.data && inventarioRes.data.length > 0) {
          // Extraer IDs de presentaciones con stock
          const presentacionesIds = inventarioRes.data
            .filter(inv => inv.cantidad > 0)
            .map(inv => inv.presentacion_id.toString());
          
          console.log(`Presentaciones con stock encontradas: ${presentacionesIds.length}`);
          
          // Filtrar presentaciones que coincidan con el inventario
          const filtradas = presentacionesAUsar.filter(p => 
            presentacionesIds.includes(p.id.toString())
          );
          
          setPresentacionesFiltradas(filtradas);
          console.log(`Presentaciones filtradas por stock para almacén ${almacenIdStr}: ${filtradas.length}`);
          return filtradas;
        } else {
          console.log(`No se encontró inventario con stock para el almacén ${almacenIdStr}`);
          setPresentacionesFiltradas([]);
          return [];
        }
      } else {
        // Si no filtramos por stock, usar todas las presentaciones
        setPresentacionesFiltradas(presentacionesAUsar);
        return presentacionesAUsar;
      }
    } catch (err) {
      console.error(`Error al filtrar por almacén ${almacenIdStr}:`, err);
      setPresentacionesFiltradas([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [filtrarPorAlmacen, soloConStock, presentaciones, cargarPresentaciones]);

  // Método para obtener presentaciones disponibles (no incluidas en detalles actuales)
  const getPresentacionesDisponibles = useCallback((detallesActuales: Array<{ presentacion_id: string }>) => {
    return presentacionesFiltradas.filter(p => {
      const presentacionId = p.id.toString();
      return !detallesActuales.some(d => d.presentacion_id === presentacionId);
    });
  }, [presentacionesFiltradas]);

  // Inicialización única y controlada usando useEffect
  useEffect(() => {
    const inicializarPresentaciones = async () => {
      // Evitar inicializaciones múltiples
      if (initializedRef.current || !cargarAlInicio) return;
      
      initializedRef.current = true;
      console.log("Inicializando presentaciones automáticamente");
      
      const presentacionesData = await cargarPresentaciones();
      
      if (presentacionesData.length > 0) {
        // Para ventas: filtrar por almacén del usuario si es necesario
        if (user?.almacen_id && filtrarPorAlmacen) {
          console.log(`Filtrando automáticamente por almacén del usuario: ${user.almacen_id}`);
          await filtrarPorAlmacenId(user.almacen_id);
        } 
        // Para pedidos: asegurarse de que las presentaciones filtradas estén establecidas
        else if (!filtrarPorAlmacen) {
          setPresentacionesFiltradas(presentacionesData);
        }
      }
    };
    
    inicializarPresentaciones();
  }, [cargarAlInicio, cargarPresentaciones, filtrarPorAlmacen, filtrarPorAlmacenId, user]);

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