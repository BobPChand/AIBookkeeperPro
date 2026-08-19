import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import AIConsentModal from './src/components/AIConsentModal';
import OnboardingScreen, { APP_CONFIGS } from './src/components/OnboardingScreen';
import { RevenueCatProvider } from './src/services/RevenueCatService';
import { loadAIConsent, saveAIConsent } from './src/utils/storage';
import { incrementSessionCount } from './src/utils/SmartRatingPrompt';

export default function App() {
  const [showConsent, setShowConsent] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const consent = await loadAIConsent();
      if (!consent) {
        setShowConsent(true);
      }
      const onboardingDone = await AsyncStorage.getItem('onboarding_completed');
      if (!onboardingDone) {
        setShowOnboarding(true);
      }
      await incrementSessionCount();
      setIsReady(true);
    })();
  }, []);

  const handleConsent = async (granted: boolean) => {
    await saveAIConsent(granted);
    setShowConsent(false);
  };

  if (!isReady) return null;

  if (showOnboarding) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <OnboardingScreen
            appConfig={APP_CONFIGS.AIBookkeeperPro}
            onComplete={() => setShowOnboarding(false)}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RevenueCatProvider>
          <StatusBar style="light" />
          <AppNavigator />
          <AIConsentModal
            visible={showConsent}
            onConsent={() => handleConsent(true)}
            onDecline={() => handleConsent(false)}
          />
        </RevenueCatProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
