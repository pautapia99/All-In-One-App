import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { FamilyProvider, useFamily } from '../../lib/FamilyProvider';
import { colors } from '../../lib/theme';

function AppNavigator() {
  const { family, isLoading } = useFamily();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent500} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!family}>
        <Stack.Screen name="index" />
        <Stack.Screen name="family" />
      </Stack.Protected>

      <Stack.Protected guard={!family}>
        <Stack.Screen name="family-setup" />
      </Stack.Protected>
    </Stack>
  );
}

export default function AppLayout() {
  return (
    <FamilyProvider>
      <AppNavigator />
    </FamilyProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
