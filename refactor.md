# Plan de Refactorización Integral - InvApp

## Resumen Ejecutivo

Este documento presenta un plan de refactorización por fases para resolver problemas de **redundancia de estilos**, **componentes no utilizados**, **patrones inconsistentes en hooks**, y **servicios poco escalables**. El plan está diseñado para mantener la funcionalidad durante todo el proceso.

---

## Análisis de Problemas Identificados

### 1. 🎨 **Estilos - Redundancia Crítica**
- **800+ líneas de código redundante** en estilos
- **2 sistemas de colores duplicados**: `constants/Colors.ts` vs `styles/Theme.ts`
- **Patrones de tarjetas repetidos** en 9+ archivos del directorio `app/`
- **Estilos inline** sin usar el sistema centralizado existente

### 2. 🧩 **Componentes - Duplicación y Componentes No Utilizados**
- **4 componentes completamente no utilizados**
- **4 pares de componentes redundantes** (FloatingActionButton vs FloatingButton, etc.)
- **Estructura bien organizada** en general, pero con duplicaciones específicas

### 3. 🪝 **Hooks - Patrones Inconsistentes**
- **3 patrones diferentes de CRUD** causando confusión
- **useVentaItem.tsx con 439 líneas** - extremadamente complejo
- **Falta de abstracciones genéricas** para operaciones comunes
- **Manejo de errores inconsistente** entre hooks

### 4. 🔧 **Servicios - Escalabilidad Limitada**
- **api.ts monolítico** con todas las operaciones
- **Falta de separación por entidad** para mejor escalabilidad
- **Estructura actual funcional** pero no óptima para crecimiento

---

## Plan de Refactorización por Fases

## 🚀 **FASE 1: Consolidación de Estilos (Semana 1-2)**
**Objetivo**: Eliminar redundancia de estilos y unificar el sistema de temas.

### 1.1 Unificar Sistema de Colores
**Prioridad**: 🔴 CRÍTICA

**Acciones**:
```bash
# Eliminar constants/Colors.ts (duplicado)
rm constants/Colors.ts

# Expandir styles/Theme.ts con colores faltantes
```

**Cambios en Theme.ts**:
```typescript
// Agregar colores faltantes desde constants/Colors.ts
export const Colors = {
  // ... colores existentes
  // Agregar colores theme-aware para light/dark mode
  light: {
    text: '#11181C',
    background: '#fff',
    tint: '#0a7ea4',
    // ... otros colores light
  },
  dark: {
    text: '#ECEDEE', 
    background: '#151718',
    tint: '#fff',
    // ... otros colores dark
  }
};
```

### 1.2 Crear Estilos de Tarjetas Centralizados
**Agregar a Theme.ts**:
```typescript
export const CardStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    ...Shadows.small,
  },
  content: { padding: Spacing.lg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    flex: 1,
  },
  // ... más estilos de tarjeta
});

export const BadgeStyles = StyleSheet.create({
  base: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  success: { backgroundColor: 'rgba(76, 175, 80, 0.2)' },
  warning: { backgroundColor: 'rgba(255, 152, 0, 0.2)' },
  danger: { backgroundColor: 'rgba(244, 67, 54, 0.2)' },
  // ... más variantes
});

export const SummaryStyles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    margin: Spacing.lg,
    gap: Spacing.sm,
  },
  primary: { backgroundColor: 'rgba(10, 126, 164, 0.1)' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // ... más estilos de resumen
});
```

### 1.3 Refactorizar Archivos con Mayor Redundancia
**Orden de prioridad**:
1. `app/ventas/index.tsx` (55 líneas redundantes)
2. `app/productos/index.tsx` (50 líneas redundantes)  
3. `app/clientes/index.tsx` (45 líneas redundantes)
4. `app/pedidos/index.tsx` (45 líneas redundantes)
5. `app/gastos/index.tsx` (40 líneas redundantes)

**Ejemplo de refactorización**:
```typescript
// ANTES (en cada archivo):
const styles = StyleSheet.create({
  cardContent: { padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  // ... 20+ líneas más
});

// DESPUÉS:
import { CardStyles, BadgeStyles } from '@/styles/Theme';
// Usar estilos centralizados directamente
```

