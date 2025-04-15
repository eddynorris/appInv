// utils/calculations.ts
// Funciones de cálculo reutilizables en la aplicación

/**
 * Calcula el rendimiento como porcentaje entre dos valores
 * @param pesoHumedo El peso húmedo (denominador)
 * @param pesoSeco El peso seco (numerador)
 * @returns Porcentaje formateado como string con 2 decimales
 */
export const calcularRendimiento = (pesoHumedo?: number | string, pesoSeco?: number | string): string => {
    // Convertir valores si son string
    const pH = typeof pesoHumedo === 'string' ? parseFloat(pesoHumedo.replace(',', '.')) : pesoHumedo;
    const pS = typeof pesoSeco === 'string' ? parseFloat(pesoSeco.replace(',', '.')) : pesoSeco;
    
    // Validar que ambos valores sean números positivos
    if (pS == null || pH == null || isNaN(pS) || isNaN(pH) || pS <= 0 || pH <= 0) {
      return '-';
    }
    
    // Calcular rendimiento como porcentaje
    const rendimiento = (pS / pH) * 100;
    return `${rendimiento.toFixed(2)}%`;
  };
  
  /**
   * Parsea un string a número, manejando formatos con coma o punto decimal
   * @param valor String a convertir
   * @param valorPorDefecto Valor a devolver si la conversión falla
   * @returns El número parseado o el valor por defecto
   */
  export const parseNumero = (valor?: string | number, valorPorDefecto: number | null = null): number | null => {
    if (valor === undefined || valor === null || valor === '') {
      return valorPorDefecto;
    }
    
    if (typeof valor === 'number') {
      return isNaN(valor) ? valorPorDefecto : valor;
    }
    
    try {
      const numeroParseado = parseFloat(valor.toString().replace(',', '.'));
      return isNaN(numeroParseado) ? valorPorDefecto : numeroParseado;
    } catch {
      return valorPorDefecto;
    }
  };
  
  /**
   * Formatea un número con separador decimal específico y número de decimales
   * @param valor Número a formatear
   * @param decimales Número de decimales (por defecto 2)
   * @param separadorDecimal Separador decimal (por defecto '.')
   * @returns String formateado o '-' si el valor no es válido
   */
  export const formatearNumero = (
    valor?: number | string | null,
    decimales: number = 2,
    separadorDecimal: string = '.'
  ): string => {
    const numero = parseNumero(valor);
    
    if (numero === null) {
      return '-';
    }
    
    return numero.toFixed(decimales).replace('.', separadorDecimal);
  };