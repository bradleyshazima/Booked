import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,   
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request notification permissions
export const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reading-reminders', {
        name: 'Reading Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

// Schedule daily reading reminders
export const scheduleDailyReminders = async () => {
  try {
    // Cancel all existing notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    const reminders = [
      { hour: 8, minute: 0, title: '📚 Morning Reading Time', body: 'Start your day with some reading!' },
      { hour: 13, minute: 0, title: '📖 Midday Book Break', body: 'Time for a quick reading session!' },
      { hour: 20, minute: 0, title: '🌙 Evening Wind Down', body: 'End your day with a good book!' }
    ];
    
    for (const reminder of reminders) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.body,
          data: { type: 'daily_reminder' },
        },
        trigger: {
          channelId: 'reading-reminders',
          hour: reminder.hour,
          minute: reminder.minute,
          repeats: true,
        },
      });
    }
    
    console.log('Daily reminders scheduled');
    return true;
  } catch (error) {
    console.error('Error scheduling reminders:', error);
    return false;
  }
};

// Cancel remaining notifications for the day (when goal is met)
export const cancelTodaysReminders = async () => {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const now = new Date();
    
    for (const notification of scheduledNotifications) {
      // Check the DATA object instead of the trigger type
      if (notification.content.data?.type === 'daily_reminder') {
        const trigger = notification.trigger;
        
        // Ensure it's a calendar/daily trigger before checking the hour
        if (trigger.hour !== undefined) {
          if (trigger.hour > now.getHours()) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          }
        }
      }
    }
    
    console.log('Cancelled remaining notifications for today');
    return true;
  } catch (error) {
    console.error('Error cancelling notifications:', error);
    return false;
  }
};

// Send immediate notification
export const sendImmediateNotification = async (title, body) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'immediate' },
      },
      trigger: null, // Send immediately
    });
    return true;
  } catch (error) {
    console.error('Error sending immediate notification:', error);
    return false;
  }
};

// Get all scheduled notifications
export const getScheduledNotifications = async () => {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Cancel all notifications
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All notifications cancelled');
    return true;
  } catch (error) {
    console.error('Error cancelling all notifications:', error);
    return false;
  }
};