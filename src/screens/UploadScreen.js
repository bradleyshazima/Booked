import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { addBook, addChapter, getAllBooks } from '../db/db';
import { extractPdfText, copyFileToAppDirectory } from '../utils/pdfExtractor';
import { COLORS, FONTS } from '../theme/index';

const UploadScreen = ({ navigation }) => {
  const { theme } = useApp();
  const [selectedFile, setSelectedFile] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/epub+zip', 'application/epub'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success' || !result.canceled) {
        const file = result.assets ? result.assets[0] : result;
        setSelectedFile(file);
        
        const filename = file.name.replace('.epub', '');
        setBookTitle(filename);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const checkIfBookExists = async (title) => {
    try {
      const allBooks = await getAllBooks();
      return allBooks.find(book => 
        book.title.toLowerCase() === title.toLowerCase()
      );
    } catch (e) {
      return null;
    }
  };

  const processAndSaveBook = async () => {
    if (!selectedFile) {
      Alert.alert('No File', 'Please select an EPUB file first');
      return;
    }

    if (!bookTitle.trim()) {
      Alert.alert('No Title', 'Please enter a title for the book');
      return;
    }

    const existingBook = await checkIfBookExists(bookTitle.trim());
    if (existingBook) {
      Alert.alert(
        'Book Already Exists',
        `"${bookTitle}" is already in your library. Do you want to open it?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Book',
            onPress: () => {
              navigation.navigate('Reading', { bookId: existingBook.id });
            },
          },
        ]
      );
      return;
    }

    setProcessing(true);
    setProgress('Extracting chapters from EPUB...');

    try {
      const extraction = await extractPdfText(selectedFile.uri);

      if (!extraction.success) {
        throw new Error(extraction.error);
      }

      setProgress('Saving book to database...');
      const bookId = await addBook(bookTitle.trim(), extraction.totalChapters);

      setProgress('Saving chapters...');
      for (let i = 0; i < extraction.chapters.length; i++) {
        const chapter = extraction.chapters[i];
        await addChapter(
          bookId,
          chapter.chapter_index,
          chapter.title,
          chapter.content
        );
        
        const percent = Math.round(((i + 1) / extraction.chapters.length) * 100);
        setProgress(`Saving chapters... ${percent}%`);
      }

      try {
        await copyFileToAppDirectory(selectedFile.uri, `${bookId}.epub`);
      } catch (copyError) {
        console.log('Warning: Could not copy EPUB file:', copyError);
      }

      setProgress('Complete!');
      
      Alert.alert(
        'Success!',
        `"${bookTitle}" has been added to your library`,
        [
          {
            text: 'Start Reading',
            onPress: () => {
              navigation.navigate('Reading', { bookId });
            },
          },
          {
            text: 'Go to Library',
            onPress: () => {
              navigation.navigate('Library');
              resetForm();
            },
          },
        ]
      );

    } catch (error) {
      console.error('Error processing book:', error);
      Alert.alert('Error', `Failed to process book: ${error.message}`);
    } finally {
      setProcessing(false);
      setProgress('');
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setBookTitle('');
    setProgress('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0} 
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <Ionicons name="cloud-upload-outline" size={80} color={theme.accentColor} />
              <Text style={[styles.title, { color: theme.textColor }]}>
                Add New Book
              </Text>
              <Text style={[styles.subtitle, { color: theme.secondaryColor }]}>
                Upload an EPUB to start your reading journey
              </Text>
            </View>

            {/* File Picker */}
            <TouchableOpacity
              style={[
                styles.dropZone,
                { borderColor: selectedFile ? theme.accentColor : theme.secondaryColor },
                selectedFile && { backgroundColor: `${theme.accentColor}15` }
              ]}
              onPress={pickDocument}
              disabled={processing}
            >
              <Ionicons
                name={selectedFile ? 'document-text' : 'cloud-upload-outline'}
                size={48}
                color={selectedFile ? theme.accentColor : theme.secondaryColor}
              />
              <Text style={[styles.dropZoneText, { color: theme.textColor }]}>
                {selectedFile ? selectedFile.name : 'Tap to upload file'}
              </Text>
              {selectedFile && (
                <Text style={[styles.fileSize, { color: theme.secondaryColor }]}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              )}
            </TouchableOpacity>

            {/* Title Input */}
            {selectedFile && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.textColor }]}>
                  Book Title
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.secondaryColor,
                      color: theme.textColor,
                      borderColor: theme.accentColor,
                    }
                  ]}
                  value={bookTitle}
                  onChangeText={setBookTitle}
                  placeholder="Enter book title..."
                  placeholderTextColor={COLORS.textTertiary}
                  editable={!processing}
                />
              </View>
            )}

            {/* Processing Status */}
            {processing && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={theme.accentColor} />
                <Text style={[styles.processingText, { color: theme.textColor }]}>
                  {progress}
                </Text>
              </View>
            )}

            {/* Upload Button */}
            {selectedFile && !processing && (
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: theme.accentColor }]}
                onPress={processAndSaveBook}
              >
                <Ionicons name="checkmark-circle" size={24} color="#ffffff" />
                <Text style={styles.uploadButtonText}>Process & Save Book</Text>
              </TouchableOpacity>
            )}

            {/* Cancel Button */}
            {selectedFile && !processing && (
              <TouchableOpacity
                style={[styles.resetButton, { borderColor: theme.secondaryColor }]}
                onPress={resetForm}
              >
                <Text style={[styles.resetButtonText, { color: theme.textColor }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    flexGrow: 1, // Ensures content stretches beautifully if short
    paddingBottom: 120, // Accommodates your new floating bottom tab bar!
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: FONTS.bold,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontFamily: FONTS.regular,
  },
  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dropZoneText: {
    fontSize: 16,
    marginTop: 12,
    fontWeight: '500',
    fontFamily: FONTS.medium,
  },
  fileSize: {
    fontSize: 12,
    marginTop: 4,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  processingContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  processingText: {
    fontSize: 14,
    marginTop: 12,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resetButton: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UploadScreen;