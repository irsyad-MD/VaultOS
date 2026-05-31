import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';

interface DataPoint {
  value: number;
}

interface MiniLineChartProps {
  data: DataPoint[];
  color?: string;
  width?: number;
  height?: number;
  showGradient?: boolean;
}

export function MiniLineChart({
  data,
  color = '#6366f1',
  width = 120,
  height = 40,
  showGradient = true,
}: MiniLineChartProps) {
  if (!data || data.length < 2) return null;

  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * chartWidth,
    y: padding + chartHeight - ((d.value - min) / range) * chartHeight,
  }));

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const gradientPath =
    linePath +
    ` L ${points[points.length - 1].x} ${padding + chartHeight}` +
    ` L ${points[0].x} ${padding + chartHeight} Z`;

  const gradientId = `grad_${color.replace('#', '')}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {showGradient ? (
        <Path d={gradientPath} fill={`url(#${gradientId})`} />
      ) : null}
      <Path
        d={linePath}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Bar chart for category spending
interface BarChartProps {
  data: { value: number; color: string }[];
  width?: number;
  height?: number;
}

export function MiniBarChart({ data, width = 200, height = 60 }: BarChartProps) {
  if (!data || data.length === 0) return null;

  const padding = 4;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const maxVal = Math.max(...data.map((d) => d.value));
  const barWidth = (chartWidth / data.length) * 0.65;
  const gap = (chartWidth / data.length) * 0.35;

  return (
    <Svg width={width} height={height}>
      {data.map((d, i) => {
        const barHeight = Math.max(4, (d.value / maxVal) * chartHeight);
        const x = padding + i * (barWidth + gap);
        const y = padding + chartHeight - barHeight;
        return (
          <Rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={3}
            fill={d.color}
            opacity={0.85}
          />
        );
      })}
    </Svg>
  );
}

// Donut / ring chart for budget/goals
interface DonutChartProps {
  progress: number; // 0–100
  color?: string;
  size?: number;
  strokeWidth?: number;
}

export function DonutChart({
  progress,
  color = '#6366f1',
  size = 60,
  strokeWidth = 7,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progress));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id={`donut_${color.replace('#', '')}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={color} stopOpacity={1} />
          <Stop offset="100%" stopColor={color} stopOpacity={0.6} />
        </LinearGradient>
      </Defs>
      {/* Track */}
      <Path
        d={describeArc(cx, cy, radius, 0, 360)}
        stroke="#27272a"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
      {/* Progress */}
      <Path
        d={describeArc(cx, cy, radius, -90, -90 + (clamped / 100) * 360)}
        stroke={`url(#donut_${color.replace('#', '')})`}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const clampedEnd = Math.min(endAngle, startAngle + 359.99);
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, clampedEnd);
  const largeArc = clampedEnd - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}