**Estimado**: 800+ líneas de código eliminadas

---

## 🧹 **FASE 2: Limpieza de Componentes (Semana 2-3)**
**Objetivo**: Eliminar componentes no utilizados y consolidar duplicados.

### 2.1 Eliminar Componentes No Utilizados
```bash
# Componentes a eliminar
rm components/HelloWave.tsx
rm components/ExternalLink.tsx
rm components/buttons/FloatingButton.tsx
rm components/data/Pagination.tsx
```

### 2.2 Consolidar Componentes Duplicados

#### DateRangeSelector
```bash
# Migrar usos de DateRangeSelector a DateRangeSelectorV2
# Archivos a actualizar:
# - app/reportes/dashboard.tsx
# - app/reportes/ventas.tsx
# - components/dashboard/SalesLineChart.tsx

# Después eliminar el original
rm components/dashboard/DateRangeSelector.tsx
mv components/dashboard/DateRangeSelectorV2.tsx components/dashboard/DateRangeSelector.tsx
```

#### DataTable Consolidation
```typescript
// Mejorar components/data/DataTable.tsx con características de EnhancedDataTable
// Luego eliminar EnhancedDataTable.tsx
```

### 2.3 Archivos a Actualizar
- 3 archivos que usan `DateRangeSelector`
- Verificar imports en toda la aplicación

**Estimado**: 4 componentes eliminados, estructura más limpia

---

## 🛠️ **FASE 3: Refactorización de Hooks (Semana 3-5)**
**Objetivo**: Crear patrones consistentes y reducir complejidad.

### 3.1 Crear Hooks Genéricos Base

#### useListWithFilters (Elimina duplicación en listas)
```typescript
// hooks/core/useListWithFilters.ts
interface UseListWithFiltersOptions<T> {
  fetchFn: (page: number, perPage: number, filters: Record<string, any>) => Promise<{data: T[], pagination: any}>;
  defaultFilters: Record<string, any>;
  defaultSort?: { column: string; order: 'asc' | 'desc' };
}

export function useListWithFilters<T>(options: UseListWithFiltersOptions<T>) {
  // Lógica consolidada de filtrado, ordenación, paginación
  // Reemplaza patrones en useClientesList, useVentasList, useGastosList, etc.
}
```

#### useSimpleCRUD (Para operaciones CRUD básicas)
```typescript
// hooks/core/useSimpleCRUD.ts  
interface UseSimpleCRUDOptions<T> {
  apiService: {
    get: (id: number) => Promise<T>;
    create: (data: Partial<T>) => Promise<T>;
    update: (id: number, data: Partial<T>) => Promise<T>;
    delete: (id: number) => Promise<void>;
  };
  entityName: string;
}

export function useSimpleCRUD<T>(options: UseSimpleCRUDOptions<T>) {
  // Operaciones CRUD estandarizadas
  // Reemplaza useClienteItem, useGastoItem, useLoteItem, etc.
}
```

#### useErrorHandler (Manejo consistente de errores)
```typescript
// hooks/core/useErrorHandler.ts
export function useErrorHandler() {
  const [error, setError] = useState<string | null>(null);
  
  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    const message = err instanceof Error ? err.message : defaultMessage;
    setError(message);
    console.error(message, err);
  }, []);
  
  return { error, setError, handleError };
}
```

### 3.2 Simplificar Hooks Complejos

#### Dividir useVentaItem.tsx (439 líneas → 4 hooks)
```bash
# Crear hooks especializados:
hooks/ventas/useVentaForm.ts     # Manejo de formularios
hooks/ventas/useVentaCRUD.ts     # Operaciones CRUD
hooks/ventas/useVentaOptions.ts  # Carga de clientes, almacenes, presentaciones  
hooks/ventas/useVentaCalculations.ts # Lógica de negocio
```

#### Refactorizar usePedidoItem.ts (495 líneas)
```bash
# Aplicar el mismo patrón de división
hooks/pedidos/usePedidoForm.ts
hooks/pedidos/usePedidoCRUD.ts
hooks/pedidos/usePedidoOptions.ts
```

### 3.3 Eliminar Hooks Obsoletos
```bash
# Eliminar useEntityCRUD.ts (reemplazado por useSimpleCRUD)
rm hooks/crud/useEntityCRUD.ts

# Migrar usos a useApiResource.tsx mejorado
```

