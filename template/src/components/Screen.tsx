import React, { type PropsWithChildren, type ReactElement } from 'react';
import {
  type RefreshControlProps,
  ScrollView,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';

import { makeStyles } from '@/theme';

export interface ScreenProps extends PropsWithChildren {
  /** Wrap the content in a ScrollView. */
  scroll?: boolean;
  /** Apply the default horizontal/vertical padding. */
  padded?: boolean;
  /** Safe area edges to respect. Screens below a header usually skip `top`. */
  edges?: Edge[];
  refreshControl?: ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['left', 'right'],
  refreshControl,
  contentStyle,
  testID,
}: ScreenProps) {
  const styles = useStyles();
  const content = [padded && styles.padded, contentStyle];

  return (
    <SafeAreaView edges={edges} style={styles.root} testID={testID}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={content}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, content]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const useStyles = makeStyles(theme => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  fill: {
    flex: 1,
  },
  padded: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
}));
