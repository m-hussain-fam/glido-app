import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const features = [
  { icon: 'flash', text: 'Fast Pickup' },
  { icon: 'shield-checkmark', text: 'Verified Drivers' },
  { icon: 'pricetag', text: 'Best Prices' },
];

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>

      <View style={styles.topSection}>
        <View style={styles.illustrationBox}>
          <Ionicons name="car-sport" size={80} color={Colors.white} />
          <View style={styles.roadLine} />
        </View>
      </View>

      <View style={styles.bottomSection}>
      

        <View style={styles.headingContainer}>
          <Text style={styles.heading}>Get There</Text>
          <Text style={[styles.heading, styles.headingBlue]}>Faster.</Text>
        </View>

        <Text style={styles.subtitle}>
          Safe, reliable rides at your fingertips
        </Text>

        <View style={styles.featuresContainer}>
          {features.map((feature) => (
            <View key={feature.text} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={16} color={Colors.primary} />
              </View>
              <Text style={styles.featureText}>{feature.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/phone')}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <TouchableOpacity>
            <Text style={styles.loginLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topSection: {
    flex: 0.4,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  illustrationBox: {
    alignItems: 'center',
    gap: 12,
  },
  roadLine: {
    width: 160,
    height: 4,
    backgroundColor: Colors.white,
    borderRadius: 2,
    opacity: 0.4,
  },
  bottomSection: {
    flex: 0.6,
    paddingHorizontal: 28,
    paddingTop: 28,
    gap: 16,
  },
  headingContainer: {
    gap: 0,
  },
  heading: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.textDark,
    lineHeight: 46,
  },
  headingBlue: {
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textGray,
    lineHeight: 22,
  },
  featuresContainer: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: Colors.textDark,
    fontWeight: '500',
  },
  button: {
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
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: Colors.textGray,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
