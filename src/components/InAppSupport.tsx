import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// IN-APP SUPPORT - Help Center + Contextual Tooltips
// Research: In-app support reduces early churn by 25%
// Resolving issues within 2 hours increases 90-day retention by 35%

// HELP CENTER MODAL - Accessible from Settings/About
export function HelpCenterModal({ visible, onClose, appConfig }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help Center</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {appConfig.faqs.map((faq, i) => (
          <View key={i} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.faqQuestion}
              onPress={() => {
                // Toggle expand - implement in parent or use state
              }}
            >
              <Text style={styles.faqQuestionText}>{faq.q}</Text>
              <Ionicons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
            <Text style={styles.faqAnswerText}>{faq.a}</Text>
          </View>
        ))}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still need help?</Text>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL(`mailto:${appConfig.supportEmail}?subject=Support: ${appConfig.appName}`)}
          >
            <Ionicons name="mail" size={20} color="#7C3AED" />
            <Text style={styles.contactBtnText}>Email Support</Text>
          </TouchableOpacity>
          <Text style={styles.responseTime}>Average response: under 24 hours</Text>
        </View>
      </ScrollView>
    </Modal>
  );
}

// CONTEXTUAL TOOLTIP - Show help next to complex UI elements
export function ContextualTooltip({ text, visible, onDismiss }) {
  if (!visible) return null;
  return (
    <View style={styles.tooltipContainer}>
      <View style={styles.tooltipBubble}>
        <Ionicons name="information-circle" size={16} color="#7C3AED" />
        <Text style={styles.tooltipText}>{text}</Text>
      </View>
      <TouchableOpacity onPress={onDismiss} style={styles.tooltipDismiss}>
        <Text style={styles.tooltipDismissText}>Got it</Text>
      </TouchableOpacity>
    </View>
  );
}

// FIRST-USE TOOLTIP MANAGER - Show tooltips for new users
export class TooltipManager {
  constructor(appKey) {
    this.appKey = appKey;
    this.storageKey = `tooltips_shown_${appKey}`;
  }

  async shouldShowTooltip(tooltipId) {
    const shown = JSON.parse(await AsyncStorage.getItem(this.storageKey) || '[]');
    return !shown.includes(tooltipId);
  }

  async markTooltipShown(tooltipId) {
    const shown = JSON.parse(await AsyncStorage.getItem(this.storageKey) || '[]');
    shown.push(tooltipId);
    await AsyncStorage.setItem(this.storageKey, JSON.stringify(shown));
  }
}

