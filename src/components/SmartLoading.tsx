import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// SKELETON LOADING — MAKES WAITING FEEL FASTER
//
// THE EDGE: Spinners make users feel like they're waiting.
// Skeleton screens (gray placeholders that pulse) make users
// feel like the app is ALREADY loading content. This is what
// Facebook, LinkedIn, and YouTube use.
//
// Research: Skeleton screens reduce perceived wait time by 30%
// and make the app feel 2x more responsive.

// Pulsing skeleton block
export function SkeletonBlock({ width = '100%', height = 16, borderRadius = 8, style }) {
  const [opacity] = useState(new Animated.Value(0.3));

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, easing: Easing.ease, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, easing: Easing.ease, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: '#E0E0E0', opacity }, style]}
    />
  );
}

// Skeleton for content cards (list view)
export function ContentCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <SkeletonBlock width={40} height={40} borderRadius={20} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <SkeletonBlock width="60%" height={14} />
          <View style={{ height: 8 }} />
          <SkeletonBlock width="40%" height={12} />
        </View>
      </View>
      <SkeletonBlock width="100%" height={14} />
      <View style={{ height: 6 }} />
      <SkeletonBlock width="90%" height={14} />
      <View style={{ height: 6 }} />
      <SkeletonBlock width="70%" height={14} />
    </View>
  );
}

// Skeleton for invoice/resume preview
export function PreviewSkeleton() {
  return (
    <View style={{ padding: 20 }}>
      <SkeletonBlock width="50%" height={24} borderRadius={6} style={{ marginBottom: 20 }} />
      <SkeletonBlock width="80%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="70%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="90%" height={16} style={{ marginBottom: 24 }} />
      <View style={{ height: 100, borderRadius: 12, backgroundColor: '#F0F0F0', marginBottom: 24 }} />
      <SkeletonBlock width="60%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="75%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="50%" height={16} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="65%" height={16} style={{ marginBottom: 24 }} />
      <SkeletonBlock width="40%" height={40} borderRadius={12} />
    </View>
  );
}

// Smart loading component — picks the right skeleton
export function SmartLoading({ type = 'list', count = 3 }) {
  if (type === 'preview') return <PreviewSkeleton />;

  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <ContentCardSkeleton key={i} />
      ))}
    </View>
  );
}

// Progressive loading indicator (for AI generation)
export function GenerationProgress({ visible, label = 'Generating...' }) {
  if (!visible) return null;

  const [dots, setDots] = React.useState('');
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.genContainer}>
      <View style={styles.genIcon}>
        <Ionicons name="sparkles" size={24} color="#7C3AED" />
      </View>
      <Text style={styles.genText}>{label}{dots}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  genContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  genIcon: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genText: { fontSize: 16, color: '#666', fontWeight: '500' },
});
