import { Picker } from '@react-native-picker/picker';
import { StyleSheet, View } from 'react-native';

import { useColors } from '../lib/ThemeProvider';
import { radii, spacing } from '../lib/theme';

export type BirthDatePickerProps = {
  /** ISO date ('YYYY-MM-DD') or null if not set yet. */
  value: string | null;
  onChange: (isoDate: string) => void;
};

const MONTHS = [
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

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);

function daysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function parse(value: string | null): { day: number; month: number; year: number } {
  if (value) {
    const [year, month, day] = value.split('-').map(Number);
    if (year && month && day) return { day, month, year };
  }
  return { day: 1, month: 1, year: CURRENT_YEAR - 25 };
}

function toIso(day: number, month: number, year: number): string {
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
}

export function BirthDatePicker({ value, onChange }: BirthDatePickerProps) {
  const colors = useColors();
  const { day, month, year } = parse(value);
  const maxDay = daysInMonth(month, year);
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);

  function update(nextDay: number, nextMonth: number, nextYear: number) {
    const clampedDay = Math.min(nextDay, daysInMonth(nextMonth, nextYear));
    onChange(toIso(clampedDay, nextMonth, nextYear));
  }

  return (
    <View style={[styles.row, { backgroundColor: colors.surface }]}>
      <Picker
        selectedValue={day}
        onValueChange={(next) => update(Number(next), month, year)}
        style={[styles.picker, { color: colors.textPrimary }]}
        itemStyle={{ color: colors.textPrimary }}
      >
        {days.map((d) => (
          <Picker.Item key={d} label={String(d)} value={d} />
        ))}
      </Picker>
      <Picker
        selectedValue={month}
        onValueChange={(next) => update(day, Number(next), year)}
        style={[styles.picker, styles.pickerMonth, { color: colors.textPrimary }]}
        itemStyle={{ color: colors.textPrimary }}
      >
        {MONTHS.map((label, index) => (
          <Picker.Item key={label} label={label} value={index + 1} />
        ))}
      </Picker>
      <Picker
        selectedValue={year}
        onValueChange={(next) => update(day, month, Number(next))}
        style={[styles.picker, { color: colors.textPrimary }]}
        itemStyle={{ color: colors.textPrimary }}
      >
        {YEARS.map((y) => (
          <Picker.Item key={y} label={String(y)} value={y} />
        ))}
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.card,
    paddingHorizontal: spacing.xs,
  },
  picker: {
    flex: 1,
  },
  pickerMonth: {
    flex: 1.6,
  },
});