// PER-APP FAQ CONFIGURATIONS
export const FAQ_CONFIGS = {
  ContentAIPro: {
    appName: 'ContentAI Pro',
    supportEmail: 'support@contentaipro.app',
    faqs: [
      { q: 'How do I create my first piece of content?', a: 'Go to the Generate tab, choose your content type (social post, blog, ad, email), select your platform, and tap Generate. Your AI content appears in seconds.' },
      { q: 'Can I customize the tone and style?', a: 'Yes! Go to the Brand tab to set your brand voice, tone, and target audience. All generated content will match your settings.' },
      { q: 'How does AI voice over work?', a: 'Select Voice Over as your content type, paste your script, choose from 6 AI voices, and tap Generate. Audio plays instantly and can be shared.' },
      { q: 'Can I edit the generated content?', a: 'Yes, tap any generated content to edit it before sharing. You can also copy it to your clipboard.' },
      { q: 'How many pieces can I generate?', a: 'Free users get 3 generations. Pro subscribers get unlimited generations, all platforms, AI voice over, and priority processing.' },
      { q: 'Can I cancel my subscription?', a: 'Yes, anytime. Go to Settings > Apple ID > Subscriptions to cancel. You keep access until your current period ends.' },
    ],
  },
  AIResumeBuilder: {
    appName: 'AI Resume Builder',
    supportEmail: 'support@airesume.app',
    faqs: [
      { q: 'What is ATS optimization?', a: 'ATS (Applicant Tracking System) is software companies use to filter resumes. Our templates and AI writing ensure your resume passes these systems.' },
      { q: 'How does the ATS score work?', a: 'Paste a job description, and our AI compares your resume against it, scoring keyword matches, formatting, and structure on a 0-100 scale.' },
      { q: 'Can I create multiple versions?', a: 'Yes! Pro subscribers can create unlimited resume versions, each tailored to different job applications.' },
      { q: 'What format should I export?', a: 'PDF is recommended for ATS compatibility. Your resume is exported as a clean, ATS-readable PDF.' },
      { q: 'Does the cover letter match my resume?', a: 'Yes, our AI generates cover letters that match your resume content and the job description you provide.' },
      { q: 'How do I cancel my subscription?', a: 'Go to Settings > Apple ID > Subscriptions. Cancel anytime - access continues until your current period ends.' },
    ],
  },
  InvoiceAI: {
    appName: 'Invoice AI',
    supportEmail: 'support@invoiceai.app',
    faqs: [
      { q: 'How do I add tax to invoices?', a: 'When creating an invoice, select your tax type (GST, HST, PST, QST) and enter the rate. The app calculates tax automatically on the subtotal.' },
      { q: 'Can I add my logo to invoices?', a: 'Pro subscribers can add custom branding including logos, colors, and business information to all invoices and estimates.' },
      { q: 'What types of documents can I create?', a: 'Invoices, estimates, and quotes. All can be exported as professional PDFs and shared via email, WhatsApp, or AirDrop.' },
      { q: 'Can I track invoice status?', a: 'Yes, mark invoices as Sent, Viewed, Paid, or Overdue. The dashboard shows all statuses at a glance.' },
      { q: 'Does the app support multiple currencies?', a: 'Yes, Pro subscribers can create invoices in any currency with automatic formatting.' },
      { q: 'How do I cancel my subscription?', a: 'Go to Settings > Apple ID > Subscriptions. Cancel anytime.' },
    ],
  },
  ProposalAI: {
    appName: 'Proposal AI',
    supportEmail: 'support@proposalai.app',
    faqs: [
      { q: 'What types of proposals can I create?', a: 'Client service proposals, project bids, RFP responses, sales proposals, and pitch decks. Our AI adapts to your needs.' },
      { q: 'How long does it take to generate a proposal?', a: 'Most proposals generate in under 30 seconds. You provide the project details, and AI handles the structure, language, and formatting.' },
      { q: 'Can I edit the generated proposal?', a: 'Yes, tap any section to edit before exporting. You have full control over the final output.' },
      { q: 'What\'s included in a pitch deck?', a: 'AI generates slide-by-slide content including problem, solution, market size, business model, traction, team, and ask.' },
      { q: 'Can I save proposal templates?', a: 'Pro subscribers can save and reuse proposal structures for recurring client types.' },
      { q: 'How do I cancel my subscription?', a: 'Go to Settings > Apple ID > Subscriptions. Cancel anytime.' },
    ],
  },
  AIBookkeeperPro: {
    appName: 'AI Bookkeeper Pro',
    supportEmail: 'support@aibookkeeper.app',
    faqs: [
      { q: 'How does receipt scanning work?', a: 'Tap Scan, point your camera at a receipt, and our AI extracts merchant, date, amount, and tax automatically. No manual data entry.' },
      { q: 'Can AI categorize my expenses?', a: 'Yes! Each transaction is automatically categorized into tax categories (meals, travel, office supplies, etc.) using AI.' },
      { q: 'How does tax deduction discovery work?', a: 'AI scans your transactions to find commonly missed tax deductions and shows estimated savings per category.' },
      { q: 'Can I generate financial reports?', a: 'Pro subscribers get Profit & Loss statements, expense reports by category, and quarterly tax estimates.' },
      { q: 'Is my financial data secure?', a: 'All data is stored locally on your device. Receipt images are processed via secure AI APIs and not stored on external servers.' },
      { q: 'How do I cancel my subscription?', a: 'Go to Settings > Apple ID > Subscriptions. Cancel anytime.' },
    ],
  },
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  closeBtn: { padding: 4 },
  content: { flex: 1, padding: 16 },
  faqItem: { marginBottom: 20 },
  faqQuestion: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestionText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  faqAnswerText: { fontSize: 14, color: '#666', marginTop: 8, lineHeight: 20 },
  contactSection: { marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: '#E5E5E5', alignItems: 'center' },
  contactTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3EEFF', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  contactBtnText: { fontSize: 16, fontWeight: '600', color: '#7C3AED', marginLeft: 8 },
  responseTime: { fontSize: 12, color: '#999', marginTop: 8 },
  tooltipContainer: { position: 'absolute', bottom: 80, left: 20, right: 20, zIndex: 100 },
  tooltipBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', padding: 12, borderRadius: 8, marginBottom: 8 },
  tooltipText: { color: '#FFF', fontSize: 14, marginLeft: 8, flex: 1 },
  tooltipDismiss: { alignSelf: 'flex-end' },
  tooltipDismissText: { color: '#7C3AED', fontSize: 14, fontWeight: '600' },
});
