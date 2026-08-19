import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Colors, ScheduleCCategories } from '../constants/colors';
import { formatCurrency } from '../utils/format';
import { AIService, ExtractedReceipt } from '../services/AIService';
import { create_entity, read_entities } from '../utils/entityApi';

interface SmartReceiptScannerProps {
  onSaved?: () => void;
}

const SmartReceiptScanner: React.FC<SmartReceiptScannerProps> = ({ onSaved }) => {
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedReceipt | null>(null);
  const [saving, setSaving] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is needed to scan paper receipts.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setCapturedUri(result.assets[0].uri);
        handleAnalyze(result.assets[0].base64 || '');
      }
    } catch (e) {
      Alert.alert('Camera Error', 'Could not access camera device.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedUri(result.assets[0].uri);
        handleAnalyze(result.assets[0].base64 || '');
      }
    } catch (e) {
      Alert.alert('Gallery Error', 'Could not access image gallery.');
    }
  };

  const handleAnalyze = async (base64: string) => {
    setExtracting(true);
    setDuplicateWarning(false);
    try {
      const data = await AIService.analyzeReceipt(base64);
      setExtracted(data);

      // Check for duplicate in recent transactions
      const existing = await read_entities('Transaction', { limit: 50 });
      const dup = existing.find(
        (t: any) =>
          t.merchant?.toLowerCase() === data.merchant?.toLowerCase() &&
          Math.abs((Number(t.amount) || 0) - data.total_amount) < 0.01
      );
      if (dup || data.duplicate_detected) {
        setDuplicateWarning(true);
      }
    } catch (e) {
      Alert.alert('Analysis Failed', 'Could not read receipt details with GPT-4o vision.');
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!extracted) return;
    setSaving(true);
    try {
      const catObj = ScheduleCCategories.find((c) => c.id === extracted.category) || {
        id: extracted.category || 'other',
        label: 'Other Business Expense',
      };

      await create_entity('Transaction', {
        type: 'expense',
        amount: extracted.total_amount,
        category: catObj.id,
        merchant: extracted.merchant,
        date: extracted.date || new Date().toISOString().split('T')[0],
        notes: `AI SmartScan: Tax ${formatCurrency(extracted.tax_amount)}. ${
          extracted.loyalty_info ? `Loyalty: ${extracted.loyalty_info}` : ''
        }`,
        receipt_url: capturedUri,
        ai_categorized: true,
        is_tax_deductible: true,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success!', 'Receipt parsed and saved to tax expenses.');
      reset();
      if (onSaved) onSaved();
    } catch (e) {
      Alert.alert('Error', 'Failed to save scanned receipt.');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setCapturedUri(null);
    setExtracted(null);
    setDuplicateWarning(false);
  };

  if (capturedUri) {
    return (
      <ScrollView style={styles.reviewContainer}>
        <View style={styles.imagePreviewWrap}>
          <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="contain" />
          {extracting && (
            <View style={styles.scanOverlay}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.scanOverlayText}>GPT-4o Vision Scanning Receipt...</Text>
            </View>
          )}
        </View>

        {extracted && !extracting && (
          <View style={styles.resultBox}>
            {duplicateWarning && (
              <View style={styles.duplicateAlert}>
                <Ionicons name="copy" size={18} color={Colors.warning} />
                <Text style={styles.duplicateText}>
                  Potential Duplicate: A similar transaction for {formatCurrency(extracted.total_amount)} exists.
                </Text>
              </View>
            )}

            <View style={styles.merchantHeader}>
              <View style={styles.merchantTitleWrap}>
                <Ionicons name="storefront" size={20} color={Colors.primary} />
                <Text style={styles.merchantName}>{extracted.merchant}</Text>
              </View>
              <Text style={styles.totalAmount}>{formatCurrency(extracted.total_amount)}</Text>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Date</Text>
                <Text style={styles.metaValue}>{extracted.date}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Tax Included</Text>
                <Text style={styles.metaValue}>{formatCurrency(extracted.tax_amount)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>Tax Category</Text>
                <Text style={[styles.metaValue, { color: Colors.accent, fontWeight: '700' }]}>
                  {extracted.category.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            {extracted.loyalty_info ? (
              <View style={styles.loyaltyBox}>
                <Ionicons name="card-outline" size={16} color={Colors.accent} />
                <Text style={styles.loyaltyText}>{extracted.loyalty_info}</Text>
              </View>
            ) : null}

            {extracted.line_items && extracted.line_items.length > 0 && (
              <View style={styles.lineItemsSection}>
                <Text style={styles.lineItemsHeader}>
                  Extracted Items ({extracted.line_items.length})
                </Text>
                {extracted.line_items.map((item, idx) => (
                  <View key={idx} style={styles.lineItemRow}>
                    <Text style={styles.lineItemDesc}>
                      {item.quantity ? `${item.quantity}x ` : ''}
                      {item.description}
                    </Text>
                    <Text style={styles.lineItemCost}>{formatCurrency(item.amount)}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.retakeBtn} onPress={reset}>
                <Ionicons name="camera-reverse" size={18} color={Colors.text} />
                <Text style={styles.retakeBtnText}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.white} />
                    <Text style={styles.saveBtnText}>Save Transaction</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.heroCircle}>
        <Ionicons name="scan-circle" size={80} color={Colors.accent} />
      </View>
      <Text style={styles.title}>GPT-4o Smart Receipt Scanner</Text>
      <Text style={styles.subtitle}>
        Snap a photo or upload a receipt to auto-extract line items, total, tax, and auto-assign Schedule C categories.
      </Text>

      <View style={styles.featurePills}>
        <View style={styles.pill}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
          <Text style={styles.pillText}>Auto Categorization</Text>
        </View>
        <View style={styles.pill}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
          <Text style={styles.pillText}>Duplicate Detection</Text>
        </View>
        <View style={styles.pill}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.accent} />
          <Text style={styles.pillText}>Line Item Parsing</Text>
        </View>
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto}>
          <Ionicons name="camera" size={22} color={Colors.white} />
          <Text style={styles.primaryBtnText}>Scan with Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
          <Ionicons name="images" size={22} color={Colors.text} />
          <Text style={styles.secondaryBtnText}>Upload from Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justify: 'center',
    padding: 24,
    backgroundColor: Colors.background,
  },
  heroCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 320,
  },
  featurePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 28,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  btnRow: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 28,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    paddingVertical: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  reviewContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  imagePreviewWrap: {
    width: '100%',
    height: 280,
    backgroundColor: Colors.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  scanOverlayText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  resultBox: {
    backgroundColor: Colors.card,
    margin: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  duplicateAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warningLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  duplicateText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  merchantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  merchantTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  merchantName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.expense,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metaItem: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  loyaltyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentLight,
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  loyaltyText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  lineItemsSection: {
    marginTop: 14,
  },
  lineItemsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutralLight,
  },
  lineItemDesc: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
  },
  lineItemCost: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 6,
  },
  retakeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});

export default SmartReceiptScanner;
