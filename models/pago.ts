// models/pago.ts
import { VentaSimple } from './venta';

export interface Pago {
    id: number;
    venta_id: number;
    monto: string;
    fecha: string;
    metodo_pago: 'efectivo' | 'transferencia' | 'deposito' | 'tarjeta'| 'yape_plin'| 'otro';
    referencia?: string;
    url_comprobante?: string;
    usuario_id?: number;
    venta?: VentaSimple;
  }
  