import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useRevenueCat } from './useRevenueCat';

interface RevenueCatContextType {
  isProUser: boolean;
  customerInfo: any;
  isLoading: boolean;
}

const RevenueCatContext = createContext<RevenueCatContextType>({
  isProUser: false,
  customerInfo: null,
  isLoading: true,
});

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isProUser, customerInfo, isLoading } = useRevenueCat();

  return (
    <RevenueCatContext.Provider value={{ isProUser, customerInfo, isLoading }}>
      {children}
    </RevenueCatContext.Provider>
  );
};

export const useRevenueCatContext = () => useContext(RevenueCatContext);
