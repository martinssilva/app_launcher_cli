import React, { useState } from 'react';
import {
  Image,
  type ImageStyle,
  type StyleProp,
  View,
  type ViewStyle,
} from 'react-native';

import BagIcon from '@/assets/icons/bag.svg';
import { makeStyles, useTheme } from '@/theme';

interface ProductImageProps {
  uri: string | null | undefined;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/**
 * Remote product photo with a themed placeholder while there is no image (or
 * it failed to load, e.g. offline). React Native's `Image` already caches
 * downloads (NSURLCache on iOS, Fresco on Android).
 */
export function ProductImage({
  uri,
  style,
  accessibilityLabel,
}: ProductImageProps) {
  const theme = useTheme();
  const styles = useStyles();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = Boolean(uri) && failedUri !== uri;

  return (
    <View
      style={[styles.container, style]}
      accessible={Boolean(accessibilityLabel)}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
    >
      <BagIcon color={theme.colors.textMuted} width="30%" height="30%" />
      {showImage ? (
        <Image
          source={{ uri: uri as string }}
          style={styles.image as StyleProp<ImageStyle>}
          resizeMode="cover"
          onError={() => setFailedUri(uri ?? null)}
          accessibilityIgnoresInvertColors
        />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(theme => ({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceVariant,
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}));
