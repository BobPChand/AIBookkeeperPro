import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors, ScheduleCCategories } from '../constants/colors';
import { formatCurrency, formatMonthYear } from '../utils/format';
import { useRevenueCatContext } from '../services/RevenueCatService';
import { read_entities } from '../utils/entityApi';

import AIChatAssistant from '../components/AIChatAssistant';
import TaxDeductionFinder from '../components/TaxDeductionFinder';
import QuarterlyTaxEstimator from '../components/QuarterlyTaxEstimator';
import CashFlowForecast from '../components/CashFlowForecast';
import CrossAppSync from '../components/CrossAppSync';
import MileageTrackerGPS from '../components/MileageTrackerGPS';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  merchant: string;
  date: string;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isProUser } = useRevenueCatContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ income: 0, expenses: 0, net: 0 });

  const loadData = useCallback(async () => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const data = await read_entities('Transaction', { limit: 500 });
      const monthTx = data.filter((t: Transaction) => new Date(t.date) >= new Date(monthStart));
      const income = monthTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      setStats({ income, expenses, net: income - expenses });
      setTransactions(monthTx.slice(0, 5));
    } catch (e) {
      console.warn('Failed to load transactions:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenAiAssistant = () => {
    navigation.navigate('AI Assistant');
  };

  const handleOpenTaxCenter = () => {
    navigation.navigate('Tax Center');
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
    >
      {/* 1. Prominent AI Chat Assistant Card at Top */}
      <AIChatAssistant compact onExpand={handleOpenAiAssistant} />

      {/* 2. Net Profit Banner */}
      <View style={styles.netProfitCard}>
        <Text style={styles.netProfitLabel}>Net Profit This Month</Text>
        <Text style={[styles.netProfitAmount, { color: stats.net >= 0 ? Colors.income : Colors.expense }]}>
          {formatCurrency(stats.net)}
        </Text>
        <View style={styles.trendRow}>
          <Ionicons name="trending-up" size={16} color={Colors.income} />
          <Text style={styles.trendText}>{formatMonthYear(new Date())}</Text>
        </View>
      </View>

      {/* 3. Income / Expense Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIconIncome}>
            <Ionicons name="arrow-down" size={20} color={Colors.income} />
          </View>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.income)}</Text>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statIconExpense}>
            <Ionicons name="arrow-up" size={20} color={Colors.expense} />
          </View>
          <Text style={styles.statLabel}>Expenses</Text>
          <Text style={styles.statValue}>{formatCurrency(stats.expenses)}</Text>
        </View>
      </View>

      {/* 4. Tax Deduction Finder Banner */}
      <TaxDeductionFinder bannerOnly onOpenFull={handleOpenTaxCenter} />

      {/* 5. Quarterly Tax Estimator Widget */}
      <QuarterlyTaxEstimator widgetOnly />

      {/* 6. Cash Flow Forecast Component */}
      <CashFlowForecast />

      {/* 7. Ecosystem Cross-App Sync */}
      <CrossAppSync />

      {/* 8. GPS Mileage Tracker */}
      <MileageTrackerGPS />

      {/* 9. Recent Transactions Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>Add one from the Transactions tab or scan a receipt</Text>
          </View>
        ) : (
          transactions.map((tx) => {
            const cat = ScheduleCCategories.find((c) => c.id === tx.category);
            return (
              <View key={tx.id} style={styles.txRow}>
                <View
                  style={[
                    styles.txIcon,
                    { backgroundColor: tx.type === 'income' ? Colors.accentLight : Colors.neutralLight },
                  ]}
                >
                  <Ionicons
                    name={(cat?.icon || 'document') as any}
                    size={20}
                    color={tx.type === 'income' ? Colors.income : Colors.neutral}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txMerchant}>{tx.merchant}</Text>
                  <Text style={styles.txCategory}>{cat?.label || tx.category}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'income' ? Colors.income : Colors.expense }]}>
                  {tx.type === 'income' ? '+' : '-'}
                  {formatCurrency(tx.amount)}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {!isProUser && (
        <View style={styles.upgradeBanner}>
          <Ionicons name="star" size={20} color={Colors.accent} />
          <Text style={styles.upgradeText}>Upgrade to Pro for unlimited transactions, GPT-4o receipt scanning, and AI features.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  netProfitCard: { backgroundColor: Colors.primary, padding: 24, marginHorizontal: 16, marginVertical: 8, borderRadius: 16 },
  netProfitLabel: { color: Colors.white, fontSize: 14, opacity: 0.7, marginBottom: 8 },
  netProfitAmount: { fontSize: 36, fontWeight: '700' },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  trendText: { color: Colors.white, fontSize: 14, opacity: 0.6 },
  statsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginVertical: 4 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  statIconIncome: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statIconExpense: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.expenseLight, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.text },
  section: { margin: 16, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: 12 },
  emptySubtext: { fontSize: 14, color: Colors.textTertiary, marginTop: 4 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 12 },
  txMerchant: { fontSize: 15, fontWeight: '500', color: Colors.text },
  txCategory: { fontSize: 13, color: Colors.textTertiary, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '600' },
  upgradeBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accentLight, margin: 16, padding: 16, borderRadius: 12, gap: 8 },
  upgradeText: { flex: 1, fontSize: 14, color: Colors.text },
});

export default HomeScreen;
