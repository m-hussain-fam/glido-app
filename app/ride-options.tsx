import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRideStore } from '@/store/rideStore';

const RIDE_OPTIONS = [
  {
    id: 'moto',
    emoji: '🏍️',
    name: 'Motorcycle',
    seats: 1,
    eta: '3 min',
    fare: 180,
    tag: 'Cheapest',
    tagColor: '#10b981',
  },
  {
    id: 'rickshaw',
    emoji: '🛺',
    name: 'Rickshaw',
    seats: 3,
    eta: '5 min',
    fare: 250,
    tag: null,
    tagColor: null,
  },
  {
    id: 'car',
    emoji: '🚗',
    name: 'Car',
    seats: 4,
    eta: '7 min',
    fare: 500,
    tag: 'Recommended',
    tagColor: Colors.primary,
  },
];

export default function RideOptionsScreen() {
  const insets = useSafeAreaInsets();
  const { from, to, setVehicle } = useRideStore();
  const [selected, setSelected] = useState('car');

  const selectedOption = RIDE_OPTIONS.find((v) => v.id === selected)!;

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose a Ride</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Route summary */}
      <View style={styles.routeCard}>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.routeText} numberOfLines={1}>{from || 'Current Location'}</Text>
        </View>
        <View style={styles.routeSeparator}>
          <View style={styles.routeDashedLine} />
        </View>
        <View style={styles.routeRow}>
          <View style={[styles.routeDot, { backgroundColor: '#f87171' }]} />
          <Text style={styles.routeText} numberOfLines={1}>{to}</Text>
        </View>
      </View>

      {/* Ride options */}
      <ScrollView
        contentContainerStyle={styles.optionsList}
        showsVerticalScrollIndicator={false}
      >
        {RIDE_OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionCard, isSelected && styles.optionCardSelected]}
              onPress={() => setSelected(option.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.emojiBox, isSelected && styles.emojiBoxSelected]}>
                <Text style={styles.emoji}>{option.emoji}</Text>
              </View>

              <View style={styles.optionInfo}>
                <View style={styles.optionNameRow}>
                  <Text style={styles.optionName}>{option.name}</Text>
                  {option.tag && (
                    <View style={[styles.tag, { backgroundColor: option.tagColor + '20' }]}>
                      <Text style={[styles.tagText, { color: option.tagColor! }]}>
                        {option.tag}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.optionMeta}>
                  <Ionicons name="person-outline" size={12} color={Colors.textGray} />
                  <Text style={styles.metaText}>
                    {option.seats} seat{option.seats > 1 ? 's' : ''}
                  </Text>
                  <View style={styles.metaDivider} />
                  <Ionicons name="time-outline" size={12} color={Colors.textGray} />
                  <Text style={styles.metaText}>{option.eta}</Text>
                </View>
              </View>

              <View style={styles.fareCol}>
                <Text style={[styles.fareText, isSelected && styles.fareTextSelected]}>
                  Rs. {option.fare}
                </Text>
                {isSelected && (
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={11} color={Colors.white} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.fareRow}>
          <Text style={styles.fareLabel}>Total Fare</Text>
          <Text style={styles.totalFare}>Rs. {selectedOption.fare}</Text>
        </View>
        <TouchableOpacity
          style={styles.bookBtn}
          activeOpacity={0.85}
          onPress={() => {
            setVehicle(selectedOption.id, selectedOption.emoji, selectedOption.fare);
            router.push('/booking' as any);
          }}
        >
          <Text style={styles.bookBtnText}>Book {selectedOption.name}</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.secondary,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textDark },
  routeCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.secondary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeDot: { width: 10, height: 10, borderRadius: 5 },
  routeText: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.textDark },
  routeSeparator: { paddingLeft: 4, paddingVertical: 4 },
  routeDashedLine: {
    width: 1.5,
    height: 16,
    backgroundColor: '#d1d5db',
    marginLeft: 4,
  },
  optionsList: { padding: 20, gap: 12 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#eff6ff',
  },
  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiBoxSelected: { backgroundColor: '#dbeafe' },
  emoji: { fontSize: 26 },
  optionInfo: { flex: 1, gap: 6 },
  optionNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionName: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: { fontSize: 11, fontWeight: '600' },
  optionMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: Colors.textGray },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textGray,
    marginHorizontal: 2,
  },
  fareCol: { alignItems: 'flex-end', gap: 6 },
  fareText: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  fareTextSelected: { color: Colors.primary },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.secondary,
    gap: 14,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fareLabel: { fontSize: 14, color: Colors.textGray },
  totalFare: { fontSize: 20, fontWeight: '800', color: Colors.textDark },
  bookBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bookBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
