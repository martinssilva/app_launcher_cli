import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { formatMoney } from '@/utils/money';

/** `formatMoney` bound to the current app language. */
export function useFormatMoney() {
  const { i18n } = useTranslation();
  return useCallback(
    (cents: number) => formatMoney(cents, i18n.language),
    [i18n.language],
  );
}
