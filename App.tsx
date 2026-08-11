import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import AIConsentModal from './src/components/AIConsentModal';
import { RevenueCatProvider } from './src/services/RevenueCatService';
import { loadAIConsent, saveAIConsent } from './src/utils/storage';

export default function App() {
  const [showConsent, setShowConsent] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    (async () => {
      const consent = await loadAIConsent();
      if (!consent) {
        setShowConsent(true);
      }
      setIsReady(true);
    })();
  }, []);

  const handleConsent = async (granted: boolean) => {
    await saveAIConsent(granted);
    setShowConsent(false);
  };

  if (!isReady) return null;

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
