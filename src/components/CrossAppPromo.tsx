import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// CROSS-APP PROMOTION SYSTEM
// Research: 15-25% of users install another app from the same developer
// This is FREE user acquisition — 1 user becomes 2-5 users
// Apple's algorithm also rewards developers with multiple successful apps
// 
// HOW IT WORKS: Each app shows a "More Apps" section in Settings/About
// with the other 4 apps. Tapping opens the App Store directly.

const APP_STORE_APPS = [
  {
    id: '6791894087',
    name: 'ContentAI Pro',
    tagline: 'AI content marketing suite',
    icon: 'sparkles',
    color: '#7C3AED',
    description: 'Generate social posts, blogs, ads & video scripts in seconds',
    category: 'Marketing',
  },
  {
    id: '6791894147',
    name: 'AI Resume Builder',
    tagline: 'ATS-optimized resumes & cover letters',
    icon: 'document-text',
    color: '#2563EB',
    description: 'Land 3x more interviews with AI-powered, ATS-optimized resumes',
    category: 'Career',
  },
  {
    id: '6791894204',
    name: 'Invoice AI',
    tagline: 'Professional invoices in 60 seconds',
    icon: 'receipt',
    color: '#4A90E2',
    description: 'Create invoices, estimates & quotes with automatic tax calculations',
    category: 'Business',
  },
  {
    id: '6795848281',
    name: 'Proposal AI',
    tagline: 'AI proposals that close deals',
    icon: 'briefcase',
    color: '#059669',
    description: 'Win more clients with AI-written proposals & pitch decks',
    category: 'Sales',
  },
  {
    id: '6800172403',
    name: 'AI Bookkeeper Pro',
    tagline: 'Bookkeeping on autopilot',
    icon: 'calculator',
    color: '#F59E0B',
    description: 'Snap receipts, auto-categorize expenses & maximize tax deductions',
    category: 'Finance',
  },
];

// Get apps to promote (exclude current app)
export function getPromoApps(currentAppId) {
  return APP_STORE_APPS.filter(app => app.id !== currentAppId);
}

// Open App Store directly
export function openAppStore(appId) {
  const url = `https://apps.apple.com/app/id${appId}`;
  Linking.openURL(url);
}

// Cross-App Promotion Card
export function CrossAppPromoCard({ app, onPress }) {
  return (
    <TouchableOpacity style={styles.promoCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.appIcon, { backgroundColor: app.color + '20' }]}>
        <Ionicons name={app.icon} size={28} color={app.color} />
      </View>
      <View style={styles.promoContent}>
        <Text style={styles.promoName}>{app.name}</Text>
        <Text style={styles.promoDesc}>{app.description}</Text>
        <View style={styles.promoBadge}>
          <Text style={styles.promoCategory}>{app.category}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );
}

// Full Cross-App Promotion Section (for Settings/About screen)
export function CrossAppPromoSection({ currentAppId }) {
  const promoApps = getPromoApps(currentAppId);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>More Apps from Us</Text>
      <Text style={styles.sectionSubtitle}>Boost your productivity with our full suite</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
        {promoApps.map((app) => (
          <CrossAppPromoCard
            key={app.id}
            app={app}
            onPress={() => openAppStore(app.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

// Compact version for bottom of Home screen
export function CrossAppPromoBanner({ currentAppId }) {
  const promoApps = getPromoApps(currentAppId);
  const featured = promoApps[Math.floor(Math.random() * promoApps.length)];

  return (
    <TouchableOpacity
      style={[styles.banner, { borderColor: featured.color + '30' }]}
      onPress={() => openAppStore(featured.id)}
      activeOpacity={0.8}
    >
      <View style={[styles.bannerIcon, { backgroundColor: featured.color + '15' }]}>
        <Ionicons name={featured.icon} size={24} color={featured.color} />
      </View>
      <View style={styles.bannerContent}>
        <Text style={styles.bannerTitle}>Also try: {featured.name}</Text>
        <Text style={styles.bannerDesc}>{featured.description}</Text>
      </View>
      <View style={styles.bannerCTA}>
        <Text style={[styles.bannerCTAText, { color: featured.color }]}>GET</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  sectionSubtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  scrollView: { flexDirection: 'row' },
  promoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 280,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  promoContent: { flex: 1 },
  promoName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginBottom: 2 },
  promoDesc: { fontSize: 12, color: '#666', lineHeight: 16, marginBottom: 6 },
  promoBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  promoCategory: { fontSize: 10, fontWeight: '600', color: '#888' },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerContent: { flex: 1 },
  bannerTitle: { fontSize: 13, fontWeight: '600', color: '#333' },
  bannerDesc: { fontSize: 11, color: '#888', marginTop: 2 },
  bannerCTA: {
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bannerCTAText: { fontSize: 13, fontWeight: '800' },
});
