// styles/Theme.ts
import { StyleSheet } from 'react-native';

// Paleta de colores centralizada
export const Colors = {
  // Colores primarios
  primary: '#0a7ea4',
  primaryLight: '#88c8d8',
  primaryDark: '#065d7a',
  
  // Colores secundarios
  secondary: '#4CAF50',
  secondaryLight: 'rgba(76, 175, 80, 0.1)',
  secondaryDark: '#2E7D32',
  
  // Estados
  success: '#4CAF50',
  warning: '#FFC107',
  danger: '#F44336',
  info: '#2196F3',
  
  // Estados de pedidos
  programado: '#FFC107',
  confirmado: '#2196F3',
  entregado: '#4CAF50',
  cancelado: '#F44336',
  
  // Estados de pago
  pagado: '#4CAF50',
  pendiente: '#FFC107',
  parcial: '#FF9800',
  
  // Tonos neutros
  white: '#FFFFFF',
  lightGray1: '#F5F5F5',
  lightGray2: '#E1E3E5',
  mediumGray: '#9BA1A6',
  darkGray: '#757575',
  darkGray2: '#424242',
  black: '#000000',
  
  // Fondos especiales
  transparent: 'transparent',
  semiTransparent: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.03)',
  
  // Texto
  textDark: '#222222',
  textMedium: '#666666',
  textLight: '#9BA1A6',
  
  // Fondos
  background: '#FFFFFF',
  backgroundDark: '#2C2C2E',
};

// Espaciado consistente
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Tamaños de fuente
export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Radios de borde
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 999, // Para círculos perfectos
};

// Sombras
export const Shadows = {
  small: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  large: {
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
};

// Estilos de formulario
export const FormStyles = StyleSheet.create({
  container: {
    gap: Spacing.lg,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  halfWidth: {
    flex: 1,
  },
  formGroup: {
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.lightGray2,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: FontSizes.md,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.lightGray2,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  disabledContainer: {
    opacity: 0.7,
    backgroundColor: Colors.lightGray1,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    color: Colors.danger,
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  infoText: {
    color: Colors.primary,
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
});

// Estilos de tarjetas de productos
export const ProductCardStyles = StyleSheet.create({
  productoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: '48%',
    minHeight: 220,
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.lightGray2,
    justifyContent: 'space-between',
    ...Shadows.small
  },
  productoHeader: {
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray2,
  },
  productoNombre: {
    fontSize: FontSizes.md,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  productoDescripcion: {
    fontSize: FontSizes.xs,
    color: Colors.textMedium,
    textAlign: 'center',
    marginTop: Spacing.xs/2,
  },
  productoImageContainer: {
    width: '100%',
    height: 80,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
    backgroundColor: Colors.lightGray1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productoImage: {
    width: '100%',
    height: '100%',
  },
  productoImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightGray1,
  },
  productoControles: {
    gap: Spacing.sm,
  },
  precioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  precioLabel: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
  },
  precioInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray2,
    borderRadius: BorderRadius.sm,
    padding: Spacing.xs,
    width: 70,
    textAlign: 'center',
    backgroundColor: Colors.white,
    fontSize: FontSizes.sm,
  },
  cantidadContainer: {
    marginTop: Spacing.xs,
  },
  cantidadLabel: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  cantidadControles: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  cantidadButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cantidadButtonText: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  cantidadButtonDisabled: {
    opacity: 0.5,
  },
  cantidadInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray2,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    width: 40,
    textAlign: 'center',
    backgroundColor: Colors.white,
    fontSize: FontSizes.sm,
    marginHorizontal: Spacing.xs,
  },
  removeProductButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(229, 57, 53, 0.8)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  removeProductButtonText: {
    color: Colors.white,
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    marginTop: -2,
  },
  addProductCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    width: '48%',
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    borderStyle: 'dashed',
  },
  addProductText: {
    fontSize: 40,
    color: Colors.secondary,
    marginBottom: Spacing.sm,
  },
  addProductLabel: {
    color: Colors.secondary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Estilos para modo de solo lectura
  readOnlyContainer: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  readOnlyLabel: {
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
  },
  readOnlyValue: {
    fontSize: FontSizes.xs,
  },
  readOnlyTotal: {
    fontSize: FontSizes.sm,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});

// Estilos para modales
export const ModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.semiTransparent,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.large
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray2,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.lightGray1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  flatList: {
    width: '100%',
    height: '90%',
  },
  productItem: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray2,
    alignItems: 'center',
  },
  productItemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
    backgroundColor: Colors.lightGray1,
    marginRight: Spacing.md,
  },
  productItemImage: {
    width: '100%',
    height: '100%',
  },
  productItemImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightGray1,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  productInfo: {
    fontSize: FontSizes.sm,
    color: Colors.darkGray,
    marginBottom: Spacing.xs,
  },
  productPrice: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  productAction: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.lg,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
  },
  emptyListContainer: {
    padding: Spacing.xxxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListText: {
    fontSize: FontSizes.md,
    color: Colors.darkGray,
    textAlign: 'center',
  },
});

// Estilos para botones
export const ButtonStyles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  button: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.secondary,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  cancel: {
    backgroundColor: Colors.lightGray1,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: Colors.darkGray2,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: Spacing.sm,
  },
});

// Estilos para secciones
export const SectionStyles = StyleSheet.create({
  container: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: FontSizes.md,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  content: {
    marginBottom: Spacing.lg,
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: Colors.lightGray2,
    paddingTop: Spacing.lg,
    marginTop: Spacing.lg,
  },
  totalLabel: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});

// Estilos comunes para pantallas
export const ScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  loadingText: {
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  heading: {
    marginBottom: Spacing.xl,
  },
  infoBox: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xl,
  },
  infoText: {
    fontSize: FontSizes.sm,
  },
  alertContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: BorderRadius.sm,
    gap: Spacing.md,
  },
  alertText: {
    textAlign: 'center',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  errorText: {
    marginTop: Spacing.lg,
    textAlign: 'center',
    color: Colors.danger,
  },
});

// Exportar todos los estilos
export default {
  Colors,
  Spacing,
  FontSizes,
  BorderRadius,
  Shadows,
  FormStyles,
  ProductCardStyles,
  ModalStyles,
  ButtonStyles,
  SectionStyles,
  ScreenStyles
};