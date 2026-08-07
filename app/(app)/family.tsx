import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChevronLeftIcon, CopyIcon, ShareIcon } from '../../components/icons';
import { useAuth } from '../../lib/AuthProvider';
import { useFamily } from '../../lib/FamilyProvider';
import { useColors } from '../../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../../lib/theme';

export default function FamilyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { family, members } = useFamily();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const [copied, setCopied] = useState(false);

  if (!family) {
    // El layout ya garantiza que solo se llega aquí con familia, pero por
    // seguridad frente a estados intermedios evitamos renderizar sobre null.
    return null;
  }

  async function handleCopy() {
    await Clipboard.setStringAsync(family!.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    try {
      await Share.share({
        message: `Únete a nuestra familia "${family!.name}" en la app con el código: ${family!.invite_code}`,
      });
    } catch (err) {
      console.error('[family] share failed', err);
    }
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backButton}>
          <ChevronLeftIcon size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Mi familia</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Text style={styles.familyName}>{family.name}</Text>
        <Text style={styles.memberCount}>
          {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
        </Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Código de invitación</Text>
          <Text style={styles.code}>{family.invite_code}</Text>
          <View style={styles.codeActions}>
            <Pressable
              onPress={handleCopy}
              style={({ pressed }) => [styles.codeActionButton, pressed && styles.codeActionButtonPressed]}
            >
              <CopyIcon size={16} color={colors.iconDefault} strokeWidth={2} />
              <Text style={styles.codeActionText}>{copied ? 'Copiado' : 'Copiar código'}</Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [styles.codeActionButton, pressed && styles.codeActionButtonPressed]}
            >
              <ShareIcon size={16} color={colors.iconDefault} strokeWidth={2} />
              <Text style={styles.codeActionText}>Compartir</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Miembros</Text>
        <View style={styles.membersList}>
          {members.map((member, index) => (
            <View
              key={member.user_id}
              style={[styles.memberRow, index === members.length - 1 && styles.memberRowLast]}
            >
              <View style={styles.memberAvatar}>
                <Text style={styles.memberAvatarText}>
                  {(member.email ?? '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberEmail}>
                  {member.email ?? 'Usuario'}
                  {member.user_id === session?.user.id ? ' (Tú)' : ''}
                </Text>
                <Text style={styles.memberJoined}>
                  Se unió el{' '}
                  {new Date(member.joined_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    backButton: {
      width: 32,
      height: 32,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontFamily: typography.fontFamily,
      fontWeight: typography.cardTitle.fontWeight,
      fontSize: 17,
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 32,
    },
    content: {
      paddingHorizontal: spacing.lg,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
    },
    familyName: {
      fontFamily: typography.fontFamily,
      fontWeight: typography.h1.fontWeight,
      fontSize: 26,
      color: colors.textPrimary,
      marginTop: spacing.md,
    },
    memberCount: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 4,
    },
    codeCard: {
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      padding: spacing.lg,
      marginTop: spacing.xl - 4,
      alignItems: 'center',
    },
    codeLabel: {
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.textMuted,
      fontWeight: '700',
    },
    code: {
      fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
      fontSize: 32,
      letterSpacing: 8,
      fontWeight: '700',
      color: colors.accent500,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    codeActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    codeActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surfaceHover,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    codeActionButtonPressed: {
      opacity: 0.75,
    },
    codeActionText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    sectionTitle: {
      fontFamily: typography.fontFamily,
      fontWeight: '700',
      fontSize: 13,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      color: colors.textMuted,
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    membersList: {
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      paddingHorizontal: spacing.lg,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider2,
    },
    memberRowLast: {
      borderBottomWidth: 0,
    },
    memberAvatar: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surfaceHover,
      alignItems: 'center',
      justifyContent: 'center',
    },
    memberAvatarText: {
      fontFamily: typography.fontFamily,
      fontWeight: '800',
      fontSize: 15,
      color: colors.textPrimary,
    },
    memberInfo: {
      flex: 1,
    },
    memberEmail: {
      fontSize: 14.5,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    memberJoined: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
}
