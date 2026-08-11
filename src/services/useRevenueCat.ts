import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { RevenueCatProvider } from './RevenueCatService';

const REVENUECAT_API_KEY = 'REPLACE_WITH_REVENUECAT_KEY';

export const useRevenueCat = () => {
  const [isProUser, setIsProUser] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (Platform.OS === 'ios') {
        try {
          await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
          const info = await Purchases.getCustomerInfo();
          setCustomerInfo(info);
          setIsProUser(info.entitlements.active['pro'] !== undefined);
        } catch (e) {
          console.warn('RevenueCat init error:', e);
        }
      }
      setIsLoading(false);
    };
    init();

    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
      setIsProUser(info.entitlements.active['pro'] !== undefined);
    });

    return () => {
      listener.remove();
    };
  }, []);

  return { isProUser, customerInfo, isLoading };
};
