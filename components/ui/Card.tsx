import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'elevated' | 'glass' | 'outlined';
  padding?: number;
}

export function Card({ children, style, variant = 'default', padding = 16 }: CardProps) {
  const cardStyle = [
    styles.base,
    variant === 'elevated' && styles.elevated,
    variant === 'glass' && styles.glass,
    variant === 'outlined' && styles.outlined,
    { padding },
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  elevated: {
    backgroundColor: Colors.cardElevated,
    ...Shadows.md,
  },
  glass: {
    backgroundColor: Colors.glass,
    borderColor: Colors.glassBorder,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
  },
});
