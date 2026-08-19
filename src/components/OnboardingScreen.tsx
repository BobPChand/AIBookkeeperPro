import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'onboarding_completed';
const PERSONA_KEY = 'user_persona';

export interface PersonaOption {
  label: string;
  value: string;
  icon: string;
}

export interface DemoContent {
  headline: string;
  description: string;
  previewIcon: string;
}

export interface AppConfig {
  appName: string;
  welcomeTitle: string;
  welcomeSubtitle: string;
  icon: string;
  keyFeatures: string[];
  personaQuestion: string;
  personaOptions: PersonaOption[];
  useCaseQuestion: string;
  useCaseOptions: PersonaOption[];
  demoContent: DemoContent;
  premiumFeatures: string[];
}

export const APP_CONFIGS: Record<string, AppConfig> = {
  AIBookkeeperPro: {
    appName: 'AI Bookkeeper Pro',
    welcomeTitle: 'Welcome to AI Bookkeeper Pro',
    welcomeSubtitle: 'Automate your bookkeeping, receipt scanning, and tax estimates with AI.',
    icon: 'calculator-outline',
    keyFeatures: [
      'Instant Receipt Scanning & AI Data Extraction',
      'Automatic IRS Schedule C Expense Categorization',
      'Real-time Quarterly Tax & Deduction Projections',
    ],
    personaQuestion: 'What best describes your business?',
    personaOptions: [
      { label: 'Freelancer / Independent Contractor', value: 'freelancer', icon: 'person-outline' },
      { label: 'Small Business Owner', value: 'small_business', icon: 'business-outline' },
      { label: 'Gig Worker / Creator', value: 'gig_worker', icon: 'car-outline' },
      { label: 'Sole Proprietor', value: 'sole_proprietor', icon: 'briefcase-outline' },
    ],
    useCaseQuestion: 'What is your primary bookkeeping goal?',
    useCaseOptions: [
      { label: 'Track Tax Deductions & Save Money', value: 'deductions', icon: 'cash-outline' },
      { label: 'Digitize & Organize Receipts', value: 'receipts', icon: 'scan-outline' },
      { label: 'Estimate Quarterly & Annual Taxes', value: 'taxes', icon: 'stats-chart-outline' },
      { label: 'Generate P&L & Profit Reports', value: 'reports', icon: 'document-text-outline' },
    ],
    demoContent: {
      headline: 'Snap. Categorize. Save.',
      description: 'AI extracts merchant, date, total, tax, and line items in seconds while tagging Schedule C categories.',
      previewIcon: 'receipt-outline',
    },
    premiumFeatures: [
      'Unlimited receipt scans & line-item breakdown',
      'AI-powered IRS Schedule C auto-categorization',
      'Real-time quarterly tax estimate calculator',
      'Deduction finder to maximize tax savings',
      'Exportable P&L & financial summary reports',
    ],
  },
};

interface StepProps {
  step: any;
  onNext?: () => void;
  onAnswer?: (value: string) => void;
  onCTA?: () => void;
}

function WelcomeStep({ step, onNext }: StepProps) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name={step.icon as any} size={64} color="#10B981" />
      </View>
      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.subtitle}>{step.subtitle}</Text>
      <View style={styles.featuresList}>
        {step.features.map((feat: string, i: number) => (
          <View key={i} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            <Text style={styles.featureText}>{feat}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

function QuestionStep({ step, onAnswer }: StepProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.questionTitle}>{step.question}</Text>
      <View style={styles.optionsList}>
        {step.options.map((opt: PersonaOption) => (
          <TouchableOpacity
            key={opt.value}
            style={styles.optionCard}
            onPress={() => onAnswer?.(opt.value)}
          >
            <Ionicons name={opt.icon as any} size={28} color="#10B981" />
            <Text style={styles.optionLabel}>{opt.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function DemoStep({ step, onNext }: StepProps) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.title}>{step.title}</Text>
      <View style={styles.demoCard}>
        <Ionicons name={step.demo.previewIcon as any} size={48} color="#10B981" />
        <Text style={styles.demoHeadline}>{step.demo.headline}</Text>
        <Text style={styles.demoDescription}>{step.demo.description}</Text>
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext}>
        <Text style={styles.primaryBtnText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

function PaywallPreviewStep({ step, onCTA }: StepProps) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.stepContainer}>
      <Ionicons name="star" size={56} color="#10B981" />
      <Text style={styles.title}>{step.title}</Text>
      <View style={styles.featuresList}>
        {step.features.map((feat: string, i: number) => (
          <View key={i} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.featureText}>{feat}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.primaryBtn} onPress={onCTA}>
        <Text style={styles.primaryBtnText}>Start Free Trial</Text>
      </TouchableOpacity>
      <Text style={styles.trialSubtext}>7 days free, then $149.99/yr. Cancel anytime.</Text>
    </ScrollView>
  );
}

interface OnboardingScreenProps {
  appConfig: AppConfig;
  onComplete?: (persona?: Record<string, any>) => void;
}

export default function OnboardingScreen({ appConfig, onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [persona, setPersona] = useState<Record<string, any>>({});
  const fadeAnim = useState(new Animated.Value(1))[0];

  const handleNext = (key: string, value: string) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setPersona(prev => ({ ...prev, [key]: value }));
      setStep(prev => prev + 1);
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  const handleComplete = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    await AsyncStorage.setItem(PERSONA_KEY, JSON.stringify(persona));
    onComplete?.(persona);
  };

  const steps = [
    { type: 'welcome', title: appConfig.welcomeTitle, subtitle: appConfig.welcomeSubtitle, icon: appConfig.icon, features: appConfig.keyFeatures },
    { type: 'question', question: appConfig.personaQuestion, options: appConfig.personaOptions, key: 'role' },
    { type: 'question', question: appConfig.useCaseQuestion, options: appConfig.useCaseOptions, key: 'useCase' },
    { type: 'demo', title: 'See it in action', demo: appConfig.demoContent },
    { type: 'paywall', title: 'Start your 7-day free trial', features: appConfig.premiumFeatures },
  ];

  const currentStep = steps[step];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
          ))}
        </View>
        <TouchableOpacity style={styles.skipBtn} onPress={handleComplete}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {currentStep.type === 'welcome' && <WelcomeStep step={currentStep} onNext={() => setStep(1)} />}
        {currentStep.type === 'question' && <QuestionStep step={currentStep} onAnswer={(val) => handleNext(currentStep.key, val)} />}
        {currentStep.type === 'demo' && <DemoStep step={currentStep} onNext={() => setStep(step + 1)} />}
        {currentStep.type === 'paywall' && <PaywallPreviewStep step={currentStep} onCTA={handleComplete} />}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  progressContainer: { flexDirection: 'row', gap: 6, flex: 1 },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#334155' },
  progressDotActive: { backgroundColor: '#10B981' },
  skipBtn: { padding: 8 },
  skipText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  stepContainer: { alignItems: 'center', paddingVertical: 20 },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#94A3B8', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  featuresList: { width: '100%', marginVertical: 20, gap: 14 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureText: { fontSize: 15, color: '#E2E8F0', flex: 1, lineHeight: 20 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 20,
    gap: 8,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  questionTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: 24 },
  optionsList: { width: '100%', gap: 12 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 14,
  },
  optionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  demoCard: {
    backgroundColor: '#1E293B',
    width: '100%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  demoHeadline: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginTop: 12, marginBottom: 8 },
  demoDescription: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
  trialSubtext: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 12 },
});
