import AsyncStorage from '@react-native-async-storage/async-storage';

// RETENTION MANAGER - Streak Tracking + Progress Indicators
// Research: Profile completeness meters and action streaks drive 20-30% higher retention
// Goal-gradient effect: users complete faster when they see progress

const STREAK_KEY = 'user_streak';
const LAST_ACTION_KEY = 'last_action_date';
const TOTAL_ACTIONS_KEY = 'total_actions';
const MILESTONES_KEY = 'achieved_milestones';

// TRACK USER ACTIONS - Call after any valuable user action
export async function trackAction(appKey) {
  const today = new Date().toDateString();
  const lastAction = await AsyncStorage.getItem(LAST_ACTION_KEY);

  // Get current streak
  const streak = parseInt(await AsyncStorage.getItem(STREAK_KEY) || '0');

  if (lastAction === today) {
    // Already tracked today - don't increment streak
    return { streak, isNewDay: false };
  }

  // Check if yesterday (continuous streak)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  let newStreak;
  if (lastAction === yesterdayStr) {
    newStreak = streak + 1;
  } else {
    newStreak = 1; // Reset streak
  }

  await AsyncStorage.setItem(STREAK_KEY, newStreak.toString());
  await AsyncStorage.setItem(LAST_ACTION_KEY, today);

  // Track total actions
  const total = parseInt(await AsyncStorage.getItem(TOTAL_ACTIONS_KEY) || '0');
  await AsyncStorage.setItem(TOTAL_ACTIONS_KEY, (total + 1).toString());

  // Check milestones
  await checkMilestones(appKey, total + 1, newStreak);

  return { streak: newStreak, isNewDay: true };
}

// MILESTONE SYSTEM - Celebrate usage milestones
const MILESTONES = [
  { count: 1, message: 'First creation! You\'re on your way.', type: 'first_action' },
  { count: 5, message: '5 creations! Getting the hang of it.', type: 'milestone_5' },
  { count: 10, message: '10 creations! You\'re a power user now.', type: 'milestone_10' },
  { count: 25, message: '25 creations! You\'re getting real value from this.', type: 'milestone_25' },
  { count: 50, message: '50 creations! Incredible productivity.', type: 'milestone_50' },
  { count: 100, message: '100 creations! You\'re in the top 1% of users.', type: 'milestone_100' },
];

// STREAK MILESTONES
const STREAK_MILESTONES = [
  { days: 3, message: '3-day streak! Keep it up!' },
  { days: 7, message: '7-day streak! A full week of productivity!' },
  { days: 14, message: '14-day streak! You\'re building a real habit.' },
  { days: 30, message: '30-day streak! Incredible consistency.' },
];

async function checkMilestones(appKey, totalCount, currentStreak) {
  const achieved = JSON.parse(await AsyncStorage.getItem(MILESTONES_KEY) || '[]');

  // Check count milestones
  for (const milestone of MILESTONES) {
    if (totalCount >= milestone.count && !achieved.includes(milestone.type)) {
      achieved.push(milestone.type);
      // Return milestone for UI celebration
      return { milestone: milestone.message, isCountMilestone: true };
    }
  }

  // Check streak milestones
  for (const streakMs of STREAK_MILESTONES) {
    const streakKey = `streak_${streakMs.days}`;
    if (currentStreak >= streakMs.days && !achieved.includes(streakKey)) {
      achieved.push(streakKey);
      return { milestone: streakMs.message, isStreakMilestone: true };
    }
  }

  await AsyncStorage.setItem(MILESTONES_KEY, JSON.stringify(achieved));
  return null;
}

// GET USER PROGRESS - For progress bars and stats display
export async function getUserProgress(appKey) {
  const streak = parseInt(await AsyncStorage.getItem(STREAK_KEY) || '0');
  const total = parseInt(await AsyncStorage.getItem(TOTAL_ACTIONS_KEY) || '0');
  const lastActive = await AsyncStorage.getItem(LAST_ACTION_KEY);

  const isActiveToday = lastActive === new Date().toDateString();

  // Calculate next milestone
  const nextMilestone = MILESTONES.find(m => m.count > total);
  const progressToNext = nextMilestone ? (total / nextMilestone.count) : 1;

  return {
    streak,
    totalActions: total,
    isActiveToday,
    nextMilestone: nextMilestone?.message || 'All milestones achieved!',
    nextMilestoneCount: nextMilestone?.count || total,
    progressToNext: Math.min(progressToNext, 1),
  };
}

// PROFILE COMPLETENESS - For resume builder and similar apps
// Research: Goal-gradient effect drives completion when users see % progress
export async function getProfileCompleteness(appKey, requiredFields) {
  const completed = [];
  const missing = [];

  for (const field of requiredFields) {
    const value = await AsyncStorage.getItem(`profile_${field}`);
    if (value && value.trim().length > 0) {
      completed.push(field);
    } else {
      missing.push(field);
    }
  }

  const percentage = Math.round((completed.length / requiredFields.length) * 100);

  return {
    percentage,
    completed,
    missing,
    nextField: missing[0] || null,
    isComplete: missing.length === 0,
  };
}

// RE-ENGAGEMENT TRACKING - Detect churning users
export async function getChurnRisk(appKey) {
  const lastActive = await AsyncStorage.getItem(LAST_ACTION_KEY);
  if (!lastActive) return { risk: 'unknown', daysInactive: null };

  const daysInactive = Math.floor((Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24));

  if (daysInactive <= 3) return { risk: 'low', daysInactive };
  if (daysInactive <= 7) return { risk: 'medium', daysInactive };
  if (daysInactive <= 14) return { risk: 'high', daysInactive };
  return { risk: 'critical', daysInactive };
}
