// services/index.ts - Centralized service exports

// Core services
export { apiClient, fetchApi, API_CONFIG } from './core/apiClient';
export { authService } from './core/authService';
export type { ApiResponse, Pagination, HttpError, ApiConfig } from './core/types';

// Entity services
export { clienteService } from './entities/clienteService';
export { productoService } from './entities/productoService';
export { gastoService } from './entities/gastoService';
export { pedidoService } from './entities/pedidoService';
export type { NormalizedPedidoFormData } from './entities/pedidoService';
export { almacenService } from './entities/almacenService';
export { pagoService } from './entities/pagoService';
export { presentacionService } from './entities/presentacionService';
export { ventaApi } from './entities/ventaService'; // Keep original name for now
export type { VentaFormData } from './entities/ventaService';

// Legacy exports for backward compatibility (will be updated in phase 4.4)
export { clienteService as clienteApi } from './entities/clienteService';
export { productoService as productoApi } from './entities/productoService';
export { gastoService as gastoApi } from './entities/gastoService';
export { pedidoService as pedidoApi } from './entities/pedidoService';
export { almacenService as almacenApi } from './entities/almacenService';
export { pagoService as pagoApi } from './entities/pagoService';
export { presentacionService as presentacionApi } from './entities/presentacionService';

// Services not yet migrated - exported from legacy api.ts
export { loteApi, usuarioApi, inventarioApi, movimientoApi, dashboardApi } from './api';