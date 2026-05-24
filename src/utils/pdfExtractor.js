// pdfExtractor.js (now handles EPUB)
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

// Parse content.opf to get the reading order and manifest
const parseContentOPF = (opfContent) => { 
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(opfContent, 'text/xml');
  
  // Get manifest items (all files in the EPUB)
  const manifest = {};
  const manifestItems = xmlDoc.getElementsByTagName('item');
  for (let item of manifestItems) {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const mediaType = item.getAttribute('media-type');
    manifest[id] = { href, mediaType };
  }
  
  // Get spine (reading order)
  const spine = [];
  const spineItems = xmlDoc.getElementsByTagName('itemref');
  for (let item of spineItems) {
    const idref = item.getAttribute('idref');
    if (manifest[idref]) {
      spine.push(manifest[idref].href);
    }
  }
  
  return { manifest, spine };
};

// Parse toc.ncx to get chapter titles
const parseTocNCX = (tocContent) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(tocContent, 'text/xml');
  
  const navPoints = xmlDoc.getElementsByTagName('navPoint');
  const chapters = [];
  
  for (let i = 0; i < navPoints.length; i++) {
    const navPoint = navPoints[i];
    const textNode = navPoint.getElementsByTagName('text')[0];
    const contentNode = navPoint.getElementsByTagName('content')[0];
    
    if (textNode && contentNode) {
      chapters.push({
        title: textNode.textContent.trim(),
        src: contentNode.getAttribute('src')
      });
    }
  }
  
  return chapters;
};

// Clean HTML content for display
const cleanHTMLContent = (html) => {
  // Remove script tags
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags but keep the text
  let text = html.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&amp;/g, '&')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Add proper paragraph breaks
  text = text.replace(/\. ([A-Z])/g, '.\n\n$1');
  
  return text;
};

// Main EPUB extraction function
export const extractPdfText = async (fileUri) => {
  try {
    console.log('Original EPUB URI:', fileUri);
    
    // 1. Copy to safe location
    const tempFileName = `processing_${Date.now()}.epub`;
    const safeUri = await copyFileToAppDirectory(fileUri, tempFileName);
    console.log('Copied to safe storage:', safeUri);
    
    // 2. Read the EPUB file as base64
    const epubBase64 = await FileSystem.readAsStringAsync(safeUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // 3. Unzip the EPUB
    const zip = new JSZip();
    const epubZip = await zip.loadAsync(epubBase64, { base64: true });
    
    // 4. Find and parse container.xml to locate content.opf
    const containerXML = await epubZip.file('META-INF/container.xml').async('string');
    const containerDoc = new DOMParser().parseFromString(containerXML, 'text/xml');
    const rootfile = containerDoc.getElementsByTagName('rootfile')[0];
    const opfPath = rootfile.getAttribute('full-path');
    
    // Get the base directory (e.g., "OEBPS/" or "")
    const baseDir = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
    
    // 5. Parse content.opf
    const opfContent = await epubZip.file(opfPath).async('string');
    const { spine } = parseContentOPF(opfContent);
    
    // 6. Try to parse toc.ncx for chapter titles
    let tocChapters = [];
    try {
      const tocPath = baseDir + 'toc.ncx';
      if (epubZip.file(tocPath)) {
        const tocContent = await epubZip.file(tocPath).async('string');
        tocChapters = parseTocNCX(tocContent);
      }
    } catch (tocError) {
      console.log('No toc.ncx found, using spine order');
    }
    
    // 7. Extract content from each chapter in the spine
    const chapters = [];
    
    for (let i = 0; i < spine.length; i++) {
      const chapterPath = baseDir + spine[i].split('#')[0]; // Remove fragment identifier
      
      try {
        const chapterFile = epubZip.file(chapterPath);
        if (!chapterFile) {
          console.log(`Skipping missing file: ${chapterPath}`);
          continue;
        }
        
        const htmlContent = await chapterFile.async('string');
        const textContent = cleanHTMLContent(htmlContent);
        
        // Skip if content is too short (likely metadata pages)
        if (textContent.length < 100) {
          continue;
        }
        
        // Find matching title from TOC
        let title = `Chapter ${chapters.length + 1}`;
        const matchingToc = tocChapters.find(toc => 
          spine[i].includes(toc.src.split('#')[0])
        );
        if (matchingToc) {
          title = matchingToc.title;
        }
        
        chapters.push({
          chapter_index: chapters.length,
          title: title,
          content: textContent
        });
        
      } catch (fileError) {
        console.log(`Error reading chapter ${chapterPath}:`, fileError);
        continue;
      }
    }
    
    console.log(`Extracted ${chapters.length} chapters from EPUB`);
    
    // 8. Cleanup
    await FileSystem.deleteAsync(safeUri, { idempotent: true });
    
    if (chapters.length === 0) {
      throw new Error('No readable chapters found in EPUB');
    }
    
    return {
      success: true,
      chapters,
      totalChapters: chapters.length
    };
    
  } catch (error) {
    console.error('EPUB extraction error:', error);
    return {
      success: false,
      error: error.message
    };
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