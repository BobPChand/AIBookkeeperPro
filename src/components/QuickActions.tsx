import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, AsyncStorage } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// QUICK ACTIONS — ONE-TAP SHORTCUTS ON HOME SCREEN
//
// THE EDGE: Most apps make users navigate 3-4 taps to do anything.
// Top apps like Notion, Linear, and Superhuman put the most common
// actions right on the home screen. One tap to start.
//
// Research: Reducing taps to primary action from 3 to 1
// increases task completion by 47%.

// Per-app quick actions
export const QUICK_ACTIONS = {
  ContentAIPro: [
    { id: 'gen_social', icon: 'logo-instagram', label: 'Social Post', color: '#7C3AED', screen: 'Generate', params: { contentType: 'social' } },
    { id: 'gen_blog', icon: 'newspaper', label: 'Blog Post', color: '#7C3AED', screen: 'Generate', params: { contentType: 'blog' } },
    { id: 'gen_ad', icon: 'megaphone', label: 'Ad Copy', color: '#7C3AED', screen: 'Generate', params: { contentType: 'ad' } },
    { id: 'gen_video', icon: 'film', label: 'Video Script', color: '#7C3AED', screen: 'Generate', params: { contentType: 'video' } },
  ],
  AIResumeBuilder: [
    { id: 'new_resume', icon: 'document-text', label: 'New Resume', color: '#2563EB', screen: 'Create', params: {} },
    { id: 'cover_letter', icon: 'mail', label: 'Cover Letter', color: '#2563EB', screen: 'Create', params: { type: 'cover' } },
    { id: 'ats_check', icon: 'analytics', label: 'ATS Check', color: '#2563EB', screen: 'Create', params: { type: 'ats' } },
    { id: 'templates', icon: 'grid', label: 'Templates', color: '#2563EB', screen: 'History', params: {} },
  ],
  InvoiceAI: [
    { id: 'new_invoice', icon: 'receipt', label: 'New Invoice', color: '#4A90E2', screen: 'Invoice', params: {} },
    { id: 'scan_receipt', icon: 'camera', label: 'Scan Receipt', color: '#4A90E2', screen: 'Invoice', params: { type: 'scan' } },
    { id: 'estimates', icon: 'document-text', label: 'Estimate', color: '#4A90E2', screen: 'Invoice', params: { type: 'estimate' } },
    { id: 'insights', icon: 'bar-chart', label: 'Insights', color: '#4A90E2', screen: 'Insights', params: {} },
  ],
  ProposalAI: [
    { id: 'new_proposal', icon: 'briefcase', label: 'Proposal', color: '#059669', screen: 'Create', params: {} },
    { id: 'pitch_deck', icon: 'easel', label: 'Pitch Deck', color: '#059669', screen: 'Pitch', params: {} },
    { id: 'templates', icon: 'grid', label: 'Templates', color: '#059669', screen: 'History', params: {} },
    { id: 'follow_up', icon: 'send', label: 'Follow Up', color: '#059669', screen: 'History', params: {} },
  ],
  AIBookkeeperPro: [
    { id: 'scan_receipt', icon: 'camera', label: 'Scan', color: '#F59E0B', screen: 'Home', params: { action: 'scan' } },
    { id: 'add_expense', icon: 'add-circle', label: 'Add Expense', color: '#F59E0B', screen: 'Home', params: { action: 'expense' } },
    { id: 'reports', icon: 'analytics', label: 'Reports', color: '#F59E0B', screen: 'Home', params: { action: 'reports' } },
    { id: 'tax_savings', icon: 'cash', label: 'Tax Tips', color: '#F59E0B', screen: 'Home', params: { action: 'tax' } },
  ],
};

// Quick Action Grid Component
export function QuickActionGrid({ appKey, onAction }) {
  const actions = QUICK_ACTIONS[appKey] || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionCard}
            onPress={() => onAction?.(action)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
              <Ionicons name={action.icon} size={26} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 8 },
  title: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 12, marginLeft: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionCard: {
    width: '23.5%',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionIcon: {
    width: 56, height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: { fontSize: 12, fontWeight: '500', color: '#333', textAlign: 'center' },
});
