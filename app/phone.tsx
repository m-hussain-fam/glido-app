import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

export default function PhoneScreen() {
  const [phone, setPhone] = useState('');

  const isValid = phone.length === 10;

  return (
    <View style={styles.container}>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.textDark} />
      </TouchableOpacity>

      <View style={styles.content}>

        <Text style={styles.heading}>Enter your{'\n'}Phone Number</Text>
        <Text style={styles.subtitle}>
          We'll send a verification code via SMS
        </Text>

        <View style={styles.inputContainer}>
          <View style={styles.countryCode}>
            <Text style={styles.flag}>🇵🇰</Text>
            <Text style={styles.code}>+92</Text>
          </View>
          <View style={styles.divider} />
          <TextInput
            style={styles.input}
            placeholder="3XX XXXXXXX"
            placeholderTextColor={Colors.textGray}
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={() => router.push('/otp')}
          disabled={!isValid}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Send OTP</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: 36,
    gap: 16,
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textDark,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textGray,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.secondary,
    borderRadius: 14,
    backgroundColor: Colors.secondary,
    marginTop: 8,
    overflow: 'hidden',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 6,
  },
  flag: {
    fontSize: 20,
  },
  code: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textDark,
  },
  divider: {
    width: 1.5,
    height: 28,
    backgroundColor: '#d1d5db',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.textDark,
    letterSpacing: 1,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  terms: {
    fontSize: 12,
    color: Colors.textGray,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  termsLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
