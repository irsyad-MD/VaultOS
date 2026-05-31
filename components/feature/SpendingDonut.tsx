import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { SpendingCategory } from '@/types';
import { formatCurrency } from '@/services/financeService';

interface SpendingDonutProps {
  data: SpendingCategory[];
  size?: number;
}

export function SpendingDonut({ data, size = 140 }: SpendingDonutProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 14;
  const strokeWidth = 20;
  const innerRadius = radius - strokeWidth / 2;

  const total = data.reduce((s, d) => s + d.value, 0);
  let startAngle = -90;

  const slices = data.map((d) => {
    const angle = (d.value / total) * 360;
    const slice = { ...d, startAngle, endAngle: startAngle + angle };
    startAngle += angle;
    return slice;
  });

  const arcPath = (start: number, end: number, r: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const endClamped = Math.min(end, start + 359.99);
    const x2 = cx + r * Math.cos(toRad(endClamped));
    const y2 = cy + r * Math.sin(toRad(endClamped));
    const large = endClamped - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const topCategory = data.reduce((a, b) => (a.value > b.value ? a : b), data[0]);

  return (
    <View style={styles.container}>
      <View>
        <Svg width={size} height={size}>
          {/* Track */}
          <Path
            d={arcPath(-90, 269.99, innerRadius)}
            stroke="#27272a"
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="butt"
          />
          {slices.map((s, i) => (
            <Path
              key={i}
              d={arcPath(s.startAngle, s.endAngle, innerRadius)}
              stroke={s.color}
              strokeWidth={strokeWidth - 3}
              fill="none"
              strokeLinecap="butt"
              opacity={0.9}
            />
          ))}
        </Svg>

        {/* Center label */}
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={styles.centerLabel}>{topCategory.percentage}%</Text>
          <Text style={styles.centerSub} numberOfLines={1}>{topCategory.name}</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {data.slice(0, 5).map((d, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: d.color }]} />
            <View style={styles.legendText}>
              <Text style={styles.legendName} numberOfLines={1}>{d.name}</Text>
              <Text style={styles.legendValue}>{d.percentage}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  center: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
    color: Colors.text,
  },
  centerSub: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    maxWidth: 70,
    textAlign: 'center',
  },
  legend: {
    flex: 1,
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  legendText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendName: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  legendValue: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
    fontWeight: Typography.medium,
  },
});
