# InvApp - Sistema de Gestión de Inventario

## Descripción General

**InvApp** es una aplicación móvil desarrollada con React Native y Expo para la gestión integral de inventarios. El sistema permite administrar productos, clientes, proveedores, almacenes, ventas, pagos, lotes y generar reportes completos. Está diseñada para funcionar en dispositivos Android e iOS, con soporte para web.

## Estructura del Proyecto

```
invApp/
├── app/                    # Rutas de la aplicación (Expo Router)
│   ├── (auth)/            # Grupo de autenticación
│   │   ├── login.tsx      # Pantalla de inicio de sesión
│   │   └── register.tsx   # Pantalla de registro
│   ├── (tabs)/            # Grupo de pestañas principales
│   │   ├── index.tsx      # Pantalla principal/dashboard
│   │   └── more.tsx       # Pantalla de "más opciones"
│   ├── almacenes/         # Gestión de almacenes
│   ├── clientes/          # Gestión de clientes
│   ├── gastos/            # Gestión de gastos
│   ├── inventarios/       # Gestión de inventarios
│   ├── lotes/             # Gestión de lotes
│   ├── movimientos/       # Historial de movimientos
│   ├── pagos/             # Gestión de pagos
│   ├── pedidos/           # Gestión de pedidos
│   ├── presentaciones/    # Presentaciones de productos
│   ├── productos/         # Gestión de productos
│   ├── proveedores/       # Gestión de proveedores
│   ├── reportes/          # Reportes y dashboard
│   ├── usuarios/          # Gestión de usuarios
│   └── ventas/            # Gestión de ventas
├── models/                # Modelos de datos TypeScript
├── services/              # Servicios y APIs
├── hooks/                 # Hooks personalizados
├── components/            # Componentes reutilizables
├── assets/                # Recursos (imágenes, fuentes)
└── constants/             # Constantes globales
```

## Tecnologías Utilizadas

### Framework Principal
- **React Native**: 0.79.2
- **Expo**: 53.0.9
- **Expo Router**: 5.0.7 (enrutamiento basado en archivos)

### Navegación y UI
- **React Navigation**: 7.0.14
- **Expo Vector Icons**: 14.1.0
- **React Native Chart Kit**: 6.12.0 (gráficos)
- **React Native SVG**: 15.11.2

### Gestión de Estado y Persistencia
- **AsyncStorage**: 2.1.2 (almacenamiento local)
- **Expo SecureStore**: 14.2.3 (almacenamiento seguro)
- **JWT Decode**: 4.0.0 (manejo de tokens)

### Funcionalidades Adicionales
- **Expo Image Picker**: 16.1.4 (selección de imágenes)
- **Expo Document Picker**: 13.1.5 (selección de documentos)
- **DateTimePicker**: 8.3.0 (selección de fechas)
- **Dayjs**: 1.11.13 (manejo de fechas)

### Desarrollo y Testing
- **TypeScript**: 5.3.3
- **Jest**: 29.2.1
- **React Test Renderer**: 18.3.1

## Arquitectura de la Aplicación

### Modelos de Datos
La aplicación maneja las siguientes entidades principales:

- **Productos**: Información básica de productos
- **Presentaciones**: Diferentes presentaciones de productos (tamaños, unidades)
- **Almacenes**: Ubicaciones de almacenamiento
- **Inventarios**: Stock disponible por presentación/almacén
- **Lotes**: Seguimiento de lotes de productos
- **Clientes**: Información de clientes
- **Proveedores**: Información de proveedores
- **Ventas**: Transacciones de venta
- **Pagos**: Pagos asociados a ventas
- **Pedidos**: Órdenes de compra/venta
- **Movimientos**: Historial de movimientos de inventario
- **Gastos**: Registro de gastos
- **Usuarios**: Gestión de usuarios del sistema

### Servicios API
La aplicación se conecta a una API REST con los siguientes servicios:

- **Autenticación**: Login/registro con JWT
- **CRUD Completo**: Para todas las entidades
- **Paginación**: Soporte para listados paginados
- **Filtros**: Búsqueda y filtrado de datos
- **Reportes**: Generación de reportes y dashboard
- **Carga de Archivos**: Soporte para imágenes y documentos

### Hooks Personalizados
- **useApiResource**: Hook genérico para operaciones CRUD
- **useEntityCRUD**: Hook específico para entidades
- **useDashboardData**: Hook para datos del dashboard
- **useImageUploader**: Hook para carga de imágenes
- **useForm**: Hook para manejo de formularios

### Componentes Reutilizables
- **DataTable**: Tabla de datos con paginación
- **FormField**: Campos de formulario estándar
- **ImageUploader**: Componente para cargar imágenes
- **DateField**: Selector de fechas
- **ProductSelector**: Selector de productos
- **PaginationControls**: Controles de paginación

## Funcionalidades Principales

### 1. Gestión de Inventario
- Control de stock por almacén y presentación
- Alertas de stock bajo
- Seguimiento de lotes
- Movimientos de inventario

