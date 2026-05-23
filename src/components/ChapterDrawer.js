import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';

const ChapterDrawer = ({ visible, chapters, currentChapter, onSelectChapter, onClose }) => {
  const renderChapterItem = ({ item, index }) => {
    const isActive = index === currentChapter;

    return (
      <TouchableOpacity
        style={[styles.chapterItem, isActive && styles.activeChapterItem]}
        onPress={() => onSelectChapter(index)}
        activeOpacity={0.7}
      >
        <View style={styles.chapterLeft}>
          <View style={[styles.chapterNumber, isActive && styles.activeChapterNumber]}>
            <Text style={[styles.chapterNumberText, isActive && styles.activeChapterNumberText]}>
              {index + 1}
            </Text>
          </View>
          
          <View style={styles.chapterInfo}>
            <Text style={[styles.chapterTitle, isActive && styles.activeChapterTitle]} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
        </View>

        {isActive && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="list" size={24} color={COLORS.textPrimary} />
            <Text style={styles.headerTitle}>Chapters</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Chapter List */}
        <FlatList
          data={chapters}
          renderItem={renderChapterItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.base,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginLeft: SPACING.md,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  listContent: {
    padding: SPACING.base,
  },
  chapterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.base,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeChapterItem: {
    backgroundColor: `${COLORS.primary}10`,
    borderColor: COLORS.primary,
  },
  chapterLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterNumber: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.divider,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  activeChapterNumber: {
    backgroundColor: COLORS.primary,
  },
  chapterNumberText: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.bold,
    color: COLORS.textSecondary,
  },
  activeChapterNumberText: {
    color: COLORS.textInverse,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: FONT_SIZES.base,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    lineHeight: FONT_SIZES.base * 1.4,
  },
  activeChapterTitle: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
});

export default ChapterDrawer;