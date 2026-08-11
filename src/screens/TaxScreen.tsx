import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, ScheduleCCategories } from '../constants/colors';
import { formatCurrency, getCurrentQuarter } from '../utils/format';
import { read_entities } from '../utils/entityApi';
import { useRevenueCatContext } from '../services/RevenueCatService';
import { generateTaxEstimate, findDeductions } from '../utils/api';

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
  const { isProUser } = useRevenueCatContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [filingStatus, setFilingStatus] = useState('single');
  const [state, setState] = useState('BC');
  const [businessName, setBusinessName] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [taxEstimate, setTaxEstimate] = useState<{ quarterly_estimate: number; effective_rate: number; deductions: any[] } | null>(null);
  const [findingDeductions, setFindingDeductions] = useState(false);
  const [deductions, setDeductions] = useState<Array<{ description: string; amount: number; explanation: string }>>([]);

  const loadData = useCallback(async () => {
    try {
      const data = await read_entities('Transaction', { limit: 500 });
      setTransactions(data);
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
  const ytdTx = transactions.filter((t) => new Date(t.date) >= yearStart);
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

  const handleEstimate = async () => {
    setEstimating(true);
    try {
      const result = await generateTaxEstimate(ytdIncome, ytdExpenses, filingStatus, state);
      setTaxEstimate(result);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate tax estimate.');
    }
    setEstimating(false);
  };

  const handleFindDeductions = async () => {
    setFindingDeductions(true);
    try {
      const result = await findDeductions('current_user');
      setDeductions(result);
    } catch (e) {
      Alert.alert('Error', 'Failed to find deductions.');
    }
    setFindingDeductions(false);
  };

  if (!isProUser) {
    return (
      <View style={styles.lockedContainer}>
        <Ionicons name="lock-closed" size={48} color={Colors.textTertiary} />
        <Text style={styles.lockedTitle}>Pro Feature</Text>
        <Text style={styles.lockedText}>Tax Center is available with a Pro subscription. Get quarterly estimates, Schedule C breakdowns, and AI deduction finder.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
    >
      <View style={styles.profileCard}>
        <View style={styles.profileHeader}>
          <View>
            <Text style={styles.profileTitle}>{businessName || 'Tax Profile'}</Text>
            <Text style={styles.profileSubtitle}>{filingStatus} | {state}</Text>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => setShowProfile(true)}>
            <Ionicons name="create" size={20} color={Colors.accent} />
          </TouchableOpacity>
        </View>
      </View>

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

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Schedule C Breakdown</Text>
        </View>
        {Object.entries(expensesByCategory).length === 0 ? (
          <Text style={styles.emptyText}>No expense data yet</Text>
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
                    <Text style={styles.categoryPct}>{pct.toFixed(1)}% of expenses</Text>
                  </View>
                  <Text style={styles.categoryAmount}>{formatCurrency(amount)}</Text>
                </View>
              );
            })
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quarterly Tax Estimate (Q{quarter})</Text>
        {taxEstimate ? (
          <View style={styles.estimateCard}>
            <Text style={styles.estimateAmount}>{formatCurrency(taxEstimate.quarterly_estimate)}</Text>
            <Text style={styles.estimateLabel}>Estimated quarterly payment</Text>
            <Text style={styles.estimateRate}>Effective rate: {taxEstimate.effective_rate.toFixed(1)}%</Text>
          </View>
        ) : (
          <Text style={styles.emptyText}>Run the estimator to get your quarterly estimate</Text>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={handleEstimate} disabled={estimating}>
          {estimating ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.actionButtonText}>Estimate Quarterly Tax</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Deduction Finder</Text>
        {deductions.length > 0 ? (
          deductions.map((d, i) => (
            <View key={i} style={styles.deductionCard}>
              <View style={styles.deductionHeader}>
                <Text style={styles.deductionDesc}>{d.description}</Text>
                <Text style={styles.deductionAmount}>{formatCurrency(d.amount)}</Text>
              </View>
              <Text style={styles.deductionExplanation}>{d.explanation}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>AI will analyze your transactions for missed deductions</Text>
        )}
        <TouchableOpacity style={styles.actionButton} onPress={handleFindDeductions} disabled={findingDeductions}>
          {findingDeductions ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.actionButtonText}>Find Deductions</Text>}
        </TouchableOpacity>
      </View>

      <Modal visible={showProfile} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tax Profile</Text>
              <TouchableOpacity onPress={() => setShowProfile(false)}>
                <Ionicons name="close" size={24} color={Colors.neutral} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} placeholder="Business Name" value={businessName} onChangeText={setBusinessName} />
            <Text style={styles.inputLabel}>Filing Status</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll}>
              {['single', 'married_joint', 'married_separate', 'head_of_household'].map((s) => (
                <TouchableOpacity key={s} style={[styles.statusChip, filingStatus === s && styles.statusChipActive]} onPress={() => setFilingStatus(s)}>
                  <Text style={[styles.statusText, filingStatus === s && styles.statusTextActive]}>{s.replace('_', ' ')}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput style={styles.input} placeholder="State/Province" value={state} onChangeText={setState} />
            <TouchableOpacity style={styles.saveButton} onPress={() => setShowProfile(false)}>
              <Text style={styles.saveButtonText}>Save Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  lockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  lockedTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 8 },
  lockedText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  profileCard: { backgroundColor: Colors.card, margin: 16, borderRadius: 12, padding: 16 },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  profileSubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 4, textTransform: 'capitalize' },
  editButton: { padding: 8 },
  netProfitCard: { backgroundColor: Colors.primary, margin: 16, borderRadius: 16, padding: 20 },
  cardLabel: { color: Colors.white, fontSize: 14, opacity: 0.7 },
  cardValue: { fontSize: 32, fontWeight: '700', marginTop: 8 },
  profitBreakdown: { flexDirection: 'row', gap: 16, marginTop: 12 },
  breakdownText: { color: Colors.white, fontSize: 14, opacity: 0.6 },
  section: { margin: 16, marginTop: 8, backgroundColor: Colors.card, borderRadius: 12, padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.text, marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textTertiary, textAlign: 'center', paddingVertical: 16 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  categoryIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  categoryInfo: { flex: 1, marginLeft: 12 },
  categoryLabel: { fontSize: 14, fontWeight: '500', color: Colors.text },
  categoryPct: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  categoryAmount: { fontSize: 14, fontWeight: '600', color: Colors.text },
  estimateCard: { backgroundColor: Colors.background, borderRadius: 12, padding: 20, alignItems: 'center' },
  estimateAmount: { fontSize: 36, fontWeight: '700', color: Colors.expense },
  estimateLabel: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  estimateRate: { fontSize: 14, color: Colors.textTertiary, marginTop: 8 },
  actionButton: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  actionButtonText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  deductionCard: { backgroundColor: Colors.accentLight, borderRadius: 10, padding: 14, marginBottom: 8 },
  deductionHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  deductionDesc: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  deductionAmount: { fontSize: 14, fontWeight: '700', color: Colors.income },
  deductionExplanation: { fontSize: 13, color: Colors.textSecondary, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12, backgroundColor: Colors.background },
  inputLabel: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary, marginBottom: 8 },
  statusScroll: { maxHeight: 50, marginBottom: 12 },
  statusChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: Colors.background, marginRight: 8 },
  statusChipActive: { backgroundColor: Colors.accent },
  statusText: { fontSize: 13, color: Colors.textSecondary, textTransform: 'capitalize' },
  statusTextActive: { color: Colors.white },
  saveButton: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});

export default TaxScreen;
