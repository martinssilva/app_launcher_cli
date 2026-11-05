import React from 'react';
import { useTranslation } from 'react-i18next';

import { Text, type TextProps } from '@/components';

import { formatPercent, formatPriceChange } from '../format';

interface PriceChangeProps extends Omit<TextProps, 'tone' | 'children'> {
  changePercent: number;
  /** Custom text; the tone still follows `changePercent`. */
  children?: string;
  /** Also shows the absolute change: `+$1.25 (+0.55%)`. */
  change?: number;
  currency?: string;
}

/** Green for gains, red for losses. */
export function PriceChange({
  changePercent,
  change,
  currency = 'USD',
  variant = 'label',
  children,
  ...rest
}: PriceChangeProps) {
  const { i18n } = useTranslation();
  const percent = formatPercent(changePercent, i18n.language);
  let tone: TextProps['tone'] = 'muted';
  if (changePercent > 0) {
    tone = 'success';
  } else if (changePercent < 0) {
    tone = 'danger';
  }
  return (
    <Text variant={variant} tone={tone} {...rest}>
      {children ??
        (change === undefined
          ? percent
          : `${formatPriceChange(change, currency, i18n.language)} (${percent})`)}
    </Text>
  );
}
