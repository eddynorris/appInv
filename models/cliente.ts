// Define el modelo Cliente basado en la respuesta real de la API
export interface Cliente {
    id: number;
    nombre: string;
    telefono: string;
    direccion: string;
    created_at: string;
    saldo_pendiente: string;
  }

  export interface ClienteSimple {
    id: number;
    nombre: string;
  }