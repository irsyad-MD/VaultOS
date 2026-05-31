import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0–100
  color?: string;
  height?: number;
  showLabel?: boolean;
  style?: ViewStyle;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  color = Colors.primary,
  height = 6,
  showLabel = false,
  style,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const isOver = progress > 100;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, clamped)}%`,
              height,
              backgroundColor: isOver ? Colors.danger : color,
              borderRadius: height / 2,
            },
          ]}
        />
      </View>
      {showLabel ? (
        <Text style={[styles.label, { color: isOver ? Colors.danger : color }]}>
          {clamped.toFixed(0)}%
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  track: {
    flex: 1,
    backgroundColor: Colors.cardElevated,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    minWidth: 4,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    width: 36,
    textAlign: 'right',
  },
});
