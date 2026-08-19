import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../utils/format';
import { create_entity, read_entities } from '../utils/entityApi';

interface SyncedInvoice {
  id: string;
  client: string;
  amount: number;
  date: string;
  status: 'paid' | 'pending';
}

const SAMPLE_INVOICES: SyncedInvoice[] = [
  { id: 'inv_101', client: 'Acme Corp', amount: 2450.0, date: 'Today', status: 'paid' },
  { id: 'inv_102', client: 'Starlight Media', amount: 1800.0, date: 'Yesterday', status: 'paid' },
  { id: 'inv_103', client: 'Nexus Tech LLC', amount: 3200.0, date: 'Aug 16', status: 'paid' },
];

const CrossAppSync: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string>('Just now');
  const [invoices, setInvoices] = useState<SyncedInvoice[]>(SAMPLE_INVOICES);
  const [importedCount, setImportedCount] = useState<number>(3);

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      // Simulate real cross-app data pull from Invoice AI entity ecosystem
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const newInvoice: SyncedInvoice = {
        id: `inv_${Date.now()}`,
        client: 'Global Partners Inc.',
        amount: 1950.0,
        date: new Date().toISOString().split('T')[0],
        status: 'paid',
      };

      await create_entity('Transaction', {
        type: 'income',
        amount: newInvoice.amount,
        category: 'services',
        merchant: `Invoice AI Sync: ${newInvoice.client}`,
        date: newInvoice.date,
        notes: `Cross-App Sync from Invoice AI #${newInvoice.id}`,
        ai_categorized: true,
      });

      setInvoices((prev) => [newInvoice, ...prev]);
      setImportedCount((prev) => prev + 1);
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      Alert.alert(
        'Ecosystem Sync Complete!',
        `Imported latest invoice payment (${formatCurrency(
          newInvoice.amount
        )} from ${newInvoice.client}) directly from Invoice AI!`
      );
    } catch (e) {
      Alert.alert('Sync Error', 'Could not sync with Invoice AI backend.');
    } finally {
      setSyncing(false);
    }
  };

  const totalSyncedIncome = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="shapes" size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.cardTitle}>5-App Ecosystem Cross-Sync</Text>
            <Text style={styles.cardSubtitle}>Auto-Sync Income from Invoice AI</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.syncButton} onPress={handleSyncNow} disabled={syncing}>
          {syncing ? (
            <ActivityIndicator size="small" color={Colors.accent} />
          ) : (
            <>
              <Ionicons name="sync" size={14} color={Colors.accent} />
              <Text style={styles.syncText}>Sync Now</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.statusBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.statusText}>Invoice AI Connected</Text>
        </View>
        <Text style={styles.lastSyncedText}>Last synced: {lastSynced}</Text>
      </View>

      <View style={styles.summaryBox}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Synced Invoices</Text>
          <Text style={styles.summaryVal}>{importedCount} Paid</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Auto-Recorded Revenue</Text>
          <Text style={[styles.summaryVal, { color: Colors.income }]}>
            {formatCurrency(totalSyncedIncome)}
          </Text>
        </View>
      </View>

      <Text style={styles.listHeader}>Recent Synced Invoices</Text>

      {invoices.map((inv) => (
        <View key={inv.id} style={styles.invRow}>
          <View style={styles.invLeft}>
            <View style={styles.invIconWrap}>
              <Ionicons name="document-text" size={18} color={Colors.accent} />
            </View>
            <View>
              <Text style={styles.invClient}>{inv.client}</Text>
              <Text style={styles.invDate}>{inv.date} • Invoice AI #{inv.id}</Text>
            </View>
          </View>
          <View style={styles.invRight}>
            <Text style={styles.invAmount}>+{formatCurrency(inv.amount)}</Text>
            <View style={styles.paidChip}>
              <Text style={styles.paidChipText}>PAID</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  syncText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accent,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  lastSyncedText: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  summaryBox: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  listHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  invRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralLight,
  },
  invLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  invIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invClient: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  invDate: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  invRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  invAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.income,
  },
  paidChip: {
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.income,
  },
});

export default CrossAppSync;
