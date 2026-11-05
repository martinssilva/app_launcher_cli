import type { TFunction } from 'i18next';
import React from 'react';
import { View } from 'react-native';
import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { RootStackScreenProps } from '@/app/navigation/types';
import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  FormTextField,
  LoadingState,
  Screen,
  Text,
  useZodForm,
} from '@/components';
import { env } from '@/config';
import { selectCurrentUser } from '@/features/auth/authSlice';
import {
  cartCleared,
  selectCartCount,
  selectCartItems,
  selectCartSubtotal,
} from '@/features/cart/cartSlice';
import { SummaryRow } from '@/features/cart/components/SummaryRow';
import {
  useCreateOrderMutation,
  useGetShippingOptionsQuery,
} from '@/features/orders/api/ordersApi';
import { shippingMethodLabel } from '@/features/orders/labels';
import { type Payment, shippingCost } from '@/features/orders/types';
import { useFormatMoney } from '@/hooks/useFormatMoney';
import { isApiErrorData } from '@/services/api/errors';
import { makeStyles } from '@/theme';
import { getErrorMessage, testIDs } from '@/utils';

import { OptionCard } from '../components/OptionCard';
import {
  type CheckoutFormInput,
  createCheckoutSchema,
  digitsOnly,
} from '../schemas';

function checkoutErrorMessage(error: unknown, t: TFunction): string {
  if (isApiErrorData(error) && error.status === 402) {
    return t('checkout.declined');
  }
  return getErrorMessage(error, t, { CONFLICT: t('checkout.outOfStock') });
}

