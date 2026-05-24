import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getAllBooks, deleteMultipleBooks } from '../db/db';
import { useApp } from '../context/AppContext';
import BookCard from '../components/BookCard';
import QuoteWidget from '../components/QuoteWidget';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';


const LibraryScreen = ({ navigation }) => {
  const { theme } = useApp();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState([]);

  const loadBooks = async () => {
    try {
      const allBooks = await getAllBooks();
      setBooks(allBooks);
      setFilteredBooks(allBooks);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBooks();
      // Exit selection mode when screen loses focus
      return () => {
        setSelectionMode(false);
        setSelectedBooks([]);
      };
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBooks();
    setRefreshing(false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredBooks(books);
    } else {
      const filtered = books.filter(book =>
        book.title.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredBooks(filtered);
    }
  };

  const handleBookPress = (book) => {
    if (selectionMode) {
      // Toggle selection
      toggleBookSelection(book.id);
    } else {
      // Navigate to reading
      navigation.navigate('Reading', { bookId: book.id });
    }
  };

  const handleBookLongPress = (book) => {
    if (!selectionMode) {
      // Enter selection mode and select this book
      setSelectionMode(true);
      setSelectedBooks([book.id]);
    }
  };

  const toggleBookSelection = (bookId) => {
    setSelectedBooks(prev => {
      if (prev.includes(bookId)) {
        const newSelection = prev.filter(id => id !== bookId);
        // Exit selection mode if no books selected
        if (newSelection.length === 0) {
          setSelectionMode(false);
        }
        return newSelection;
      } else {
        return [...prev, bookId];
      }
    });
  };

  const selectAll = () => {
    setSelectedBooks(filteredBooks.map(book => book.id));
  };

  const deselectAll = () => {
    setSelectedBooks([]);
    setSelectionMode(false);
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Books',
      `Are you sure you want to delete ${selectedBooks.length} book${selectedBooks.length > 1 ? 's' : ''}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMultipleBooks(selectedBooks);
              await loadBooks();
              setSelectionMode(false);
              setSelectedBooks([]);
              Alert.alert('Success', `${selectedBooks.length} book${selectedBooks.length > 1 ? 's' : ''} deleted`);
            } catch (error) {
              console.error('Error deleting books:', error);
              Alert.alert('Error', 'Failed to delete books');
            }
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={[styles.searchContainer, { backgroundColor: theme.secondaryColor }]}>
        <Ionicons name="search" size={20} color={theme.textColor} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: theme.textColor }]}
          placeholder="Search your library..."
          placeholderTextColor={COLORS.textTertiary}
          value={searchQuery}
          onChangeText={handleSearch}
          editable={!selectionMode}
        />
        {searchQuery.length > 0 && !selectionMode && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Summary */}
      {!selectionMode && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.accentColor }]}>
              {books.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textColor }]}>
              Total Books
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.accentColor }]}>
              {books.filter(b => !b.is_completed).length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textColor }]}>
              In Progress
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: theme.accentColor }]}>
              {books.filter(b => b.is_completed).length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textColor }]}>
              Completed
            </Text>
          </View>
        </View>
      )}

      <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
        {selectionMode ? `${selectedBooks.length} Selected` : 'Your Books'}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="book-outline" size={80} color={COLORS.textSecondary} />
      <Text style={styles.emptyTitle}>No Books Yet</Text>
      <Text style={styles.emptySubtitle}>
        Tap the + button to add your first book
      </Text>
    </View>
  );

  return (
    <SafeAreaProvider style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Selection Action Bar */}
      {selectionMode && (
        <View style={[styles.selectionBar, { backgroundColor: theme.accentColor }]}>
          <TouchableOpacity onPress={deselectAll} style={styles.selectionAction}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.selectionText}>
            {selectedBooks.length} selected
          </Text>

          <View style={styles.selectionActions}>
            <TouchableOpacity onPress={selectAll} style={styles.selectionAction}>
              <Ionicons name="checkmark-done" size={24} color="#ffffff" />
              <Text style={styles.selectionActionText}>All</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleDeleteSelected} 
              style={[styles.selectionAction, styles.deleteAction]}
              disabled={selectedBooks.length === 0}
            >
              <Ionicons name="trash" size={24} color="#ffffff" />
              <Text style={styles.selectionActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={filteredBooks}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <BookCard 
            book={item} 
            onPress={() => handleBookPress(item)}
            onLongPress={() => handleBookLongPress(item)}
            selectionMode={selectionMode}
            isSelected={selectedBooks.includes(item.id)}
          />
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        numColumns={2}
        columnWrapperStyle={styles.bookRow}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accentColor}
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: SPACING.lg,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  selectionText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.bold,
    flex: 1,
    marginLeft: SPACING.md,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  selectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    gap: SPACING.xs,
  },
  selectionActionText: {
    color: '#ffffff',
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  deleteAction: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SPACING.base,
    marginTop: SPACING.base,
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceDark,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.regular,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.xl,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: COLORS.surfaceDark,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    width: '30%',
  },
  statNumber: {
    fontSize: FONT_SIZES.xxxl,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginHorizontal: SPACING.base,
    marginBottom: SPACING.md,
  },
  bookRow: {
    paddingHorizontal: SPACING.base,
    gap: SPACING.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
    marginTop: SPACING.base,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary,
    textAlign: 'center',
  },
});

export default LibraryScreen;