### 2. Gestión de Ventas
- Creación de ventas con múltiples productos
- Gestión de pagos (contado/crédito)
- Conversión de pedidos a ventas
- Historial de ventas por cliente

### 3. Gestión de Pagos
- Pagos individuales y por lotes
- Soporte para comprobantes (imágenes/PDF)
- Diferentes métodos de pago
- Seguimiento de saldos pendientes

### 4. Reportes y Dashboard
- Dashboard con métricas clave
- Gráficos de ventas
- Reportes de inventario
- Proyecciones de ventas

### 5. Gestión de Usuarios
- Roles diferenciados (admin/vendedor)
- Asignación de almacenes a usuarios
- Control de acceso basado en roles

## Configuración y Deployment

### Variables de Entorno
```
EXPO_PUBLIC_API_URL=https://tu-api-url.com
```

### Expo Configuration
- **Slug**: invApp
- **Version**: 1.2.1
- **Package**: com.yordev.invApp
- **EAS Project ID**: be67618e-9c1d-4fee-a0fa-c604b075eac6

### Plataformas Soportadas
- **Android**: APK con versionCode 9
- **iOS**: Soporte para tablets
- **Web**: Salida estática con Metro bundler

## Mejoras Recomendadas

### 1. BÚSQUEDA Y FILTROS (Prioridad Crítica) 🔍
- [ ] **Implementar buscador unificado en todas las listas** (clientes, gastos, pagos, ventas, pedidos)
- [ ] **Añadir SearchComponent reutilizable** con debounce y filtros avanzados
- [ ] **Mejorar filtros existentes en clientes** (ampliar más allá de ciudad)
- [ ] **Implementar búsqueda por texto** en gastos (descripción, categoría)
- [ ] **Añadir filtros en pagos** (método de pago, fecha, monto)
- [ ] **Mejorar búsqueda en ventas** (cliente, producto, vendedor)
- [ ] **Implementar filtros en pedidos** (estado, cliente, fecha entrega)
- [ ] **Añadir filtros rápidos** (botones predefinidos)

#### Especificaciones Técnicas para Búsqueda

**Componentes a Crear:**
```typescript
// components/search/SearchField.tsx - Campo de búsqueda reutilizable con debounce
// components/search/FilterChips.tsx - Chips de filtros rápidos
// components/search/SearchResults.tsx - Componente de resultados unificado
// hooks/search/useSearch.tsx - Hook para lógica de búsqueda
// hooks/search/useDebounce.tsx - Hook para debounce
// models/search.ts - Tipos TypeScript para búsqueda
// services/search.ts - Servicio API para búsqueda global
```

**APIs a Utilizar (ya disponibles según API_OVERVIEW.md):**
- GET /clientes?search=texto&page=1&per_page=10
- GET /gastos?search=texto&categoria=logistica
- GET /pagos?search=texto&metodo_pago=efectivo
- GET /ventas?search=texto&estado_pago=pendiente&fecha_inicio=2023-01-01
- GET /pedidos?search=texto&estado=programado

**Implementación Prioritaria:**
1. **SearchField component** con debounce de 300ms
2. **Actualizar EnhancedCardList** para incluir SearchField
3. **Hooks de búsqueda** específicos para cada entidad
4. **Filtros rápidos** como chips (Estado: Todos, Pagado, Pendiente)
5. **Persistir búsquedas** en AsyncStorage

**Estado Actual de Búsqueda por Módulo:**
- ✅ **Clientes**: Filtro básico por ciudad implementado
- ❌ **Gastos**: Sin búsqueda, solo resumen estadístico
- ❌ **Pagos**: Sin búsqueda, solo filtro de usuario
- ⚠️ **Ventas**: Filtros por fecha y estado, falta búsqueda por texto
- ⚠️ **Pedidos**: Filtros por fecha, falta búsqueda por texto

**Arquitectura Propuesta:**
```typescript
interface SearchConfig {
  searchFields: string[];           // Campos donde buscar
  quickFilters: QuickFilter[];      // Filtros rápidos
  defaultSort: SortConfig;          // Ordenación por defecto
  persistSearch: boolean;           // Guardar búsquedas
}

interface QuickFilter {
  label: string;
  field: string;
  value: any;
  icon?: string;
}
```

### 2. Dashboard y UX Móvil (Prioridad Alta)
- [ ] **Rediseñar dashboard mobile-first** con widgets interactivos
- [ ] **Implementar alertas push** para stock bajo y pagos pendientes
- [ ] **Añadir shortcuts** para acciones frecuentes (nueva venta, nuevo cliente)
- [ ] **Crear vista de inventario crítico** con alertas visuales
- [ ] **Crear widget de ventas del día** con progreso visual

### 3. Arquitectura y Estado (Prioridad Alta)
- [ ] **Migrar a React Query/TanStack Query** para cache y sincronización
- [ ] **Implementar Context API** para estado global más robusto
- [ ] **Añadir Zustand/Redux Toolkit** para estado complejo
- [ ] **Implementar optimistic updates** para mejor UX
- [ ] **Añadir interceptores HTTP** para manejo centralizado de errores
- [ ] **Implementar patrón Repository** para abstracción de datos
- [ ] **Mejorar tipado TypeScript** eliminando tipos `any`
- [ ] **Añadir validación con Zod** para formularios y API responses