### 3.4 Plan de Migración por Hook

| Hook Original | Nuevo Patrón | Complejidad | Tiempo Estimado |
|---------------|--------------|-------------|-----------------|
| useClienteItem | useSimpleCRUD | Baja | 2 horas |
| useGastoItem | useSimpleCRUD | Baja | 2 horas |
| useLoteItem | useSimpleCRUD | Baja | 2 horas |
| useClientesList | useListWithFilters | Media | 4 horas |
| useVentasList | useListWithFilters | Media | 4 horas |
| useVentaItem | División en 4 hooks | Alta | 12 horas |
| usePedidoItem | División en 4 hooks | Alta | 12 horas |

**Estimado**: 40% reducción en duplicación de código, hooks más mantenibles

---

## 📦 **FASE 4: Reorganización de Servicios (Semana 5-6)**
**Objetivo**: Mejorar escalabilidad y mantenimiento de servicios.

### 4.1 Dividir api.ts por Entidad

#### Estructura Propuesta
```
services/
├── core/
│   ├── apiClient.ts          # Configuración base y fetchApi
│   ├── authService.ts        # Renombrar auth.ts
│   └── types.ts              # Interfaces comunes (ApiResponse, Pagination)
├── entities/
│   ├── clienteService.ts     # Operaciones de clientes
│   ├── productoService.ts    # Operaciones de productos
│   ├── ventaService.ts       # Renombrar venta.ts
│   ├── pagoService.ts        # Operaciones de pagos
│   ├── gastoService.ts       # Operaciones de gastos
│   ├── pedidoService.ts      # Operaciones de pedidos
│   ├── inventarioService.ts  # Operaciones de inventario
│   └── reporteService.ts     # Operaciones de reportes
├── index.ts                  # Exportaciones centralizadas
└── appBaseConfig.ts          # Mantener configuración base
```

#### Crear Servicios Base
```typescript
// services/core/apiClient.ts
export const apiClient = {
  get: <T>(endpoint: string, params?: Record<string, any>) => fetchApi<T>(...),
  post: <T>(endpoint: string, data: any) => fetchApi<T>(...),
  put: <T>(endpoint: string, data: any) => fetchApi<T>(...),
  delete: <T>(endpoint: string) => fetchApi<T>(...),
};

// services/core/types.ts
export interface ApiResponse<T> { /* ... */ }
export interface Pagination { /* ... */ }
```

#### Servicios por Entidad
```typescript
// services/entities/clienteService.ts
export const clienteService = {
  getClientes: (page = 1, perPage = 10, filters?: Record<string, any>) => 
    apiClient.get<ApiResponse<Cliente>>(`/clientes`, { page, per_page: perPage, ...filters }),
  
  getCliente: (id: number) => 
    apiClient.get<Cliente>(`/clientes/${id}`),
  
  createCliente: (data: Partial<Cliente>) => 
    apiClient.post<Cliente>('/clientes', data),
  
  updateCliente: (id: number, data: Partial<Cliente>) => 
    apiClient.put<Cliente>(`/clientes/${id}`, data),
  
  deleteCliente: (id: number) => 
    apiClient.delete(`/clientes/${id}`),
};
```

### 4.2 Plan de Migración de Servicios

| Entidad | Líneas en api.ts | Nuevo Archivo | Tiempo Estimado |
|---------|------------------|--------------- |-----------------|
| Clientes | ~50 líneas | clienteService.ts | 2 horas |
| Productos | ~60 líneas | productoService.ts | 2 horas |
| Ventas | Ya existe (venta.ts) | Refactorizar | 1 hora |
| Pagos | ~70 líneas | pagoService.ts | 3 horas |
| Gastos | ~40 líneas | gastoService.ts | 2 horas |
| Pedidos | ~80 líneas | pedidoService.ts | 3 horas |
| Inventario | ~60 líneas | inventarioService.ts | 2 horas |
| Reportes | ~50 líneas | reporteService.ts | 2 horas |

### 4.3 Actualizar Imports
```typescript
// ANTES
import { clienteApi } from '@/services/api';

// DESPUÉS  
import { clienteService } from '@/services/entities/clienteService';
// O usando el índice centralizado
import { clienteService } from '@/services';
```

