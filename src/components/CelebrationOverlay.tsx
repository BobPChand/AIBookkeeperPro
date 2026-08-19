import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Easing, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// CELEBRATION OVERLAY — MILESTONE CELEBRATIONS WITH CONFETTI
//
// THE COMPETITIVE EDGE: Emotional moments create attachment.
// Duolingo, Strava, and Apple Fitness all use celebrations
// to drive retention. Users who celebrate milestones show
// 40% higher 30-day retention.
//
// WHEN TO USE:
// - First content generation (ContentAI Pro)
// - First resume completed (AI Resume Builder)
// - First invoice created (Invoice AI)
// - First proposal generated (Proposal AI)
// - First receipt scanned (AI Bookkeeper Pro)
// - Streak milestones (3, 7, 14, 30 days)
// - Count milestones (5, 10, 25, 50, 100 generations)

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Confetti particle system
function generateConfetti(count = 30) {
  const colors = ['#7C3AED', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#EC4899'];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * screenWidth,
    y: -20 - Math.random() * 100,
    size: 6 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    speed: 2 + Math.random() * 4,
    drift: (Math.random() - 0.5) * 3,
  }));
}

export function CelebrationOverlay({ visible, title, subtitle, icon = 'checkmark-circle', color = '#7C3AED', onClose, autoDismiss = true, duration = 3000 }) {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [confetti] = useState(generateConfetti());
  const [confettiAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Scale in animation
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();

      if (autoDismiss) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(opacityAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      scaleAnim.setValue(0);
      confettiAnim.setValue(0);
      onClose?.();
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      {/* Confetti */}
      {confetti.map((particle) => {
        const translateY = confettiAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, screenHeight + 50],
        });
        const translateX = confettiAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, particle.drift * 100],
        });
        const rotate = confettiAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${particle.rotation + 720}deg`],
        });
        const confettiOpacity = confettiAnim.interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [1, 1, 0],
        });

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.confetti,
              {
                left: particle.x,
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                transform: [{ translateY }, { translateX }, { rotate }],
                opacity: confettiOpacity,
              },
            ]}
          />
        );
      })}

      {/* Celebration card */}
      <Animated.View style={[styles.card, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon} size={64} color={color} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <TouchableOpacity style={[styles.button, { backgroundColor: color }]} onPress={handleClose}>
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// Achievement Badge (for displaying milestones earned)
export function AchievementBadge({ icon, title, color = '#7C3AED', earned = true }) {
  return (
    <View style={[styles.badge, !earned && styles.badgeLocked]}>
      <View style={[styles.badgeIcon, { backgroundColor: earned ? color + '20' : '#F0F0F0' }]}>
        <Ionicons name={earned ? icon : 'lock-closed'} size={24} color={earned ? color : '#CCC'} />
      </View>
      <Text style={[styles.badgeTitle, !earned && styles.badgeTitleLocked]}>{title}</Text>
    </View>
  );
}

// Milestone definitions per app
export const MILESTONES = {
  ContentAIPro: [
    { count: 1, title: 'First Content!', subtitle: 'Your AI journey begins', icon: 'sparkles' },
    { count: 10, title: 'Content Creator!', subtitle: '10 pieces generated', icon: 'create' },
    { count: 25, title: 'Marketing Pro!', subtitle: '25 pieces generated', icon: 'megaphone' },
    { count: 50, title: 'Content Machine!', subtitle: '50 pieces generated', icon: 'flash' },
    { count: 100, title: 'Content Legend!', subtitle: '100 pieces — top 1%', icon: 'trophy' },
  ],
  AIResumeBuilder: [
    { count: 1, title: 'Resume Ready!', subtitle: 'Your first AI resume', icon: 'document-text' },
    { count: 3, title: 'Getting Serious!', subtitle: '3 resumes created', icon: 'briefcase' },
    { count: 10, title: 'Job Hunter!', subtitle: '10 resumes tailored', icon: 'search' },
    { count: 25, title: 'Career Pro!', subtitle: '25 applications ready', icon: 'ribbon' },
    { count: 50, title: 'Interview Magnet!', subtitle: '50 resumes — top 1%', icon: 'trophy' },
  ],
  InvoiceAI: [
    { count: 1, title: 'First Invoice!', subtitle: 'Get paid faster', icon: 'receipt' },
    { count: 5, title: 'On a Roll!', subtitle: '5 invoices sent', icon: 'trending-up' },
    { count: 15, title: 'Business Pro!', subtitle: '15 invoices created', icon: 'business' },
    { count: 30, title: 'Invoice Master!', subtitle: '30 invoices', icon: 'cash' },
    { count: 50, title: 'Finance Legend!', subtitle: '50 invoices — top 1%', icon: 'trophy' },
  ],
  ProposalAI: [
    { count: 1, title: 'First Proposal!', subtitle: 'Win more clients', icon: 'briefcase' },
    { count: 3, title: 'Building Momentum!', subtitle: '3 proposals ready', icon: 'trending-up' },
    { count: 10, title: 'Deal Maker!', subtitle: '10 proposals sent', icon: 'handshake' },
    { count: 25, title: 'Sales Pro!', subtitle: '25 proposals', icon: 'ribbon' },
    { count: 50, title: 'Closer Legend!', subtitle: '50 proposals — top 1%', icon: 'trophy' },
  ],
  AIBookkeeperPro: [
    { count: 1, title: 'First Receipt!', subtitle: 'AI bookkeeping begins', icon: 'receipt' },
    { count: 10, title: 'Organized!', subtitle: '10 receipts scanned', icon: 'folder' },
    { count: 50, title: 'Tax Ready!', subtitle: '50 receipts categorized', icon: 'calculator' },
    { count: 100, title: 'Bookkeeper!', subtitle: '100 transactions tracked', icon: 'analytics' },
    { count: 250, title: 'Finance Master!', subtitle: '250+ receipts — top 1%', icon: 'trophy' },
  ],
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '85%',
    maxWidth: 350,
  },
  iconContainer: {
    width: 100, height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', color: '#1a1a1a', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  confetti: {
    position: 'absolute',
    borderRadius: 2,
  },
  badge: {
    alignItems: 'center',
    padding: 12,
  },
  badgeLocked: { opacity: 0.5 },
  badgeIcon: {
    width: 48, height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeTitle: { fontSize: 12, fontWeight: '600', color: '#333' },
  badgeTitleLocked: { color: '#CCC' },
});
