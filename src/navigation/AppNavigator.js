import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../theme';

// Import screens
import LibraryScreen from '../screens/LibraryScreen';
import UploadScreen from '../screens/UploadScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ReadingScreen from '../screens/ReadingScreen';

// Import custom tab bar
import LiquidGlassTabBar from '../components/LiquidGlassTabBar';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab Navigator Component with Liquid Glass Tab Bar
const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: COLORS.textInverse,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTransparent: true,
        headerBackground: () => null,
      }}
    >
      <Tab.Screen 
        name="Library" 
        component={LibraryScreen}
        options={{
          title: 'Library',
          headerShown: true,
        }}
      />
      <Tab.Screen 
        name="Upload" 
        component={UploadScreen}
        options={{
          title: 'Add Book',
        }}
      />
      <Tab.Screen 
        name="Progress" 
        component={ProgressScreen}
        options={{
          title: 'Stats',
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigator
const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        cardStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={TabNavigator} 
      />
      <Stack.Screen 
        name="Reading" 
        component={ReadingScreen}
        options={{
          presentation: 'fullScreenModal',
          animationEnabled: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;