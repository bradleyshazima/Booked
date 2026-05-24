import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import {
  getBookById,
  getChaptersByBookId,
  updateBookProgress,
  markBookCompleted,
  resetBookProgress,
} from '../db/db';
import { updateStreak, getStreakByDate } from '../db/db';
import { cancelTodaysReminders } from '../utils/notificationScheduler';
import ChapterDrawer from '../components/ChapterDrawer';
import QuoteModal from '../components/QuoteModal';
import { COLORS, FONTS } from '../theme/index';
import { SafeAreaProvider } from 'react-native-safe-area-context';


const ReadingScreen = ({ route, navigation }) => {
  const { bookId } = route.params;
  const { theme, dailyGoal, updateTodayProgress } = useApp();
  
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [showChapterDrawer, setShowChapterDrawer] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [pagesRead, setPagesRead] = useState(0);
  
  const scrollViewRef = useRef(null);
  const lastScrollY = useRef(0);

  useEffect(() => {
    loadBookData();
  }, [bookId]);

  const loadBookData = async () => {
    try {
      const bookData = await getBookById(bookId);
      const chaptersData = await getChaptersByBookId(bookId);
      
      setBook(bookData);
      setChapters(chaptersData);

      // Smart Resume Logic
      if (bookData.is_completed) {
        // If completed, start from beginning
        setCurrentChapterIndex(0);
        setScrollPosition(0);
        
        Alert.alert(
          'Book Completed',
          'You\'ve already finished this book. Start over?',
          [
            {
              text: 'Continue',
              onPress: () => {},
            },
            {
              text: 'Reset Progress',
              onPress: async () => {
                await resetBookProgress(bookId);
                const updatedBook = await getBookById(bookId);
                setBook(updatedBook);
              },
            },
          ]
        );
      } else {
        // Resume from last position
        const lastIndex = bookData.last_read_index || 0;
        setScrollPosition(lastIndex);
        
        // Determine which chapter based on scroll position
        let totalLength = 0;
        for (let i = 0; i < chaptersData.length; i++) {
          totalLength += chaptersData[i].content.length;
          if (totalLength > lastIndex) {
            setCurrentChapterIndex(i);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error loading book data:', error);
      Alert.alert('Error', 'Failed to load book');
      navigation.goBack();
    }
  };

  const handleScroll = async (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const currentY = contentOffset.y;
    const scrollHeight = contentSize.height - layoutMeasurement.height;
    
    // Calculate approximate pages read (assuming 500px per page)
    const newPagesRead = Math.floor(currentY / 500);
    if (newPagesRead !== pagesRead) {
      setPagesRead(newPagesRead);
      
      // Update today's progress
      updateTodayProgress(newPagesRead);
      
      // Check if goal met
      if (newPagesRead >= dailyGoal) {
        const today = new Date().toISOString().split('T')[0];
        const todayStreak = await getStreakByDate(today);
        
        if (!todayStreak || todayStreak.goal_met === 0) {
          await updateStreak(today, newPagesRead, 1);
          await cancelTodaysReminders();
          
          // Show celebration
          Alert.alert(
            '🎉 Goal Achieved!',
            `You've read ${dailyGoal} pages today!`,
            [{ text: 'Awesome!' }]
          );
        }
      }
    }
    
    // Update scroll position for resume
    setScrollPosition(Math.floor(currentY));
    
    // Save progress periodically (every 1000px scrolled)
    if (Math.abs(currentY - lastScrollY.current) > 1000) {
      await updateBookProgress(bookId, Math.floor(currentY));
      lastScrollY.current = currentY;
    }
    
    // Check if reached end of book
    if (currentY >= scrollHeight - 100 && scrollHeight > 0) {
      handleBookCompletion();
    }
  };

  const handleBookCompletion = async () => {
    try {
      if (book && !book.is_completed) {
        await markBookCompleted(bookId);
        
        Alert.alert(
          '📚 Book Completed!',
          `Congratulations on finishing "${book.title}"!`,
          [
            {
              text: 'Read Again',
              onPress: async () => {
                await resetBookProgress(bookId);
                loadBookData();
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              },
            },
            {
              text: 'Go to Library',
              onPress: () => navigation.navigate('Library'),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error marking book complete:', error);
    }
  };

  const jumpToChapter = (chapterIndex) => {
    setCurrentChapterIndex(chapterIndex);
    setShowChapterDrawer(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const renderAllChapters = () => {
    return chapters.map((chapter, index) => (
      <View key={chapter.id} style={styles.chapterContainer}>
        <Text style={[styles.chapterTitle, {fontFamily: FONTS.serifBold}, { color: theme.textColor }]}>
          {chapter.title}
        </Text>
        <Text
          selectable={true}
          style={[
            styles.chapterContent,
            {
              color: theme.textColor,
              fontSize: theme.fontSize,
              lineHeight: theme.fontSize * theme.lineHeight,
              fontFamily: FONTS.serif,
            },
          ]}
        >
          {chapter.content}
        </Text>
      </View>
    ));
  };

  if (!book || chapters.length === 0) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundColor }]}>
        <Text style={[styles.loadingText, { color: theme.textColor }]}>
          Loading book...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar barStyle="light-content" hidden />
      
      {/* Top Action Bar */}
      <View style={[styles.actionBar, { backgroundColor: theme.backgroundColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.actionButton}>
          <Ionicons name="arrow-back" size={24} color={theme.textColor} />
        </TouchableOpacity>

        <Text style={[styles.bookTitle, { color: theme.textColor }]} numberOfLines={1}>
          {book.title}
        </Text>

        <View style={styles.rightActions}>

          <TouchableOpacity
            onPress={() => setShowChapterDrawer(true)}
            style={styles.actionButton}
          >
            <Ionicons name="menu" size={24} color={theme.textColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reading Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {renderAllChapters()}
        </View>
      </ScrollView>

      {/* Floating Quote Button */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: theme.accentColor }]}
        onPress={() => setShowQuoteModal(true)}
      >
        <Ionicons name="bookmark" size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* Chapter Drawer */}
      <ChapterDrawer
        visible={showChapterDrawer}
        chapters={chapters}
        currentChapter={currentChapterIndex}
        onSelectChapter={jumpToChapter}
        onClose={() => setShowChapterDrawer(false)}
      />

      {/* Quote Modal */}
      <QuoteModal
        visible={showQuoteModal}
        bookId={bookId}
        locationIndex={scrollPosition}
        onClose={() => setShowQuoteModal(false)}
      />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderDark,
    height: 80,
  },
  actionButton: {
    padding: 8,
  },
  bookTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginHorizontal: 12,
    marginBottom: 10,
  },
  rightActions: {
    flexDirection: 'row',
  },
  scrollView: {
    flex: 1,
    fontFamily: FONTS.serif,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
    fontFamily: FONTS.serif,
  },
  chapterContainer: {
    marginBottom: 40,
  },
  chapterTitle: {
    fontSize: 24,
    marginBottom: 20,
  },
  chapterContent: {
    lineHeight: 28,
    fontFamily: FONTS.serif,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  settingsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsCard: {
    width: '80%',
    padding: 24,
    borderRadius: 16,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingsInfo: {
    fontSize: 14,
    opacity: 0.7,
  },
});

export default ReadingScreen;