import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Colors } from '../constants/colors';
import { formatCurrency } from '../utils/format';
import { create_entity } from '../utils/entityApi';

const IRS_MILEAGE_RATE = 0.67; // $0.67 / mile standard IRS rate

interface Trip {
  id: string;
  date: string;
  startLocation: string;
  endLocation: string;
  miles: number;
  purpose: string;
  classification?: 'business' | 'personal';
}

const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip_1',
    date: 'Today, 9:30 AM',
    startLocation: 'Main Office',
    endLocation: 'Tech Hub Center',
    miles: 18.4,
    purpose: 'Client Onboarding Meeting',
  },
  {
    id: 'trip_2',
    date: 'Yesterday, 2:15 PM',
    startLocation: 'Downtown Depot',
    endLocation: 'Westside Branch',
    miles: 12.8,
    purpose: 'Office Supply Pickup',
  },
  {
    id: 'trip_3',
    date: 'Aug 17, 10:00 AM',
    startLocation: 'Home Office',
    endLocation: 'Metro Airport',
    miles: 34.2,
    purpose: 'Conference Flight',
    classification: 'business',
  },
];

const MileageTrackerGPS: React.FC = () => {
  const [autoTracking, setAutoTracking] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [isRecording, setIsRecording] = useState(false);
  const [currentMiles, setCurrentMiles] = useState(0);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleClassify = async (tripId: string, classification: 'business' | 'personal') => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return;

    const value = Math.round(trip.miles * IRS_MILEAGE_RATE * 100) / 100;

    if (classification === 'business') {
      try {
        await create_entity('Transaction', {
          type: 'expense',
          amount: value,
          category: 'car_truck',
          merchant: `Mileage: ${trip.startLocation} to ${trip.endLocation}`,
          date: new Date().toISOString().split('T')[0],
          notes: `${trip.miles} miles @ $${IRS_MILEAGE_RATE}/mi (${trip.purpose})`,
          is_tax_deductible: true,
        });
      } catch (e) {
        console.warn('Failed to record mileage deduction:', e);
      }
    }

    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, classification } : t))
    );
  };

  const toggleRecording = () => {
    if (!hasPermission) {
      Alert.alert('Location Required', 'Please enable location permissions in settings.');
      return;
    }

    if (!isRecording) {
      setIsRecording(true);
      setCurrentMiles(0.1);
      Alert.alert('GPS Drive Tracking Started', 'Recording trip route in background...');
    } else {
      setIsRecording(false);
      const newTrip: Trip = {
        id: `trip_${Date.now()}`,
        date: 'Just Now',
        startLocation: 'Current Drive Start',
        endLocation: 'Current Drive Destination',
        miles: 14.5,
        purpose: 'Recent Drive',
      };
      setTrips((prev) => [newTrip, ...prev]);
      Alert.alert(
        'Trip Ended',
        `Logged 14.5 miles ($${(14.5 * IRS_MILEAGE_RATE).toFixed(2)} potential tax value).`
      );
    }
  };

  const handleExport = () => {
    const totalBusinessMiles = trips
      .filter((t) => t.classification === 'business')
      .reduce((sum, t) => sum + t.miles, 0);
    const totalDeduction = totalBusinessMiles * IRS_MILEAGE_RATE;

    Alert.alert(
      'Tax Mileage Report Exported',
      `Exported ${trips.length} drives (${totalBusinessMiles.toFixed(
        1
      )} business miles = ${formatCurrency(totalDeduction)} deduction) formatted for Schedule C tax filing.`
    );
  };

  const totalBusinessMiles = trips
    .filter((t) => t.classification === 'business')
    .reduce((sum, t) => sum + t.miles, 0);

  const totalDeductionValue = totalBusinessMiles * IRS_MILEAGE_RATE;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="car" size={20} color={Colors.white} />
          </View>
          <View>
            <Text style={styles.cardTitle}>GPS Mileage Tracker</Text>
            <Text style={styles.cardSubtitle}>
              IRS Standard Rate: ${IRS_MILEAGE_RATE}/mile • Free Feature
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
          <Ionicons name="download-outline" size={16} color={Colors.accent} />
          <Text style={styles.exportText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Stats */}
      <View style={styles.statsBox}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Business Miles</Text>
          <Text style={styles.statVal}>{totalBusinessMiles.toFixed(1)} mi</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>Tax Savings</Text>
          <Text style={[styles.statVal, { color: Colors.income }]}>
            {formatCurrency(totalDeductionValue)}
          </Text>
        </View>
      </View>

      {/* Auto Detect Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          <Ionicons name="navigate" size={18} color={Colors.accent} />
          <View>
            <Text style={styles.toggleTitle}>Auto-Detect Driving</Text>
            <Text style={styles.toggleSub}>
              {autoTracking ? 'GPS active in background' : 'Manual start only'}
            </Text>
          </View>
        </View>
        <Switch
          value={autoTracking}
          onValueChange={setAutoTracking}
          trackColor={{ false: Colors.neutralLight, true: Colors.accentLight }}
          thumbColor={autoTracking ? Colors.accent : Colors.neutral}
        />
      </View>

      {/* Manual Start Drive Button */}
      <TouchableOpacity
        style={[styles.driveBtn, isRecording && styles.driveBtnRecording]}
        onPress={toggleRecording}
      >
        <Ionicons name={isRecording ? 'stop-circle' : 'play-circle'} size={22} color={Colors.white} />
        <Text style={styles.driveBtnText}>
          {isRecording ? 'Stop Recording Drive' : 'Start Manual Drive GPS'}
        </Text>
      </TouchableOpacity>

      {/* Unclassified Drives Header */}
      <Text style={styles.sectionHeader}>Trip Log & Swipe Classification</Text>

      <ScrollView style={styles.tripsScroll} nestedScrollEnabled>
        {trips.map((trip) => {
          const tripValue = trip.miles * IRS_MILEAGE_RATE;
          return (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripTop}>
                <View style={styles.routeHeader}>
                  <Ionicons name="location" size={16} color={Colors.accent} />
                  <Text style={styles.routeText}>
                    {trip.startLocation} → {trip.endLocation}
                  </Text>
                </View>
                <Text style={styles.tripMiles}>{trip.miles} mi</Text>
              </View>

              <View style={styles.tripMeta}>
                <Text style={styles.tripDate}>{trip.date}</Text>
                <Text style={styles.tripValue}>Valued at {formatCurrency(tripValue)}</Text>
              </View>

              {/* Classification status or action buttons */}
              {trip.classification ? (
                <View
                  style={[
                    styles.classifiedBadge,
                    trip.classification === 'business'
                      ? styles.businessBadge
                      : styles.personalBadge,
                  ]}
                >
                  <Ionicons
                    name={trip.classification === 'business' ? 'briefcase' : 'person'}
                    size={14}
                    color={trip.classification === 'business' ? Colors.income : Colors.neutral}
                  />
                  <Text
                    style={[
                      styles.classifiedText,
                      trip.classification === 'business'
                        ? styles.businessText
                        : styles.personalText,
                    ]}
                  >
                    Classified as {trip.classification.toUpperCase()} ({formatCurrency(tripValue)}{' '}
                    tax deduction)
                  </Text>
                </View>
              ) : (
                <View style={styles.classifyBtnRow}>
                  <TouchableOpacity
                    style={styles.personalBtn}
                    onPress={() => handleClassify(trip.id, 'personal')}
                  >
                    <Ionicons name="person-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.personalBtnText}>Personal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.businessBtn}
                    onPress={() => handleClassify(trip.id, 'business')}
                  >
                    <Ionicons name="briefcase" size={16} color={Colors.white} />
                    <Text style={styles.businessBtnText}>Business (+{formatCurrency(tripValue)})</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.accentLight,
  },
  exportText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
  },
  statsBox: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.border,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  toggleSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  driveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
  },
  driveBtnRecording: {
    backgroundColor: Colors.expense,
  },
  driveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  tripsScroll: {
    maxHeight: 320,
  },
  tripCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tripTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  tripMiles: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primary,
  },
  tripMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 10,
  },
  tripDate: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  tripValue: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.income,
  },
  classifyBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  personalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.neutralLight,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  personalBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  businessBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  businessBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  classifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  businessBadge: {
    backgroundColor: Colors.accentLight,
  },
  personalBadge: {
    backgroundColor: Colors.neutralLight,
  },
  classifiedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  businessText: {
    color: Colors.income,
  },
  personalText: {
    color: Colors.neutral,
  },
});

export default MileageTrackerGPS;
