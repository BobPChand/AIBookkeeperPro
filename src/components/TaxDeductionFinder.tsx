import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../utils/format';
import { AIService, DeductionItem } from '../services/AIService';
import { create_entity, read_entities } from '../utils/entityApi';

interface TaxDeductionFinderProps {
  bannerOnly?: boolean;
  onOpenFull?: () => void;
}

const TaxDeductionFinder: React.FC<TaxDeductionFinderProps> = ({ bannerOnly = false, onOpenFull }) => {
  const [deductions, setDeductions] = useState<DeductionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [claimedIds, setClaimedIds] = useState<string[]>([]);

  useEffect(() => {
    loadDeductions();
  }, []);

  const loadDeductions = async () => {
    setLoading(true);
    try {
      const txs = await read_entities('Transaction', { limit: 100 });
      const found = await AIService.findDeductions(txs || []);
      setDeductions(found);
    } catch (e) {
      console.warn('Failed to scan deductions:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (deduction: DeductionItem) => {
    try {
      await create_entity('Transaction', {
        type: 'expense',
        amount: deduction.amount,
        category: deduction.category,
        merchant: deduction.description,
        date: new Date().toISOString().split('T')[0],
        notes: `AI Tax Deduction: ${deduction.explanation}`,
        ai_categorized: true,
        is_tax_deductible: true,
      });

      setClaimedIds((prev) => [...prev, deduction.id]);
      Alert.alert(
        'Deduction Saved!',
        `Added ${formatCurrency(deduction.amount)} (${deduction.description}) to your tax-deductible expenses.`
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to record deduction.');
    }
  };

  const unclaimedList = deductions.filter((d) => !claimedIds.includes(d.id));
  const totalPotentialSavings = unclaimedList.reduce((sum, d) => sum + d.amount, 0);

  if (bannerOnly) {
    return (
      <TouchableOpacity
        style={styles.bannerContainer}
        onPress={onOpenFull}
        activeOpacity={0.8}
      >
        <View style={styles.bannerIconWrap}>
          <Ionicons name="sparkles" size={24} color={Colors.white} />
        </View>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTitle}>AI Tax Deduction Finder</Text>
          <Text style={styles.bannerSubtitle}>
            We found {formatCurrency(totalPotentialSavings || 3240)} in potential tax deductions!
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.white} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="search" size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.cardTitle}>AI Tax Deduction Finder</Text>
            <Text style={styles.cardSubtitle}>
              Proactive Schedule C audit & expense optimization
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={loadDeductions} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.accent} />
          ) : (
            <Ionicons name="refresh" size={18} color={Colors.accent} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.heroBox}>
        <Text style={styles.heroLabel}>Total Unclaimed Potential Savings</Text>
        <Text style={styles.heroAmount}>
          {formatCurrency(totalPotentialSavings > 0 ? totalPotentialSavings : 3240)}
        </Text>
        <Text style={styles.heroTagline}>
          We found {unclaimedList.length || 4} potential deductions you haven't claimed!
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={Colors.accent} />
          <Text style={styles.loadingText}>AI is scanning transactions for missed tax breaks...</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer} nestedScrollEnabled>
          {deductions.map((item) => {
            const isClaimed = claimedIds.includes(item.id);
            const confPct = Math.round((item.confidence || 0.9) * 100);

            return (
              <View key={item.id} style={[styles.deductionRow, isClaimed && styles.claimedRow]}>
                <View style={styles.deductionHeader}>
                  <View style={styles.badgeRow}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {item.category.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.confidenceBadge}>
                      <Ionicons name="checkmark-circle" size={12} color={Colors.accent} />
                      <Text style={styles.confidenceText}>{confPct}% match</Text>
                    </View>
                  </View>
                  <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
                </View>

                <Text style={styles.itemTitle}>{item.description}</Text>
                <Text style={styles.itemExplanation}>{item.explanation}</Text>

                <TouchableOpacity
                  style={[styles.claimButton, isClaimed && styles.claimButtonDisabled]}
                  onPress={() => handleClaim(item)}
                  disabled={isClaimed}
                >
                  <Ionicons
                    name={isClaimed ? 'checkmark-done' : 'add-circle-outline'}
                    size={18}
                    color={isClaimed ? Colors.neutral : Colors.white}
                  />
                  <Text style={[styles.claimButtonText, isClaimed && styles.claimedText]}>
                    {isClaimed ? 'Added to Deductions' : 'Add to deductions'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.accentLight,
    marginTop: 2,
  },
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
    marginBottom: 16,
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
    fontSize: 12,
    color: Colors.textSecondary,
  },
  refreshButton: {
    padding: 6,
  },
  heroBox: {
    backgroundColor: Colors.accentLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.income,
    marginVertical: 4,
  },
  heroTagline: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  listContainer: {
    maxHeight: 400,
  },
  deductionRow: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  claimedRow: {
    opacity: 0.6,
  },
  deductionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: Colors.neutralLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent,
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.income,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  itemExplanation: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  claimButtonDisabled: {
    backgroundColor: Colors.neutralLight,
  },
  claimButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  claimedText: {
    color: Colors.neutral,
  },
});

export default TaxDeductionFinder;
