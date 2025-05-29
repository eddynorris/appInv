import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { CategorizedDeliveries } from '@/hooks/reportes/useUpcomingDeliveries'; 
import { router } from 'expo-router';

interface NotificationsBarProps {
  categorizedDeliveries: CategorizedDeliveries;
  hasUpcomingDeliveries: boolean;
}

export function NotificationsBar({ 
  categorizedDeliveries,
  hasUpcomingDeliveries
}: NotificationsBarProps) {
  const [showDeliveriesDropdown, setShowDeliveriesDropdown] = useState(false);
  const maxItemsToShow = 5;
  
  // Obtener el color y texto según la urgencia
  const getDeliveryStatusInfo = (status: 'today' | 'next3days' | 'next7days') => {
    switch (status) {
      case 'today':
        return { color: '#FF5252', text: 'Enviar pedido' }; // Rojo
      case 'next3days':
        return { color: '#FF9800', text: 'Preparar pedido' }; // Naranja
      case 'next7days':
        return { color: '#4CAF50', text: 'Asegurar stock' }; // Verde
      default:
        return { color: '#0a7ea4', text: 'Próximas entregas' };
    }
  };
  
  // Contar alertas por categoría
  const deliveryAlerts = [
    { status: 'today' as const, count: categorizedDeliveries.today.length },
    { status: 'next3days' as const, count: categorizedDeliveries.next3days.length },
    { status: 'next7days' as const, count: categorizedDeliveries.next7days.length }
  ].filter(alert => alert.count > 0);
  
  // Formatear fecha para mostrar
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha';
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };
  
  return (
    <View style={styles.container}>
      {/* Icono de Próximas Entregas */}
      <View>
        <TouchableOpacity 
          style={styles.iconContainer}
          onPress={() => setShowDeliveriesDropdown(!showDeliveriesDropdown)}
        >
          <IconSymbol 
            name="calendar" 
            size={24} 
            color={hasUpcomingDeliveries ? "#FF5252" : "#0a7ea4"} 
          />
          {hasUpcomingDeliveries && (
            <View style={[styles.badge, { backgroundColor: '#FF5252' }]}>
              <ThemedText style={styles.badgeText}>
                {deliveryAlerts.reduce((sum, alert) => sum + alert.count, 0)}
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>
        
        {/* Dropdown de Próximas Entregas */}
        {showDeliveriesDropdown && (
          <View style={styles.dropdown}>
            <ScrollView style={styles.dropdownScroll}>
              {hasUpcomingDeliveries ? (
                <>
                  {deliveryAlerts.map(({ status, count }) => {
                    const { color, text } = getDeliveryStatusInfo(status);
                    const deliveries = categorizedDeliveries[status];
                    
                    return (
                      <View key={status}>
                        <View style={[styles.statusHeader, { backgroundColor: `${color}20` }]}>
                          <View style={[styles.statusDot, { backgroundColor: color }]} />
                          <ThemedText style={[styles.statusText, { color }]}>
                            {text} ({count})
                          </ThemedText>
                        </View>
                        
                        {deliveries.slice(0, maxItemsToShow).map((pedido) => (
                          <TouchableOpacity 
                            key={pedido.id} 
                            style={styles.dropdownItem}
                            onPress={() => router.push(`/pedidos/${pedido.id}`)}
                          >
                            <ThemedText style={styles.itemName}>
                              #{pedido.id} - {pedido.cliente?.nombre || 'Cliente'}
                            </ThemedText>
                            <ThemedText style={styles.itemDetail}>
                              Entrega: {formatDate(pedido.fecha_entrega || '')}
                            </ThemedText>
                            {pedido.total_estimado && (
                              <ThemedText style={styles.itemDetail}>
                                Total: ${parseFloat(pedido.total_estimado).toFixed(2)}
                              </ThemedText>
                            )}
                          </TouchableOpacity>
                        ))}
                        
                        {count > maxItemsToShow && (
                          <ThemedText style={styles.moreItems}>
                            ... {count - maxItemsToShow} más
                          </ThemedText>
                        )}
                      </View>
                    );
                  })}
                </>
              ) : (
                <View style={styles.dropdownItem}>
                  <ThemedText>No hay entregas programadas</ThemedText>
                </View>
              )}
              
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/reportes/proyecciones')}
              >
                <ThemedText style={styles.viewAllText}>Ver todos los pedidos</ThemedText>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdownScroll: {
    maxHeight: 400,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginTop: 8,
    borderRadius: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
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
