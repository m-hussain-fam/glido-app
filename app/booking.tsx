import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRideStore } from '@/store/rideStore';

const VEHICLE_META: Record<string, { name: string; seats: number; eta: string }> = {
  moto:     { name: 'Motorcycle', seats: 1, eta: '~3 min' },
  rickshaw: { name: 'Rickshaw',   seats: 3, eta: '~5 min' },
  car:      { name: 'Car',        seats: 4, eta: '~7 min' },
};

async function fetchRoute(
  fromLat: number, fromLon: number,
  toLat: number,   toLon: number,
): Promise<{ latitude: number; longitude: number }[]> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes?.length) {
      return data.routes[0].geometry.coordinates.map(([lon, lat]: [number, number]) => ({
        latitude: lat,
        longitude: lon,
      }));
    }
  } catch {}
  return [];
}

function PulsingDots() {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 200),
          Animated.timing(dot, { toValue: 1,   duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.dotsRow}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
      ))}
    </View>
  );
}

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const { fromCoords, toCoords, vehicle, vehicleEmoji, fare } = useRideStore();
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const meta = VEHICLE_META[vehicle] ?? VEHICLE_META.car;

  useEffect(() => {
    if (!fromCoords || !toCoords) return;
    fetchRoute(fromCoords.lat, fromCoords.lon, toCoords.lat, toCoords.lon).then((coords) => {
      setRouteCoords(coords);
      if (coords.length > 0) {
        mapRef.current?.fitToCoordinates(coords, {
          edgePadding: { top: 80, right: 40, bottom: 320, left: 40 },
          animated: true,
        });
      }
    });
  }, [fromCoords, toCoords]);

  const fromMarker = fromCoords
    ? { latitude: fromCoords.lat, longitude: fromCoords.lon }
    : null;

  const toMarker = toCoords
    ? { latitude: toCoords.lat, longitude: toCoords.lon }
    : null;

  return (
    <View style={styles.container}>

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {fromMarker && (
          <Marker coordinate={fromMarker} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.fromMarker} />
          </Marker>
        )}
        {toMarker && (
          <Marker coordinate={toMarker} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.toMarkerWrapper}>
              <Ionicons name="location" size={32} color="#f87171" />
            </View>
          </Marker>
        )}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor={Colors.primary}
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* Bottom card */}
      <View style={[styles.card, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dragHandle} />

        {/* Vehicle info */}
        <View style={styles.vehicleRow}>
          <View style={styles.emojiBox}>
            <Text style={styles.emoji}>{vehicleEmoji}</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>{meta.name}</Text>
            <View style={styles.vehicleMeta}>
              <Ionicons name="person-outline" size={13} color={Colors.textGray} />
              <Text style={styles.metaText}>{meta.seats} seat{meta.seats > 1 ? 's' : ''}</Text>
              <View style={styles.metaDot} />
              <Ionicons name="time-outline" size={13} color={Colors.textGray} />
              <Text style={styles.metaText}>{meta.eta}</Text>
            </View>
          </View>
          <Text style={styles.fare}>Rs. {fare}</Text>
        </View>

        <View style={styles.divider} />

        {/* Driver search */}
        <View style={styles.searchingSection}>
          <PulsingDots />
          <Text style={styles.searchingText}>Looking for your driver...</Text>
        </View>

        {/* Cancel button */}
        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.85}
          onPress={() => setShowCancelModal(true)}
        >
          <Text style={styles.cancelBtnText}>Cancel Ride</Text>
        </TouchableOpacity>
      </View>

      {/* Cancel confirmation modal */}
      <Modal visible={showCancelModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="warning-outline" size={32} color="#f87171" />
            </View>
            <Text style={styles.modalTitle}>Cancel Ride?</Text>
            <Text style={styles.modalSubtitle}>
              Are you sure you want to cancel your ride request?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalNoBtn}
                onPress={() => setShowCancelModal(false)}
              >
                <Text style={styles.modalNoText}>Keep Ride</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalYesBtn}
                onPress={() => {
                  setShowCancelModal(false);
                  router.back();
                }}
              >
                <Text style={styles.modalYesText}>Yes, Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  fromMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  toMarkerWrapper: { alignItems: 'center' },
  card: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 14,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  dragHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
  },
  vehicleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: { fontSize: 26 },
  vehicleInfo: { flex: 1, gap: 5 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: Colors.textDark },
  vehicleMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: Colors.textGray },
  metaDot: {
    width: 3, height: 3, borderRadius: 1.5,
    backgroundColor: Colors.textGray,
    marginHorizontal: 2,
  },
  fare: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  divider: { height: 1, backgroundColor: Colors.secondary },
  searchingSection: { alignItems: 'center', gap: 12, paddingVertical: 4 },
  dotsRow: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  searchingText: { fontSize: 15, color: Colors.textGray, fontWeight: '500' },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#f87171',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#f87171' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  modalIconBox: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textDark },
  modalSubtitle: {
    fontSize: 14, color: Colors.textGray,
    textAlign: 'center', lineHeight: 20,
  },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 8, width: '100%' },
  modalNoBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
  },
  modalNoText: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  modalYesBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
  },
  modalYesText: { fontSize: 14, fontWeight: '700', color: '#f87171' },
});
