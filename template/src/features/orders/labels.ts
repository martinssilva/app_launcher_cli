import type { TFunction } from 'i18next';

import type { OrderStatus, ShippingMethod } from './types';

export function orderStatusLabel(status: OrderStatus, t: TFunction): string {
  const labels: Record<OrderStatus, string> = {
    processing: t('orders.statusProcessing'),
    shipped: t('orders.statusShipped'),
    delivered: t('orders.statusDelivered'),
    cancelled: t('orders.statusCancelled'),
  };
  return labels[status] ?? status;
}

export function shippingMethodLabel(
  method: ShippingMethod,
  t: TFunction,
): string {
  const labels: Record<ShippingMethod, string> = {
    standard: t('checkout.shippingStandard'),
    express: t('checkout.shippingExpress'),
  };
  return labels[method] ?? method;
}
