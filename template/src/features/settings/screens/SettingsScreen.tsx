import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '@/app/store/hooks';
import {
  Button,
  Card,
  Screen,
  SegmentedControl,
  type SegmentedOption,
  Text,
} from '@/components';
import { env } from '@/config';
import { logout, selectCurrentUser } from '@/features/auth/authSlice';
import { type LanguagePreference, SUPPORTED_LANGUAGES } from '@/i18n/languages';
import { makeStyles, type ThemePreference } from '@/theme';
import { testIDs } from '@/utils/testIDs';

import {
  languagePreferenceChanged,
  selectLanguagePreference,
  selectThemePreference,
  themePreferenceChanged,
} from '../settingsSlice';

const THEME_VALUES: ThemePreference[] = ['system', 'light', 'dark'];
const LANGUAGE_VALUES: LanguagePreference[] = [
  'system',
  ...SUPPORTED_LANGUAGES,
];

export function SettingsScreen() {
  const { t } = useTranslation();
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const themePreference = useAppSelector(selectThemePreference);
  const languagePreference = useAppSelector(selectLanguagePreference);

  const themeLabels: Record<ThemePreference, string> = {
    system: t('settings.themeSystem'),
    light: t('settings.themeLight'),
    dark: t('settings.themeDark'),
  };
  const themeOptions: SegmentedOption<ThemePreference>[] = THEME_VALUES.map(
    value => ({
      value,
      label: themeLabels[value],
      testID: testIDs.settings.themeOption(value),
    }),
  );

  const languageLabels: Record<LanguagePreference, string> = {
    system: t('settings.languageSystem'),
    en: t('languages.en'),
    'pt-BR': t('languages.ptBR'),
  };
  const languageOptions: SegmentedOption<LanguagePreference>[] =
    LANGUAGE_VALUES.map(value => ({
      value,
      label: languageLabels[value],
      testID: testIDs.settings.languageOption(value),
    }));

  return (
    <Screen scroll testID={testIDs.settings.screen}>
      <View style={styles.section}>
        <Text variant="label" tone="muted">
          {t('settings.appearance')}
        </Text>
        <SegmentedControl
          accessibilityLabel={t('settings.appearance')}
          options={themeOptions}
          value={themePreference}
          onChange={value => dispatch(themePreferenceChanged(value))}
        />
      </View>

      <View style={styles.section}>
        <Text variant="label" tone="muted">
          {t('settings.language')}
        </Text>
        <SegmentedControl
          accessibilityLabel={t('settings.language')}
          options={languageOptions}
          value={languagePreference}
          onChange={value => dispatch(languagePreferenceChanged(value))}
        />
      </View>

      <View style={styles.section}>
        <Text variant="label" tone="muted">
          {t('settings.about')}
        </Text>
        <Card>
          <InfoRow label={t('settings.environment')} value={env.name} />
          <InfoRow label={t('settings.apiUrl')} value={env.apiUrl} />
          <InfoRow
            label={t('settings.mockApi')}
            value={
              env.useMockApi ? t('settings.enabled') : t('settings.disabled')
            }
          />
        </Card>
      </View>

      <View style={styles.section}>
        <Text variant="label" tone="muted">
          {t('settings.account')}
        </Text>
        {user ? (
          <Text>{t('settings.signedInAs', { email: user.email })}</Text>
        ) : null}
        <Button
          title={t('settings.logout')}
          variant="danger"
          onPress={() => dispatch(logout())}
          testID={testIDs.settings.logoutButton}
        />
      </View>
    </Screen>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Text tone="muted">{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  section: {
    gap: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  rowValue: {
    flexShrink: 1,
  },
}));