**Estimado**: api.ts reducido de 1000+ líneas a ~200 líneas, mejor organización

---

## 📋 **FASE 5: Testing y Optimización (Semana 6-7)**
**Objetivo**: Asegurar que los cambios funcionen correctamente.

### 5.1 Testing de Cambios
- ✅ Verificar que todos los estilos se renderizan correctamente
- ✅ Confirmar que componentes consolidados funcionan en todas las vistas
- ✅ Probar hooks refactorizados en operaciones CRUD
- ✅ Validar que servicios divididos mantienen funcionalidad

### 5.2 Optimizaciones Finales
- 🔍 Revisar imports no utilizados
- 📦 Verificar bundle size reduction
- 🚀 Optimizar re-renders en hooks complejos
- 📝 Actualizar documentación

---

## 📊 **Métricas de Éxito**

### Reducción de Código
| Área | Antes | Después | Reducción |
|------|-------|---------|-----------|
| Estilos duplicados | 800+ líneas | 200 líneas | 75% |
| Componentes | 41 archivos | 37 archivos | 10% |
| Hooks complejos | 439 líneas (useVentaItem) | ~150 líneas (dividido) | 65% |
| api.ts monolítico | 1000+ líneas | 200 líneas | 80% |

### Mejoras de Mantenimiento
- ✅ **Sistema de estilos unificado** - Un solo lugar para cambios de tema
- ✅ **Hooks consistentes** - Patrones estandarizados para CRUD
- ✅ **Servicios escalables** - Fácil agregar nuevas entidades
- ✅ **Reducción de duplicación** - Código más DRY

### Métricas de Performance
- 📈 **Bundle size reduction**: Estimado 15-20%
- ⚡ **Faster development**: Menos archivos que modificar para cambios globales
- 🔍 **Better debugging**: Separación clara de responsabilidades

---

## ⚠️ **Consideraciones de Riesgo**

### Riesgos Bajos (Verde)
- **Eliminación de componentes no utilizados**: Sin impacto funcional
- **Consolidación de estilos**: Cambios visuales mínimos
- **División de servicios**: Misma funcionalidad, mejor organización

### Riesgos Medios (Amarillo)  
- **Refactorización de hooks complejos**: Requiere testing exhaustivo
- **Migración de DateRangeSelector**: 3 archivos afectados
- **Cambios en imports**: Múltiples archivos a actualizar

### Mitigaciones
- 🧪 **Testing incremental** en cada fase
- 🔄 **Rollback plan** para cada cambio mayor
- 📝 **Documentar cambios** para el equipo
- 🚀 **Deploy gradual** si es posible

---

## 🎯 **Orden de Ejecución Recomendado**

### Semana 1-2: Estilos (Impacto Inmediato)
1. Unificar sistema de colores (1 día)
2. Crear estilos centralizados (2 días)
3. Refactorizar archivos con mayor redundancia (5 días)

### Semana 2-3: Componentes (Riesgo Bajo)
1. Eliminar componentes no utilizados (1 día)
2. Consolidar componentes duplicados (3 días)
3. Testing de componentes (1 día)

### Semana 3-5: Hooks (Complejidad Alta)
1. Crear hooks genéricos base (5 días)
2. Dividir hooks complejos (7 días)
3. Migrar hooks simples (3 días)

### Semana 5-6: Servicios (Escalabilidad)
1. Crear estructura de servicios (2 días)
2. Migrar entidades por prioridad (6 días)
3. Actualizar imports (2 días)

### Semana 6-7: Testing y Finalización
1. Testing integral (4 días)
2. Optimizaciones finales (2 días)
3. Documentación (1 día)

---

## 🎉 **Resultado Final Esperado**

Al completar esta refactorización:

✅ **Código más limpio**: 40% menos duplicación  
✅ **Mejor mantenimiento**: Cambios centralizados  
✅ **Escalabilidad mejorada**: Fácil agregar nuevas features  
✅ **Desarrollo más rápido**: Patrones consistentes  
✅ **Performance mejorada**: Bundle size optimizado  

La aplicación mantendrá toda su funcionalidad actual mientras gana una arquitectura más sólida y mantenible para el futuro.