// --- Añadir Modelo DepositoBancario ---
import { AlmacenSimple } from './almacen';
import { UserSimple } from './user'; // Asegurar que UserSimple esté definida

export interface DepositoBancario {
  id: number;
  fecha_deposito: string; // ISO 8601 Date String
  monto_depositado: string; // La API devuelve Numeric, tratar como string
  almacen_id?: number;
  usuario_id?: number;
  referencia_bancaria?: string;
  url_comprobante_deposito?: string; // Puede ser null
  notas?: string;
  created_at: string;
  updated_at: string;
  almacen?: AlmacenSimple; // Relación opcional
  usuario?: UserSimple; // Relación opcional
}

// Interfaz para Crear/Actualizar Deposito
export interface DepositoPayload {
    fecha_deposito: string; // Formato 'YYYY-MM-DD' o ISO completo si es necesario
    monto_depositado: string;
    almacen_id?: number | null;
    usuario_id?: number | null; // Podría autocompletarse en backend?
    referencia_bancaria?: string;
    notas?: string;
    // Campo opcional para enviar la instrucción de borrar comprobante
    url_comprobante_deposito?: null;
}