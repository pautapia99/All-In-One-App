import type { ComponentType } from 'react';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useColors } from '../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../lib/theme';
import type { IconProps } from './icons';

export type DashboardCardProps = {
  title: string;
  subtitle: string;
  icon: ComponentType<IconProps>;
  /** 'full' spans the whole row (icon + text side by side); 'half' stacks icon above text. */
  variant?: 'full' | 'half';
  /** Highlights the icon with the accent color/background, matching the design's "accentHighlights" state. */
  accent?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export function DashboardCard({
  title,
  subtitle,
  icon: Icon,
  variant = 'half',
  accent = false,
  onPress,
  style,
}: DashboardCardProps) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const isFull = variant === 'full';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isFull ? styles.cardFull : styles.cardHalf,
        style,
        pressed && styles.cardPressed,
      ]}
    >
      <View
        style={[
          styles.iconBox,
          isFull && styles.iconBoxFlexNone,
          { backgroundColor: accent ? colors.accentSoftBg : colors.surfaceHover },
        ]}
      >
        <Icon size={22} color={accent ? colors.accent500 : colors.iconDefault} strokeWidth={1.75} />
      </View>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      padding: spacing.lg,
    },
    cardFull: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md + 2,
    },
    cardHalf: {
      flexDirection: 'column',
      gap: spacing.sm + 2,
    },
    cardPressed: {
      transform: [{ scale: 0.97 }],
      backgroundColor: colors.surfaceHover,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: radii.icon,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBoxFlexNone: {
      flexShrink: 0,
    },
    title: {
      fontSize: typography.cardTitle.fontSize,
      fontWeight: typography.cardTitle.fontWeight,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: typography.cardSubtitle.fontSize,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
}
