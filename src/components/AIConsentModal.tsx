import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface Props {
  visible: boolean;
  onConsent: () => void;
  onDecline: () => void;
}

const AIConsentModal: React.FC<Props> = ({ visible, onConsent, onDecline }) => {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={48} color={Colors.accent} />
          </View>
          <Text style={styles.title}>AI Data Sharing Consent</Text>
          <Text style={styles.description}>
            AI Bookkeeper Pro uses AI to scan receipts and categorize transactions.
            Your data is sent to our AI provider (OpenAI) for processing to enable
            features like receipt scanning, auto-categorization, and tax estimates.
          </Text>
          <Text style={styles.description}>
            You can still use the app without AI features. Manual entry and basic
            tracking will continue to work. You can change this at any time in Settings.
          </Text>
          <TouchableOpacity style={styles.consentButton} onPress={onConsent}>
            <Text style={styles.consentButtonText}>I Consent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.declineButton} onPress={onDecline}>
            <Text style={styles.declineButtonText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 10,
    textAlign: 'center',
  },
  consentButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  consentButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  declineButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  declineButtonText: {
    color: Colors.neutral,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default AIConsentModal;
