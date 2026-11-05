import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type {
  CompositeScreenProps,
  NavigatorScreenParams,
} from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type MainTabParamList = {
  Home: undefined;
  Shop: undefined;
  Favorites: undefined;
  Cart: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Login: { email?: string; passwordReset?: boolean } | undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ItemDetails: { id: string; title: string };
  // Shopping
  ProductDetails: { id: string; name: string };
  Checkout: undefined;
  OrderConfirmation: { orderId: string };
  Orders: undefined;
  OrderDetails: { id: string; number: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

// Types `useNavigation()` and `<Link />` globally.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
