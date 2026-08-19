import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, View as RNView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// SHAREABLE OUTPUT CARDS — VIRAL MARKETING BUILT INTO THE PRODUCT
//
// THE #1 COMPETITIVE EDGE: When users generate content/resumes/invoices,
// they can share a beautiful branded card to social media.
// Each share = FREE marketing with app branding.
//
// Research: Apps with shareable outputs have 3-5x organic growth
// vs apps without. Canva grew to 60M users this way.
//
// HOW IT WORKS:
// 1. User generates content (resume, invoice, social post, etc.)
// 2. App shows a "Share" button with a preview card
// 3. Card includes: app name, subtle logo, user's output summary
// 4. User shares to Instagram/Twitter/LinkedIn → free marketing
//
// This creates a VIRAL LOOP:
// User generates → Shares to social → Follower sees → Downloads app → Generates → Shares...

export function ShareableCard({ appName, appColor, outputTitle, outputSummary, outputType, onPress }) {
  const handleShare = async () => {
    try {
      const message = formatShareText(appName, outputTitle, outputSummary, outputType);
      await Share.share({
        message,
        title: `${appName} — ${outputTitle}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  return (
    <TouchableOpacity style={[styles.card, { borderTopColor: appColor }]} onPress={handleShare} activeOpacity={0.8}>
      {/* App branding header */}
      <View style={[styles.cardHeader, { backgroundColor: appColor }]}>
        <Ionicons name="sparkles" size={14} color="#FFF" />
        <Text style={styles.cardHeaderText}>{appName}</Text>
      </View>

      {/* Output preview */}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{outputTitle}</Text>
        <Text style={styles.cardSummary} numberOfLines={4}>{outputSummary}</Text>
      </View>

      {/* Footer with CTA */}
      <View style={styles.cardFooter}>
        <Text style={styles.cardFooterText}>Made with {appName}</Text>
        <View style={styles.cardShareBtn}>
          <Ionicons name="share-outline" size={16} color="#FFF" />
          <Text style={styles.cardShareText}>Share</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Format share text per app type
function formatShareText(appName, title, summary, type) {
  const appLinks = {
    'ContentAI Pro': '\n\n📱 Try ContentAI Pro: https://apps.apple.com/app/id6791894087',
    'AI Resume Builder': '\n\n📱 Try AI Resume Builder: https://apps.apple.com/app/id6791894147',
    'Invoice AI': '\n\n📱 Try Invoice AI: https://apps.apple.com/app/id6791894204',
    'Proposal AI': '\n\n📱 Try Proposal AI: https://apps.apple.com/app/id6795848281',
    'AI Bookkeeper Pro': '\n\n📱 Try AI Bookkeeper Pro: https://apps.apple.com/app/id6800172403',
  };

  const link = appLinks[appName] || '';

  switch (type) {
    case 'resume':
      return `🎉 My AI-optimized resume is ready!\n\n"${title}"\n\n${summary}${link}`;
    case 'invoice':
      return `📋 Professional invoice created with AI:\n\n${title}\n${summary}${link}`;
    case 'proposal':
      return `🚀 Just created a winning proposal with AI:\n\n"${title}"\n\n${summary}${link}`;
    case 'content':
      return `${summary}${link}`;
    case 'receipt':
      return `🧾 Receipt scanned & categorized with AI:\n\n${summary}${link}`;
    default:
      return `"${title}"\n\n${summary}${link}`;
  }
}

// Quick Share Button (compact, for inline use)
export function QuickShareButton({ appName, appColor, title, summary, type }) {
  const handleShare = async () => {
    const message = formatShareText(appName, title, summary, type);
    await Share.share({ message, title: `${appName} — ${title}` });
  };

  return (
    <TouchableOpacity
      style={[styles.quickShare, { backgroundColor: appColor }]}
      onPress={handleShare}
      activeOpacity={0.8}
    >
      <Ionicons name="share-social" size={18} color="#FFF" />
      <Text style={styles.quickShareText}>Share</Text>
    </TouchableOpacity>
  );
}

// Social Proof Component — shows share count and recent shares
export function SocialProofBanner({ shareCount, totalUsers }) {
  if (shareCount === 0 && !totalUsers) return null;

  return (
    <View style={styles.socialProof}>
      <Ionicons name="trending-up" size={14} color="#10B981" />
      <Text style={styles.socialProofText}>
        {totalUsers > 0 && `${totalUsers.toLocaleString()} professionals use this app`}
        {shareCount > 0 && totalUsers > 0 && ' · '}
        {shareCount > 0 && `${shareCount} shares this week`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    marginVertical: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
  },
  cardHeaderText: { color: '#FFF', fontSize: 12, fontWeight: '700', marginLeft: 6 },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 8 },
  cardSummary: { fontSize: 14, color: '#555', lineHeight: 20 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cardFooterText: { fontSize: 11, color: '#AAA' },
  cardShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  cardShareText: { color: '#FFF', fontSize: 13, fontWeight: '600', marginLeft: 4 },
  quickShare: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  quickShareText: { color: '#FFF', fontSize: 14, fontWeight: '600', marginLeft: 6 },
  socialProof: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 6,
  },
  socialProofText: { fontSize: 12, color: '#10B981', fontWeight: '500' },
});