### 4. Performance Móvil (Prioridad Alta)
- [ ] **Implementar lazy loading** para rutas y componentes pesados
- [ ] **Añadir virtualización** para listas grandes con FlashList
- [ ] **Optimizar renderizado** con React.memo y useMemo
- [ ] **Implementar skeleton screens** para mejor UX de carga
- [ ] **Añadir compression** de requests/responses
- [ ] **Optimizar imágenes** con diferentes resoluciones y WebP
- [ ] **Implementar caching inteligente** con AsyncStorage
- [ ] **Añadir code splitting** por rutas principales

### 5. Funcionalidades Móviles Específicas
- [ ] **Implementar notificaciones push** para alertas críticas
- [ ] **Añadir geolocalización** para tracking de entregas
- [ ] **Crear modo offline robusto** con queue de peticiones
- [ ] **Implementar cámara integrada** para documentos y productos
- [ ] **Añadir sharing nativo** para reportes y datos
- [ ] **Implementar biometría** para autenticación rápida
- [ ] **Crear widgets nativos** para iOS/Android
- [ ] **Añadir deep linking** para navegación externa

### 6. Experiencia de Usuario Móvil
- [ ] **Implementar modo oscuro completo** con persistencia
- [ ] **Añadir animaciones fluidas** con Reanimated 3
- [ ] **Mejorar accesibilidad** (screen readers, navegación por teclado)
- [ ] **Implementar haptic feedback** para acciones importantes
- [ ] **Añadir soporte para tablets** con layout adaptativo
- [ ] **Crear onboarding interactivo** para nuevos usuarios
- [ ] **Implementar temas personalizables** por usuario
- [ ] **Añadir shortcuts de teclado** para power users

### 7. Modelos y Datos
- [ ] **Añadir modelos de dashboard** (DashboardStats, AlertConfig)
- [ ] **Crear modelo de notificaciones** (Notification, AlertRule)
- [ ] **Implementar modelo de sincronización** (SyncQueue, ConflictResolution)
- [ ] **Añadir modelo de preferencias** (UserPreferences, AppSettings)
- [ ] **Crear modelo de métricas** (DailyMetrics, WeeklyReport)
- [ ] **Implementar modelo de audit trail** (AuditLog, UserActivity)
- [ ] **Añadir modelo de backup** (BackupConfig, DataExport)

### 8. Seguridad y Privacidad
- [ ] **Implementar refresh tokens** automáticos
- [ ] **Añadir encriptación** de datos sensibles con Expo SecureStore
- [ ] **Implementar 2FA** con TOTP
- [ ] **Añadir rate limiting** en cliente
- [ ] **Implementar certificate pinning** para API
- [ ] **Añadir logs de seguridad** con anonimización
- [ ] **Implementar RBAC granular** con permisos por feature
- [ ] **Añadir validación de integridad** de datos críticos

### 9. Testing y Calidad
- [ ] **Aumentar cobertura de tests** unitarios (objetivo: 80%)
- [ ] **Implementar tests de integración** con MSW
- [ ] **Añadir tests E2E** con Detox para flujos críticos
- [ ] **Implementar visual regression testing** con Storybook
- [ ] **Añadir performance testing** con Flipper
- [ ] **Configurar CI/CD** con GitHub Actions
- [ ] **Implementar monitoreo** de errores con Sentry
- [ ] **Añadir analytics** de uso con eventos personalizados

### 10. DevOps y Deployment
- [ ] **Configurar EAS Build** para builds automatizados
- [ ] **Implementar OTA updates** con Expo Updates
- [ ] **Añadir environment staging** con datos de prueba
- [ ] **Configurar monitoreo** de performance de la app
- [ ] **Implementar feature flags** para releases graduales
- [ ] **Añadir crash reporting** detallado
- [ ] **Configurar alertas** para métricas críticas
- [ ] **Implementar rollback** automático en caso de errores

### 11. Integraciones y APIs
- [ ] **Implementar versionado de API** client-side
- [ ] **Añadir GraphQL** para queries complejas
- [ ] **Implementar webhooks** para notificaciones en tiempo real
- [ ] **Añadir integración con servicios de pago** (Stripe, PayPal)
- [ ] **Implementar exportación** a servicios de contabilidad
- [ ] **Añadir integración con servicios de mensajería** (WhatsApp Business)
- [ ] **Implementar backup automático** en la nube
- [ ] **Añadir integración con proveedores** de logística

## Comandos Útiles

```bash
# Desarrollo
npm start                    # Iniciar servidor de desarrollo
npm run android             # Ejecutar en Android
npm run ios                 # Ejecutar en iOS
npm run web                 # Ejecutar en navegador

# Testing
npm test                    # Ejecutar tests
npm run lint                # Linter

# Utilidades
npm run reset-project       # Resetear proyecto
```

## Contacto y Soporte

Para reportar problemas o sugerencias, contactar al equipo de desarrollo.

---

*Última actualización: Enero 2025*