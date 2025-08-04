import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { FloatingActionButton } from '@/components/FloatingActionButton';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { EnhancedCardList } from '@/components/data/EnhancedCardList';
import { useUsuariosList } from '@/hooks/crud/useUsuariosList';
import { IconSymbol } from '@/components/ui/IconSymbol';
 import { Colors } from '@/styles/Theme';

export default function UsuariosScreen() {
  const {
    usuarios,
    isLoading,
    error,
    pagination,
    sorting,
    refresh,
    deleteUsuario,
    isAdmin,
  } = useUsuariosList();

  const handleAddUsuario = () => {
    router.push('/usuarios/create');
  };

  return (
    <ScreenContainer
      title="Usuarios"
      scrollable={false} // EnhancedCardList ya tiene su propio scroll
    >
      <Stack.Screen options={{
        title: 'Usuarios',
        headerShown: true
      }} />

      <ThemedView style={styles.container}>
        <EnhancedCardList
          data={usuarios}
          isLoading={isLoading}
          error={error}
          baseRoute="/usuarios"
          pagination={pagination}
          sorting={sorting}
          actions={{
            onView: true,
            onEdit: isAdmin, // Solo admins pueden editar
            onDelete: isAdmin, // Solo admins pueden borrar
          }}
          deleteOptions={{
            title: 'Eliminar Usuario',
            message: '¿Está seguro que desea eliminar este usuario?',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onDelete: async (id) => await deleteUsuario(Number(id))
          }}
          emptyMessage="No hay usuarios registrados"
          onRefresh={refresh}
          renderCard={(user) => (
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <ThemedText style={styles.cardTitle}>{user.username}</ThemedText>
                <ThemedView style={[styles.badge, styles.roleBadge]}>
                  <ThemedText style={styles.badgeText}>{user.rol}</ThemedText>
                </ThemedView>
              </View>
              <View style={styles.cardDetails}>
                <View style={styles.detailRow}>
                  <IconSymbol name="house.fill" size={16} color={Colors.primary} />
                  <ThemedText style={styles.detailText}>
                    Almacén: {user.almacen?.nombre || 'No asignado'}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
          numColumns={1}
        />

        {isAdmin && (
          <FloatingActionButton
            icon="plus.circle.fill"
            onPress={handleAddUsuario}
          />
        )}
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Estilos para las tarjetas (puedes ajustarlos)
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(10, 126, 164, 0.2)', // Un color distintivo para el rol
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary, // Color del texto del badge
  },
  cardDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    flex: 1,
  },
}); 