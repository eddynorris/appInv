// components/data/DetailCard.tsx
import React, { ReactNode } from 'react';
import { StyleSheet, ViewProps } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors, Spacing, BorderRadius, Shadows } from '@/styles/Theme';

interface DetailRowProps {
  label: string;
  value: ReactNode;
}

export function DetailRow({ label, value }: DetailRowProps) {
  return (
    <ThemedView style={styles.infoRow}>
      <ThemedText type="defaultSemiBold">{label}:</ThemedText>
      <ThemedView style={styles.valueContainer}>
        {typeof value === 'string' || typeof value === 'number' ? (
          <ThemedText>{value || '-'}</ThemedText>
        ) : (
          value
        )}
      </ThemedView>
    </ThemedView>
  );
}

interface DetailSectionProps {
  title: string;
  children: ReactNode;
}

export function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <ThemedView style={styles.section}>
      <ThemedText type="subtitle">{title}</ThemedText>
      {children}
    </ThemedView>
  );
}

interface DetailCardProps extends ViewProps {
  title?: string;
  children: ReactNode;
}

export function DetailCard({ title, children, style, ...rest }: DetailCardProps) {
  return (
    <ThemedView style={[styles.card, style]} {...rest}>
      {title && <ThemedText type="title" style={styles.title}>{title}</ThemedText>}
      {children}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    marginBottom: 16,
  },
  section: {
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
    justifyContent: 'space-between',
  },
  valueContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  }
});