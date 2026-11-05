import React, { useMemo } from 'react';
import { LogBox, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CandlestickChart, LineChart } from 'react-native-wagmi-charts';

import { makeStyles, useTheme } from '@/theme';
import { testIDs } from '@/utils/testIDs';

import { toLinePoints } from '../chart';
import type { Candle, ChartPeriod, ChartType } from '../types';

interface PriceChartProps {
  type: ChartType;
  period: ChartPeriod;
  candles: Candle[];
  width: number;
  height: number;
  /** Text summary for screen readers (charts are images to them). */
  accessibilityLabel: string;
}

// react-native-wagmi-charts passes dependency arrays to useDerivedValue.
// Reanimated ignores them on native (the worklet closure is tracked instead),
// so this warning is harmless.
LogBox.ignoreLogs(['[Reanimated] Dependencies should only be used on the web']);

const DATE_FORMAT = {
  '1D': { hour: '2-digit', minute: '2-digit' },
  '1W': { weekday: 'short', hour: '2-digit', minute: '2-digit' },
  '1M': { day: 'numeric', month: 'short' },
  '1Y': { day: 'numeric', month: 'short', year: 'numeric' },
} as const satisfies Record<ChartPeriod, Intl.DateTimeFormatOptions>;

/**
 * Line or candlestick chart (react-native-wagmi-charts). Touch and drag to
 * see the price and time of any point.
 */
export function PriceChart({
  type,
  period,
  candles,
  width,
  height,
  accessibilityLabel,
}: PriceChartProps) {
  const theme = useTheme();
  const styles = useStyles();
  const { i18n } = useTranslation();
  const points = useMemo(() => toLinePoints(candles), [candles]);

  const first = candles[0];
  const last = candles[candles.length - 1];
  const isUp = !first || !last || last.close >= first.open;
  const trendColor = isUp ? theme.colors.success : theme.colors.danger;

  const tooltipText = [styles.tooltip, { color: theme.colors.text }];
  const datetime = (
    <LineChart.DatetimeText
      locale={i18n.language}
      options={DATE_FORMAT[period]}
      style={tooltipText}
    />
  );

  if (type === 'candle') {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        testID={testIDs.assetDetails.candleChart}
      >
        <CandlestickChart.Provider data={candles}>
          <CandlestickChart width={width} height={height}>
            <CandlestickChart.Candles
              positiveColor={theme.colors.success}
              negativeColor={theme.colors.danger}
            />
            <CandlestickChart.Crosshair color={theme.colors.textMuted}>
              <CandlestickChart.Tooltip textStyle={tooltipText} />
            </CandlestickChart.Crosshair>
          </CandlestickChart>
          <View style={styles.cursorRow}>
            <CandlestickChart.DatetimeText
              locale={i18n.language}
              options={DATE_FORMAT[period]}
              style={[styles.cursorText, { color: theme.colors.textMuted }]}
            />
          </View>
        </CandlestickChart.Provider>
      </View>
    );
  }

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      testID={testIDs.assetDetails.lineChart}
    >
      <LineChart.Provider data={points}>
        <LineChart width={width} height={height}>
          <LineChart.Path color={trendColor} width={2}>
            <LineChart.Gradient color={trendColor} />
          </LineChart.Path>
          <LineChart.CursorCrosshair color={trendColor}>
            <LineChart.Tooltip textStyle={tooltipText} />
            <LineChart.Tooltip position="bottom">{datetime}</LineChart.Tooltip>
          </LineChart.CursorCrosshair>
        </LineChart>
      </LineChart.Provider>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  tooltip: {
    ...theme.typography.caption,
    fontWeight: '600',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    borderRadius: theme.radii.sm,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  cursorRow: {
    minHeight: theme.typography.caption.lineHeight,
    alignItems: 'center',
  },
  cursorText: {
    ...theme.typography.caption,
  },
}));
