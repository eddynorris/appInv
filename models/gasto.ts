// Define el modelo Gasto basado en el esquema de la API
export interface Gasto {
    id: number;
    descripcion: string;
    monto: string; // Decimal como string
    fecha: string; // Fecha como string
    categoria: string;
  }