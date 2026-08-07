import { Stack } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { FamilyProvider, useFamily } from '../../lib/FamilyProvider';
import { ProfileProvider, useProfile } from '../../lib/ProfileProvider';
import { colors } from '../../lib/theme';

function AppNavigator() {
  const { profile, isLoading: profileLoading } = useProfile();
  const { family, isLoading: familyLoading } = useFamily();

  if (profileLoading || familyLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent500} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!profile}>
        <Stack.Screen name="profile-setup" />
      </Stack.Protected>

      <Stack.Protected guard={!!profile && !family}>
        <Stack.Screen name="family-setup" />
      </Stack.Protected>

      <Stack.Protected guard={!!profile && !!family}>
        <Stack.Screen name="index" />
        <Stack.Screen name="family" />
      </Stack.Protected>
    </Stack>
  );
}

export default function AppLayout() {
  return (
    <ProfileProvider>
      <FamilyProvider>
        <AppNavigator />
      </FamilyProvider>
    </ProfileProvider>
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
