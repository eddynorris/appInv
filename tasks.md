# Tareas de Refactorización

Este archivo documenta los pasos para refactorizar los módulos de `pedidos`, `presentaciones`, `productos` y `ventas` siguiendo el patrón de los módulos ya refactorizados (como `pagos`).

## 1. Refactorizar Módulo `pedidos`

- [ ] **Crear `hooks/crud/usePedidosList.tsx`**:
    - Implementar usando `useApiResource`.
    - Migrar lógica de obtención de lista, paginación, filtros y ordenamiento desde `hooks/crud/usePedidos.tsx`.
    - Definir `columns` para `EnhancedDataTable`.
    - Incluir manejo de permisos (ej. filtrar por `vendedor_id` para no admins).
- [ ] **Crear `hooks/crud/usePedidoItem.ts`**:
    - Implementar lógica para `getPedido`, `createPedido`, `updatePedido`, `deletePedido` usando `pedidoApi`.
    - Migrar la lógica del formulario (`useForm`), validaciones (`validationRules`), manejo de detalles del pedido y carga de opciones (clientes, presentaciones si aplica) desde `hooks/crud/usePedidos.tsx`.
    - Separar la carga de opciones (clientes, presentaciones) para que no se ejecute innecesariamente en cada render o carga de item. Considerar un hook dedicado o un contexto si las opciones son globales.
- [ ] **Actualizar Pantallas `app/pedidos/`**:
    - Modificar `app/pedidos/index.tsx` para usar `usePedidosList`.
    - Modificar `app/pedidos/create.tsx` para usar `usePedidoItem`.
    - Modificar `app/pedidos/[id].tsx` (pantalla de detalle) para usar `usePedidoItem` para obtener datos.
    - Modificar (o crear si no existe) `app/pedidos/edit/[id].tsx` para usar `usePedidoItem` para cargar datos y actualizar.
- [ ] **Limpieza `pedidos`**:
    - Eliminar el hook antiguo `hooks/crud/usePedidos.tsx`.
    - Eliminar el hook antiguo `hooks/usePedido.ts` (si existe y ya no es necesario).

## 2. Refactorizar Módulo `presentaciones`

- [ ] **Crear `hooks/crud/usePresentacionItem.ts`**:
    - Implementar lógica para `getPresentacion`, `createPresentacion`, `updatePresentacion` usando `presentacionApi`.
    - Mover la lógica del formulario (`formData`, `handleChange`, `validate`), carga de productos (`loadProductos`), manejo de imágenes (siguiendo patrón de `usePagoItem`) y llamadas API de creación/actualización desde `hooks/crud/usePresentaciones.tsx`.
- [ ] **Refactorizar y Renombrar `hooks/crud/usePresentaciones.tsx`**:
    - Renombrar a `hooks/crud/usePresentacionesList.tsx`.
    - Asegurar que solo contenga la lógica de la lista (usando `useApiResource`), definición de `columns` y funciones relacionadas (`refresh`, `deleteItem` wrapper si es necesario).
    - Eliminar la lógica del formulario y manejo de item individual.
- [ ] **Actualizar Pantallas `app/presentaciones/`**:
    - Modificar `app/presentaciones/index.tsx` para usar `usePresentacionesList`.
    - Modificar `app/presentaciones/create.tsx` para usar `usePresentacionItem`.
    - Modificar `app/presentaciones/[id].tsx` (detalle) para usar `usePresentacionItem`.
    - Modificar (o crear) `app/presentaciones/edit/[id].tsx` para usar `usePresentacionItem`.

## 3. Refactorizar Módulo `productos`

- [ ] **Evaluar Necesidad de CRUD `Producto`**:
    - Determinar si se requiere una gestión CRUD completa para la entidad `Producto` separada de `Presentacion`.
- [ ] **Si se requiere CRUD `Producto`**:
    - [ ] Crear `hooks/crud/useProductosList.tsx` (con `useApiResource`, `productoApi`).
    - [ ] Crear `hooks/crud/useProductoItem.ts` (con `productoApi`).
    - [ ] Crear/Actualizar pantallas en `app/productos/`.
- [ ] **Revisar `hooks/crud/useProductos.ts` (Actual)**:
    - Decidir si su lógica de filtrado de presentaciones por inventario/stock se integra en `usePresentacionItem` / `useVentaItem` / `usePedidoItem` o se mantiene como un hook de utilidad (`usePresentacionesDisponibles`).
    - Renombrar o eliminar según la decisión.

## 4. Refactorizar Módulo `ventas`

- [ ] **Crear `hooks/crud/useVentasList.tsx`**:
    - Implementar usando `useApiResource`.
    - Migrar lógica de lista, paginación, filtros, ordenamiento y `columns` desde `hooks/crud/useVentas.tsx`.
    - Incluir manejo de permisos (filtrar por `vendedor_id`).
- [ ] **Crear `hooks/crud/useVentaItem.ts`**:
    - Implementar lógica para `getVenta`, `createVenta`, `updateVenta`, `deleteVenta` usando `ventaApi`.
    - Mover lógica del formulario (`useForm`), validaciones, manejo de detalles (`DetalleVentaForm`), carga optimizada de opciones (clientes, almacenes), selección de presentaciones disponibles (usando el hook de productos refactorizado/utilidad), cálculos y llamadas API de C/U desde `hooks/crud/useVentas.tsx`.
    - Separar la carga de opciones.
- [ ] **Actualizar Pantallas `app/ventas/`**:
    - Modificar `app/ventas/index.tsx` para usar `useVentasList`.
    - Modificar `app/ventas/create.tsx` para usar `useVentaItem`.
    - Modificar `app/ventas/[id].tsx` (detalle) para usar `useVentaItem`.
    - Modificar (o crear) `app/ventas/edit/[id].tsx` para usar `useVentaItem`.
- [ ] **Limpieza `ventas`**:
    - Eliminar el hook antiguo `hooks/crud/useVentas.tsx`.

## 5. Revisión General y Limpieza Final

- [ ] Revisar `services/api.ts`: Asegurar consistencia y funciones necesarias.
- [ ] Eliminar Hooks Antiguos/Duplicados: `usePedido.ts`, `useProductos.ts` (original), etc.
- [ ] Verificar Componentes Reutilizables: `EnhancedDataTable`, `*Form`, etc.
- [ ] Consistencia Estado: `isLoading`, `error` en todos los módulos.
- [ ] Probar Flujos Completos: Crear, ver, editar, eliminar para cada módulo refactorizado.
