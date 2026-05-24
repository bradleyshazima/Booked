import * as SQLite from 'expo-sqlite';

let db = null;

// Initialize database connection
const openDatabase = async () => {
  if (!db) {
    db = await SQLite.openDatabaseAsync('reading_app.db');
  }
  return db;
};

// Initialize all tables
export const initDatabase = async () => {
  try {
    const database = await openDatabase();
    
    // Books table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        total_chapters INTEGER DEFAULT 0,
        last_read_index INTEGER DEFAULT 0,
        is_completed INTEGER DEFAULT 0,
        times_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Books table created');

    // Chapters table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS chapters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        chapter_index INTEGER NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );
    `);
    console.log('Chapters table created');

    // Quotes table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS quotes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        location_index INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );
    `);
    console.log('Quotes table created');

    // Streaks table
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS streaks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        pages_read INTEGER DEFAULT 0,
        goal_met INTEGER DEFAULT 0
      );
    `);
    console.log('Streaks table created');

    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Books CRUD operations
export const addBook = async (title, totalChapters) => {
  try {
    const database = await openDatabase();
    const result = await database.runAsync(
      'INSERT INTO books (title, total_chapters) VALUES (?, ?)',
      [title, totalChapters]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding book:', error);
    throw error;
  }
};

export const getAllBooks = async () => {
  try {
    const database = await openDatabase();
    const result = await database.getAllAsync('SELECT * FROM books ORDER BY created_at DESC');
    return result;
  } catch (error) {
    console.error('Error getting all books:', error);
    throw error;
  }
};

export const getBookById = async (bookId) => {
  try {
    const database = await openDatabase();
    const result = await database.getFirstAsync(
      'SELECT * FROM books WHERE id = ?',
      [bookId]
    );
    return result;
  } catch (error) {
    console.error('Error getting book by ID:', error);
    throw error;
  }
};

export const updateBookProgress = async (bookId, lastReadIndex) => {
  try {
    const database = await openDatabase();
    const result = await database.runAsync(
      'UPDATE books SET last_read_index = ? WHERE id = ?',
      [lastReadIndex, bookId]
    );
    return result;
  } catch (error) {
    console.error('Error updating book progress:', error);
    throw error;
  }
};

export const markBookCompleted = async (bookId) => {
  try {
    const database = await openDatabase();
    const result = await database.runAsync(
      'UPDATE books SET is_completed = 1, times_read = times_read + 1 WHERE id = ?',
      [bookId]
    );
    return result;
  } catch (error) {
    console.error('Error marking book completed:', error);
    throw error;
  }
};

export const resetBookProgress = async (bookId) => {
  try {
    const database = await openDatabase();
    const result = await database.runAsync(
      'UPDATE books SET last_read_index = 0, is_completed = 0 WHERE id = ?',
      [bookId]
    );
    return result;
  } catch (error) {
    console.error('Error resetting book progress:', error);
    throw error;
  }
};

export const deleteBook = async (bookId) => {
  try {
    const database = await openDatabase();
    // This will cascade delete chapters and quotes due to FOREIGN KEY ON DELETE CASCADE
    const result = await database.runAsync(
      'DELETE FROM books WHERE id = ?',
      [bookId]
    );
    return result;
  } catch (error) {
    console.error('Error deleting book:', error);
    throw error;
  }
};

export const deleteMultipleBooks = async (bookIds) => {
  try {
    const database = await openDatabase();
    const placeholders = bookIds.map(() => '?').join(',');
    const result = await database.runAsync(
      `DELETE FROM books WHERE id IN (${placeholders})`,
      bookIds
    );
    return result;
  } catch (error) {
    console.error('Error deleting multiple books:', error);
    throw error;
  }
}

// Chapters CRUD operations
export const addChapter = async (bookId, chapterIndex, title, content) => {
  try {
    const database = await openDatabase();
    const result = await database.runAsync(
      'INSERT INTO chapters (book_id, chapter_index, title, content) VALUES (?, ?, ?, ?)',
      [bookId, chapterIndex, title, content]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding chapter:', error);
    throw error;
  }
};

export const getChaptersByBookId = async (bookId) => {
  try {
    const database = await openDatabase();
    const result = await database.getAllAsync(
      'SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_index ASC',
      [bookId]
    );
    return result;
  } catch (error) {
    console.error('Error getting chapters:', error);
    throw error;
  }
};

export const getChapterByIndex = async (bookId, chapterIndex) => {
  try {
    const database = await openDatabase();
    const result = await database.getFirstAsync(
      'SELECT * FROM chapters WHERE book_id = ? AND chapter_index = ?',
      [bookId, chapterIndex]
    );
    return result;
  } catch (error) {
    console.error('Error getting chapter by index:', error);
    throw error;
  }
};

// Quotes CRUD operations
export const addQuote = async (bookId, content, locationIndex) => {
  try {
    const database = await openDatabase();
    const result = await database.runAsync(
      'INSERT INTO quotes (book_id, content, location_index) VALUES (?, ?, ?)',
      [bookId, content, locationIndex]
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error adding quote:', error);
    throw error;
  }
};

export const getAllQuotes = async () => {
  try {
    const database = await openDatabase();
    const result = await database.getAllAsync(
      `SELECT q.*, b.title as book_title 
       FROM quotes q 
       JOIN books b ON q.book_id = b.id 
       ORDER BY q.created_at DESC`
    );
    return result;
  } catch (error) {
    console.error('Error getting all quotes:', error);
    throw error;
  }
};

export const getQuotesByBookId = async (bookId) => {
  try {
    const database = await openDatabase();
    const result = await database.getAllAsync(
      'SELECT * FROM quotes WHERE book_id = ? ORDER BY created_at DESC',
      [bookId]
    );
    return result;
  } catch (error) {
    console.error('Error getting quotes by book ID:', error);
    throw error;
  }
};

export const deleteQuote = async (quoteId) => {
  try {
    const database = await openDatabase();
    const result = await database.runAsync(
      'DELETE FROM quotes WHERE id = ?',
      [quoteId]
    );
    return result;
  } catch (error) {
    console.error('Error deleting quote:', error);
    throw error;
  }
};

// Streaks CRUD operations
export const updateStreak = async (date, pagesRead, goalMet) => {
  try {
    const database = await openDatabase();
    const result = await database.runAsync(
      `INSERT INTO streaks (date, pages_read, goal_met) 
       VALUES (?, ?, ?) 
       ON CONFLICT(date) 
       DO UPDATE SET pages_read = ?, goal_met = ?`,
      [date, pagesRead, goalMet, pagesRead, goalMet]
    );
    return result;
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
};

export const getStreakByDate = async (date) => {
  try {
    const database = await openDatabase();
    const result = await database.getFirstAsync(
      'SELECT * FROM streaks WHERE date = ?',
      [date]
    );
    return result || null;
  } catch (error) {
    console.error('Error getting streak by date:', error);
    throw error;
  }
};

export const getStreaksForDays = async (days) => {
  try {
    const database = await openDatabase();
    const result = await database.getAllAsync(
      'SELECT * FROM streaks ORDER BY date DESC LIMIT ?',
      [days]
    );
    return result;
  } catch (error) {
    console.error('Error getting streaks for days:', error);
    throw error;
  }
};

export default { initDatabase, openDatabase };