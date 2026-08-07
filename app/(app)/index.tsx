import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import type { ComponentType } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DashboardCard } from '../../components/DashboardCard';
import {
  BarChartIcon,
  BookOpenIcon,
  CalendarIcon,
  ClockIcon,
  GiftIcon,
  ListChecksIcon,
  UsersIcon,
  type IconProps,
} from '../../components/icons';
import { useFamily } from '../../lib/FamilyProvider';
import { useProfile } from '../../lib/ProfileProvider';
import { supabase } from '../../lib/supabase';
import { colors, spacing, typography } from '../../lib/theme';

// Módulos de la app. `route` queda vacío a propósito: las pantallas de destino
// todavía no existen, así que por ahora solo registramos la navegación deseada.
type ModuleKey =
  | 'familia'
  | 'listas'
  | 'calendario'
  | 'cumpleanos'
  | 'presupuesto'
  | 'comidas'
  | 'recetas';

type ModuleConfig = {
  key: ModuleKey;
  title: string;
  subtitle: string;
  icon: ComponentType<IconProps>;
  span: 'full' | 'one';
  accent?: boolean;
};

// Datos de ejemplo (mock): cada módulo mostrará su propio resumen real una vez
// esté conectado a Supabase.
const MODULES: ModuleConfig[] = [
  {
    key: 'familia',
    title: 'Mi familia',
    subtitle: '', // se sustituye por el nº real de miembros al renderizar
    icon: UsersIcon,
    span: 'full',
  },
  {
    key: 'listas',
    title: 'Listas',
    subtitle: '2 listas activas',
    icon: ListChecksIcon,
    span: 'one',
  },
  {
    key: 'calendario',
    title: 'Calendario',
    subtitle: 'Próximo evento: hoy',
    icon: CalendarIcon,
    span: 'one',
    accent: true,
  },
  {
    key: 'cumpleanos',
    title: 'Cumpleaños',
    subtitle: 'Cumpleaños de Koda en 5 días',
    icon: GiftIcon,
    span: 'one',
    accent: true,
  },
  {
    key: 'presupuesto',
    title: 'Presupuesto',
    subtitle: 'Gastado este mes: 450 €',
    icon: BarChartIcon,
    span: 'one',
  },
  {
    key: 'comidas',
    title: 'Comidas',
    subtitle: 'Menú de esta semana',
    icon: ClockIcon,
    span: 'one',
  },
  {
    key: 'recetas',
    title: 'Recetas',
    subtitle: '12 recetas guardadas',
    icon: BookOpenIcon,
    span: 'full',
  },
];

const MAX_CONTENT_WIDTH = 640;
const HORIZONTAL_PADDING = 20;
const GRID_GAP = 13;

function useResponsiveGrid(windowWidth: number) {
  return useMemo(() => {
    const contentWidth = Math.min(windowWidth, MAX_CONTENT_WIDTH);
    const gridWidth = contentWidth - HORIZONTAL_PADDING * 2;

    // Más columnas a medida que hay más espacio (útil sobre todo en Web).
    const columns = gridWidth >= 760 ? 4 : gridWidth >= 460 ? 3 : 2;
    const itemWidth = (gridWidth - GRID_GAP * (columns - 1)) / columns;

    return { contentWidth, gridWidth, itemWidth };
  }, [windowWidth]);
}

export default function HomeScreen() {
  const router = useRouter();
  const { family, members } = useFamily();
  const { profile } = useProfile();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { contentWidth, gridWidth, itemWidth } = useResponsiveGrid(width);

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    []
  );

  const modules = useMemo(
    () =>
      MODULES.map((module) =>
        module.key === 'familia'
          ? {
              ...module,
              subtitle: `${members.length} ${members.length === 1 ? 'miembro' : 'miembros'}`,
            }
          : module
      ),
    [members.length]
  );

  function handleModulePress(key: ModuleKey) {
    if (key === 'familia') {
      router.push('/family');
      return;
    }
    // TODO: sustituir por router.push cuando exista cada pantalla.
    console.log(`[home] navegar a módulo: ${key}`);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <View style={[styles.content, { width: contentWidth, alignSelf: 'center' }]}>
          <View style={styles.header}>
            <Text style={styles.kicker}>{family?.name}</Text>
            <Text style={styles.greeting}>Hola, {profile?.alias}</Text>
            <Text style={styles.date}>{today}</Text>

            {/* Provisional: hasta que exista la pantalla de Ajustes, dejamos
                aquí un acceso mínimo para poder cerrar sesión. */}
            <Pressable
              onPress={() => supabase.auth.signOut()}
              style={styles.signOutButton}
              hitSlop={8}
            >
              <Text style={styles.signOutText}>Cerrar sesión</Text>
            </Pressable>
          </View>

          <View style={styles.divider} />

          <View style={[styles.grid, { width: gridWidth, gap: GRID_GAP }]}>
            {modules.map((module) => (
              <DashboardCard
                key={module.key}
                title={module.title}
                subtitle={module.subtitle}
                icon={module.icon}
                variant={module.span === 'full' ? 'full' : 'half'}
                accent={module.accent}
                onPress={() => handleModulePress(module.key)}
                style={{ width: module.span === 'full' ? gridWidth : itemWidth }}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    maxWidth: MAX_CONTENT_WIDTH,
  },
  header: {
    paddingTop: 26,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingBottom: 6,
  },
  kicker: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.kicker.fontWeight,
    fontSize: typography.kicker.fontSize,
    letterSpacing: typography.kicker.letterSpacing,
    textTransform: typography.kicker.textTransform,
    color: colors.accent500,
  },
  greeting: {
    fontFamily: typography.fontFamily,
    fontWeight: typography.h1.fontWeight,
    fontSize: typography.h1.fontSize,
    lineHeight: typography.h1.lineHeight,
    marginTop: spacing.sm,
    color: colors.textPrimary,
  },
  date: {
    fontSize: typography.dateLabel.fontSize,
    color: colors.neutral500,
    marginTop: 6,
    textTransform: 'capitalize',
  },
  signOutButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  signOutText: {
    fontSize: 12,
    color: colors.neutral500,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 2,
    backgroundColor: colors.divider,
    marginTop: spacing.lg + 2,
    marginHorizontal: HORIZONTAL_PADDING,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
    paddingTop: spacing.lg + 2,
    paddingBottom: spacing.xl - 4,
  },
});
