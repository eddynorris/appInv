const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => isDevelopment && console.log(...args),
  error: (...args: any[]) => console.error(...args),
  warn: (...args: any[]) => console.warn(...args),
};