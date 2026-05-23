import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';

const StreakCalendar = ({ data }) => {
  // Generate last 7 days
  const getLast7Days = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
      });
    }
    
    return days;
  };

  const days = getLast7Days();

  const getStreakForDate = (dateStr) => {
    return data.find(streak => streak.date === dateStr);
  };

  const renderDay = (day) => {
    const streak = getStreakForDate(day.date);
    const hasActivity = streak && streak.pages_read > 0;
    const goalMet = streak && streak.goal_met === 1;
    const isToday = day.date === new Date().toISOString().split('T')[0];

    return (
      <View key={day.date} style={styles.dayContainer}>
        <Text style={[styles.dayName, isToday && styles.todayText]}>
          {day.dayName}
        </Text>
        
        <View
          style={[
            styles.dayCircle,
            hasActivity && styles.activeDay,
            goalMet && styles.goalMetDay,
            isToday && styles.todayCircle,
          ]}
        >
          {goalMet ? (
            <Ionicons name="checkmark" size={20} color={COLORS.textInverse} />
          ) : hasActivity ? (
            <View style={styles.partialDot} />
          ) : (
            <Text style={styles.dayNumber}>{day.dayNumber}</Text>
          )}
        </View>

        {hasActivity && !goalMet && (
          <Text style={styles.pagesCount}>{streak.pages_read}p</Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.calendarRow}>
        {days.map(day => renderDay(day))}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.legendText}>Goal met</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
          <Text style={styles.legendText}>Partial</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.divider }]} />
          <Text style={styles.legendText}>No activity</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.base,
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.base,
  },
  dayContainer: {
    alignItems: 'center',
    flex: 1,
  },
  dayName: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  todayText: {
    color: COLORS.primary,
    fontFamily: FONTS.bold,
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  todayCircle: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  activeDay: {
    backgroundColor: COLORS.warning,
  },
  goalMetDay: {
    backgroundColor: COLORS.success,
  },
  dayNumber: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
  },
  partialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textInverse,
  },
  pagesCount: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textTertiary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.base,
    paddingTop: SPACING.base,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
});

export default StreakCalendar;