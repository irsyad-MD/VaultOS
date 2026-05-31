import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Colors, Typography, Spacing, Radius } from '@/constants/theme';
import { ChartDataPoint } from '@/types';

interface IncomeExpenseChartProps {
  data: ChartDataPoint[];
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  const chartWidth = SCREEN_WIDTH - Spacing.base * 4;
  const chartHeight = 120;
  const bottomPadding = 20;
  const topPadding = 8;
  const usableHeight = chartHeight - bottomPadding - topPadding;

  const allValues = data.flatMap((d) => [d.income, d.expense]);
  const maxVal = Math.max(...allValues, 1);

  const groupWidth = chartWidth / data.length;
  const barWidth = groupWidth * 0.3;
  const gap = barWidth * 0.3;

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: Colors.success }]} />
          <Text style={styles.legendText}>Pemasukan</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
          <Text style={styles.legendText}>Pengeluaran</Text>
        </View>
      </View>

      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.success} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={Colors.success} stopOpacity={0.5} />
          </LinearGradient>
          <LinearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={Colors.danger} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={Colors.danger} stopOpacity={0.5} />
          </LinearGradient>
        </Defs>

        {data.map((d, i) => {
          const groupX = i * groupWidth + groupWidth / 2 - barWidth - gap / 2;
          const incomeH = Math.max(4, (d.income / maxVal) * usableHeight);
          const expenseH = Math.max(4, (d.expense / maxVal) * usableHeight);
          const incomeY = topPadding + usableHeight - incomeH;
          const expenseY = topPadding + usableHeight - expenseH;
          const labelX = i * groupWidth + groupWidth / 2;

          return (
            <React.Fragment key={i}>
              <Rect
                x={groupX}
                y={incomeY}
                width={barWidth}
                height={incomeH}
                rx={4}
                fill="url(#incomeGrad)"
              />
              <Rect
                x={groupX + barWidth + gap}
                y={expenseY}
                width={barWidth}
                height={expenseH}
                rx={4}
                fill="url(#expenseGrad)"
              />
              <SvgText
                x={labelX}
                y={chartHeight - 4}
                textAnchor="middle"
                fill={Colors.textMuted}
                fontSize={10}
              >
                {d.month}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: Typography.xs,
    color: Colors.textMuted,
  },
});
