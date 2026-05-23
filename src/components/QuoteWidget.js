import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllQuotes } from '../db/db';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - (SPACING.base * 2);

const QuoteWidget = ({ navigation }) => {
  const [quotes, setQuotes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    loadQuotes();
  }, []);

  const loadQuotes = async () => {
    try {
      const allQuotes = await getAllQuotes();
      setQuotes(allQuotes);
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
  };

  const handleReadPress = (quote) => {
    if (quote.book_id && quote.location_index) {
      navigation.navigate('Reading', {
        bookId: quote.book_id,
        scrollTo: quote.location_index,
      });
    }
  };

  const renderQuoteCard = ({ item }) => (
    <View style={styles.quoteCard}>
      <View style={styles.quoteContent}>
        <Ionicons name="quote" size={24} color={COLORS.primary} style={styles.quoteIcon} />
        
        <Text style={styles.quoteText} numberOfLines={4}>
          {item.content}
        </Text>

        <View style={styles.quoteFooter}>
          <View style={styles.bookInfo}>
            <Ionicons name="book" size={14} color={COLORS.textSecondary} />
            <Text style={styles.bookTitle} numberOfLines={1}>
              {item.book_title}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.readButton}
            onPress={() => handleReadPress(item)}
          >
            <Text style={styles.readButtonText}>Read</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyQuoteCard}>
      <Ionicons name="bookmark-outline" size={48} color={COLORS.textTertiary} />
      <Text style={styles.emptyTitle}>No Saved Quotes Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start reading and save your favorite lines
      </Text>
    </View>
  );

  if (quotes.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="sparkles" size={20} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Your Highlights</Text>
        </View>
        {renderEmptyState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={20} color={COLORS.primary} />
          <Text style={styles.headerTitle}>Your Highlights</Text>
        </View>
        <View style={styles.pagination}>
          <Text style={styles.paginationText}>
            {currentIndex + 1} / {quotes.length}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={quotes}
        renderItem={renderQuoteCard}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / CARD_WIDTH);
          setCurrentIndex(index);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  pagination: {
    backgroundColor: COLORS.divider,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.md,
  },
  paginationText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
  quoteCard: {
    width: CARD_WIDTH,
    paddingHorizontal: SPACING.base,
  },
  quoteContent: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  quoteIcon: {
    marginBottom: SPACING.sm,
    opacity: 0.6,
  },
  quoteText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.md * 1.6,
    marginBottom: SPACING.base,
  },
  quoteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bookInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: BORDER_RADIUS.md,
  },
  readButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
    marginRight: 4,
  },
  emptyQuoteCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    marginHorizontal: SPACING.base,
    ...SHADOWS.medium,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});

export default QuoteWidget;