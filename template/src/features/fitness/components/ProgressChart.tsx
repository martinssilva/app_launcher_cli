import React, { useMemo, useState } from 'react';
import { LogBox, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LineChart } from 'react-native-wagmi-charts';

import { Text } from '@/components';
import { makeStyles, useTheme } from '@/theme';
import { formatDate, parseDateString } from '@/utils/dates';
import { testIDs } from '@/utils/testIDs';

import { formatNumber } from '../format';
import type { ProgressPoint } from '../progress';

// react-native-wagmi-charts passes dependency arrays to Reanimated hooks;
// Reanimated ignores them on native and warns once in development.
LogBox.ignoreLogs(['Dependencies should only be used on the web']);

const CHART_HEIGHT = 200;

interface ProgressChartProps {
  points: ProgressPoint[];
}

/**
 * Line chart of a load over time (react-native-wagmi-charts). Touching the
 * chart moves a cursor; the header shows the touched point or the latest one.
 */
export function ProgressChart({ points }: ProgressChartProps) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const window = useWindowDimensions();
  // Starts from the screen width (minus padding) and follows the real layout.
  const [width, setWidth] = useState(window.width - theme.spacing.lg * 2);
  const [activeIndex, setActiveIndex] = useState(-1);

  const data = useMemo(
    () =>
      points.map(point => ({
        timestamp: parseDateString(point.date).getTime(),
        value: point.value,
      })),
    [points],
  );
  const shown = points[activeIndex] ?? points[points.length - 1];
  if (!shown) {
    return null;
  }

  return (
    <View
      style={styles.container}
      onLayout={event => setWidth(event.nativeEvent.layout.width)}
      testID={testIDs.progress.chart}
    >
      <View accessible testID={testIDs.progress.chartValue}>
        <Text variant="title">
          {t('progress.load', {
            value: formatNumber(shown.value, i18n.language),
          })}
        </Text>
        <Text tone="muted">{formatDate(shown.date, i18n.language)}</Text>
      </View>
      <LineChart.Provider data={data} onCurrentIndexChange={setActiveIndex}>
        <LineChart width={width} height={CHART_HEIGHT}>
          <LineChart.Path color={theme.colors.primary} width={3}>
            <LineChart.Gradient color={theme.colors.primary} />
          </LineChart.Path>
          <LineChart.CursorCrosshair color={theme.colors.primary} />
        </LineChart>
      </LineChart.Provider>
      <Text variant="caption" tone="muted">
        {t('progress.chartHint')}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    gap: theme.spacing.sm,
  },
}));
