import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EventFormSheet, type EventFormValues } from '../../../components/EventFormSheet';
import { ChevronLeftIcon, ChevronRightIcon, LockIcon, PlusIcon, UsersIcon } from '../../../components/icons';
import { useColors } from '../../../lib/ThemeProvider';
import {
  addDays,
  addMonths,
  buildAllDayEnd,
  buildAllDayStart,
  buildDateTime,
  buildMonthGrid,
  daysInMonth,
  isoDateOf,
  isSameDay,
  minutesFromMidnight,
  startOfDay,
  startOfWeek,
  timeOf,
  toDateKey,
} from '../../../lib/calendarUtils';
import { radii, spacing, typography, type ColorPalette } from '../../../lib/theme';
import { useEvents, type CalendarEvent } from '../../../lib/useEvents';

type ViewMode = 'mensual' | 'semanal' | 'diario';

const VIEW_OPTIONS: { key: ViewMode; label: string }[] = [
  { key: 'mensual', label: 'Mensual' },
  { key: 'semanal', label: 'Semanal' },
  { key: 'diario', label: 'Diario' },
];

const WEEKDAY_SHORT = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAY_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const MONTH_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const HOUR_HEIGHT = 52;
const GUTTER_WIDTH = 36;
const DAY_COL_WIDTH = 92;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { width, height } = useWindowDimensions();
  const { events, refresh, createEvent, updateEvent, deleteEvent } = useEvents();

  // Igual que en Listas: la pantalla queda montada al abrir el formulario, así
  // que sin esto los cambios no se reflejarían al volver a esta pantalla.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const [viewMode, setViewMode] = useState<ViewMode>('mensual');
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  function goToday() {
    setSelectedDay(startOfDay(new Date()));
  }

  function shift(delta: number) {
    setSelectedDay((current) => {
      if (viewMode === 'mensual') {
        const day = current.getDate();
        const next = addMonths(current, delta);
        const clampedDay = Math.min(day, daysInMonth(next.getFullYear(), next.getMonth()));
        return new Date(next.getFullYear(), next.getMonth(), clampedDay);
      }
      if (viewMode === 'semanal') {
        return addDays(current, delta * 7);
      }
      return addDays(current, delta);
    });
  }

  const monthGrid = useMemo(() => buildMonthGrid(selectedDay), [selectedDay]);
  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDay);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDay]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const start = startOfDay(new Date(event.start_at));
      const end = startOfDay(new Date(event.end_at));
      for (let d = start; d.getTime() <= end.getTime(); d = addDays(d, 1)) {
        const key = toDateKey(d);
        const list = map.get(key) ?? [];
        list.push(event);
        map.set(key, list);
      }
    }
    return map;
  }, [events]);

  const eventsOnDay = useCallback(
    (day: Date) =>
      (eventsByDay.get(toDateKey(day)) ?? []).slice().sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()),
    [eventsByDay]
  );

  const headerLabel = useMemo(() => {
    if (viewMode === 'mensual') {
      return `${MONTH_NAMES[selectedDay.getMonth()]} ${selectedDay.getFullYear()}`;
    }
    if (viewMode === 'semanal') {
      const start = startOfWeek(selectedDay);
      const end = addDays(start, 6);
      const sameMonth = start.getMonth() === end.getMonth();
      const startLabel = sameMonth ? `${start.getDate()}` : `${start.getDate()} ${MONTH_SHORT[start.getMonth()]}`;
      const endLabel = `${end.getDate()} ${MONTH_SHORT[end.getMonth()]} ${end.getFullYear()}`;
      return `${startLabel} - ${endLabel}`;
    }
    return `${WEEKDAY_FULL[(selectedDay.getDay() + 6) % 7]}, ${selectedDay.getDate()} de ${MONTH_NAMES[
      selectedDay.getMonth()
    ].toLowerCase()}`;
  }, [viewMode, selectedDay]);

  function openCreateSheet() {
    setEditingEvent(null);
    setSheetOpen(true);
  }

  function openEditSheet(event: CalendarEvent) {
    setEditingEvent(event);
    setSheetOpen(true);
  }

  async function handleSubmit(values: EventFormValues) {
    const payload = values.isAllDay
      ? {
          title: values.title,
          start_at: buildAllDayStart(values.dateIso),
          end_at: buildAllDayEnd(values.dateIso),
          is_all_day: true,
          visibility: values.visibility,
        }
      : {
          title: values.title,
          start_at: buildDateTime(values.dateIso, values.startTime),
          end_at: buildDateTime(values.dateIso, values.endTime),
          is_all_day: false,
          visibility: values.visibility,
        };

    if (editingEvent) {
      await updateEvent(editingEvent.id, payload);
    } else {
      await createEvent(payload);
    }
  }

  async function handleDelete() {
    if (!editingEvent) return;
    await deleteEvent(editingEvent.id);
  }

  const initialFormValues: EventFormValues = editingEvent
    ? {
        title: editingEvent.title,
        dateIso: isoDateOf(editingEvent.start_at),
        isAllDay: editingEvent.is_all_day,
        startTime: timeOf(editingEvent.start_at),
        endTime: timeOf(editingEvent.end_at),
        visibility: editingEvent.visibility,
      }
    : {
        title: '',
        dateIso: toDateKey(selectedDay),
        isAllDay: false,
        startTime: '09:00',
        endTime: '10:00',
        visibility: 'compartido',
      };

  // Deja sitio a header + selector + fila de navegación para que la franja
  // horaria (semanal/diario) haga scroll dentro del espacio que le queda, en
  // vez de intentar crecer más allá de la pantalla.
  const timelineHeight = Math.max(280, height - insets.top - insets.bottom - 210);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.headerButton}>
          <ChevronLeftIcon size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Calendario</Text>
        <Pressable onPress={openCreateSheet} hitSlop={8} style={styles.headerButton}>
          <PlusIcon size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.viewSelector}>
        {VIEW_OPTIONS.map(({ key, label }) => {
          const active = viewMode === key;
          return (
            <Pressable
              key={key}
              onPress={() => setViewMode(key)}
              style={[styles.viewPill, active && styles.viewPillActive]}
            >
              <Text style={[styles.viewPillText, active && styles.viewPillTextActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.navRow}>
        <Pressable onPress={() => shift(-1)} style={styles.navButton} hitSlop={6}>
          <ChevronLeftIcon size={16} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.navLabel} numberOfLines={1}>
          {headerLabel}
        </Text>
        <Pressable onPress={goToday} style={styles.todayButton}>
          <Text style={styles.todayButtonText}>Hoy</Text>
        </Pressable>
        <Pressable onPress={() => shift(1)} style={styles.navButton} hitSlop={6}>
          <ChevronRightIcon size={16} color={colors.textPrimary} />
        </Pressable>
      </View>

      {viewMode === 'mensual' && (
        <MonthView
          colors={colors}
          styles={styles}
          monthGrid={monthGrid}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          eventsOnDay={eventsOnDay}
          onPressEvent={openEditSheet}
        />
      )}
      {viewMode === 'semanal' && (
        <WeekView
          colors={colors}
          styles={styles}
          days={weekDays}
          eventsOnDay={eventsOnDay}
          onPressEvent={openEditSheet}
          timelineHeight={timelineHeight}
          screenWidth={width}
        />
      )}
      {viewMode === 'diario' && (
        <WeekView
          colors={colors}
          styles={styles}
          days={[selectedDay]}
          eventsOnDay={eventsOnDay}
          onPressEvent={openEditSheet}
          timelineHeight={timelineHeight}
          screenWidth={width}
          singleDay
        />
      )}

      <EventFormSheet
        visible={sheetOpen}
        initialValues={initialFormValues}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editingEvent ? handleDelete : undefined}
      />
    </View>
  );
}

type Styles = ReturnType<typeof getStyles>;

function MonthView({
  colors,
  styles,
  monthGrid,
  selectedDay,
  onSelectDay,
  eventsOnDay,
  onPressEvent,
}: {
  colors: ColorPalette;
  styles: Styles;
  monthGrid: Date[];
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  eventsOnDay: (day: Date) => CalendarEvent[];
  onPressEvent: (event: CalendarEvent) => void;
}) {
  const currentMonth = selectedDay.getMonth();
  const today = startOfDay(new Date());
  const selectedEvents = eventsOnDay(selectedDay);

  return (
    <ScrollView contentContainerStyle={styles.monthContent}>
      <View style={styles.weekdayRow}>
        {WEEKDAY_SHORT.map((label, index) => (
          <Text key={`${label}-${index}`} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.monthGrid}>
        {monthGrid.map((day, index) => {
          const inCurrentMonth = day.getMonth() === currentMonth;
          const isSelected = isSameDay(day, selectedDay);
          const isToday = isSameDay(day, today);
          const hasEvents = eventsOnDay(day).length > 0;
          return (
            <Pressable key={index} onPress={() => onSelectDay(day)} style={styles.monthCell}>
              <View
                style={[
                  styles.monthDayCircle,
                  isSelected && styles.monthDayCircleSelected,
                  isToday && !isSelected && styles.monthDayCircleToday,
                ]}
              >
                <Text
                  style={[
                    styles.monthDayText,
                    !inCurrentMonth && styles.monthDayTextMuted,
                    isSelected && styles.monthDayTextSelected,
                  ]}
                >
                  {day.getDate()}
                </Text>
              </View>
              {hasEvents && <View style={[styles.eventDot, isSelected && styles.eventDotSelected]} />}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.dayEventsSection}>
        <Text style={styles.dayEventsTitle}>
          {WEEKDAY_FULL[(selectedDay.getDay() + 6) % 7]}, {selectedDay.getDate()} de{' '}
          {MONTH_NAMES[selectedDay.getMonth()].toLowerCase()}
        </Text>
        {selectedEvents.length === 0 ? (
          <Text style={styles.dayEventsEmpty}>Sin eventos este día.</Text>
        ) : (
          selectedEvents.map((event) => (
            <EventListRow key={event.id} event={event} colors={colors} styles={styles} onPress={() => onPressEvent(event)} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function EventListRow({
  event,
  colors,
  styles,
  onPress,
}: {
  event: CalendarEvent;
  colors: ColorPalette;
  styles: Styles;
  onPress: () => void;
}) {
  const VisibilityIcon = event.visibility === 'privado' ? LockIcon : UsersIcon;
  const timeLabel = event.is_all_day ? 'Todo el día' : `${timeOf(event.start_at)} - ${timeOf(event.end_at)}`;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.eventRow, pressed && styles.eventRowPressed]}>
      <View style={styles.eventRowAccent} />
      <View style={styles.eventRowBody}>
        <Text style={styles.eventRowTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.eventRowMetaRow}>
          <Text style={styles.eventRowMeta}>{timeLabel}</Text>
          <VisibilityIcon size={11} color={colors.textMuted} strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
}

function WeekView({
  styles,
  days,
  eventsOnDay,
  onPressEvent,
  timelineHeight,
  screenWidth,
  singleDay,
}: {
  colors: ColorPalette;
  styles: Styles;
  days: Date[];
  eventsOnDay: (day: Date) => CalendarEvent[];
  onPressEvent: (event: CalendarEvent) => void;
  timelineHeight: number;
  screenWidth: number;
  singleDay?: boolean;
}) {
  const today = startOfDay(new Date());
  const colWidth = singleDay ? Math.max(240, screenWidth - GUTTER_WIDTH - spacing.lg * 2) : DAY_COL_WIDTH;

  const allDayEventsByDay = days.map((day) => eventsOnDay(day).filter((e) => e.is_all_day));
  const timedEventsByDay = days.map((day) => eventsOnDay(day).filter((e) => !e.is_all_day));
  const hasAnyAllDay = allDayEventsByDay.some((list) => list.length > 0);

  return (
    <View style={styles.weekViewRoot}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekHorizontalScroll}>
        <View style={{ width: GUTTER_WIDTH + colWidth * days.length }}>
          <View style={styles.weekHeaderRow}>
            <View style={{ width: GUTTER_WIDTH }} />
            {days.map((day, index) => {
              const isToday = isSameDay(day, today);
              return (
                <View key={index} style={[styles.weekHeaderCell, { width: colWidth }]}>
                  <Text style={styles.weekHeaderWeekday}>{WEEKDAY_SHORT[(day.getDay() + 6) % 7]}</Text>
                  <View style={[styles.weekHeaderDayCircle, isToday && styles.weekHeaderDayCircleToday]}>
                    <Text style={[styles.weekHeaderDayNumber, isToday && styles.weekHeaderDayNumberToday]}>
                      {day.getDate()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {hasAnyAllDay && (
            <View style={styles.allDayRow}>
              <View style={{ width: GUTTER_WIDTH }} />
              {days.map((day, index) => (
                <View key={index} style={[styles.allDayCell, { width: colWidth }]}>
                  {allDayEventsByDay[index].map((event) => (
                    <Pressable key={event.id} onPress={() => onPressEvent(event)} style={styles.allDayChip}>
                      <Text style={styles.allDayChipText} numberOfLines={1}>
                        {event.title}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          )}

          <ScrollView style={[styles.timelineScroll, { height: timelineHeight }]} showsVerticalScrollIndicator={false}>
            <View style={styles.timelineRow}>
              <View style={{ width: GUTTER_WIDTH }}>
                {HOURS.map((hour) => (
                  <View key={hour} style={[styles.hourLabelRow, { height: HOUR_HEIGHT }]}>
                    <Text style={styles.hourLabelText}>{hour.toString().padStart(2, '0')}:00</Text>
                  </View>
                ))}
              </View>
              {days.map((day, dayIndex) => (
                <View key={dayIndex} style={[styles.dayColumn, { width: colWidth, height: HOUR_HEIGHT * 24 }]}>
                  {HOURS.map((hour) => (
                    <View key={hour} style={[styles.hourGridLine, { top: hour * HOUR_HEIGHT }]} />
                  ))}
                  {timedEventsByDay[dayIndex].map((event) => {
                    const top = (minutesFromMidnight(event.start_at) / 60) * HOUR_HEIGHT;
                    const durationMinutes = Math.max(
                      30,
                      (new Date(event.end_at).getTime() - new Date(event.start_at).getTime()) / 60000
                    );
                    const eventHeight = (durationMinutes / 60) * HOUR_HEIGHT;
                    return (
                      <Pressable
                        key={event.id}
                        onPress={() => onPressEvent(event)}
                        style={[styles.timedEvent, { top, height: eventHeight }]}
                      >
                        <Text style={styles.timedEventText} numberOfLines={2}>
                          {event.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
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
    headerButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
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
    viewSelector: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    viewPill: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radii.pill,
      backgroundColor: colors.surface,
    },
    viewPillActive: {
      backgroundColor: colors.accent500,
    },
    viewPillText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
    },
    viewPillTextActive: {
      color: '#ffffff',
    },
    navRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    navButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surfaceHover,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navLabel: {
      flex: 1,
      textAlign: 'center',
      fontFamily: typography.fontFamily,
      fontWeight: '700',
      fontSize: 14,
      color: colors.textPrimary,
      textTransform: 'capitalize',
    },
    todayButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radii.pill,
      backgroundColor: colors.surfaceHover,
    },
    todayButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },

    // ── Vista mensual ──
    monthContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
    },
    weekdayRow: {
      flexDirection: 'row',
    },
    weekdayLabel: {
      width: `${100 / 7}%`,
      textAlign: 'center',
      fontSize: 11,
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    monthCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthDayCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthDayCircleSelected: {
      backgroundColor: colors.accent500,
    },
    monthDayCircleToday: {
      borderWidth: 1.5,
      borderColor: colors.accent500,
    },
    monthDayText: {
      fontSize: 13,
      color: colors.textPrimary,
    },
    monthDayTextMuted: {
      color: colors.textMuted,
      opacity: 0.6,
    },
    monthDayTextSelected: {
      color: '#ffffff',
      fontWeight: '700',
    },
    eventDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.accent500,
      marginTop: 3,
    },
    eventDotSelected: {
      backgroundColor: colors.accent500,
    },
    dayEventsSection: {
      marginTop: spacing.lg,
      gap: spacing.xs,
    },
    dayEventsTitle: {
      fontFamily: typography.fontFamily,
      fontWeight: '700',
      fontSize: 14,
      color: colors.textPrimary,
      textTransform: 'capitalize',
      marginBottom: spacing.xs,
    },
    dayEventsEmpty: {
      fontSize: 13,
      color: colors.textMuted,
    },
    eventRow: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      overflow: 'hidden',
      marginBottom: spacing.xs,
    },
    eventRowPressed: {
      backgroundColor: colors.surfaceHover,
    },
    eventRowAccent: {
      width: 4,
      backgroundColor: colors.accent500,
    },
    eventRowBody: {
      flex: 1,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    eventRowTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    eventRowMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    eventRowMeta: {
      fontSize: 12,
      color: colors.textMuted,
    },

    // ── Vistas semanal / diaria ──
    weekViewRoot: {
      flex: 1,
    },
    weekHorizontalScroll: {
      flex: 1,
    },
    weekHeaderRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
    },
    weekHeaderCell: {
      alignItems: 'center',
      paddingBottom: spacing.xs,
    },
    weekHeaderWeekday: {
      fontSize: 11,
      color: colors.textMuted,
    },
    weekHeaderDayCircle: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    weekHeaderDayCircleToday: {
      backgroundColor: colors.accent500,
    },
    weekHeaderDayNumber: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    weekHeaderDayNumberToday: {
      color: '#ffffff',
    },
    allDayRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider2,
    },
    allDayCell: {
      paddingHorizontal: 2,
      gap: 2,
    },
    allDayChip: {
      backgroundColor: colors.accentSoftBg,
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    allDayChipText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.accent500,
    },
    timelineScroll: {
      paddingHorizontal: spacing.lg,
    },
    timelineRow: {
      flexDirection: 'row',
    },
    hourLabelRow: {
      alignItems: 'flex-end',
      paddingRight: 4,
    },
    hourLabelText: {
      fontSize: 10,
      color: colors.textMuted,
      transform: [{ translateY: -6 }],
    },
    dayColumn: {
      position: 'relative',
      borderLeftWidth: 1,
      borderLeftColor: colors.divider2,
    },
    hourGridLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: colors.divider2,
    },
    timedEvent: {
      position: 'absolute',
      left: 3,
      right: 3,
      backgroundColor: colors.accentSoftBg,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent500,
      paddingHorizontal: 6,
      paddingVertical: 3,
      overflow: 'hidden',
    },
    timedEventText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textPrimary,
    },
  });
}
