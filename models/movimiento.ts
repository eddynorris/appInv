// Define el modelo Movimiento basado en el esquema de la API
import { ProductoSimple } from './producto';
import { AlmacenSimple } from './almacen';
import { ProveedorSimple } from './proveedor';
import { VentaSimple } from './venta';

export interface Movimiento {
  id: number;
  producto_id: number;
  almacen_id: number;
  venta_id?: number;
  proveedor_id?: number;
  cantidad: string; // Decimal como string
  tipo: 'entrada' | 'salida';
  fecha: string;
  
  // Relaciones anidadas
  producto: ProductoSimple;
  almacen: AlmacenSimple;
  venta?: VentaSimple;
  proveedor?: ProveedorSimple;
}