export function CheckoutScreen({
  navigation,
}: RootStackScreenProps<'Checkout'>) {
  const { t } = useTranslation();
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const formatMoney = useFormatMoney();
  const user = useAppSelector(selectCurrentUser);
  const items = useAppSelector(selectCartItems);
  const count = useAppSelector(selectCartCount);
  const subtotal = useAppSelector(selectCartSubtotal);
  const shippingOptions = useGetShippingOptionsQuery();
  const [createOrder, { isLoading: isPlacing, error }] =
    useCreateOrderMutation();

  const { control, handleSubmit, setValue, setFocus } = useZodForm(
    createCheckoutSchema,
    {
      defaultValues: {
        fullName: user?.name ?? '',
        street: '',
        complement: '',
        city: '',
        state: '',
        postalCode: '',
        shippingMethod: 'standard',
        paymentMethod: 'card',
        cardNumber: '',
        cardExpiry: '',
        cardCvc: '',
      } satisfies CheckoutFormInput,
    },
  );
  const shippingMethod = useWatch({ control, name: 'shippingMethod' });
  const paymentMethod = useWatch({ control, name: 'paymentMethod' });

  const selectedOption = shippingOptions.data?.find(
    option => option.id === shippingMethod,
  );
  const shipping = selectedOption ? shippingCost(selectedOption, subtotal) : 0;

  const onSubmit = handleSubmit(async values => {
    const payment: Payment =
      values.paymentMethod === 'card'
        ? { method: 'card', last4: digitsOnly(values.cardNumber).slice(-4) }
        : { method: 'cash' };
    try {
      const order = await createOrder({
        items: items.map(({ productId, quantity }) => ({
          productId,
          quantity,
        })),
        address: {
          fullName: values.fullName,
          street: values.street,
          complement: values.complement,
          city: values.city,
          state: values.state,
          postalCode: values.postalCode,
        },
        shippingMethod: values.shippingMethod,
        payment,
      }).unwrap();
      navigation.replace('OrderConfirmation', { orderId: order.id });
      dispatch(cartCleared());
    } catch {
      // Shown below through the mutation error.
    }
  });

  if (items.length === 0) {
    return (
      <Screen testID={testIDs.checkout.screen}>
        <EmptyState message={t('checkout.emptyCart')} />
      </Screen>
    );
  }

  let shippingContent;
  if (shippingOptions.isLoading) {
    shippingContent = <LoadingState />;
  } else if (shippingOptions.error || !shippingOptions.data) {
    shippingContent = (
      <ErrorState
        message={getErrorMessage(shippingOptions.error, t)}
        onRetry={shippingOptions.refetch}
      />
    );
  } else {
    shippingContent = shippingOptions.data.map(option => {
      const cost = shippingCost(option, subtotal);
      const days = t('checkout.shippingDays', {
        min: option.minDays,
        max: option.maxDays,
      });
      const freeOver =
        option.freeOver !== null && cost > 0
          ? ` · ${t('checkout.freeOver', { amount: formatMoney(option.freeOver) })}`
          : '';
      return (
        <OptionCard
          key={option.id}
          label={shippingMethodLabel(option.id, t)}
          description={`${days}${freeOver}`}
          trailing={cost === 0 ? t('checkout.free') : formatMoney(cost)}
          selected={shippingMethod === option.id}
          onPress={() => setValue('shippingMethod', option.id)}
          testID={testIDs.checkout.shippingOption(option.id)}
        />
      );
    });
  }

  return (
    <Screen scroll testID={testIDs.checkout.screen}>
      <View style={styles.section}>
        <Text variant="subtitle">{t('checkout.address')}</Text>
        <FormTextField
          control={control}
          name="fullName"
          label={t('checkout.fullName')}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => setFocus('street')}
          testID={testIDs.checkout.fullNameInput}
        />
        <FormTextField
          control={control}
          name="street"
          label={t('checkout.street')}
          placeholder={t('checkout.streetPlaceholder')}
          autoComplete="address-line1"
          textContentType="streetAddressLine1"
          returnKeyType="next"
          onSubmitEditing={() => setFocus('complement')}
          testID={testIDs.checkout.streetInput}
        />
        <FormTextField
          control={control}
          name="complement"
          label={t('checkout.complement')}
          autoComplete="address-line2"
          textContentType="streetAddressLine2"
          returnKeyType="next"
          onSubmitEditing={() => setFocus('city')}
          testID={testIDs.checkout.complementInput}
        />
        <FormTextField
          control={control}
          name="city"
          label={t('checkout.city')}
          textContentType="addressCity"
          returnKeyType="next"
          onSubmitEditing={() => setFocus('state')}
          testID={testIDs.checkout.cityInput}
        />
        <View style={styles.row}>
          <View style={styles.cell}>
            <FormTextField
              control={control}
              name="state"
              label={t('checkout.state')}
              textContentType="addressState"
              returnKeyType="next"
              onSubmitEditing={() => setFocus('postalCode')}
              testID={testIDs.checkout.stateInput}
            />
          </View>
          <View style={styles.cell}>
            <FormTextField
              control={control}
              name="postalCode"
              label={t('checkout.postalCode')}
              autoComplete="postal-code"
              textContentType="postalCode"
              keyboardType="numbers-and-punctuation"
              returnKeyType="done"
              testID={testIDs.checkout.postalCodeInput}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="subtitle">{t('checkout.delivery')}</Text>
        <View accessibilityRole="radiogroup" style={styles.options}>
          {shippingContent}
        </View>
      </View>

      <View style={styles.section}>
        <Text variant="subtitle">{t('checkout.payment')}</Text>
        <View accessibilityRole="radiogroup" style={styles.options}>
          <OptionCard
            label={t('checkout.card')}
            selected={paymentMethod === 'card'}
            onPress={() => setValue('paymentMethod', 'card')}
            testID={testIDs.checkout.paymentOption('card')}
          />
          <OptionCard
            label={t('checkout.cash')}
            selected={paymentMethod === 'cash'}
            onPress={() => setValue('paymentMethod', 'cash')}
            testID={testIDs.checkout.paymentOption('cash')}
          />
        </View>
        {paymentMethod === 'card' ? (
          <>
            <FormTextField
              control={control}
              name="cardNumber"
              label={t('checkout.cardNumber')}
              placeholder="4242 4242 4242 4242"
              keyboardType="number-pad"
              autoComplete="cc-number"
              textContentType="creditCardNumber"
              returnKeyType="next"
              onSubmitEditing={() => setFocus('cardExpiry')}
              testID={testIDs.checkout.cardNumberInput}
            />
            <View style={styles.row}>
              <View style={styles.cell}>
                <FormTextField
                  control={control}
                  name="cardExpiry"
                  label={t('checkout.cardExpiry')}
                  placeholder="MM/YY"
                  keyboardType="numbers-and-punctuation"
                  autoComplete="cc-exp"
                  textContentType="creditCardExpiration"
                  returnKeyType="next"
                  onSubmitEditing={() => setFocus('cardCvc')}
                  testID={testIDs.checkout.cardExpiryInput}
                />
              </View>
              <View style={styles.cell}>
                <FormTextField
                  control={control}
                  name="cardCvc"
                  label={t('checkout.cardCvc')}
                  placeholder="123"
                  keyboardType="number-pad"
                  autoComplete="cc-csc"
                  textContentType="creditCardSecurityCode"
                  secureTextEntry
                  returnKeyType="done"
                  testID={testIDs.checkout.cardCvcInput}
                />
              </View>
            </View>
            <Text variant="caption" tone="muted">
              {t('checkout.cardNote')}
            </Text>
            {env.useMockApi ? (
              <Text variant="caption" tone="muted">
                {t('checkout.mockHint')}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text variant="subtitle">{t('checkout.summary')}</Text>
        <Card>
          <SummaryRow
            label={`${t('checkout.subtotal')} (${t('cart.itemCount', { count })})`}
            value={formatMoney(subtotal)}
            testID={testIDs.checkout.subtotal}
          />
          <SummaryRow
            label={t('checkout.shipping')}
            value={shipping === 0 ? t('checkout.free') : formatMoney(shipping)}
            testID={testIDs.checkout.shipping}
          />
          <SummaryRow
            label={t('checkout.total')}
            value={formatMoney(subtotal + shipping)}
            emphasized
            testID={testIDs.checkout.total}
          />
        </Card>
      </View>

      {error ? (
        <Text
          tone="danger"
          align="center"
          accessibilityLiveRegion="polite"
          testID={testIDs.checkout.errorMessage}
        >
          {checkoutErrorMessage(error, t)}
        </Text>
      ) : null}
      <Button
        title={t('checkout.placeOrder')}
        onPress={onSubmit}
        loading={isPlacing}
        disabled={!selectedOption}
        testID={testIDs.checkout.placeOrderButton}
      />
    </Screen>
  );
}

const useStyles = makeStyles(theme => ({
  section: {
    gap: theme.spacing.md,
  },
  options: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cell: {
    flex: 1,
  },
}));
