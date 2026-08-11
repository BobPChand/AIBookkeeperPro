import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, ScheduleCCategories, IncomeCategories } from '../constants/colors';
import { formatCurrency, formatDate } from '../utils/format';
import { read_entities, create_entity, delete_entity } from '../utils/entityApi';
import { useRevenueCatContext } from '../services/RevenueCatService';
import { getFreeTxCount, FREE_TRANSACTION_LIMIT } from '../utils/storage';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  category: string;
  merchant: string;
  date: string;
  notes?: string;
}

type FilterType = 'all' | 'income' | 'expense';

const TransactionsScreen: React.FC = () => {
  const { isProUser } = useRevenueCatContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  // Add form state
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [category, setCategory] = useState('other');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const loadData = useCallback(async () => {
    try {
      const data = await read_entities('Transaction', { limit: 500, sort: '-date' });
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

  const handleAdd = async () => {
    if (!amount || !merchant) {
      Alert.alert('Missing fields', 'Please enter an amount and merchant.');
      return;
    }

    if (!isProUser) {
      const count = await getFreeTxCount();
      if (count >= FREE_TRANSACTION_LIMIT) {
        Alert.alert('Free limit reached', `You've used ${FREE_TRANSACTION_LIMIT} free transactions. Upgrade to Pro for unlimited.`);
        return;
      }
    }

    try {
      await create_entity('Transaction', {
        type,
        amount: parseFloat(amount),
        category,
        merchant,
        date,
        notes,
      });
      setShowAdd(false);
      setAmount('');
      setMerchant('');
      setNotes('');
      setCategory('other');
      setType('expense');
      loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to save transaction.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await delete_entity('Transaction', id);
            loadData();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const filtered = transactions.filter((tx) => {
    if (filter !== 'all' && tx.type !== filter) return false;
    if (search && !tx.merchant.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const cats = type === 'income' ? IncomeCategories : ScheduleCCategories;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {(['all', 'income', 'expense'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No transactions found</Text>
          </View>
        ) : (
          filtered.map((tx) => {
            const cats = tx.type === 'income' ? IncomeCategories : ScheduleCCategories;
            const cat = cats.find((c) => c.id === tx.category);
            return (
              <TouchableOpacity
                key={tx.id}
                style={styles.txRow}
                onLongPress={() => handleDelete(tx.id)}
              >
                <View style={[styles.txIcon, { backgroundColor: tx.type === 'income' ? Colors.accentLight : Colors.neutralLight }]}>
                  <Ionicons name={(cat?.icon || 'document') as any} size={20} color={tx.type === 'income' ? Colors.income : Colors.neutral} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txMerchant}>{tx.merchant}</Text>
                  <Text style={styles.txCategory}>{cat?.label || tx.category}</Text>
                  <Text style={styles.txDate}>{formatDate(tx.date)}</Text>
                </View>
                <Text style={[styles.txAmount, { color: tx.type === 'income' ? Colors.income : Colors.expense }]}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Transaction</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Ionicons name="close" size={24} color={Colors.neutral} />
              </TouchableOpacity>
            </View>

            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeButton, type === 'expense' && styles.typeButtonActive]}
                onPress={() => { setType('expense'); setCategory('other'); }}
              >
                <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>Expense</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, type === 'income' && styles.typeButtonActiveIncome]}
                onPress={() => { setType('income'); setCategory('other'); }}
              >
                <Text style={[styles.typeText, type === 'income' && styles.typeTextActiveIncome]}>Income</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Amount ($)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="Merchant / Description"
              value={merchant}
              onChangeText={setMerchant}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {cats.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.categoryChip, category === c.id && styles.categoryChipActive]}
                  onPress={() => setCategory(c.id)}
                >
                  <Ionicons name={c.icon as any} size={16} color={category === c.id ? Colors.white : Colors.neutral} />
                  <Text style={[styles.categoryText, category === c.id && styles.categoryTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.input}
              placeholder="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
              <Text style={styles.saveButtonText}>Save Transaction</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: 16, paddingHorizontal: 12, backgroundColor: Colors.card, borderRadius: 12, height: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card },
  filterChipActive: { backgroundColor: Colors.primary },
  filterText: { fontSize: 14, color: Colors.textSecondary },
  filterTextActive: { color: Colors.white, fontWeight: '500' },
  list: { flex: 1, marginHorizontal: 16 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: 12 },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginBottom: 8 },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txInfo: { flex: 1, marginLeft: 12 },
  txMerchant: { fontSize: 15, fontWeight: '500', color: Colors.text },
  txCategory: { fontSize: 13, color: Colors.textTertiary, marginTop: 2 },
  txDate: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '700' },
  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  typeToggle: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeButton: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: Colors.background },
  typeButtonActive: { backgroundColor: Colors.expense },
  typeButtonActiveIncome: { backgroundColor: Colors.income },
  typeText: { textAlign: 'center', fontSize: 15, fontWeight: '500', color: Colors.textSecondary },
  typeTextActive: { color: Colors.white },
  typeTextActiveIncome: { color: Colors.white },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 12, backgroundColor: Colors.background },
  categoryScroll: { maxHeight: 50, marginBottom: 12 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: Colors.background, marginRight: 8 },
  categoryChipActive: { backgroundColor: Colors.accent },
  categoryText: { fontSize: 13, color: Colors.textSecondary },
  categoryTextActive: { color: Colors.white },
  saveButton: { backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: Colors.white, fontSize: 16, fontWeight: '600' },
});

export default TransactionsScreen;
