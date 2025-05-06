import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
// Asegúrate de que los tipos Lote e Inventario estén correctamente importados o definidos
import { Lote, Inventario } from '@/models'; 
import { formatNumber } from '@/utils/formatters';
import { router } from 'expo-router';


interface NotificationsBarProps {
  // Aseguramos que siempre sean arrays, usando || [] si vienen undefined
  lotesBajos?: Lote[]; 
  inventarioBajo?: Inventario[];
}

export function NotificationsBar({ lotesBajos = [], inventarioBajo = [] }: NotificationsBarProps) {
  const [showLotesDropdown, setShowLotesDropdown] = useState(false);
  const [showInventarioDropdown, setShowInventarioDropdown] = useState(false);
  
  // Ahora es seguro acceder a .length porque garantizamos que son arrays
  const hasLotesAlert = lotesBajos.length > 0;
  const hasInventarioAlert = inventarioBajo.length > 0;
  
  // Limitar la cantidad de elementos mostrados
  const maxItemsToShow = 5;
  // Usamos slice en arrays garantizados
  const lotesToShow = lotesBajos.slice(0, maxItemsToShow);
  const inventarioToShow = inventarioBajo.slice(0, maxItemsToShow);
  
  return (
    <View style={styles.container}>
      {/* Icono de Lotes */}
      <View>
        <TouchableOpacity 
          style={styles.iconContainer}
          onPress={() => {
            setShowLotesDropdown(!showLotesDropdown);
            setShowInventarioDropdown(false);
          }}
        >
          <IconSymbol name="scalemass.fill" size={24} color="#0a7ea4" />
          {hasLotesAlert && (
            <View style={styles.badge}>
              {/* Acceso seguro a .length */}
              <ThemedText style={styles.badgeText}>{lotesBajos.length}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Dropdown para Lotes */}
        {showLotesDropdown && (
          <ThemedView style={styles.dropdown}>
            <ThemedText style={styles.dropdownTitle}>Lotes con bajo stock</ThemedText>
            
            {/* Acceso seguro a .length */}
            {lotesBajos.length > 0 ? (
              <ScrollView style={{ maxHeight: 200 }}>
                {lotesToShow.map(item => (
                  <TouchableOpacity 
                    // Asegúrate que item.id existe y es único
                    key={item.id?.toString() ?? Math.random().toString()} 
                    style={styles.dropdownItem}
                    onPress={() => item.id && router.push(`/lotes/${item.id}`)}
                  >
                    {/* Usar optional chaining por si producto no existe */}
                    <ThemedText style={styles.itemName}>{item.descripcion ?? 'Lote sin nombre'}</ThemedText>
                    <ThemedText style={styles.itemDetail}>
                      Disponible: {formatNumber(item.cantidad_disponible_kg ?? '0')} kg
                    </ThemedText>
                  </TouchableOpacity>
                ))}
                {/* Acceso seguro a .length */}
                {lotesBajos.length > maxItemsToShow && (
                  <ThemedText style={styles.moreItems}>
                    ... {lotesBajos.length - maxItemsToShow} más
                  </ThemedText>
                )}
              </ScrollView>
            ) : (
              <ThemedText style={styles.emptyText}>No hay lotes con bajo stock</ThemedText>
            )}
            
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/lotes')}
            >
              <ThemedText style={styles.viewAllText}>Ver todos los lotes</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </View>
      
      {/* Icono de Inventario */}
      <View>
        <TouchableOpacity 
          style={styles.iconContainer}
          onPress={() => {
            setShowInventarioDropdown(!showInventarioDropdown);
            setShowLotesDropdown(false);
          }}
        >
          <IconSymbol name="cube.box.fill" size={24} color="#0a7ea4" />
          {hasInventarioAlert && (
            <View style={styles.badge}>
              {/* Acceso seguro a .length */}
              <ThemedText style={styles.badgeText}>{inventarioBajo.length}</ThemedText>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Dropdown para Inventario */}
        {showInventarioDropdown && (
          <ThemedView style={styles.dropdown}>
            <ThemedText style={styles.dropdownTitle}>Inventario con bajo stock</ThemedText>
            
            {/* Acceso seguro a .length */}
            {inventarioBajo.length > 0 ? (
              <ScrollView style={{ maxHeight: 200 }}>
                {inventarioToShow.map(item => (
                  <TouchableOpacity 
                    // Asegúrate que item.id existe y es único
                    key={item.id?.toString() ?? Math.random().toString()}
                    style={styles.dropdownItem}
                    // Navegar a inventarios o a la presentación específica si es posible
                    onPress={() => router.push(`/inventarios`)} 
                  >
                    {/* Usar optional chaining */}
                    <ThemedText style={styles.itemName}>{item.nombre ?? 'Item sin nombre'} {item.almacen_nombre ?? 0}</ThemedText>
                    <ThemedText style={styles.itemDetail}>
                      Stock: {item.cantidad ?? 0} (Mín: {item.stock_minimo ?? 0}) 
                    </ThemedText>
                  </TouchableOpacity>
                ))}
                {inventarioBajo.length > maxItemsToShow && (
                  <ThemedText style={styles.moreItems}>
                    ... {inventarioBajo.length - maxItemsToShow} más
                  </ThemedText>
                )}
              </ScrollView>
            ) : (
              <ThemedText style={styles.emptyText}>No hay productos con bajo stock</ThemedText>
            )}
            
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/inventarios')}
            >
              <ThemedText style={styles.viewAllText}>Ver todo el inventario</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
    gap: 16,
  },
  iconContainer: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F44336',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    right: 0,
    width: 250,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 1001,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0a7ea4',
  },
  dropdownItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemDetail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  moreItems: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#0a7ea4',
    fontWeight: '500',
  },
});
