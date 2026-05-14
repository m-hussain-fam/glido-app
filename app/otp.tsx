import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

const OTP_LENGTH = 4;

export default function OtpScreen() {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const isComplete = otp.every((d) => d !== '');

  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < OTP_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleBackspace = (value: string, index: number) => {
    if (value === '' && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setOtp(['', '', '', '']);
    setTimer(60);
    setCanResend(false);
    inputs.current[0]?.focus();
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={Colors.textDark} />
      </TouchableOpacity>

      <View style={styles.content}>

        <Text style={styles.heading}>Verify your{'\n'}Number</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit code sent to{'\n'}
          <Text style={styles.phone}>+92 3XX XXXXXXX</Text>
        </Text>

        <View style={styles.otpRow}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref; }}
              style={[styles.otpBox, digit !== '' && styles.otpBoxFilled]}
              value={digit}
              onChangeText={(val) => handleChange(val, index)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace') handleBackspace(digit, index);
              }}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              autoFocus={index === 0}
            />
          ))}
        </View>

        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendActive}>Resend OTP</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>
              Resend code in{' '}
              <Text style={styles.timerText}>{formatTime(timer)}</Text>
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, !isComplete && styles.buttonDisabled]}
          onPress={() => router.replace('/home')}
          disabled={!isComplete}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Verify</Text>
          <Ionicons name="checkmark" size={20} color={Colors.white} />
        </TouchableOpacity>

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
    gap: 20,
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
    lineHeight: 24,
  },
  phone: {
    color: Colors.primary,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 8,
  },
  otpBox: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    backgroundColor: Colors.secondary,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textDark,
  },
  otpBoxFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#dbeafe',
  },
  resendRow: {
    alignItems: 'center',
  },
  resendTimer: {
    fontSize: 14,
    color: Colors.textGray,
  },
  timerText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  resendActive: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
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
});
