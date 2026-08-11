import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useRevenueCatContext } from '../services/RevenueCatService';
import Purchases from 'react-native-purchases';

const features = [
  { icon: 'scan', label: 'Receipt Scanner', desc: 'Snap photos and AI extracts all the data' },
  { icon: 'sparkles', label: 'AI Auto-Categorize', desc: 'Smart IRS Schedule C categorization' },
  { icon: 'calculator', label: 'Tax Estimates', desc: 'Real-time quarterly tax projections' },
  { icon: 'search', label: 'Deduction Finder', desc: 'AI finds missed write-offs' },
  { icon: 'stats-chart', label: 'P&L Reports', desc: 'Profit & loss statements, exportable' },
  { icon: 'infinite', label: 'Unlimited Transactions', desc: 'No 25-transaction free limit' },
];

const UpgradeScreen: React.FC = () => {
  const { isProUser, isLoading } = useRevenueCatContext();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId);
    try {
      const offerings = await Purchases.getOfferings();
      const pkg = offerings.current?.[packageId];
      if (!pkg) throw new Error('Package not found');
      await Purchases.purchasePackage(pkg);
      Alert.alert('Success', 'Welcome to Pro! All features unlocked.');
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
      }
    }
    setPurchasing(null);
  };

  const restorePurchases = async () => {
    try {
      const info = await Purchases.restorePurchases();
      if (info.entitlements.active['pro']) {
        Alert.alert('Restored', 'Your Pro subscription has been restored.');
      } else {
        Alert.alert('No Purchases', 'No active subscriptions found.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to restore purchases.');
    }
  };

  if (isProUser) {
    return (
      <View style={styles.proContainer}>
        <Ionicons name="checkmark-circle" size={64} color={Colors.accent} />
        <Text style={styles.proTitle}>You're a Pro Member</Text>
        <Text style={styles.proText}>All features unlocked. Enjoy unlimited transactions, receipt scanning, and AI tax tools.</Text>
        <View style={styles.proFeatures}>
          {features.map((f) => (
            <View key={f.label} style={styles.proFeatureRow}>
              <Ionicons name={f.icon as any} size={20} color={Colors.accent} />
              <Text style={styles.proFeatureText}>{f.label}</Text>
              <Ionicons name="checkmark" size={18} color={Colors.accent} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.accent} /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="star" size={48} color={Colors.accent} />
        <Text style={styles.headerTitle}>Upgrade to Pro</Text>
        <Text style={styles.headerSubtitle}>Unlock the full power of AI Bookkeeper</Text>
      </View>

      <View style={styles.featuresGrid}>
        {features.map((f) => (
          <View key={f.label} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as any} size={22} color={Colors.accent} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.plansContainer}>
        <View style={styles.planCard}>
          <Text style={styles.planName}>Monthly Pro</Text>
          <Text style={styles.planPrice}>$19.99<Text style={styles.planPeriod}>/mo</Text></Text>
          <TouchableOpacity style={styles.planButton} onPress={() => handlePurchase('$rc_monthly')} disabled={purchasing === '$rc_monthly'}>
            {purchasing === '$rc_monthly' ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.planButtonText}>Subscribe</Text>}
          </TouchableOpacity>
        </View>

        <View style={[styles.planCard, styles.planCardFeatured]}>
          <View style={styles.bestValue}>
            <Text style={styles.bestValueText}>BEST VALUE</Text>
          </View>
          <Text style={styles.planName}>Yearly Pro</Text>
          <Text style={styles.planPrice}>$149.99<Text style={styles.planPeriod}>/yr</Text></Text>
          <Text style={styles.planSavings}>Save 37% vs monthly</Text>
          <TouchableOpacity style={[styles.planButton, styles.planButtonFeatured]} onPress={() => handlePurchase('$rc_annual')} disabled={purchasing === '$rc_annual'}>
            {purchasing === '$rc_annual' ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.planButtonText}>Subscribe</Text>}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.restoreButton} onPress={restorePurchases}>
        <Text style={styles.restoreText}>Restore Purchases</Text>
      </TouchableOpacity>

      <Text style={styles.legalText}>
        Payment will be charged to your Apple ID account at confirmation of purchase.
        Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
        Manage or cancel in your Account Settings on the App Store.
      </Text>
      <Text style={styles.legalLink}>Terms of Use: https://aibookkeeperpro.com/terms</Text>
      <Text style={styles.legalLink}>Privacy Policy: https://aibookkeeperpro.com/privacy</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', paddingVertical: 32, backgroundColor: Colors.primary },
  headerTitle: { fontSize: 28, fontWeight: '700', color: Colors.white, marginTop: 12 },
  headerSubtitle: { fontSize: 15, color: Colors.white, opacity: 0.6, marginTop: 4 },
  featuresGrid: { padding: 16 },
  featureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  featureIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center' },
  featureInfo: { marginLeft: 12, flex: 1 },
  featureLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  featureDesc: { fontSize: 13, color: Colors.textTertiary, marginTop: 2 },
  plansContainer: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 8 },
  planCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 2, borderColor: Colors.border, position: 'relative' },
  planCardFeatured: { borderColor: Colors.accent },
  bestValue: { position: 'absolute', top: -12, backgroundColor: Colors.accent, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  bestValueText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  planName: { fontSize: 16, fontWeight: '600', color: Colors.text, marginTop: 8 },
  planPrice: { fontSize: 28, fontWeight: '700', color: Colors.text, marginTop: 8 },
  planPeriod: { fontSize: 16, fontWeight: '400', color: Colors.textSecondary },
  planSavings: { fontSize: 12, color: Colors.accent, marginTop: 4, marginBottom: 8 },
  planButton: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24, marginTop: 12, width: '100%', alignItems: 'center' },
  planButtonFeatured: { backgroundColor: Colors.accent },
  planButtonText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  restoreButton: { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  restoreText: { fontSize: 14, color: Colors.accent, fontWeight: '500' },
  legalText: { fontSize: 11, color: Colors.textTertiary, paddingHorizontal: 24, textAlign: 'center', lineHeight: 16, marginBottom: 8 },
  legalLink: { fontSize: 11, color: Colors.accent, textAlign: 'center', marginBottom: 4 },
  proContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: Colors.background },
  proTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, marginTop: 16 },
  proText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  proFeatures: { marginTop: 24, width: '100%' },
  proFeatureRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  proFeatureText: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text },
});

export default UpgradeScreen;
