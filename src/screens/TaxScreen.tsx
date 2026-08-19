import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, ScheduleCCategories } from '../constants/colors';
import { formatCurrency, getCurrentQuarter } from '../utils/format';
import { read_entities } from '../utils/entityApi';
import QuarterlyTaxEstimator from '../components/QuarterlyTaxEstimator';
import TaxDeductionFinder from '../components/TaxDeductionFinder';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  merchant: string;
  date: string;
  is_tax_deductible?: boolean;
}

const TaxScreen: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [filingStatus, setFilingStatus] = useState('single');
  const [state, setState] = useState('BC');
  const [businessName, setBusinessName] = useState('Sole Proprietorship');

  const loadData = useCallback(async () => {
    try {
      const data = await read_entities('Transaction', { limit: 500 });
      setTransactions(data || []);
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

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();
  const ytdTx = transactions.filter((t) => new Date(t.date) >= new Date(yearStart));
  const ytdIncome = ytdTx.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const ytdExpenses = ytdTx.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netProfit = ytdIncome - ytdExpenses;
  const quarter = getCurrentQuarter();

  // Group expenses by Schedule C category
  const expensesByCategory = ytdTx
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
    >
      {/* Profile Header */}
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View>
            <Text style={styles.profileTitle}>{businessName || 'Tax Profile'}</Text>
            <Text style={styles.profileSubtitle}>
              Filing: {filingStatus.replace('_', ' ').toUpperCase()} | State/Region: {state}
            </Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => setShowProfile(true)}>
            <Ionicons name="create-outline" size={20} color={Colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

      {/* YTD Profit Banner */}
      <View style={styles.netProfitCard}>
        <Text style={styles.cardLabel}>Year-to-Date Net Profit</Text>
        <Text style={[styles.cardValue, { color: netProfit >= 0 ? Colors.income : Colors.expense }]}>
          {formatCurrency(netProfit)}
        </Text>
        <View style={styles.profitBreakdown}>
          <Text style={styles.breakdownText}>Income: {formatCurrency(ytdIncome)}</Text>
          <Text style={styles.breakdownText}>Expenses: {formatCurrency(ytdExpenses)}</Text>
        </View>
      </View>

      {/* 1. Real-Time Quarterly Tax Estimator */}
      <QuarterlyTaxEstimator />

      {/* 2. AI Tax Deduction Finder */}
      <TaxDeductionFinder />

      {/* 3. Schedule C Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>IRS Schedule C Expense Breakdown</Text>
        {Object.entries(expensesByCategory).length === 0 ? (
          <Text style={styles.emptyText}>No expense data logged for this tax year</Text>
        ) : (
          Object.entries(expensesByCategory)
            .sort(([, a], [, b]) => b - a)
            .map(([catId, amount]) => {
              const cat = ScheduleCCategories.find((c) => c.id === catId);
              const pct = ytdExpenses > 0 ? (amount / ytdExpenses) * 100 : 0;
              return (
                <View key={catId} style={styles.categoryRow}>
                  <View style={[styles.categoryIcon, { backgroundColor: Colors.neutralLight }]}>
                    <Ionicons name={(cat?.icon || 'document') as any} size={18} color={Colors.neutral} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryLabel}>{cat?.label || catId}</Text>
                    <Text style={styles.categoryPct}>{pct.toFixed(1)}% of total expenses</Text>
                  </View>
                  <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
                </View>
              );
            })
        )}
      </View>

      {/* Profile Edit Modal */}
      <Modal visible={showProfile} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tax Profile Settings</Text>
              <TouchableOpacity onPress={() => setShowProfile(false)}>
                <Ionicons name="close" size={24} color={Colors.neutral} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Business Entity Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Acme Services LLC"
              value={businessName}
              onChangeText={setBusinessName}
            />

            <Text style={styles.inputLabel}>Filing Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
              {['single', 'married_joint', 'married_separate', 'head_of_household'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusChip, filingStatus === s && styles.statusChipActive]}
                  onPress={() => setFilingStatus(s)}
                >
                  <Text style={[styles.statusText, filingStatus === s && styles.statusTextActive]}>
                    {s.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>State / Province Code</Text>
            <TextInput style={styles.input} placeholder="e.g. CA, NY, BC" value={state} onChangeText={setState} />

            <TouchableOpacity style={styles.saveButton} onPress={() => setShowProfile(false)}>
              <Text style={styles.saveButtonText}>Save Tax Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  profileCard: { backgroundColor: Colors.card, padding: 16, marginHorizontal: 16, marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  profileSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  editButton: { padding: 6 },
  netProfitCard: { backgroundColor: Colors.primary, padding: 20, marginHorizontal: 16, marginVertical: 8, borderRadius: 16 },
  cardLabel: { color: Colors.white, fontSize: 12, opacity: 0.8, textTransform: 'uppercase' },
  cardValue: { fontSize: 32, fontWeight: '800', marginVertical: 4 },
  profitBreakdown: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  breakdownText: { color: Colors.white, fontSize: 12, opacity: 0.7 },
  section: { margin: 16, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  emptyText: { fontSize: 13, color: Colors.textTertiary, fontStyle: 'italic' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  categoryIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  categoryInfo: { flex: 1, marginLeft: 12 },
  categoryLabel: { fontSize: 14, fontWeight: '600', color: Colors.text },
  categoryPct: { fontSize: 12, color: Colors.textTertiary },
  categoryAmount: { fontSize: 14, fontWeight: '700', color: Colors.text },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginTop: 4 },
  input: { backgroundColor: Colors.background, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, borderColor: Colors.border, color: Colors.text },
  statusScroll: { flexDirection: 'row', marginVertical: 4 },
  statusChip: { backgroundColor: Colors.background, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, marginRight: 8 },
  statusChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  statusText: { fontSize: 12, color: Colors.textSecondary, textTransform: 'capitalize' },
  statusTextActive: { color: Colors.white, fontWeight: '700' },
  saveButton: { backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  saveButtonText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
});

export default TaxScreen;
