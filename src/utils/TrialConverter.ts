import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Alert, Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';

// TRIAL CONVERTER - 7-Day Free Trial Management
// Research: 80-90% of free trial starts occur on Day 0 during onboarding
// 35-45% trial-to-paid conversion for 7-day trials on business apps
// 48-hour pre-expiry notification reduces refunds by 40%

const TRIAL_START_KEY = 'trial_start_date';
const TRIAL_EXPIRY_KEY = 'trial_expiry_date';
const TRIAL_EXPIRY_NOTIFIED_KEY = 'trial_expiry_notified';
const HAS_TRIALED_KEY = 'has_trialed';

// START TRIAL - Called when user taps "Start Free Trial"
export async function startTrial() {
  const now = Date.now();
  const expiry = now + (7 * 24 * 60 * 60 * 1000); // 7 days

  await AsyncStorage.setItem(TRIAL_START_KEY, now.toString());
  await AsyncStorage.setItem(TRIAL_EXPIRY_KEY, expiry.toString());
  await AsyncStorage.setItem(HAS_TRIALED_KEY, 'true');
  await AsyncStorage.setItem(TRIAL_EXPIRY_NOTIFIED_KEY, 'false');

  return { startDate: now, expiryDate: expiry };
}

// CHECK TRIAL STATUS - Call on app open
export async function checkTrialStatus() {
  const startStr = await AsyncStorage.getItem(TRIAL_START_KEY);
  const expiryStr = await AsyncStorage.getItem(TRIAL_EXPIRY_KEY);

  if (!startStr || !expiryStr) {
    return { isTrialing: false, daysLeft: 0, hasTrialed: false };
  }

  const expiry = parseInt(expiryStr);
  const now = Date.now();
  const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

  const hasTrialed = await AsyncStorage.getItem(HAS_TRIALED_KEY) === 'true';

  return {
    isTrialing: now < expiry,
    daysLeft: Math.max(daysLeft, 0),
    hasTrialed,
    expiryDate: expiry,
    startDate: parseInt(startStr),
  };
}

// CHECK FOR 48-HOUR PRE-EXPIRY NOTIFICATION
// Send a push notification 48 hours before trial ends
// Reduces refund requests by 40% and builds trust
export async function checkTrialExpiryNotification(appName) {
  const notified = await AsyncStorage.getItem(TRIAL_EXPIRY_NOTIFIED_KEY) === 'true';
  if (notified) return false;

  const expiryStr = await AsyncStorage.getItem(TRIAL_EXPIRY_KEY);
  if (!expiryStr) return false;

  const expiry = parseInt(expiryStr);
  const now = Date.now();
  const hoursUntilExpiry = (expiry - now) / (1000 * 60 * 60);

  // If within 48 hours of expiry, schedule notification
  if (hoursUntilExpiry <= 48 && hoursUntilExpiry > 0) {
    await AsyncStorage.setItem(TRIAL_EXPIRY_NOTIFIED_KEY, 'true');

    // Schedule local notification
    try {
      const Notifications = require('expo-notifications').default;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Your ${appName || 'Pro'} trial ends in 2 days`,
          body: `Enjoying the app? Your free trial ends soon. Keep all features with a subscription - cancel anytime.`,
          sound: true,
          data: { type: 'trial_expiry' },
        },
        trigger: { seconds: 1 },
      });
    } catch (e) {
      console.log('Notification error:', e);
    }

    return true;
  }

  return false;
}

// TRIAL PAYWALL TEXT - Dynamic based on trial status
export function getTrialPaywallText(trialStatus) {
  if (trialStatus.isTrialing && trialStatus.daysLeft > 0) {
    return {
      cta: 'Continue Free Trial',
      subtext: `${trialStatus.daysLeft} ${trialStatus.daysLeft === 1 ? 'day' : 'days'} left in your free trial`,
      showTrialBanner: true,
    };
  }

  if (trialStatus.hasTrialed && !trialStatus.isTrialing) {
    return {
      cta: 'Subscribe Now',
      subtext: 'Your trial has ended. Subscribe to keep all features.',
      showTrialBanner: false,
    };
  }

  return {
    cta: 'Start 7-Day Free Trial',
    subtext: 'No charge for 7 days. Then $14.99/mo or $99.99/yr. Cancel anytime.',
    showTrialBanner: false,
  };
}

// CONVERT TRIAL TO PAID - Called after successful purchase during trial
export async function convertTrialToPaid() {
  await AsyncStorage.removeItem(TRIAL_START_KEY);
  await AsyncStorage.removeItem(TRIAL_EXPIRY_KEY);
  await AsyncStorage.removeItem(TRIAL_EXPIRY_NOTIFIED_KEY);
}

// CELEBRATE CONVERSION - Show celebration UI after trial-to-paid conversion
export function getConversionCelebration(appName) {
  return {
    title: `Welcome to ${appName || 'Pro'}!`,
    message: 'You now have unlimited access to all features. Let\'s get to work!',
    icon: 'checkmark-circle',
    autoDismiss: true,
    dismissAfter: 3000,
  };
}
