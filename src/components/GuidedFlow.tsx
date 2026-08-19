import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// GUIDED FLOW — STEP-BY-STEP WIZARD FOR COMPLEX TASKS
//
// THE EDGE: Complex tasks (creating invoices, resumes, proposals)
// overwhelm users with too many fields at once. Guided flows break
// them into simple steps with a progress bar and one decision per step.
//
// Research: Guided flows increase completion rate by 52%
// and reduce "I'll do this later" abandonment by 40%.
// This is what TurboTax, Stripe Onboarding, and Typeform use.

export function GuidedFlow({
  steps = [],
  onComplete,
  onCancel,
  primaryColor = '#7C3AED',
  title = 'Let\'s get started',
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState({});
  const [progressAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(300));

  const totalSteps = steps.length;
  const progress = (currentStep + 1) / totalSteps;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Slide in new step
    slideAnim.setValue(300);
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  }, [currentStep]);

  const handleNext = (data) => {
    setStepData(prev => ({ ...prev, ...data }));
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete?.({ ...stepData, ...data });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      onCancel?.();
    }
  };

  const handleSkip = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete?.(stepData);
    }
  };

  const currentStepData = steps[currentStep];
  if (!currentStepData) return null;

  return (
    <Modal visible={true} animationType="fade" transparent={false}>
      <View style={styles.container}>
        {/* Header with progress */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Text style={styles.stepCount}>Step {currentStep + 1} of {totalSteps}</Text>
          </View>
          {currentStepData.skippable && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: primaryColor,
              },
            ]}
          />
        </View>

        {/* Step content */}
        <Animated.ScrollView
          style={{ flex: 1, transform: [{ translateX: slideAnim }] }}
          contentContainerStyle={{ padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.stepTitle}>{currentStepData.title}</Text>
          {currentStepData.subtitle && (
            <Text style={styles.stepSubtitle}>{currentStepData.subtitle}</Text>
          )}
          <View style={styles.stepContent}>
            {currentStepData.render({ data: stepData, onNext: handleNext, primaryColor })}
          </View>
        </Animated.ScrollView>

        {/* Footer */}
        {!currentStepData.customButton && (
          <View style={styles.footer}>
            {currentStep > 0 && (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: primaryColor, flex: currentStep > 0 ? 1 : 1 }]}
              onPress={() => handleNext({})}
            >
              <Text style={styles.nextBtnText}>
                {currentStep === totalSteps - 1 ? 'Complete' : 'Continue'}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

// Toast notification — instant feedback for actions
export function Toast({ visible, message, type = 'success', onDismiss, duration = 2500 }) {
  const [opacity] = useState(new Animated.Value(0));
  const [translateY] = useState(new Animated.Value(-100));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -100, duration: 200, useNativeDriver: true }),
        ]).start(() => onDismiss?.());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const bgColor = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#F59E0B';
  const iconName = type === 'success' ? 'checkmark-circle' : type === 'error' ? 'close-circle' : 'alert-circle';

  return (
    <Animated.View
      style={[
        styles.toast,
        { backgroundColor: bgColor, opacity, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name={iconName} size={22} color="#FFF" />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { padding: 8 },
  headerContent: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  stepCount: { fontSize: 12, color: '#999', marginTop: 2 },
  skipButton: { padding: 8 },
  skipText: { fontSize: 14, color: '#999', fontWeight: '500' },
  progressTrack: { height: 4, backgroundColor: '#E0E0E0', marginHorizontal: 16, borderRadius: 2 },
  progressFill: { height: 4, borderRadius: 2 },
  stepTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  stepSubtitle: { fontSize: 16, color: '#666', marginBottom: 24, lineHeight: 22 },
  stepContent: { flex: 1 },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  backBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  backBtnText: { fontSize: 16, fontWeight: '600', color: '#666' },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextBtnText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  toast: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    zIndex: 9999,
    gap: 10,
  },
  toastText: { color: '#FFF', fontSize: 15, fontWeight: '600', flex: 1 },
});
