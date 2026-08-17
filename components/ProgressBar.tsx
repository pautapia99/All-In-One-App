import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { useColors } from '../lib/ThemeProvider';
import type { ColorPalette } from '../lib/theme';

export type ProgressBarProps = {
  /** 0..1 fraction filled; values above 1 just render a full bar. */
  progress: number;
  color: string;
  height?: number;
};

export function ProgressBar({ progress, color, height = 8 }: ProgressBarProps) {
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const pct = Math.max(0, Math.min(1, progress)) * 100;

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      {pct > 0 && (
        <View
          style={[
            styles.fill,
            { width: `${pct}%`, height, borderRadius: height / 2, backgroundColor: color },
          ]}
        />
      )}
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    track: {
      width: '100%',
      backgroundColor: colors.surfaceHover,
      overflow: 'hidden',
    },
    fill: {
      minWidth: 4,
    },
  });
}
