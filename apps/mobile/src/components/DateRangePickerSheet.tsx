import { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, radius, spacing, typography, controlSize } from '../theme/tokens';
import { BottomSheetModal, Button } from './AppPrimitives';

export type ShiftType = 'morning' | 'afternoon' | 'full_day';

export interface DateRangePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  shift?: ShiftType;
  onConfirm: (range: { startDate: string; endDate: string; shift?: ShiftType }) => void;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function formatDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseDateStr(str?: string): Date | null {
  if (!str) return null;
  const parts = str.split('-').map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return null;
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDisplayDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

const SHIFT_OPTIONS: Array<{
  key: ShiftType;
  label: string;
  icon: 'sunny-outline' | 'partly-sunny-outline' | 'time-outline';
}> = [
  { key: 'full_day', label: 'Cả ngày (07:00 - 17:30)', icon: 'time-outline' },
  { key: 'morning', label: 'Ca sáng (07:00 - 11:30)', icon: 'sunny-outline' },
  { key: 'afternoon', label: 'Ca chiều (13:30 - 17:30)', icon: 'partly-sunny-outline' },
];

export function DateRangePickerSheet({
  visible,
  onClose,
  startDate,
  endDate,
  shift: initialShift = 'full_day',
  onConfirm,
}: DateRangePickerSheetProps) {
  const todayStr = useMemo(() => formatDateStr(new Date()), []);
  const [selectedStart, setSelectedStart] = useState<string>(startDate || todayStr);
  const [selectedEnd, setSelectedEnd] = useState<string>(endDate || startDate || todayStr);
  const [selectedShift, setSelectedShift] = useState<ShiftType>(initialShift);

  // Current viewing month
  const [viewDate, setViewDate] = useState<Date>(() => {
    return parseDateStr(startDate) || new Date();
  });

  // Sync with props when opened
  useEffect(() => {
    if (visible) {
      const s = startDate || todayStr;
      const e = endDate || startDate || todayStr;
      setSelectedStart(s);
      setSelectedEnd(e);
      setSelectedShift(initialShift);
      const parsed = parseDateStr(s);
      if (parsed) {
        setViewDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
      }
    }
  }, [visible, startDate, endDate, initialShift, todayStr]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // Presets
  const applyPreset = (daysSpan: number, presetShift?: ShiftType) => {
    const start = new Date();
    const end = addDays(start, daysSpan - 1);
    setSelectedStart(formatDateStr(start));
    setSelectedEnd(formatDateStr(end));
    if (presetShift) setSelectedShift(presetShift);
  };

  const applyThisWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = addDays(now, diffToMonday);
    const sunday = addDays(monday, 6);
    setSelectedStart(formatDateStr(monday));
    setSelectedEnd(formatDateStr(sunday));
  };

  // Month navigation
  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  // Calendar cells
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon
    // Convert so Monday is 0
    const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ day: number | null; dateStr: string | null }> = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        dateStr: `${year}-${pad2(month + 1)}-${pad2(d)}`,
      });
    }
    return cells;
  }, [year, month]);

  const handleDayPress = (dateStr: string) => {
    if (!selectedStart || (selectedStart && selectedEnd && selectedStart !== selectedEnd)) {
      // Start a new selection
      setSelectedStart(dateStr);
      setSelectedEnd(dateStr);
    } else if (selectedStart && (!selectedEnd || selectedStart === selectedEnd)) {
      if (dateStr >= selectedStart) {
        setSelectedEnd(dateStr);
      } else {
        // Clicked date is earlier than selected start
        setSelectedStart(dateStr);
        setSelectedEnd(selectedStart);
      }
    }
  };

  const handleConfirm = () => {
    const finalStart = selectedStart <= selectedEnd ? selectedStart : selectedEnd;
    const finalEnd = selectedEnd >= selectedStart ? selectedEnd : selectedStart;
    onConfirm({
      startDate: finalStart,
      endDate: finalEnd,
      shift: selectedShift,
    });
    onClose();
  };

  // Compute duration in days
  const durationDays = useMemo(() => {
    const s = parseDateStr(selectedStart);
    const e = parseDateStr(selectedEnd);
    if (!s || !e) return 1;
    const diffTime = Math.abs(e.getTime() - s.getTime());
    return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [selectedStart, selectedEnd]);

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title="Dải ngày & ca chăm sóc"
      subtitle="Thiết lập thời gian thực hiện chăm sóc cây"
      maxHeight="92%"
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Quick Presets */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Lối tắt chọn nhanh</Text>
          <View style={styles.presetsRow}>
            <Pressable
              accessibilityRole="button"
              style={[
                styles.presetChip,
                selectedStart === todayStr && selectedEnd === todayStr && styles.presetChipActive,
              ]}
              onPress={() => applyPreset(1)}
            >
              <Text
                style={[
                  styles.presetText,
                  selectedStart === todayStr && selectedEnd === todayStr && styles.presetTextActive,
                ]}
              >
                Hôm nay
              </Text>
            </Pressable>

            <Pressable accessibilityRole="button" style={styles.presetChip} onPress={() => applyPreset(3)}>
              <Text style={styles.presetText}>3 ngày tới</Text>
            </Pressable>

            <Pressable accessibilityRole="button" style={styles.presetChip} onPress={applyThisWeek}>
              <Text style={styles.presetText}>Tuần này</Text>
            </Pressable>

            <Pressable accessibilityRole="button" style={styles.presetChip} onPress={() => applyPreset(7)}>
              <Text style={styles.presetText}>7 ngày tới</Text>
            </Pressable>
          </View>
        </View>

        {/* Month Navigation & Grid */}
        <View style={styles.calendarCard}>
          <View style={styles.monthHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tháng trước"
              onPress={prevMonth}
              style={styles.monthNavBtn}
            >
              <Ionicons name="chevron-back" size={20} color={colors.ink} />
            </Pressable>
            <Text style={styles.monthTitle}>
              Tháng {pad2(month + 1)} / {year}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tháng sau"
              onPress={nextMonth}
              style={styles.monthNavBtn}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.ink} />
            </Pressable>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekdayRow}>
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((w, idx) => (
              <Text key={idx} style={styles.weekdayText}>
                {w}
              </Text>
            ))}
          </View>

          {/* Day Grid */}
          <View style={styles.daysGrid}>
            {calendarCells.map((cell, idx) => {
              if (!cell.day || !cell.dateStr) {
                return <View key={idx} style={styles.emptyDayCell} />;
              }
              const isStart = cell.dateStr === selectedStart;
              const isEnd = cell.dateStr === selectedEnd;
              const inRange =
                selectedStart && selectedEnd && cell.dateStr > selectedStart && cell.dateStr < selectedEnd;
              const isSingleSelected = isStart && isEnd;

              const isMonday = idx % 7 === 0;
              const isSunday = idx % 7 === 6;
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const isFirstDay = cell.day === 1;
              const isLastDay = cell.day === daysInMonth;

              const hasRibbon =
                (isStart && !isSingleSelected && Boolean(selectedEnd)) ||
                (isEnd && !isSingleSelected && Boolean(selectedStart)) ||
                inRange;

              return (
                <Pressable
                  key={idx}
                  accessibilityRole="button"
                  accessibilityLabel={`Ngày ${cell.day}`}
                  onPress={() => cell.dateStr && handleDayPress(cell.dateStr)}
                  style={styles.dayCell}
                >
                  {hasRibbon ? (
                    <View
                      style={[
                        styles.ribbonTrack,
                        isStart && !isSingleSelected && styles.ribbonStartPill,
                        isEnd && !isSingleSelected && styles.ribbonEndPill,
                        inRange && styles.ribbonMiddlePill,
                        (isMonday || isFirstDay) && styles.ribbonRoundLeft,
                        (isSunday || isLastDay) && styles.ribbonRoundRight,
                      ]}
                    />
                  ) : null}
                  <View style={[styles.dayCircle, (isStart || isEnd) && styles.dayCircleActive]}>
                    <Text
                      style={[
                        styles.dayText,
                        inRange && styles.dayTextInRange,
                        (isStart || isEnd) && styles.dayTextActive,
                      ]}
                    >
                      {cell.day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Shift Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Ca thực hiện</Text>
          <View style={styles.shiftContainer}>
            {SHIFT_OPTIONS.map((opt) => {
              const active = selectedShift === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  accessibilityRole="button"
                  onPress={() => setSelectedShift(opt.key)}
                  style={[styles.shiftCard, active && styles.shiftCardActive]}
                >
                  <Ionicons name={opt.icon} size={18} color={active ? colors.snowWhite : colors.primaryDark} />
                  <Text style={[styles.shiftCardText, active && styles.shiftCardTextActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Selected Range Summary Box */}
        <View style={styles.summaryBox}>
          <Ionicons name="calendar" size={20} color={colors.primaryDark} />
          <View style={styles.summaryTextGroup}>
            <Text style={styles.summaryTitle}>
              {formatDisplayDate(selectedStart)} — {formatDisplayDate(selectedEnd)} ({durationDays} ngày)
            </Text>
            <Text style={styles.summarySubtitle}>Ca: {SHIFT_OPTIONS.find((s) => s.key === selectedShift)?.label}</Text>
          </View>
        </View>

        {/* Confirm Actions */}
        <View style={styles.actionRow}>
          <Button variant="primary" size="field" onPress={handleConfirm} style={styles.confirmBtn}>
            Áp dụng dải ngày
          </Button>
          <Button variant="outline" size="compact" onPress={onClose}>
            Hủy
          </Button>
        </View>
      </ScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.pewter,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  presetChip: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.neutralSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: colors.successSurface,
    borderColor: colors.willowGreen,
  },
  presetText: {
    ...typography.body,
    fontSize: 13,
    color: colors.ink,
  },
  presetTextActive: {
    ...typography.bodyStrong,
    color: colors.primaryDark,
  },
  calendarCard: {
    backgroundColor: colors.cardWarm,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  monthTitle: {
    ...typography.bodyStrong,
    fontSize: 16,
    color: colors.forestDepths,
  },
  monthNavBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutralSurface,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineBorder,
  },
  weekdayText: {
    width: 38,
    textAlign: 'center',
    ...typography.metadata,
    color: colors.pewter,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  emptyDayCell: {
    width: '14.28%',
    height: 40,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ribbonTrack: {
    position: 'absolute',
    height: 34,
    top: 3,
    backgroundColor: colors.successSurface,
    zIndex: 0,
  },
  ribbonStartPill: {
    left: '8%',
    right: 0,
    borderTopLeftRadius: 17,
    borderBottomLeftRadius: 17,
  },
  ribbonEndPill: {
    left: 0,
    right: '8%',
    borderTopRightRadius: 17,
    borderBottomRightRadius: 17,
  },
  ribbonMiddlePill: {
    left: 0,
    right: 0,
  },
  ribbonRoundLeft: {
    borderTopLeftRadius: 17,
    borderBottomLeftRadius: 17,
  },
  ribbonRoundRight: {
    borderTopRightRadius: 17,
    borderBottomRightRadius: 17,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dayCircleActive: {
    backgroundColor: colors.forestDepths,
  },
  dayText: {
    ...typography.body,
    fontSize: 14,
    color: colors.ink,
  },
  dayTextInRange: {
    color: colors.forestDepths,
    fontWeight: '600',
  },
  dayTextActive: {
    color: colors.snowWhite,
    fontWeight: '600',
  },
  shiftContainer: {
    gap: spacing.xs,
  },
  shiftCard: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.control,
    backgroundColor: colors.neutralSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  shiftCardActive: {
    backgroundColor: colors.forestDepths,
    borderColor: colors.forestDepths,
  },
  shiftCardText: {
    ...typography.body,
    color: colors.ink,
  },
  shiftCardTextActive: {
    ...typography.bodyStrong,
    color: colors.snowWhite,
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.successSurface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.willowGreen,
  },
  summaryTextGroup: {
    flex: 1,
  },
  summaryTitle: {
    ...typography.bodyStrong,
    color: colors.forestDepths,
  },
  summarySubtitle: {
    ...typography.metadata,
    color: colors.primaryDark,
    marginTop: 2,
  },
  actionRow: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  confirmBtn: {
    minHeight: controlSize.field,
  },
});
