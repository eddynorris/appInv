// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, TextStyle, ViewStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'person.fill': 'person',
  'cart.fill': 'shopping-cart',
  'bag.fill': 'shopping-bag',
  'folder.fill': 'folder',
  'doc.fill': 'description',
  'creditcard.fill': 'credit-card',
  'mail.fill': 'email',
  'phone.fill': 'phone',
  'location.fill': 'location-on',
  'calendar.fill': 'calendar-today',
  'calendar': 'calendar-today',  // Versión sin fill para compatibilidad
  'chart.bar.fill': 'bar-chart',
  'star.fill': 'star',
  'heart.fill': 'favorite',
  'trash.fill': 'delete',
  'pencil.fill': 'edit',
  'plus.circle.fill': 'add-circle',
  'minus.circle.fill': 'remove-circle',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  'info.circle.fill': 'info',
  'exclamationmark.circle.fill': 'warning',
  'arrow.up.fill': 'arrow-upward',
  'arrow.down.fill': 'arrow-downward',
  'arrow.left.fill': 'arrow-back',
  'arrow.right.fill': 'arrow-forward',
  'bell.fill': 'notifications',
  'gear.fill': 'settings',
  'tag.fill': 'local-offer',
  'magnifyingglass': 'search',
  'plus': 'add',
  'minus': 'remove',
  'checkmark': 'check',
  'xmark': 'close',
  'scalemass.fill': 'balance', // Para lotes
  'cube.box.fill': 'inventory',
  'banknote.fill': 'payments', // Gastos (nuevo)
  'arrow.up.to.line': 'upload', // Depósitos 
  'person.2.fill': 'group', // Usuarios (nuevo)
  'truck.box.badge.clock.fill' : 'schedule', // Horarios (nuevo)
  'chart.line.uptrend.xyaxis': 'timeline', // Ventas (nuevo)
  'arrow.left.arrow.right.circle.fill': 'refresh', // Actualizar
  'archivebox.fill': 'archive',
  'rectangle.portrait.and.arrow.right': 'forward',
  'map.fill': 'map',
  'dollarsign.circle.fill': 'attach-money',
  'photo.on.rectangle': 'photo',
  'camera.fill': 'camera',
  'cube.box': 'inventory-2',
  'exclamationmark.triangle': 'error',
  'arrow.right.circle': 'refresh',
  "person.3.fill": 'person-3',
} as Partial<
  Record<
    import('expo-symbols').SymbolViewProps['name'],
    React.ComponentProps<typeof MaterialIcons>['name']
  >
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: any; // Usamos any temporalmente para evitar conflictos de tipos
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}