/**
 * Funciones de utilidad para formato
 */

/**
 * Formatea un valor monetario
 * @param value - El valor a formatear
 * @param currencySymbol - El símbolo de moneda (por defecto '$')
 * @param decimals - Número de decimales (por defecto 2)
 * @returns Cadena formateada como moneda
 */
export function formatCurrency(
  value: number | string | undefined | null,
  currencySymbol = '$',
  decimals = 2
): string {
  // Manejar valores nulos o indefinidos
  if (value === undefined || value === null) {
    return `${currencySymbol}0.00`;
  }

  // Convertir a número si es string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Validar que sea un número
  if (isNaN(numValue)) {
    return `${currencySymbol}0.00`;
  }

  // Formatear con separador de miles y decimales especificados
  return `${currencySymbol}${numValue.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Formatea una fecha a una cadena legible
 * @param date - La fecha a formatear (Date, string o timestamp)
 * @param includeTime - Si se debe incluir la hora (por defecto false)
 * @returns Cadena formateada de fecha
 */
export function formatDate(
  date: Date | string | number | undefined | null,
  includeTime = false
): string {
  if (!date) return 'Fecha no disponible';

  const dateObj = typeof date === 'object' ? date : new Date(date);

  if (isNaN(dateObj.getTime())) return 'Fecha inválida';

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  };

  return dateObj.toLocaleDateString('es-MX', options);
}

/**
 * Formatea un número con separadores de miles y decimales especificados
 * @param value - El valor a formatear
 * @param decimals - Número de decimales (por defecto 2)
 * @returns Cadena formateada como número
 */
export function formatNumber(
  value: number | string | undefined | null,
  decimals = 2
): string {
  // Manejar valores nulos o indefinidos
  if (value === undefined || value === null) {
    return '0';
  }

  // Convertir a número si es string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  // Validar que sea un número
  if (isNaN(numValue)) {
    return '0';
  }

  // Formatear con separador de miles y decimales especificados
  return numValue.toLocaleString('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Capitaliza la primera letra de un texto
 * @param text - El texto a capitalizar
 * @returns Texto con la primera letra en mayúscula
 */
export function capitalize(text: string | undefined | null): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Trunca un texto a una longitud máxima
 * @param text - El texto a truncar
 * @param maxLength - Longitud máxima (por defecto 100)
 * @param suffix - Sufijo a añadir si se trunca (por defecto '...')
 * @returns Texto truncado
 */
export function truncateText(
  text: string | undefined | null,
  maxLength = 100,
  suffix = '...'
): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}${suffix}`;
} 