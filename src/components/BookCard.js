import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

const BookCard = ({ book, onPress }) => {
  const progress = book.total_chapters > 0 
    ? Math.round((book.last_read_index / book.total_chapters) * 100) 
    : 0;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Book Cover Placeholder */}
      <View style={styles.coverContainer}>
        <View style={[styles.cover, { backgroundColor: getBookColor(book.id) }]}>
          <Ionicons name="book" size={40} color={COLORS.textInverse} />
        </View>
        
        {/* Completion Badge */}
        {book.is_completed && (
          <View style={styles.completionBadge}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          </View>
        )}
        
        {/* Reading Progress Indicator */}
        {!book.is_completed && book.last_read_index > 0 && (
          <View style={styles.progressIndicator}>
            <View style={[styles.progressBar, { width: `${progress}%` }]} />
          </View>
        )}
      </View>

      {/* Book Info */}
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        
        <View style={styles.meta}>
          {book.is_completed ? (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.statusText}>
                {book.times_read > 1 ? `Read ${book.times_read}×` : 'Completed'}
              </Text>
            </View>
          ) : book.last_read_index > 0 ? (
            <View style={styles.statusContainer}>
              <Ionicons name="time" size={14} color={COLORS.primary} />
              <Text style={[styles.statusText, { color: COLORS.primary }]}>
                {progress}% complete
              </Text>
            </View>
          ) : (
            <View style={styles.statusContainer}>
              <Ionicons name="book-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.statusText}>Not started</Text>
            </View>
          )}
        </View>

        {/* Chapters Count */}
        <Text style={styles.chapters}>
          {book.total_chapters} chapter{book.total_chapters !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Generate consistent color based on book ID
const getBookColor = (id) => {
  const colors = [
    '#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', 
    '#10B981', '#3B82F6', '#EF4444', '#06B6D4'
  ];
  return colors[id % colors.length];
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    marginBottom: SPACING.base,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  coverContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 0.7,
  },
  cover: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.round,
    padding: 4,
  },
  progressIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  info: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.semiBold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    lineHeight: FONT_SIZES.base * 1.4,
  },
  meta: {
    marginBottom: SPACING.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.success,
    marginLeft: 4,
  },
  chapters: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
  },
});

export default BookCard;