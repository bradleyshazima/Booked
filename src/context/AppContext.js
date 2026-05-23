import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase } from '../db/db';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState({
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    accentColor: '#6366f1',
    secondaryColor: '#4b5563',
    fontSize: 16,
    fontFamily: 'System',
    lineHeight: 1.6,
  });

  // Reading goal state
  const [dailyGoal, setDailyGoal] = useState(20); // pages per day
  const [todayProgress, setTodayProgress] = useState(0);
  
  // Active streak
  const [currentStreak, setCurrentStreak] = useState(0);
  
  // Database initialization status
  const [dbInitialized, setDbInitialized] = useState(false);

  // Initialize database on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        setDbInitialized(true);
        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Database initialization error:', error);
      }
    };
    
    init();
  }, []);

  // Load saved preferences
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        const savedGoal = await AsyncStorage.getItem('dailyGoal');
        
        if (savedTheme) {
          setTheme(JSON.parse(savedTheme));
        }
        
        if (savedGoal) {
          setDailyGoal(parseInt(savedGoal, 10));
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };
    
    loadPreferences();
  }, []);

  // Save theme preference
  const updateTheme = async (newTheme) => {
    try {
      const updatedTheme = { ...theme, ...newTheme };
      setTheme(updatedTheme);
      await AsyncStorage.setItem('theme', JSON.stringify(updatedTheme));
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Save daily goal
  const updateDailyGoal = async (goal) => {
    try {
      setDailyGoal(goal);
      await AsyncStorage.setItem('dailyGoal', goal.toString());
    } catch (error) {
      console.error('Error saving daily goal:', error);
    }
  };

  // Update today's progress
  const updateTodayProgress = (progress) => {
    setTodayProgress(progress);
  };

  // Calculate streak
  const calculateStreak = (streakData) => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < streakData.length; i++) {
      const streakDate = new Date(streakData[i].date);
      const daysDiff = Math.floor((today - streakDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === i && streakData[i].goal_met === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    setCurrentStreak(streak);
    return streak;
  };

  const value = {
    theme,
    updateTheme,
    dailyGoal,
    updateDailyGoal,
    todayProgress,
    updateTodayProgress,
    currentStreak,
    calculateStreak,
    dbInitialized,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;