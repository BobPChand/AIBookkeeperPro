import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../utils/format';
import { useRevenueCatContext } from '../services/RevenueCatService';
import { create_entity } from '../utils/entityApi';
import { extractReceiptData } from '../utils/api';

interface ExtractedData {
  merchant: string;
  date: string;
  total_amount: number;
  tax_amount: number;
  line_items: Array<{ description: string; amount: number; quantity: number }>;
}

const ScanScreen: React.FC = () => {
  const { isProUser } = useRevenueCatContext();
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [saving, setSaving] = useState(false);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Camera permission is required to scan receipts.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCapturedUri(result.assets[0].uri);
      setExtracted(null);
      handleExtract(result.assets[0].base64 || '');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setCapturedUri(result.assets[0].uri);
      setExtracted(null);
      handleExtract(result.assets[0].base64 || '');
    }
  };

  const handleExtract = async (base64: string) => {
    setExtracting(true);
    try {
      const data = await extractReceiptData(base64);
      setExtracted(data);
    } catch (e) {
      Alert.alert('Extraction Failed', 'Could not read receipt. Please enter manually.');
    }
    setExtracting(false);
  };

  const handleSave = async () => {
    if (!extracted) return;
    setSaving(true);
    try {
      await create_entity('Transaction', {
        type: 'expense',
        amount: extracted.total_amount,
        category: 'other',
        merchant: extracted.merchant,
        date: extracted.date,
        notes: `Tax: ${formatCurrency(extracted.tax_amount)}. Items: ${extracted.line_items.length}`,
        receipt_url: capturedUri,
        ai_categorized: false,
        is_tax_deductible: true,
      });
      Alert.alert('Saved', 'Transaction saved from receipt.');
      reset();
    } catch (e) {
      Alert.alert('Error', 'Failed to save transaction.');
    }
    setSaving(false);
  };

  const reset = () => {
    setCapturedUri(null);
    setExtracted(null);
  };

  if (!isProUser) {
    return (
      <View style={styles.lockedContainer}>
        <Ionicons name="lock-closed" size={48} color={Colors.textTertiary} />
        <Text style={styles.lockedTitle}>Pro Feature</Text>
        <Text style={styles.lockedText}>Receipt scanning is available with a Pro subscription. Upgrade to scan receipts and auto-extract data with AI.</Text>
      </View>
    );
  }

  if (capturedUri) {
    return (
      <View style={styles.reviewContainer}>
        <ScrollView style={styles.reviewScroll}>
          <Image source={{ uri: capturedUri }} style={styles.capturedImage} resizeMode="contain" />

          {extracting ? (
            <View style={styles.extractingBox}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.extractingText}>Extracting receipt data...</Text>
            </View>
          ) : extracted ? (
            <View style={styles.extractedBox}>
              <Text style={styles.extractedTitle}>Extracted Data</Text>
              <View style={styles.extractedRow}>
                <Text style={styles.extractedLabel}>Merchant</Text>
                <Text style={styles.extractedValue}>{extracted.merchant}</Text>
              </View>
              <View style={styles.extractedRow}>
                <Text style={styles.extractedLabel}>Date</Text>
                <Text style={styles.extractedValue}>{extracted.date}</Text>
              </View>
              <View style={styles.extractedRow}>
                <Text style={styles.extractedLabel}>Total</Text>
                <Text style={[styles.extractedValue, { fontWeight: '700' }]}>{formatCurrency(extracted.total_amount)}</Text>
              </View>
              {extracted.tax_amount > 0 && (
                <View style={styles.extractedRow}>
                  <Text style={styles.extractedLabel}>Tax</Text>
                  <Text style={styles.extractedValue}>{formatCurrency(extracted.tax_amount)}</Text>
                </View>
              )}
              {extracted.line_items.length > 0 && (
                <View style={styles.lineItemsBox}>
                  <Text style={styles.lineItemsTitle}>Line Items ({extracted.line_items.length})</Text>
                  {extracted.line_items.map((item, i) => (
                    <View key={i} style={styles.lineItemRow}>
                      <Text style={styles.lineItemDesc}>{item.description}</Text>
                      <Text style={styles.lineItemAmount}>{formatCurrency(item.amount)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.reviewActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={reset}>
            <Ionicons name="camera" size={20} color={Colors.text} />
            <Text style={styles.retakeText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveReceiptButton} onPress={handleSave} disabled={!extracted || saving}>
            {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveReceiptText}>Save Transaction</Text>}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.scanIconWrap}>
        <Ionicons name="scan-outline" size={64} color={Colors.accent} />
      </View>
      <Text style={styles.emptyTitle}>Scan a Receipt</Text>
      <Text style={styles.emptyText}>Take a photo or pick from gallery to auto-extract transaction data with AI.</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.cameraButton} onPress={takePhoto}>
          <Ionicons name="camera" size={24} color={Colors.white} />
          <Text style={styles.cameraButtonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
          <Ionicons name="images" size={24} color={Colors.text} />
          <Text style={styles.galleryButtonText}>Pick from Gallery</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  lockedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: Colors.background },
  lockedTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 8 },
  lockedText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: Colors.background },
  scanIconWrap: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.card, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  emptyTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32, maxWidth: 280 },
  actionRow: { flexDirection: 'column', alignItems: 'center', gap: 12 },
  cameraButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24, gap: 8 },
  cameraButtonText: { fontSize: 16, fontWeight: '600', color: Colors.white },
  galleryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24, gap: 8, borderWidth: 1, borderColor: Colors.border },
  galleryButtonText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  reviewContainer: { flex: 1, backgroundColor: Colors.background },
  reviewScroll: { flex: 1 },
  capturedImage: { width: '100%', height: 300, backgroundColor: Colors.dark },
  extractingBox: { alignItems: 'center', paddingVertical: 32 },
  extractingText: { fontSize: 15, color: Colors.textSecondary, marginTop: 12 },
  extractedBox: { backgroundColor: Colors.card, margin: 16, borderRadius: 12, padding: 16 },
  extractedTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  extractedRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  extractedLabel: { fontSize: 15, color: Colors.textSecondary },
  extractedValue: { fontSize: 15, color: Colors.text },
  lineItemsBox: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  lineItemsTitle: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary, marginBottom: 8 },
  lineItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  lineItemDesc: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  lineItemAmount: { fontSize: 14, color: Colors.text, fontWeight: '500' },
  reviewActions: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, gap: 12 },
  retakeButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12, gap: 8 },
  retakeText: { fontSize: 15, fontWeight: '600', color: Colors.text },
  saveReceiptButton: { flex: 1, backgroundColor: Colors.accent, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveReceiptText: { fontSize: 15, fontWeight: '700', color: Colors.white },
});
