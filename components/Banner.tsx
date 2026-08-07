import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '../lib/theme';

export type BannerProps = {
  type: 'error' | 'success';
  message: string;
};

export function Banner({ type, message }: BannerProps) {
  return (
    <View style={[styles.banner, type === 'error' ? styles.error : styles.success]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  error: {
    backgroundColor: colors.accentSoftBg,
  },
  success: {
    backgroundColor: 'rgba(74,222,128,0.16)',
  },
  text: {
    fontSize: 13,
    color: colors.textPrimary,
  },
});
