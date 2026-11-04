import React, { type PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';

import LogoIcon from '@/assets/icons/logo.svg';
import { Screen, Text } from '@/components';
import { makeStyles, useTheme } from '@/theme';

interface AuthLayoutProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  /** `false` for screens without a navigation header (they handle the top inset). */
  withHeader?: boolean;
  testID: string;
}

/** Shared layout of the signed-out screens (login, sign-up, password recovery). */
export function AuthLayout({
  title,
  subtitle,
  showLogo = false,
  withHeader = true,
  testID,
  children,
}: AuthLayoutProps) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen
        scroll
        edges={
          withHeader
            ? ['bottom', 'left', 'right']
            : ['top', 'bottom', 'left', 'right']
        }
        contentStyle={styles.content}
        testID={testID}
      >
        <View style={styles.header}>
          {showLogo ? (
            <LogoIcon width={64} height={64} color={theme.colors.primary} />
          ) : null}
          <Text variant="title" align="center">
            {title}
          </Text>
          {subtitle ? (
            <Text tone="muted" align="center">
              {subtitle}
            </Text>
          ) : null}
        </View>
        {children}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles(theme => ({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
}));
