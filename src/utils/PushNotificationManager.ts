import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// PUSH NOTIFICATION MANAGER - Pre-prompt + Behavioral Triggers
const PUSH_PREF_KEY = 'push_permission_shown';
const NOTIFICATION_PREF_KEY = 'notifications_enabled';

export interface NotificationItem {
  title: string;
  body: string;
  trigger?: Record<string, any>;
  id: string;
  triggerInactivityDays?: number;
}

export interface AppNotificationConfig {
  [key: string]: NotificationItem;
}

export async function shouldShowPushPrePrompt(): Promise<boolean> {
  const shown = await AsyncStorage.getItem(PUSH_PREF_KEY);
  const enabled = await AsyncStorage.getItem(NOTIFICATION_PREF_KEY);
  return !shown && !enabled;
}

export async function handlePushPrePromptResponse(agreed: boolean): Promise<void> {
  await AsyncStorage.setItem(PUSH_PREF_KEY, 'true');
  if (agreed) {
    await requestPushPermission();
  } else {
    await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, 'false');
  }
}

async function requestPushPermission(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, 'true');
      return true;
    }
    await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, 'false');
    return false;
  } catch (error) {
    console.log('Push permission error:', error);
    return false;
  }
}

export const NOTIFICATION_CONFIGS: Record<string, AppNotificationConfig> = {
  ContentAIPro: {
    weeklyContentReminder: {
      title: "Time to create this week's content",
      body: 'Your audience is waiting. Generate a week of posts in 2 minutes.',
      trigger: { weekday: 1, hour: 9, minute: 0 },
      id: 'contentai_weekly',
    },
    reEngagement: {
      title: 'Your content calendar is waiting',
      body: 'Generate fresh social posts, blog articles, and ads in seconds.',
      triggerInactivityDays: 5,
      id: 'contentai_reengage',
    },
  },
  AIResumeBuilder: {
    monthlyUpdate: {
      title: 'Is your resume up to date?',
      body: 'New achievements? Update your resume in 2 minutes with AI.',
      trigger: { day: 1, hour: 10, minute: 0 },
      id: 'resume_monthly',
    },
    reEngagement: {
      title: "Don't let your resume get stale",
      body: 'Update your resume and run an ATS check to stay job-ready.',
      triggerInactivityDays: 14,
      id: 'resume_reengage',
    },
  },
  InvoiceAI: {
    invoiceReminder: {
      title: 'You have pending invoices',
      body: 'Check your invoice status and send reminders to clients.',
      trigger: { weekday: 2, hour: 9, minute: 0 },
      id: 'invoice_weekly',
    },
    reEngagement: {
      title: 'Time to send invoices',
      body: 'Create and send professional invoices in under 60 seconds.',
      triggerInactivityDays: 7,
      id: 'invoice_reengage',
    },
  },
  ProposalAI: {
    proposalFollowup: {
      title: 'Follow up on your proposals',
      body: 'Check proposal status and send follow-ups to close deals.',
      trigger: { weekday: 3, hour: 9, minute: 0 },
      id: 'proposal_weekly',
    },
    reEngagement: {
      title: 'Win more clients this week',
      body: 'Create AI proposals that close deals faster.',
      triggerInactivityDays: 10,
      id: 'proposal_reengage',
    },
  },
  AIBookkeeperPro: {
    weeklyReceiptScan: {
      title: "Scan this week's receipts",
      body: 'Snap your receipts and let AI handle the data entry.',
      trigger: { weekday: 5, hour: 18, minute: 0 },
      id: 'bookkeeper_weekly',
    },
    monthlyTaxReminder: {
      title: 'Check your tax deductions',
      body: "See how much you've saved in tax deductions this month.",
      trigger: { day: 28, hour: 10, minute: 0 },
      id: 'bookkeeper_monthly',
    },
    reEngagement: {
      title: "Don't miss tax deductions",
      body: 'Scan receipts and let AI find deductions you might be missing.',
      triggerInactivityDays: 7,
      id: 'bookkeeper_reengage',
    },
  },
};

export async function scheduleNotifications(appKey: string): Promise<void> {
  const enabled = await AsyncStorage.getItem(NOTIFICATION_PREF_KEY);
  if (enabled !== 'true') return;

  const configs = NOTIFICATION_CONFIGS[appKey];
  if (!configs) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const [_, config] of Object.entries(configs)) {
    if (config.trigger) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: config.title,
          body: config.body,
          sound: true,
        },
        trigger: config.trigger as Notifications.NotificationTriggerInput,
        identifier: config.id,
      });
    }
  }
}

export async function checkReEngagement(appKey: string): Promise<void> {
  const configs = NOTIFICATION_CONFIGS[appKey];
  if (!configs?.reEngagement) return;

  const lastActiveKey = `last_active_${appKey}`;
  const lastActive = await AsyncStorage.getItem(lastActiveKey);

  if (lastActive) {
    const daysInactive = (Date.now() - parseInt(lastActive, 10)) / (1000 * 60 * 60 * 24);
    if (daysInactive >= (configs.reEngagement.triggerInactivityDays || 7)) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: configs.reEngagement.title,
          body: configs.reEngagement.body,
          sound: true,
        },
        trigger: { seconds: 1 } as Notifications.NotificationTriggerInput,
        identifier: configs.reEngagement.id,
      });
    }
  }

  await AsyncStorage.setItem(lastActiveKey, Date.now().toString());
}
