import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import SmartReceiptScanner from '../components/SmartReceiptScanner';

const ScanScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <SmartReceiptScanner />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});

export default ScanScreen;
