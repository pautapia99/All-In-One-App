import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ConfirmModal } from '../../../components/ConfirmModal';
import {
  CheckIcon,
  ChevronLeftIcon,
  ListChecksIcon,
  LockIcon,
  PlusIcon,
  ShoppingBagIcon,
  TagIcon,
  TrashIcon,
  UsersIcon,
  type IconProps,
} from '../../../components/icons';
import { useAuth } from '../../../lib/AuthProvider';
import { useColors } from '../../../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../../../lib/theme';
import { supabase } from '../../../lib/supabase';
import type { ListCategory, ListVisibility } from '../../../lib/useLists';
import type { ComponentType } from 'react';

type ListRow = {
  id: string;
  name: string;
  category: ListCategory;
  visibility: ListVisibility;
};

type ItemRow = {
  id: string;
  title: string;
  is_done: boolean;
  created_at: string;
};

const CATEGORY_ICON: Record<ListCategory, ComponentType<IconProps>> = {
  compra: ShoppingBagIcon,
  tareas: ListChecksIcon,
  otros: TagIcon,
};

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [list, setList] = useState<ListRow | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [confirmDeleteList, setConfirmDeleteList] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [{ data: listData, error: listError }, { data: itemsData, error: itemsError }] = await Promise.all([
        supabase.from('lists').select('id, name, category, visibility').eq('id', id).maybeSingle(),
        supabase
          .from('list_items')
          .select('id, title, is_done, created_at')
          .eq('list_id', id)
          .order('created_at', { ascending: true }),
      ]);
      if (listError) throw new Error(listError.message);
      if (itemsError) throw new Error(itemsError.message);
      setList((listData as ListRow) ?? null);
      setItems((itemsData ?? []) as ItemRow[]);
    } catch (err) {
      console.error('[list-detail]', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function toggleItem(item: ItemRow) {
    // Actualización optimista: se ve al instante, y si falla se revierte al recargar.
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_done: !i.is_done } : i)));
    const { error } = await supabase
      .from('list_items')
      .update({ is_done: !item.is_done })
      .eq('id', item.id);
    if (error) {
      console.error('[list-detail] toggle failed', error.message);
      refresh();
    }
  }

  async function addItem() {
    const title = newItemTitle.trim();
    if (!title || !id || !session) return;
    setNewItemTitle('');
    const { error } = await supabase
      .from('list_items')
      .insert({ list_id: id, title, created_by: session.user.id });
    if (error) {
      console.error('[list-detail] add item failed', error.message);
    }
    refresh();
  }

  async function deleteItem(itemId: string) {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    const { error } = await supabase.from('list_items').delete().eq('id', itemId);
    if (error) {
      console.error('[list-detail] delete item failed', error.message);
      refresh();
    }
  }

  async function handleDeleteList() {
    setConfirmDeleteList(false);
    if (!id) return;
    const { error } = await supabase.from('lists').delete().eq('id', id);
    if (error) {
      console.error('[list-detail] delete list failed', error.message);
      return;
    }
    router.back();
  }

  const CategoryIcon = list ? CATEGORY_ICON[list.category] : ListChecksIcon;
  const VisibilityIcon = list?.visibility === 'privada' ? LockIcon : UsersIcon;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
          <ChevronLeftIcon size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {list?.name ?? ''}
          </Text>
          {list && (
            <View style={styles.headerMetaRow}>
              <CategoryIcon size={12} color={colors.textMuted} strokeWidth={2} />
              <VisibilityIcon size={12} color={colors.textMuted} strokeWidth={2} />
              <Text style={styles.headerMetaText}>
                {list.visibility === 'privada' ? 'Privada' : 'Compartida'}
              </Text>
            </View>
          )}
        </View>
        <Pressable onPress={() => setConfirmDeleteList(true)} hitSlop={8} style={styles.headerButton}>
          <TrashIcon size={20} color={colors.textMuted} strokeWidth={1.75} />
        </Pressable>
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder="Añadir un elemento…"
          placeholderTextColor={colors.textMuted}
          value={newItemTitle}
          onChangeText={setNewItemTitle}
          onSubmitEditing={addItem}
          returnKeyType="done"
        />
        <Pressable
          onPress={addItem}
          style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
        >
          <PlusIcon size={18} color="#ffffff" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}>
        {!isLoading && items.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sin elementos todavía</Text>
            <Text style={styles.emptySubtitle}>Añade el primero arriba.</Text>
          </View>
        )}

        {items.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <Pressable
              onPress={() => toggleItem(item)}
              style={({ pressed }) => [styles.itemMain, pressed && styles.itemMainPressed]}
            >
              <View style={[styles.checkCircle, item.is_done && styles.checkCircleDone]}>
                {item.is_done && <CheckIcon size={13} color="#ffffff" strokeWidth={3} />}
              </View>
              <Text style={[styles.itemTitle, item.is_done && styles.itemTitleDone]}>{item.title}</Text>
            </Pressable>
            <Pressable onPress={() => deleteItem(item.id)} hitSlop={8}>
              <TrashIcon size={16} color={colors.textMuted} strokeWidth={1.75} />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <ConfirmModal
        visible={confirmDeleteList}
        title="¿Eliminar esta lista?"
        message="Se borrarán también todos sus elementos. Esta acción no se puede deshacer."
        confirmLabel="Eliminar lista"
        onConfirm={handleDeleteList}
        onCancel={() => setConfirmDeleteList(false)}
      />
    </KeyboardAvoidingView>
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
    headerButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleWrap: {
      flex: 1,
      alignItems: 'center',
    },
    headerTitle: {
      fontFamily: typography.fontFamily,
      fontWeight: typography.cardTitle.fontWeight,
      fontSize: 17,
      color: colors.textPrimary,
    },
    headerMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    headerMetaText: {
      fontSize: 11,
      color: colors.textMuted,
    },
    addRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
    },
    addInput: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      fontSize: 15,
      color: colors.textPrimary,
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: radii.icon,
      backgroundColor: colors.accent500,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonPressed: {
      backgroundColor: colors.accent600,
    },
    content: {
      paddingHorizontal: spacing.lg,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
      gap: 2,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    emptySubtitle: {
      fontSize: 13,
      color: colors.textMuted,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginBottom: spacing.xs,
    },
    itemMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    itemMainPressed: {
      opacity: 0.6,
    },
    checkCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.75,
      borderColor: colors.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkCircleDone: {
      backgroundColor: colors.accent500,
      borderColor: colors.accent500,
    },
    itemTitle: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
    },
    itemTitleDone: {
      color: colors.textMuted,
      textDecorationLine: 'line-through',
    },
  });
}
