import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

// SMART RATING PROMPT - Session-gated SKStoreReviewController
// Research: Apple limits to 3 prompts per 365 days per user
// Top apps trigger at "Moments of Delight" with 3-5 session minimum

const SESSION_COUNT_KEY = 'session_count';
const LAST_RATING_PROMPT_KEY = 'last_rating_prompt_date';
const RATING_TRIGGERED_KEY = 'rating_triggered_events';

// Track session count - increment on each app open
export async function incrementSessionCount(): Promise<number> {
  const count = await AsyncStorage.getItem(SESSION_COUNT_KEY);
  const newCount = (parseInt(count || '0', 10) + 1).toString();
  await AsyncStorage.setItem(SESSION_COUNT_KEY, newCount);
  return parseInt(newCount, 10);
}

// Check if we should show rating prompt
// Conditions: 3+ sessions, not prompted in last 90 days, hasn't been triggered for this event
export async function shouldShowRatingPrompt(triggerEvent: string): Promise<boolean> {
  const sessionCount = parseInt(await AsyncStorage.getItem(SESSION_COUNT_KEY) || '0', 10);
  const lastPrompt = await AsyncStorage.getItem(LAST_RATING_PROMPT_KEY);
  const triggeredEvents: string[] = JSON.parse(await AsyncStorage.getItem(RATING_TRIGGERED_KEY) || '[]');

  // Need at least 3 sessions
  if (sessionCount < 3) return false;

  // Don't prompt more than once per 90 days
  if (lastPrompt) {
    const daysSince = (Date.now() - parseInt(lastPrompt, 10)) / (1000 * 60 * 60 * 24);
    if (daysSince < 90) return false;
  }

  // Don't trigger for the same event twice
  if (triggeredEvents.includes(triggerEvent)) return false;

  return true;
}

// MOMENTS OF DELIGHT - Each app has specific trigger events
export const RATING_TRIGGERS = {
  ContentAIPro: {
    contentGenerated: 'content_generated',
    contentShared: 'content_shared',
    voiceOverCreated: 'voiceover_created',
    bulkGenerated: 'bulk_generated',
  },
  AIResumeBuilder: {
    resumeExported: 'resume_exported',
    atsScoreChecked: 'ats_score_checked',
    coverLetterCreated: 'cover_letter_created',
    resumeCompleted: 'resume_completed',
  },
  InvoiceAI: {
    invoiceCreated: 'invoice_created',
    invoiceSent: 'invoice_sent',
    estimateCreated: 'estimate_created',
    paymentReceived: 'payment_received',
  },
  ProposalAI: {
    proposalGenerated: 'proposal_generated',
    pitchDeckCreated: 'pitchdeck_created',
    proposalExported: 'proposal_exported',
    proposalSent: 'proposal_sent',
  },
  AIBookkeeperPro: {
    receiptScanned: 'receipt_scanned',
    deductionFound: 'deduction_found',
    reportGenerated: 'report_generated',
    taxEstimated: 'tax_estimated',
  },
};

// Show the rating prompt using SKStoreReviewController
export async function showRatingPrompt(triggerEvent: string): Promise<boolean> {
  const canShow = await shouldShowRatingPrompt(triggerEvent);
  if (!canShow) return false;

  try {
    const triggeredEvents: string[] = JSON.parse(await AsyncStorage.getItem(RATING_TRIGGERED_KEY) || '[]');
    triggeredEvents.push(triggerEvent);
    await AsyncStorage.setItem(RATING_TRIGGERED_KEY, JSON.stringify(triggeredEvents));

    await AsyncStorage.setItem(LAST_RATING_PROMPT_KEY, Date.now().toString());

    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      return true;
    }
  } catch (error) {
    console.log('Rating prompt error:', error);
  }
  return false;
}
