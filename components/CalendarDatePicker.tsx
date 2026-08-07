import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { useColors } from '../lib/ThemeProvider';
import { radii, spacing, typography, type ColorPalette } from '../lib/theme';

export type CalendarDatePickerProps = {
  /** ISO date ('YYYY-MM-DD') or null if not set yet. */
  value: string | null;
  onChange: (isoDate: string) => void;
};

const WEEKDAY_LABELS = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'];
const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];
const MONTH_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const TODAY = new Date();
const CURRENT_YEAR = TODAY.getFullYear();
const MIN_YEAR = CURRENT_YEAR - 110;
const MAX_YEAR = CURRENT_YEAR;

type ParsedDate = { year: number; month: number; day: number }; // month: 0-11

function parseIso(value: string | null): ParsedDate | null {
  if (value) {
    const [year, month, day] = value.split('-').map(Number);
    if (year && month && day) return { year, month: month - 1, day };
  }
  return null;
}

function toIso(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, '0')}-${(month + 1).toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
}

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Monday-first weekday index (0=Mon..6=Sun) for the 1st of the given month. */
function firstWeekdayIndex(year: number, month: number): number {
  const jsDay = new Date(year, month, 1).getDay(); // 0=Sun..6=Sat
  return (jsDay + 6) % 7;
}

type Cell = { day: number; month: number; year: number; inCurrentMonth: boolean };

function buildGrid(viewYear: number, viewMonth: number): Cell[] {
  const lead = firstWeekdayIndex(viewYear, viewMonth);
  const total = daysInMonth(viewYear, viewMonth);
  const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
  const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
  const prevTotal = daysInMonth(prevYear, prevMonth);
  const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;

  const cells: Cell[] = [];
  for (let i = lead - 1; i >= 0; i--) {
    cells.push({ day: prevTotal - i, month: prevMonth, year: prevYear, inCurrentMonth: false });
  }
  for (let d = 1; d <= total; d++) {
    cells.push({ day: d, month: viewMonth, year: viewYear, inCurrentMonth: true });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    cells.push({ day: nextDay, month: nextMonth, year: nextYear, inCurrentMonth: false });
    nextDay++;
  }
  return cells;
}

type Level = 'day' | 'month' | 'year';

