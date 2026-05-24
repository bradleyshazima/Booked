import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { getAllBooks, getStreaksForDays } from '../db/db';
import StreakCalendar from '../components/StreakCalendar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS, FONTS, BORDER_RADIUS } from '../theme';


const ProgressScreen = () => {
  const { theme, currentStreak, calculateStreak, dailyGoal } = useApp();
  const [books, setBooks] = useState([]);
  const [masteredBooks, setMasteredBooks] = useState([]);
  const [streakData, setStreakData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalBooks: 0,
    currentlyReading: 0,
    completed: 0,
    totalRereads: 0,
  });

  const loadData = async () => {
    try {
      // Load books
      const allBooks = await getAllBooks();
      setBooks(allBooks);

      // Calculate stats
      const completed = allBooks.filter(b => b.is_completed);
      const currentlyReading = allBooks.filter(b => !b.is_completed && b.last_read_index > 0);
      const totalRereads = allBooks.reduce((sum, book) => sum + (book.times_read || 0), 0);

      setStats({
        totalBooks: allBooks.length,
        currentlyReading: currentlyReading.length,
        completed: completed.length,
        totalRereads,
      });

      // Filter mastered books (read at least once)
      const mastered = completed.filter(b => b.times_read > 0);
      setMasteredBooks(mastered);

      // Load streak data
      const streaks = await getStreaksForDays(7);
      setStreakData(streaks);
      calculateStreak(streaks);

    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const StatCard = ({ icon, value, label, color }) => (
    <View style={[styles.statCard, { backgroundColor: COLORS.surfaceDark }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={32} color={color} />
      </View>
      <Text style={[styles.statValue, { color: COLORS.textInverse }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: COLORS.textSecondary }]}>{label}</Text>
    </View>
  );

  const MasteredBookItem = ({ book }) => (
    <View style={[styles.masteredItem, { backgroundColor: COLORS.surfaceDark }]}>
      <View style={styles.masteredInfo}>
        <Text style={[styles.masteredTitle, { color: COLORS.textPrimary }]} numberOfLines={1}>
          {book.title}
        </Text>
        <Text style={[styles.masteredMeta, { color: COLORS.textSecondary }]}>
          {book.times_read > 1 ? `Read ${book.times_read} times` : 'Read 1 time'}
        </Text>
      </View>
      <Ionicons name="checkmark-circle" size={24} color="#10b981" />
    </View>
  );

  return (
    <SafeAreaProvider style={[styles.container, { backgroundColor: COLORS.backgroundDark }]}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accentColor}
          />
        }
        contentContainerStyle={styles.content}
      >
        {/* Streak Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flame" size={24} color="#f59e0b" />
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
              Your Streak
            </Text>
          </View>
          
          <View style={[styles.streakCard, { backgroundColor: COLORS.surfaceDark }]}>
            <Text style={[styles.streakNumber, { color: '#f59e0b' }]}>
              {currentStreak}
            </Text>
            <Text style={[styles.streakLabel, { color: theme.textColor }]}>
              day{currentStreak !== 1 ? 's' : ''} in a row
            </Text>
            <Text style={[styles.streakGoal, { color: theme.textColor }]}>
              Goal: {dailyGoal} pages/day
            </Text>
          </View>

          <StreakCalendar data={streakData} />
        </View>

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
            Overview
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon="library"
              value={stats.totalBooks}
              label="Total Books"
              color={theme.accentColor}
            />
            <StatCard
              icon="book"
              value={stats.currentlyReading}
              label="In Progress"
              color="#f59e0b"
            />
            <StatCard
              icon="checkmark-circle"
              value={stats.completed}
              label="Completed"
              color="#10b981"
            />
            <StatCard
              icon="repeat"
              value={stats.totalRereads}
              label="Total Rereads"
              color="#8b5cf6"
            />
          </View>
        </View>

        {/* Mastered Books */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="trophy" size={24} color="#f59e0b" />
            <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
              Mastered Books
            </Text>
          </View>

          {masteredBooks.length > 0 ? (
            masteredBooks.map(book => (
              <MasteredBookItem key={book.id} book={book} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color={theme.secondaryColor} />
              <Text style={[styles.emptyText, { color: theme.secondaryColor }]}>
                No completed books yet
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.secondaryColor }]}>
                Finish a book to see it here
              </Text>
            </View>
          )}
        </View>

        {/* Reading Insights */}
        <View style={[styles.insightCard, { backgroundColor: COLORS.surfaceDark }]}>
          <Ionicons name="bulb" size={24} color={theme.accentColor} />
          <Text style={[styles.insightText, { color: theme.textColor }]}>
            {stats.currentlyReading > 0
              ? `You're currently reading ${stats.currentlyReading} book${stats.currentlyReading > 1 ? 's' : ''}. Keep it up!`
              : stats.completed > 0
              ? 'Great job on finishing books! Start a new one to keep the momentum.'
              : 'Upload your first book to start tracking your reading journey!'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    marginLeft: 8,
    fontFamily: FONTS.medium,
  },
  streakCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderRadius: BORDER_RADIUS.lg,
  },
  streakNumber: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 16,
    marginTop: 8,
    opacity: 0.8,
    fontFamily: FONTS.regular,
  },
  streakGoal: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.6,
    fontFamily: FONTS.medium,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  masteredItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  masteredInfo: {
    flex: 1,
  },
  masteredTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  masteredMeta: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    fontFamily: FONTS.medium,
  },
  insightCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  insightText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: FONTS.medium,
    opacity: 0.6,
  },
});

export default ProgressScreen;