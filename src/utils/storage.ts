import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_CONSENT_KEY = '@ai_bookkeeper_consent';
const USER_ID_KEY = '@ai_bookkeeper_user_id';
const FREE_TX_COUNT_KEY = '@ai_bookkeeper_free_tx_count';

export const loadAIConsent = async (): Promise<boolean | null> => {
  const value = await AsyncStorage.getItem(AI_CONSENT_KEY);
  if (value === null) return null;
  return value === 'true';
};

export const saveAIConsent = async (granted: boolean): Promise<void> => {
  await AsyncStorage.setItem(AI_CONSENT_KEY, granted ? 'true' : 'false');
};

export const getUserId = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(USER_ID_KEY);
};

export const setUserId = async (userId: string): Promise<void> => {
  await AsyncStorage.setItem(USER_ID_KEY, userId);
};

export const getFreeTxCount = async (): Promise<number> => {
  const value = await AsyncStorage.getItem(FREE_TX_COUNT_KEY);
  return value ? parseInt(value, 10) : 0;
};

export const incrementFreeTxCount = async (): Promise<number> => {
  const current = await getFreeTxCount();
  const next = current + 1;
  await AsyncStorage.setItem(FREE_TX_COUNT_KEY, next.toString());
  return next;
};

export const FREE_TRANSACTION_LIMIT = 25;