export function CalendarDatePicker({ value, onChange }: CalendarDatePickerProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const selected = parseIso(value);

  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<Level>('day');
  const [viewYear, setViewYear] = useState(selected?.year ?? CURRENT_YEAR - 25);
  const [viewMonth, setViewMonth] = useState(selected?.month ?? 0);

  const grid = useMemo(() => buildGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  function openPicker() {
    setViewYear(selected?.year ?? CURRENT_YEAR - 25);
    setViewMonth(selected?.month ?? 0);
    setLevel('day');
    setOpen(true);
  }

  function selectDate(year: number, month: number, day: number) {
    onChange(toIso(year, month, day));
    setOpen(false);
  }

  function goToday() {
    setViewYear(CURRENT_YEAR);
    setViewMonth(TODAY.getMonth());
    setLevel('day');
  }

  function shiftMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  }

  function shiftYear(delta: number) {
    setViewYear((y) => Math.min(MAX_YEAR, Math.max(MIN_YEAR, y + delta)));
  }

  const displayLabel = selected
    ? capitalizeFirst(`${selected.day} de ${MONTH_NAMES[selected.month]} de ${selected.year}`)
    : 'Selecciona una fecha';

  return (
    <View>
      <Pressable onPress={openPicker} style={styles.field}>
        <CalendarIcon size={18} color={colors.iconDefault} strokeWidth={1.75} />
        <Text style={[styles.fieldText, !selected && styles.fieldPlaceholder]}>{displayLabel}</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetTitleRow}>
              <Text style={styles.sheetTitle}>Fecha de nacimiento</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Cerrar</Text>
              </Pressable>
            </View>

            {level === 'day' && (
            <>
              <View style={styles.header}>
                <Pressable onPress={() => shiftMonth(-1)} style={styles.navButton} hitSlop={6}>
                  <ChevronLeftIcon size={16} color={colors.textPrimary} />
                </Pressable>
                <Pressable onPress={() => setLevel('month')} style={styles.headerLabelButton}>
                  <Text style={styles.headerLabel}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </Text>
                </Pressable>
                <Pressable onPress={goToday} style={styles.todayButton}>
                  <Text style={styles.todayButtonText}>Hoy</Text>
                </Pressable>
                <Pressable onPress={() => shiftMonth(1)} style={styles.navButton} hitSlop={6}>
                  <ChevronRightIcon size={16} color={colors.textPrimary} />
                </Pressable>
              </View>

              <View style={styles.weekdayRow}>
                {WEEKDAY_LABELS.map((label) => (
                  <Text key={label} style={styles.weekdayLabel}>
                    {label}
                  </Text>
                ))}
              </View>

              <View style={styles.daysGrid}>
                {grid.map((cell, index) => {
                  const isSelected =
                    !!selected &&
                    selected.year === cell.year &&
                    selected.month === cell.month &&
                    selected.day === cell.day;
                  const isToday =
                    cell.year === CURRENT_YEAR &&
                    cell.month === TODAY.getMonth() &&
                    cell.day === TODAY.getDate();

                  return (
                    <Pressable
                      key={index}
                      onPress={() => selectDate(cell.year, cell.month, cell.day)}
                      style={styles.dayCell}
                    >
                      <View
                        style={[
                          styles.dayCircle,
                          isSelected && styles.dayCircleSelected,
                          isToday && !isSelected && styles.dayCircleToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            !cell.inCurrentMonth && styles.dayTextMuted,
                            isSelected && styles.dayTextSelected,
                          ]}
                        >
                          {cell.day}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {level === 'month' && (
            <>
              <View style={styles.header}>
                <Pressable onPress={() => shiftYear(-1)} style={styles.navButton} hitSlop={6}>
                  <ChevronLeftIcon size={16} color={colors.textPrimary} />
                </Pressable>
                <Pressable onPress={() => setLevel('year')} style={styles.headerLabelButton}>
                  <Text style={styles.headerLabel}>{viewYear}</Text>
                </Pressable>
                <Pressable onPress={() => shiftYear(1)} style={styles.navButton} hitSlop={6}>
                  <ChevronRightIcon size={16} color={colors.textPrimary} />
                </Pressable>
              </View>

              <View style={styles.monthGrid}>
                {MONTH_SHORT.map((label, index) => (
                  <Pressable
                    key={label}
                    onPress={() => {
                      setViewMonth(index);
                      setLevel('day');
                    }}
                    style={styles.monthCell}
                  >
                    <View style={[styles.monthPill, viewMonth === index && styles.monthPillSelected]}>
                      <Text
                        style={[styles.monthCellText, viewMonth === index && styles.monthCellTextSelected]}
                      >
                        {label}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {level === 'year' && (
            <ScrollView style={styles.yearList} nestedScrollEnabled>
              <View style={styles.yearGrid}>
                {Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MAX_YEAR - i).map((y) => (
                  <Pressable
                    key={y}
                    onPress={() => {
                      setViewYear(y);
                      setLevel('month');
                    }}
                    style={styles.yearCell}
                  >
                    <View style={[styles.monthPill, viewYear === y && styles.monthPillSelected]}>
                      <Text style={[styles.monthCellText, viewYear === y && styles.monthCellTextSelected]}>
                        {y}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function getStyles(colors: ColorPalette) {
  return StyleSheet.create({
    field: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radii.card,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    fieldText: {
      fontSize: 16,
      color: colors.textPrimary,
    },
    fieldPlaceholder: {
      color: colors.textMuted,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.card,
      borderTopRightRadius: radii.card,
      padding: spacing.lg,
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center',
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.divider,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    sheetTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    sheetTitle: {
      fontFamily: typography.fontFamily,
      fontWeight: '700',
      fontSize: 16,
      color: colors.textPrimary,
    },
    closeButton: {
      paddingVertical: 4,
    },
    closeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent500,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    navButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.surfaceHover,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerLabelButton: {
      flex: 1,
      alignItems: 'center',
    },
    headerLabel: {
      fontFamily: typography.fontFamily,
      fontWeight: '700',
      fontSize: 15,
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
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCircle: {
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dayCircleSelected: {
      backgroundColor: colors.accent500,
    },
    dayCircleToday: {
      borderWidth: 1.5,
      borderColor: colors.accent500,
    },
    dayText: {
      fontSize: 13,
      color: colors.textPrimary,
    },
    dayTextMuted: {
      color: colors.textMuted,
      opacity: 0.6,
    },
    dayTextSelected: {
      color: '#ffffff',
      fontWeight: '700',
    },
    monthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    monthCell: {
      width: '33.33%',
      padding: spacing.xs,
    },
    yearGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    yearCell: {
      width: '33.33%',
      padding: spacing.xs,
    },
    monthPill: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radii.card,
      backgroundColor: colors.surfaceHover,
    },
    monthPillSelected: {
      backgroundColor: colors.accent500,
    },
    monthCellText: {
      fontSize: 14,
      color: colors.textPrimary,
    },
    monthCellTextSelected: {
      color: '#ffffff',
      fontWeight: '700',
    },
    yearList: {
      maxHeight: 240,
    },
  });
}
