import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const toDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export default function CalendarPicker({ value, onChange, minDate, maxDate }) {
  const initial = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const today = toDay(new Date());
  const min = minDate ? toDay(minDate) : null;
  const max = maxDate ? toDay(maxDate) : null;

  const isSelected = (day) => {
    if (!value) return false;
    const v = toDay(value);
    return v.getFullYear() === viewYear && v.getMonth() === viewMonth && v.getDate() === day;
  };

  const isToday = (day) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  const isDisabled = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    if (min && d < min) return true;
    if (max && d > max) return true;
    return false;
  };

  const canGoPrev = () => {
    if (!min) return true;
    return viewYear > min.getFullYear() || (viewYear === min.getFullYear() && viewMonth > min.getMonth());
  };

  const canGoNext = () => {
    if (!max) return true;
    return viewYear < max.getFullYear() || (viewYear === max.getFullYear() && viewMonth < max.getMonth());
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const selectDay = (day) => {
    if (isDisabled(day)) return;
    onChange(new Date(viewYear, viewMonth, day));
  };

  // Build a flat list of cells: nulls for leading blanks, then day numbers
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete the last row
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View style={styles.container}>
      {/* Month navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={prevMonth}
          disabled={!canGoPrev()}
          style={[styles.navBtn, !canGoPrev() && styles.navBtnDisabled]}
        >
          <Ionicons name="chevron-back" size={22} color={canGoPrev() ? colors.primary.teal : colors.gray[300]} />
        </TouchableOpacity>

        <Text style={styles.monthYear}>{MONTHS[viewMonth]} {viewYear}</Text>

        <TouchableOpacity
          onPress={nextMonth}
          disabled={!canGoNext()}
          style={[styles.navBtn, !canGoNext() && styles.navBtnDisabled]}
        >
          <Ionicons name="chevron-forward" size={22} color={canGoNext() ? colors.primary.teal : colors.gray[300]} />
        </TouchableOpacity>
      </View>

      {/* Day-of-week headers */}
      <View style={styles.weekRow}>
        {DAYS.map(d => (
          <Text key={d} style={styles.dayHeader}>{d}</Text>
        ))}
      </View>

      {/* Day grid */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (day === null) return <View key={di} style={styles.cell} />;
            const selected = isSelected(day);
            const disabled = isDisabled(day);
            const todayCell = isToday(day);
            return (
              <TouchableOpacity
                key={di}
                style={[
                  styles.cell,
                  todayCell && !selected && styles.cellToday,
                  selected && styles.cellSelected,
                  disabled && styles.cellDisabled,
                ]}
                onPress={() => selectDay(day)}
                disabled={disabled}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dayText,
                  todayCell && !selected && styles.dayTextToday,
                  selected && styles.dayTextSelected,
                  disabled && styles.dayTextDisabled,
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Selected date display */}
      {value && (
        <View style={styles.selectedRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.selectedText}>
            {value.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: {
    padding: 6,
    borderRadius: 8,
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  monthYear: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.primary.dark,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    margin: 1,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: colors.primary.teal,
  },
  cellSelected: {
    backgroundColor: colors.primary.teal,
  },
  cellDisabled: {
    opacity: 0.25,
  },
  dayText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  dayTextToday: {
    color: colors.primary.teal,
    fontWeight: '700',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  dayTextDisabled: {
    color: colors.neutral,
  },
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  selectedText: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '600',
  },
});
