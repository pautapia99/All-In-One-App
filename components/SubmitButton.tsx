import { Pressable, StyleSheet, Text } from 'react-native';

import { accent500, accent600, neutral100, radii } from '../lib/theme';

export type SubmitButtonProps = {
  title: string;
  loading?: boolean;
  onPress: () => void;
};

export function SubmitButton({ title, loading, onPress }: SubmitButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        pressed && !loading && styles.pressed,
        loading && styles.disabled,
      ]}
    >
      <Text style={styles.text}>{loading ? 'Un momento…' : title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: accent500,
    borderRadius: radii.card,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: accent600,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: neutral100,
    fontSize: 16,
    fontWeight: '700',
  },
});
