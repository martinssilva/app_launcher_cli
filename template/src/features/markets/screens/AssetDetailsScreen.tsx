import React, { useMemo, useState } from 'react';
import { ActivityIndicator, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { RootStackScreenProps } from '@/app/navigation/types';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Screen,
  SegmentedControl,
  type SegmentedOption,
  Text,
} from '@/components';
import { useWatchlistToggle } from '@/features/watchlist/useWatchlistToggle';
import { makeStyles, useTheme } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import { useGetAssetQuery, useGetCandlesQuery } from '../api/marketsApi';
import { summarizeCandles, withLivePrice } from '../chart';
import { ConnectionBadge } from '../components/ConnectionBadge';
import { LivePrice } from '../components/LivePrice';
import { PriceChange } from '../components/PriceChange';
import { PriceChart } from '../components/PriceChart';
import { QuotesError } from '../components/QuotesError';
import { formatCompact, formatPercent, formatPrice } from '../format';
import { useLiveQuotes } from '../hooks/useLiveQuotes';
import { CHART_PERIODS, type ChartPeriod, type ChartType } from '../types';

const CHART_HEIGHT = 220;

export function AssetDetailsScreen({
  route,
}: RootStackScreenProps<'AssetDetails'>) {
  const { symbol } = route.params;
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const locale = i18n.language;

  const [period, setPeriod] = useState<ChartPeriod>('1D');
  const [chartType, setChartType] = useState<ChartType>('line');

  const assetQuery = useGetAssetQuery(symbol);
  const quotesQuery = useLiveQuotes([symbol]);
  const quote = quotesQuery.data?.[symbol];
  const candlesQuery = useGetCandlesQuery({ symbol, period });
  const { inWatchlist, toggle } = useWatchlistToggle(symbol);

  const candles = useMemo(
    () => withLivePrice(candlesQuery.currentData?.candles ?? [], quote?.price),
    [candlesQuery.currentData, quote?.price],
  );
  const summary = useMemo(() => summarizeCandles(candles), [candles]);

  const asset = assetQuery.data;
  if (assetQuery.isLoading) {
    return <LoadingState />;
  }
  if (assetQuery.error || !asset) {
    return (
      <ErrorState
        message={getErrorMessage(assetQuery.error, t)}
        onRetry={assetQuery.refetch}
      />
    );
  }

  const { currency } = asset;
  const price = (value: number) => formatPrice(value, currency, locale);
  const periodName = t(`assetDetails.periodName${period}`);

  const periodOptions: SegmentedOption<ChartPeriod>[] = CHART_PERIODS.map(
    value => ({
      value,
      label: t(`assetDetails.period${value}`),
      testID: testIDs.assetDetails.period(value),
    }),
  );
  const chartTypeOptions: SegmentedOption<ChartType>[] = [
    {
      value: 'line',
      label: t('assetDetails.chartLine'),
      testID: testIDs.assetDetails.chartType('line'),
    },
    {
      value: 'candle',
      label: t('assetDetails.chartCandles'),
      testID: testIDs.assetDetails.chartType('candle'),
    },
  ];

  let chart: React.ReactNode;
  if (candlesQuery.error) {
    chart = (
      <View testID={testIDs.assetDetails.chartError} style={styles.fill}>
        <ErrorState
          message={getErrorMessage(candlesQuery.error, t)}
          onRetry={candlesQuery.refetch}
        />
      </View>
    );
  } else if (!candlesQuery.currentData) {
    chart = (
      <ActivityIndicator
        color={theme.colors.primary}
        style={styles.fill}
        testID={testIDs.assetDetails.chartLoading}
      />
    );
  } else if (!summary) {
    chart = (
      <View testID={testIDs.assetDetails.chartEmpty} style={styles.fill}>
        <EmptyState message={t('assetDetails.chartEmpty')} />
      </View>
    );
  } else {
    chart = (
      <PriceChart
        type={chartType}
        period={period}
        candles={candles}
        width={width - theme.spacing.lg * 2}
        height={CHART_HEIGHT}
        accessibilityLabel={t('assetDetails.chartLabel', {
          period: periodName,
          change: formatPercent(summary.changePercent, locale),
        })}
      />
    );
  }

  const stats = quote
    ? [
        { label: t('assetDetails.open'), value: price(quote.open) },
        { label: t('assetDetails.high'), value: price(quote.high) },
        { label: t('assetDetails.low'), value: price(quote.low) },
        {
          label: t('assetDetails.previousClose'),
          value: price(quote.previousClose),
        },
        {
          label: t('assetDetails.volume'),
          value: formatCompact(quote.volume, locale, t),
        },
      ]
    : [];
  stats.push({
    label: t('assetDetails.marketCap'),
    value: formatCompact(asset.marketCap, locale, t),
  });

  return (
    <Screen scroll testID={testIDs.assetDetails.screen}>
      <View style={styles.header}>
        <Text variant="subtitle" testID={testIDs.assetDetails.name}>
          {asset.name}
        </Text>
        <Text variant="caption" tone="muted">
          {`${asset.exchange} · ${t(`assetDetails.${asset.type}`)}`}
        </Text>
        <LivePrice
          price={quote?.price}
          variant="display"
          style={styles.price}
          testID={testIDs.assetDetails.price}
        >
          {quote ? price(quote.price) : '—'}
        </LivePrice>
        <View style={styles.changeRow}>
          {quote ? (
            <PriceChange
              changePercent={quote.changePercent}
              change={quote.change}
              currency={currency}
              testID={testIDs.assetDetails.change}
            />
          ) : null}
          <ConnectionBadge />
        </View>
        {quotesQuery.error ? (
          <QuotesError
            error={quotesQuery.error}
            onRetry={quotesQuery.refetch}
          />
        ) : null}
      </View>

      <SegmentedControl
        accessibilityLabel={t('assetDetails.chartType')}
        options={chartTypeOptions}
        value={chartType}
        onChange={setChartType}
      />
      <View style={styles.chart}>{chart}</View>
      <SegmentedControl
        accessibilityLabel={t('assetDetails.period')}
        options={periodOptions}
        value={period}
        onChange={setPeriod}
      />
      {summary && candlesQuery.currentData ? (
        <View style={styles.summary}>
          <PriceChange
            changePercent={summary.changePercent}
            testID={testIDs.assetDetails.periodChange}
          >
            {t('assetDetails.changeOver', {
              change: formatPercent(summary.changePercent, locale),
              period: periodName,
            })}
          </PriceChange>
          <Text
            variant="caption"
            tone="muted"
            testID={testIDs.assetDetails.periodRange}
          >
            {t('assetDetails.periodRange', {
              low: price(summary.low),
              high: price(summary.high),
            })}
          </Text>
        </View>
      ) : null}

      <Button
        title={inWatchlist ? t('watchlist.remove') : t('watchlist.add')}
        variant={inWatchlist ? 'secondary' : 'primary'}
        onPress={toggle}
        testID={testIDs.assetDetails.watchlistButton}
      />

      <Card>
        <Text variant="label">{t('assetDetails.statistics')}</Text>
        {stats.map(({ label, value }) => (
          <View key={label} style={styles.statRow}>
            <Text tone="muted">{label}</Text>
            <Text>{value}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text variant="label">{t('assetDetails.about')}</Text>
        <Text>{asset.description}</Text>
      </Card>
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  header: {
    gap: theme.spacing.xxs,
  },
  price: {
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  chart: {
    minHeight: CHART_HEIGHT,
    justifyContent: 'center',
  },
  fill: {
    minHeight: CHART_HEIGHT,
  },
  summary: {
    gap: theme.spacing.xxs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xxs,
  },
}));
