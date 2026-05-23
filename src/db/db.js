import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('reading_app.db');

// Initialize all tables
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // Books table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS books (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          total_chapters INTEGER DEFAULT 0,
          last_read_index INTEGER DEFAULT 0,
          is_completed INTEGER DEFAULT 0,
          times_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );`,
        [],
        () => console.log('Books table created'),
        (_, error) => console.error('Error creating books table:', error)
      );

      // Chapters table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS chapters (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          chapter_index INTEGER NOT NULL,
          title TEXT,
          content TEXT NOT NULL,
          FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        );`,
        [],
        () => console.log('Chapters table created'),
        (_, error) => console.error('Error creating chapters table:', error)
      );

      // Quotes table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS quotes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          book_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          location_index INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        );`,
        [],
        () => console.log('Quotes table created'),
        (_, error) => console.error('Error creating quotes table:', error)
      );

      // Streaks table
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS streaks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT UNIQUE NOT NULL,
          pages_read INTEGER DEFAULT 0,
          goal_met INTEGER DEFAULT 0
        );`,
        [],
        () => console.log('Streaks table created'),
        (_, error) => console.error('Error creating streaks table:', error)
      );
    }, reject, resolve);
  });
};

// Books CRUD operations
export const addBook = (title, totalChapters) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO books (title, total_chapters) VALUES (?, ?)',
        [title, totalChapters],
        (_, result) => resolve(result.insertId),
        (_, error) => reject(error)
      );
    });
  });
};

export const getAllBooks = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM books ORDER BY created_at DESC',
        [],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => reject(error)
      );
    });
  });
};

export const getBookById = (bookId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM books WHERE id = ?',
        [bookId],
        (_, { rows: { _array } }) => resolve(_array[0]),
        (_, error) => reject(error)
      );
    });
  });
};

export const updateBookProgress = (bookId, lastReadIndex) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE books SET last_read_index = ? WHERE id = ?',
        [lastReadIndex, bookId],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const markBookCompleted = (bookId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE books SET is_completed = 1, times_read = times_read + 1 WHERE id = ?',
        [bookId],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const resetBookProgress = (bookId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'UPDATE books SET last_read_index = 0, is_completed = 0 WHERE id = ?',
        [bookId],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// Chapters CRUD operations
export const addChapter = (bookId, chapterIndex, title, content) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO chapters (book_id, chapter_index, title, content) VALUES (?, ?, ?, ?)',
        [bookId, chapterIndex, title, content],
        (_, result) => resolve(result.insertId),
        (_, error) => reject(error)
      );
    });
  });
};

export const getChaptersByBookId = (bookId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_index ASC',
        [bookId],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => reject(error)
      );
    });
  });
};

export const getChapterByIndex = (bookId, chapterIndex) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM chapters WHERE book_id = ? AND chapter_index = ?',
        [bookId, chapterIndex],
        (_, { rows: { _array } }) => resolve(_array[0]),
        (_, error) => reject(error)
      );
    });
  });
};

// Quotes CRUD operations
export const addQuote = (bookId, content, locationIndex) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO quotes (book_id, content, location_index) VALUES (?, ?, ?)',
        [bookId, content, locationIndex],
        (_, result) => resolve(result.insertId),
        (_, error) => reject(error)
      );
    });
  });
};

export const getAllQuotes = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT q.*, b.title as book_title 
         FROM quotes q 
         JOIN books b ON q.book_id = b.id 
         ORDER BY q.created_at DESC`,
        [],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => reject(error)
      );
    });
  });
};

export const getQuotesByBookId = (bookId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM quotes WHERE book_id = ? ORDER BY created_at DESC',
        [bookId],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => reject(error)
      );
    });
  });
};

export const deleteQuote = (quoteId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM quotes WHERE id = ?',
        [quoteId],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// Streaks CRUD operations
export const updateStreak = (date, pagesRead, goalMet) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO streaks (date, pages_read, goal_met) 
         VALUES (?, ?, ?) 
         ON CONFLICT(date) 
         DO UPDATE SET pages_read = ?, goal_met = ?`,
        [date, pagesRead, goalMet, pagesRead, goalMet],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

export const getStreakByDate = (date) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM streaks WHERE date = ?',
        [date],
        (_, { rows: { _array } }) => resolve(_array[0] || null),
        (_, error) => reject(error)
      );
    });
  });
};

export const getStreaksForDays = (days) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM streaks ORDER BY date DESC LIMIT ?',
        [days],
        (_, { rows: { _array } }) => resolve(_array),
        (_, error) => reject(error)
      );
    });
  });
};

export default db;