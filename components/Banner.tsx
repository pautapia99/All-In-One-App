import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '../lib/ThemeProvider';
import { accentSoftBg, radii, spacing, type ColorPalette } from '../lib/theme';

export type BannerProps = {
  type: 'error' | 'success';
  message: string;
};

export function Banner({ type, message }: BannerProps) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={[styles.banner, type === 'error' ? styles.error : styles.success]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    banner: {
      borderRadius: radii.card,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    error: {
      backgroundColor: accentSoftBg,
    },
    success: {
      backgroundColor: 'rgba(74,222,128,0.16)',
    },
    text: {
      fontSize: 13,
      color: colors.textPrimary,
    },
  });
}
