import React from 'react';
import { View } from 'react-native';

import { makeStyles } from '@/theme';

interface ProgressBarProps {
  /** 0 to 1. */
  progress: number;
  testID?: string;
}

export function ProgressBar({ progress, testID }: ProgressBarProps) {
  const styles = useStyles();
  const percent = Math.round(Math.min(Math.max(progress, 0), 1) * 100);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.track}
      testID={testID}
    >
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  track: {
    height: 6,
    overflow: 'hidden',
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.surfaceVariant,
  },
  fill: {
    height: '100%',
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.primary,
  },
}));
