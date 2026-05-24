import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AppProvider } from './src/context/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import { requestNotificationPermissions, scheduleDailyReminders } from './src/utils/notificationScheduler';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Ignore specific warnings
LogBox.ignoreLogs(['new NativeEventEmitter']);

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      // Load custom fonts
      await Font.loadAsync({
        'SFPro-Regular': require('./assets/fonts/SFPro-Regular.otf'),
        'SFPro-Medium': require('./assets/fonts/SFPro-Medium.otf'),
        'SFPro-Bold': require('./assets/fonts/SFPro-Bold.otf'),
        'Serif-Regular': require('./assets/fonts/Serif-Regular.ttf'),
        'Serif-Medium': require('./assets/fonts/Serif-Medium.ttf'),
        'Serif-Italic': require('./assets/fonts/Serif-Italic.ttf'),
        'Serif-Bold': require('./assets/fonts/Serif-Bold.ttf'),
      });

      // Request notification permissions
      const hasPermission = await requestNotificationPermissions();
      if (hasPermission) {
        await scheduleDailyReminders();
      }

      setFontsLoaded(true);
      await SplashScreen.hideAsync();
    } catch (error) {
      console.error('Error loading resources:', error);
      setFontsLoaded(true);
      await SplashScreen.hideAsync();
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
        <AppNavigator />
      </NavigationContainer>
    </AppProvider>
  );
}