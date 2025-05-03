// hooks/crud/useInventarios.tsx - Versión Optimizada y Simplificada
import { useState, useCallback, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';

// Quitar useApiResource ya que manejaremos la lista principal manualmente
// import { useApiResource } from '@/hooks/useApiResource';
import { Inventario, AlmacenSimple, Presentacion, Lote, Almacen } from '@/models'; // Añadir AlmacenSimple y Almacen
import { inventarioApi, almacenApi, presentacionApi, loteApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { useForm } from '../useForm'; // Asumiendo que useForm existe

// Interface para los datos del formulario de ajuste
interface AjusteStockForm {
    cantidad: string;
    motivo: string;
    tipo_ajuste: 'entrada' | 'salida';
    lote_origen_id?: string; // Para entradas desde lote
}

// Estado inicial del formulario de ajuste
const initialAjusteForm: AjusteStockForm = {
    cantidad: '1',
    motivo: '',
    tipo_ajuste: 'salida',
    lote_origen_id: '',
};

export function useInventarios(inventarioIdParaAjuste?: number | null) {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'admin';

    // Estados para la lista principal
    const [allInventarios, setAllInventarios] = useState<Inventario[]>([]); // Todos los datos
    const [filteredInventarios, setFilteredInventarios] = useState<Inventario[]>([]); // Datos filtrados para mostrar
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [listError, setListError] = useState<string | null>(null);

    // Estados para filtros (aplicados localmente)
    const [selectedAlmacenId, setSelectedAlmacenId] = useState<string>(() =>
        !isAdmin && user?.almacen_id ? user.almacen_id.toString() : ''
    );
    const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);
    const [searchText, setSearchText] = useState('');

    // Estados para la pantalla de ajuste
    const [inventarioActual, setInventarioActual] = useState<Inventario | null>(null);
    const [isLoadingItem, setIsLoadingItem] = useState(false);
    const [itemError, setItemError] = useState<string | null>(null);
    const [lotesDisponibles, setLotesDisponibles] = useState<Lote[]>([]);
    const [isLoadingLotes, setIsLoadingLotes] = useState(false);
    const [isAdjusting, setIsAdjusting] = useState(false);

    // Estado para almacenes (picker admin)
    const [almacenesParaPicker, setAlmacenesParaPicker] = useState<AlmacenSimple[]>([]);
    const [isLoadingAlmacenes, setIsLoadingAlmacenes] = useState(false);

    // Hook de formulario para el ajuste - CORREGIDO: useForm solo con estado inicial
    const ajusteForm = useForm<AjusteStockForm>(initialAjusteForm);

    // --- Funciones para la Lista (INDEX) ---

    // Cargar todos los inventarios (llamada única)
    const loadAllInventarios = useCallback(async () => {
        setIsLoadingList(true);
        setListError(null);
        try {
            // Intentar obtener todos con perPage muy grande o un flag si la API lo soporta
            // Aquí asumimos perPage grande. Ajustar si la API tiene otra forma.
            const response = await inventarioApi.getInventarios(1, 10000); // TODO: Ajustar límite o usar flag si existe
            setAllInventarios(response.data || []);
        } catch (err: any) {
            console.error('Error loading all inventarios:', err);
            setListError(err.message || 'Error al cargar el inventario');
            setAllInventarios([]); // Asegurar que esté vacío en caso de error
        } finally {
            setIsLoadingList(false);
        }
    }, []);

    // Cargar almacenes para el picker (solo admin)
    const loadAlmacenesParaPicker = useCallback(async () => {
        if (!isAdmin || almacenesParaPicker.length > 0) return;
        setIsLoadingAlmacenes(true);
        try {
            const response = await almacenApi.getAlmacenes(1, 100); // Suficientes para un picker
            setAlmacenesParaPicker(response.data || []);
        } catch (err: any) {
            console.error("Error cargando almacenes para picker:", err);
            // No establecer error global, solo afecta al picker
        } finally {
            setIsLoadingAlmacenes(false);
        }
    }, [isAdmin, almacenesParaPicker.length]);

    // Aplicar filtros localmente
    const applyLocalFilters = useCallback(() => {
        let result = allInventarios;

        // Filtrar por almacén
        if (selectedAlmacenId) {
            result = result.filter(item => item.almacen_id.toString() === selectedAlmacenId);
        }

        // Filtrar por stock bajo
        if (showOnlyLowStock) {
            result = result.filter(item => item.cantidad <= item.stock_minimo);
        }

        // Filtrar por texto de búsqueda (nombre presentación o producto)
        if (searchText) {
            const lowerSearchText = searchText.toLowerCase();
            result = result.filter(item =>
                item.presentacion?.nombre?.toLowerCase().includes(lowerSearchText) ||
                item.presentacion?.producto?.nombre?.toLowerCase().includes(lowerSearchText)
            );
        }

        setFilteredInventarios(result);
    }, [allInventarios, selectedAlmacenId, showOnlyLowStock, searchText]);

    // Efecto para aplicar filtros cuando cambian los datos o los filtros
    useEffect(() => {
        // Aplicar filtros solo si no estamos cargando un item específico
        // (los filtros se aplican sobre allInventarios, que solo se carga para la lista)
        if (!inventarioIdParaAjuste) {
            applyLocalFilters();
        }
    }, [applyLocalFilters, inventarioIdParaAjuste]); // Añadir dependencia

    // Efecto para carga inicial de lista y almacenes picker
    useEffect(() => {
        // Cargar solo si no es para ajuste
        if (!inventarioIdParaAjuste) {
            console.log("useInventarios: Cargando datos para VISTA DE LISTA (useEffect principal)");
            loadAllInventarios();
            loadAlmacenesParaPicker(); // Llamar aquí
        }
        // CORREGIDO: Quitar loadAlmacenesParaPicker del array de dependencias
    }, [loadAllInventarios, inventarioIdParaAjuste]);

    // --- Funciones para el Item (AJUSTAR) ---

    // Cargar datos del inventario específico para ajustar
    const loadInventarioParaAjuste = useCallback(async (id: number) => {
        setIsLoadingItem(true);
        setItemError(null);
        setInventarioActual(null);
        try {
            const data = await inventarioApi.getInventario(id);
            setInventarioActual(data);
            // Podríamos pre-llenar algo del form aquí si fuera necesario
        } catch (err: any) {
            console.error(`Error loading inventario ${id}:`, err);
            setItemError(err.message || 'Error al cargar los detalles del inventario');
        } finally {
            setIsLoadingItem(false);
        }
    }, []);

    // Cargar lotes disponibles (solo si es una entrada y hay un inventario cargado)
    const loadLotesDisponibles = useCallback(async () => {
        if (!inventarioActual || ajusteForm.formData.tipo_ajuste !== 'entrada') {
            setLotesDisponibles([]);
            return;
        }
        setIsLoadingLotes(true);
        try {
            // Idealmente filtrar por producto_id si la API lo permite
            const productoId = inventarioActual.presentacion?.producto_id;
            // TODO: Verificar si loteApi.getLotes acepta filtro producto_id y disponible=true
            const response = await loteApi.getLotes(1, 500); // Cargar suficientes lotes
            // Filtrar adicionalmente si es necesario (ej: por producto si la API no lo hizo)
            let lotesFiltrados = response.data || [];
            if (productoId) {
                 lotesFiltrados = lotesFiltrados.filter(lote => lote.producto_id === productoId);
            }
            // Podríamos filtrar también lotes con cantidad_disponible > 0
             lotesFiltrados = lotesFiltrados.filter(lote => parseFloat(String(lote.cantidad_disponible_kg ?? 0)) > 0);

            setLotesDisponibles(lotesFiltrados);
        } catch (err: any) {
            console.error("Error loading lotes disponibles:", err);
        } finally {
            setIsLoadingLotes(false);
        }
    }, [inventarioActual, ajusteForm.formData.tipo_ajuste]);

    // Efecto para cargar el item de ajuste si se proporciona ID
    useEffect(() => {
        if (inventarioIdParaAjuste) {
            console.log(`useInventarios: Cargando datos para AJUSTE (ID: ${inventarioIdParaAjuste})`);
            loadInventarioParaAjuste(inventarioIdParaAjuste);
        }
    }, [inventarioIdParaAjuste, loadInventarioParaAjuste]);

    // Efecto para cargar lotes cuando se cambia a 'entrada' o cambia el inventario
     useEffect(() => {
         // Solo cargar lotes si estamos en modo ajuste y es entrada
        if (inventarioIdParaAjuste && inventarioActual && ajusteForm.formData.tipo_ajuste === 'entrada') {
             loadLotesDisponibles();
        } else {
            setLotesDisponibles([]); // Limpiar si no es entrada o no estamos en ajuste
        }
    }, [inventarioActual, ajusteForm.formData.tipo_ajuste, loadLotesDisponibles, inventarioIdParaAjuste]); // Añadir dependencia


    // Realizar el ajuste de stock
    const adjustStock = useCallback(async (): Promise<boolean> => {
        // CORREGIDO: Validar aquí directamente
        const currentFormData = ajusteForm.formData;
        const errors: Record<string, string> = {};
        if (!currentFormData.cantidad || isNaN(parseInt(currentFormData.cantidad)) || parseInt(currentFormData.cantidad) <= 0) {
            errors.cantidad = 'Ingrese una cantidad válida mayor a 0.';
        }
        if (!currentFormData.motivo.trim()) {
            errors.motivo = 'El motivo es requerido.';
        }
        if (currentFormData.tipo_ajuste === 'entrada' && !currentFormData.lote_origen_id) {
            errors.lote_origen_id = 'Debe seleccionar un lote de origen para la entrada.';
        }
        if (currentFormData.tipo_ajuste === 'salida' && inventarioActual) {
           const cantidadAjuste = parseInt(currentFormData.cantidad);
           if (!isNaN(cantidadAjuste) && cantidadAjuste > inventarioActual.cantidad) {
               errors.cantidad = `No puede restar más de ${inventarioActual.cantidad} (stock actual).`;
           }
        }

        if (Object.keys(errors).length > 0 || !inventarioActual) {
            ajusteForm.setErrors(errors);
            return false;
        }

        setIsAdjusting(true);
        setItemError(null); // Limpiar error previo
        // Usar currentFormData en lugar de ajusteForm.formData directamente aquí
        const { cantidad, motivo, tipo_ajuste, lote_origen_id } = currentFormData;
        const cantidadNum = parseInt(cantidad);
        const cantidadAjuste = tipo_ajuste === 'entrada' ? cantidadNum : -cantidadNum;
        const nuevaCantidad = inventarioActual.cantidad + cantidadAjuste;

        try {
            const payload: any = {
                cantidad: nuevaCantidad, // Enviar la cantidad final
                // Otros campos que permita la API PUT de inventario, si son necesarios
                // Por ejemplo, si la API necesita el motivo o el lote_id directamente aquí:
                // motivo_ajuste: motivo,
                // tipo_ajuste: tipo_ajuste,
            };

            // Si es entrada desde un lote, asociar el lote al registro de inventario si es necesario
            // (Depende de si tu modelo Inventario guarda el lote_id directamente O si el ajuste se registra en otra tabla)
            // Asumiendo que el PUT a /inventarios/{id} puede actualizar el lote_id
             if (tipo_ajuste === 'entrada' && lote_origen_id) {
                 payload.lote_id = parseInt(lote_origen_id);
                 // Podríamos necesitar llamar a un endpoint de lote para decrementar su cantidad
                 // await loteApi.ajustarStockLote(parseInt(lote_origen_id), -cantidadNum * capacidadPresentacion); // Ejemplo
             } else if (tipo_ajuste === 'salida') {
                 // Si es una salida y el inventario estaba asociado a un lote, quizás necesitemos desasociarlo
                 // payload.lote_id = null; // OJO: Esto depende totalmente de tu lógica de negocio y backend
                 // También podríamos necesitar llamar a un endpoint de lote para incrementar su cantidad disponible si la salida fue por merma/descarte
             }


            console.log(`Ajustando stock para inventario ${inventarioActual.id}. Payload:`, payload);

            // Llamar a la API para actualizar el inventario
            await inventarioApi.updateInventario(inventarioActual.id, payload);

            Alert.alert('Éxito', 'Stock ajustado correctamente');
            // Opcional: Recargar datos de la lista si estamos en index, o volver atrás si estamos en ajustar
            await loadAllInventarios(); // Recargar la lista principal
            router.back(); // Volver si estamos en la pantalla de ajuste
            return true;

        } catch (err: any) {
            console.error('Error adjusting stock:', err);
            const apiError = err.response?.data?.error || err.message || 'Error al ajustar el stock';
             setItemError(apiError);
            // Mantener el formulario para que el usuario vea el error
            // setErrors(prev => ({ ...prev, api: apiError }));
            Alert.alert('Error', apiError);
            return false;
        } finally {
            setIsAdjusting(false);
        }
    }, [inventarioActual, ajusteForm, loadAllInventarios]); // ajusteForm ahora incluye setErrors


     // Borrar item (con confirmación) - Adaptado sin useApiResource
     const deleteInventario = useCallback(async (id: number): Promise<boolean> => {
         return new Promise((resolve) => {
             Alert.alert("Eliminar Registro", "¿Está seguro?", [
                 { text: "Cancelar", style: "cancel", onPress: () => resolve(false) },
                 { text: "Eliminar", style: "destructive", onPress: async () => {
                     try {
                         await inventarioApi.deleteInventario(id);
                         // Eliminar localmente y refrescar filtros
                         setAllInventarios(prev => prev.filter(item => item.id !== id));
                         // applyLocalFilters(); // Se disparará automáticamente por el cambio en allInventarios
                         resolve(true);
                     } catch (e: any) {
                         Alert.alert('Error', e.message || 'No se pudo eliminar el registro.');
                         resolve(false);
                     }
                 }}
             ]);
         });
     }, [/* No depende de allInventarios directamente aquí para evitar re-creación */]);


    // Refrescar lista principal
    const refreshList = useCallback(() => {
        loadAllInventarios();
        loadAlmacenesParaPicker(); // También refrescar almacenes por si acaso
    }, [loadAllInventarios, loadAlmacenesParaPicker]);

    // Handlers para filtros locales
    const handleAlmacenFilterChange = useCallback((id: string) => {
        setSelectedAlmacenId(id);
    }, []);
    const handleSearchFilterChange = useCallback((text: string) => {
        setSearchText(text);
    }, []);
    const toggleLowStockFilter = useCallback(() => {
        setShowOnlyLowStock(prev => !prev);
    }, []);
     const clearFilters = useCallback(() => {
        setSelectedAlmacenId(!isAdmin && user?.almacen_id ? user.almacen_id.toString() : '');
        setShowOnlyLowStock(false);
        setSearchText('');
    }, [isAdmin, user?.almacen_id]);

     // Estadísticas calculadas localmente
    const estadisticas = useMemo(() => {
        const stockBajoCount = filteredInventarios.filter(item => item.cantidad <= item.stock_minimo).length;
        return {
            totalItems: filteredInventarios.length, // O allInventarios.length si quieres el total general
            stockBajo: stockBajoCount,
        };
    }, [filteredInventarios]);


    // Exponer estado y funciones
    return {
        // Para la lista (index)
        inventarios: filteredInventarios, // La lista filtrada para mostrar
        isLoading: isLoadingList || (isAdmin && isLoadingAlmacenes), // Estado de carga combinado
        error: listError, // Error de carga de lista
        almacenes: almacenesParaPicker,
        isAdmin,
        filters: { // Estado actual de los filtros locales
            almacen_id: selectedAlmacenId,
            search: searchText,
            stock_bajo: showOnlyLowStock,
        },
        handleAlmacenFilterChange, // Cambiar filtro almacén
        handleSearchFilterChange, // Cambiar filtro búsqueda
        toggleLowStockFilter, // Cambiar filtro stock bajo
        clearFilters, // Limpiar filtros locales
        refresh: refreshList, // Refrescar la lista completa
        deleteInventario, // Borrar un item
        estadisticas, // Estadísticas basadas en la lista filtrada

        // Para el item (ajustar)
        inventarioActual, // El item que se está ajustando
        isLoadingItem, // Cargando detalles del item
        itemError, // Error al cargar/ajustar item
        isAdjusting, // Estado de submitting del ajuste
        ajusteForm, // Hook del formulario de ajuste
        lotesDisponibles, // Lotes para el picker de entrada
        isLoadingLotes, // Cargando lotes
        adjustStock, // Función para ejecutar el ajuste
        // loadInventarioParaAjuste, // Exponer si es necesario llamarla manualmente
    };
}