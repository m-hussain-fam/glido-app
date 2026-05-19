import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, TextInput, Dimensions, FlatList, ActivityIndicator,
  Keyboard, Platform, BackHandler,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { searchPlaces, PlaceSuggestion } from '@/services/placesSearch';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRideStore } from '@/store/rideStore';

const { height } = Dimensions.get('window');

const recentPlaces = [
  { id: '1', icon: 'home', label: 'Home', address: 'DHA Phase 5, Lahore' },
  { id: '2', icon: 'briefcase', label: 'Office', address: 'Gulberg III, Lahore' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { setFrom, setTo } = useRideStore();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [fromText, setFromText] = useState('Current Location');
  const [toText, setToText] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const drawerAnim = useRef(new Animated.Value(height)).current;
  const keyboardAnim = useRef(new Animated.Value(0)).current;
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      const geocode = await Location.reverseGeocodeAsync(loc.coords);
      const coords = { lat: loc.coords.latitude, lon: loc.coords.longitude };
      if (geocode.length > 0) {
        const { district, city, street, name } = geocode[0];
        const label = district && city
          ? `${district}, ${city}`
          : street
          ? `${name ? name + ' ' : ''}${street}`
          : 'Current Location';
        setFromText(label);
        setFrom(label, coords);
      } else {
        setFrom('Current Location', coords);
      }
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      Animated.timing(keyboardAnim, {
        toValue: -e.endCoordinates.height,
        duration: e.duration ?? 250,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration: e.duration ?? 250,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardAnim]);

  useEffect(() => {
    if (!drawerOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeDrawer();
      return true;
    });
    return () => sub.remove();
  }, [drawerOpen]);

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.spring(drawerAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const closeDrawer = () => {
    Animated.timing(drawerAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setDrawerOpen(false));
  };

  const handleToTextChange = (text: string) => {
    setToText(text);
    setSuggestions([]);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (text.trim().length < 2) {
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceTimer.current = setTimeout(async () => {
      const results = await searchPlaces(text);
      setSuggestions(results);
      setSearching(false);
    }, 500);
  };

  const selectSuggestion = (place: PlaceSuggestion) => {
    setToText(place.name);
    setTo(place.name, { lat: place.lat, lon: place.lon });
    setSuggestions([]);
  };

  const swapLocations = () => {
    const temp = fromText;
    setFromText(toText || 'Current Location');
    setToText(temp);
    setSuggestions([]);
  };

  const region = location
    ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 31.5204,
        longitude: 74.3587,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <View style={styles.container}>

      {/* Map */}
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            }}
          />
        )}
      </MapView>

      {/* Header */}
      <View style={[styles.header, { top: insets.top + 10 }]}>
        <View>
          <Text style={styles.greeting}>Hi, Username! 👋</Text>
          <Text style={styles.subGreeting}>Where are you going today?</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="person-circle-outline" size={38} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Bottom Card */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>

        {/* Where to go bar */}
        <TouchableOpacity style={styles.searchBar} onPress={openDrawer} activeOpacity={0.8}>
          <View style={styles.searchDot} />
          <Text style={styles.searchText}>Where to go?</Text>
          <Ionicons name="search" size={18} color={Colors.textGray} />
        </TouchableOpacity>

        {/* Recent Places */}
        <Text style={styles.recentTitle}>Recent Places</Text>
        <View style={styles.recentRow}>
          {recentPlaces.map((place) => (
            <TouchableOpacity key={place.id} style={styles.recentCard} onPress={openDrawer}>
              <View style={styles.recentIcon}>
                <Ionicons name={place.icon as any} size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentLabel}>{place.label}</Text>
                <Text style={styles.recentAddress} numberOfLines={1}>{place.address}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </View>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <TouchableOpacity style={styles.overlay} onPress={closeDrawer} activeOpacity={1} />
      )}

      {/* Bottom Drawer */}
      <Animated.View style={[styles.drawer, { paddingBottom: insets.bottom + 16, transform: [{ translateY: Animated.add(drawerAnim, keyboardAnim) }] }]}>

        <View style={styles.dragHandle} />

        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>Set Location</Text>
          <TouchableOpacity onPress={closeDrawer} style={styles.closeBtn} hitSlop={8}>
            <Ionicons name="close" size={20} color={Colors.textDark} />
          </TouchableOpacity>
        </View>

        {/* From */}
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: Colors.primary }]} />
          <View style={styles.locationInput}>
            <Text style={styles.locationLabel}>From</Text>
            <TextInput
              style={styles.locationText}
              value={fromText}
              onChangeText={setFromText}
              placeholder="Your location"
              placeholderTextColor={Colors.textGray}
            />
          </View>
        </View>

        {/* Swap Button */}
        <TouchableOpacity style={styles.swapBtn} onPress={swapLocations}>
          <Ionicons name="swap-vertical" size={18} color={Colors.primary} />
        </TouchableOpacity>

        {/* To */}
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: '#f87171' }]} />
          <View style={styles.locationInput}>
            <Text style={styles.locationLabel}>To</Text>
            <TextInput
              style={styles.locationText}
              value={toText}
              onChangeText={handleToTextChange}
              placeholder="Enter destination"
              placeholderTextColor={Colors.textGray}
              autoFocus
            />
          </View>
          {searching && <ActivityIndicator size="small" color={Colors.primary} />}
        </View>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            style={styles.suggestionsList}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.suggestionItem} onPress={() => selectSuggestion(item)}>
                <Ionicons name="location-outline" size={16} color={Colors.primary} style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.suggestionAddress} numberOfLines={1}>{item.address}</Text>
                </View>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.suggestionDivider} />}
          />
        )}

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, !toText && styles.confirmBtnDisabled]}
          disabled={!toText}
          activeOpacity={0.85}
          onPress={() => {
            closeDrawer();
            router.push('/ride-options' as any);
          }}
        >
          <Text style={styles.confirmBtnText}>Confirm Location</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>

      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  map: { flex: 1 },
  header: {
    position: 'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  greeting: { fontSize: 17, fontWeight: '700', color: Colors.textDark },
  subGreeting: { fontSize: 12, color: Colors.textGray, marginTop: 2 },
  profileBtn: { padding: 2 },
  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 10,
    gap: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  searchDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  searchText: { flex: 1, fontSize: 15, color: Colors.textGray },
  recentTitle: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  recentRow: { flexDirection: 'row', gap: 10 },
  recentCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentLabel: { fontSize: 13, fontWeight: '600', color: Colors.textDark },
  recentAddress: { fontSize: 11, color: Colors.textGray, marginTop: 2 },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  drawer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  dragHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginBottom: 6,
  },
  drawerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.secondary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationDot: { width: 12, height: 12, borderRadius: 6 },
  locationInput: { flex: 1 },
  locationLabel: { fontSize: 11, color: Colors.textGray, marginBottom: 2 },
  locationText: { fontSize: 15, color: Colors.textDark, fontWeight: '500' },
  swapBtn: {
    alignSelf: 'flex-end',
    marginRight: 14,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmBtnDisabled: {
    backgroundColor: '#93c5fd',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  suggestionsList: {
    maxHeight: 220,
    backgroundColor: Colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.secondary,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  suggestionName: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  suggestionAddress: { fontSize: 12, color: Colors.textGray, marginTop: 1 },
  suggestionDivider: { height: 1, backgroundColor: Colors.secondary, marginHorizontal: 14 },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
