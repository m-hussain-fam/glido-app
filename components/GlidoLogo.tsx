import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type Props = {
  size?: 'large' | 'small';
};

export default function GlidoLogo({ size = 'large' }: Props) {
  const isLarge = size === 'large';

  return (
    <View style={styles.container}>
      <View style={[styles.circle, isLarge ? styles.circleLarge : styles.circleSmall]}>
        <Ionicons name="car-sport" size={isLarge ? 48 : 28} color={Colors.white} />
      </View>
      <Text style={[styles.appName, isLarge ? styles.appNameLarge : styles.appNameSmall]}>
        Glido
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  circle: {
    backgroundColor: Colors.primary,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  circleLarge: {
    width: 100,
    height: 100,
  },
  circleSmall: {
    width: 56,
    height: 56,
  },
  appName: {
    fontWeight: '800',
    color: Colors.textDark,
    letterSpacing: 2,
  },
  appNameLarge: {
    fontSize: 36,
  },
  appNameSmall: {
    fontSize: 20,
  },
});
