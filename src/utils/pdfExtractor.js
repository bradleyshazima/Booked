import * as FileSystem from 'expo-file-system';
import { extractText } from 'expo-pdf-text-extract';

// Parse extracted text into structured chapters
const parseTextIntoChapters = (rawText) => {
  const chapters = [];
  
  // Split text into lines for analysis
  const lines = rawText.split('\n');
  
  let currentChapter = null;
  let chapterIndex = 0;
  let contentBuffer = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) continue;
    
    // Detect chapter headings using multiple patterns
    const isChapterHeading = 
      /^(chapter|ch\.?)\s+\d+/i.test(line) ||
      /^(part|section)\s+\d+/i.test(line) ||
      /^\d+\.\s+[A-Z]/.test(line) ||
      (line.length < 100 && line === line.toUpperCase() && line.length > 3);
    
    if (isChapterHeading) {
      // Save previous chapter if exists
      if (currentChapter) {
        currentChapter.content = contentBuffer.join('\n\n');
        chapters.push(currentChapter);
      }
      
      // Start new chapter
      currentChapter = {
        chapter_index: chapterIndex++,
        title: line,
        content: ''
      };
      contentBuffer = [];
    } else {
      // Add to current chapter content
      contentBuffer.push(line);
    }
  }
  
  // Add the last chapter
  if (currentChapter) {
    currentChapter.content = contentBuffer.join('\n\n');
    chapters.push(currentChapter);
  }
  
  // If no chapters detected, create single chapter with all content
  if (chapters.length === 0) {
    chapters.push({
      chapter_index: 0,
      title: 'Full Text',
      content: rawText
    });
  }
  
  return chapters;
};

// Enhanced text cleaning and formatting
const cleanAndFormatText = (text) => {
  // Remove image references and metadata
  text = text.replace(/\[Image:.*?\]/g, '');
  text = text.replace(/\[Fig\.?\s+\d+.*?\]/gi, '');
  
  // Clean up excessive whitespace
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/[ \t]{2,}/g, ' ');
  
  // Detect and format lists
  text = formatLists(text);
  
  // Detect and format headings/subheadings
  text = formatHeadings(text);
  
  return text.trim();
};

// Format detected lists (bulleted and numbered)
const formatLists = (text) => {
  const lines = text.split('\n');
  const formatted = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect bulleted lists
    if (/^[•·‣▪▫○●∙⦿⦾]\s+/.test(line)) {
      formatted.push('  • ' + line.replace(/^[•·‣▪▫○●∙⦿⦾]\s+/, ''));
      continue;
    }
    
    // Detect numbered lists
    if (/^\d+[.)\]:]\s+/.test(line)) {
      formatted.push('  ' + line);
      continue;
    }
    
    // Detect alphabetic lists
    if (/^[a-z][.)\]]\s+/i.test(line)) {
      formatted.push('  ' + line);
      continue;
    }
    
    formatted.push(line);
  }
  
  return formatted.join('\n');
};

// Format headings and subheadings based on context
const formatHeadings = (text) => {
  const lines = text.split('\n');
  const formatted = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
    const prevLine = i > 0 ? lines[i - 1].trim() : '';
    
    // Skip empty lines
    if (!line) {
      formatted.push('');
      continue;
    }
    
    // Detect headings (short lines, capitalized, followed by content)
    const isHeading = 
      line.length < 80 &&
      line === line.toUpperCase() &&
      line.length > 3 &&
      nextLine &&
      nextLine !== nextLine.toUpperCase();
    
    // Detect subheadings (title case, short, followed by content)
    const isSubheading = 
      line.length < 80 &&
      /^[A-Z][a-z]+/.test(line) &&
      !line.endsWith('.') &&
      !line.endsWith(',') &&
      nextLine &&
      !prevLine;
    
    if (isHeading) {
      formatted.push('\n## ' + line + '\n');
    } else if (isSubheading) {
      formatted.push('\n### ' + line + '\n');
    } else {
      formatted.push(line);
    }
  }
  
  return formatted.join('\n');
};

// Main PDF extraction function
export const extractPdfText = async (fileUri) => {
  try {
    console.log('Extracting PDF from:', fileUri);
    
    // Extract raw text from PDF
    const rawText = await extractText({ uri: fileUri });
    
    if (!rawText || rawText.trim().length === 0) {
      throw new Error('No text could be extracted from the PDF');
    }
    
    // Clean and format the text
    const cleanedText = cleanAndFormatText(rawText);
    
    // Parse into structured chapters
    const chapters = parseTextIntoChapters(cleanedText);
    
    console.log(`Extracted ${chapters.length} chapters`);
    
    return {
      success: true,
      chapters,
      totalChapters: chapters.length
    };
    
  } catch (error) {
    console.error('PDF extraction error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Get file info
export const getFileInfo = async (uri) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo;
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};

// Copy file to app directory
export const copyFileToAppDirectory = async (sourceUri, filename) => {
  try {
    const destinationUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destinationUri
    });
    return destinationUri;
  } catch (error) {
    console.error('Error copying file:', error);
    throw error;
  }
};