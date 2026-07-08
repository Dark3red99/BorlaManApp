import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { resetPassword, AuthError } from '../services/authService';
import { validatePassword } from '../utils/validation';
import AuthHero from '../components/AuthHero';
import WaveDivider from '../components/WaveDivider';
import sanitationArt from '../assets/girl-boy-sanitation.svg';

const PRIMARY = '#059669';
const PRIMARY_SOFT = '#ECFDF5';
const TEXT = '#0F172A';
const BORDER = '#D3E8DD';
const INPUT_BG = '#F4FAF7';
const WHITE = '#FFFFFF';
const PLACEHOLDER = '#93A8A0';
const GRAY = '#5B6B63';
const FONT_REGULAR = 'Poppins_400Regular';
const FONT_MEDIUM = 'Poppins_500Medium';
const FONT_BOLD = 'Poppins_700Bold';
const FONT_EXTRABOLD = 'Poppins_800ExtraBold';
const WIDE_BREAKPOINT = 768;

type Step = 'phone' | 'otp' | 'reset';

const OTP_LENGTH = 6;

export default function ForgotPassword({ navigation }: RootStackScreenProps<'ForgotPassword'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (step === 'otp') {
      startTimer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const startTimer = () => {
    setResendTimer(30);
    setCanResend(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const animateToNext = (nextStep: Step) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleSendOTP = () => {
    if (phone.trim().length < 9) return;
    // TODO: call your OTP send API here
    animateToNext('otp');
  };

  const handleOtpChange = (val: string, index: number) => {
    const digits = val.replace(/[^0-9]/g, '');
    const updated = [...otp];

    if (digits.length > 1) {
      // Handle paste
      const pasted = digits.slice(0, OTP_LENGTH).split('');
      const filled = [...Array(OTP_LENGTH)].map((_, i) => pasted[i] || '');
      setOtp(filled);
      const lastFilled = Math.min(pasted.length, OTP_LENGTH - 1);
      otpRefs.current[lastFilled]?.focus();
      return;
    }

    updated[index] = digits;
    setOtp(updated);
    if (digits && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      const updated = [...otp];
      updated[index - 1] = '';
      setOtp(updated);
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) return;
    // TODO: verify OTP with your API here
    animateToNext('reset');
  };

  const handleResetPassword = async () => {
    const pwError = validatePassword(newPassword);
    if (pwError) {
      Alert.alert('Weak Password', pwError);
      return;
    }
    if (newPassword !== confirmPassword) return;
    try {
      await resetPassword(phone, newPassword);
      Alert.alert('Password Reset', 'Your password has been updated. Sign in with your new password.', [
        { text: 'Sign In', onPress: () => navigation.navigate('SignIn') },
      ]);
    } catch (e) {
      Alert.alert(
        'Reset Failed',
        e instanceof AuthError ? e.message : 'Something went wrong. Please try again.',
      );
    }
  };

  const handleBack = () => {
    if (step === 'otp') animateToNext('phone');
    else if (step === 'reset') animateToNext('otp');
    else navigation?.goBack();
  };

  // Step indicator
  const stepIndex = step === 'phone' ? 0 : step === 'otp' ? 1 : 2;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_SOFT} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.shell, isWide && styles.shellWide]}>
          {/* Illustration header — top band on phones, left panel on wide screens */}
          <AuthHero wide={isWide} asset={sanitationArt} artWidth={230} artHeight={144} />

          <View style={styles.formPane}>
            {/* Step dots */}
            <View style={styles.stepDots}>
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={[styles.dot, i === stepIndex && styles.dotActive, i < stepIndex && styles.dotDone]}
                />
              ))}
            </View>

            <Animated.View
              style={[
                styles.content,
                isWide && styles.contentWide,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* ─── STEP 1: Phone ─── */}
              {step === 'phone' && (
                <View style={styles.stepBlock}>
                  <Text style={styles.heading}>Forgot Password?</Text>
                  <Text style={styles.subText}>
                    Enter your registered phone number and we'll send you a verification code.
                  </Text>

                  <View style={styles.form}>
                    <View style={styles.inputWrapper}>
                      <View style={styles.phonePrefix}>
                        <Text style={styles.phonePrefixText}>🇬🇭 +233</Text>
                      </View>
                      <TextInput
                        style={[styles.input, styles.inputPhoneField]}
                        placeholder="Phone number"
                        placeholderTextColor={PLACEHOLDER}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        returnKeyType="done"
                        maxLength={10}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.primaryBtn, phone.trim().length < 9 && styles.btnDisabled]}
                      onPress={handleSendOTP}
                      activeOpacity={0.85}
                      disabled={phone.trim().length < 9}
                    >
                      <Text style={styles.primaryBtnText}>Send OTP</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ─── STEP 2: OTP ─── */}
              {step === 'otp' && (
                <View style={styles.stepBlock}>
                  <Text style={styles.heading}>Enter OTP</Text>
                  <Text style={styles.subText}>
                    We sent a {OTP_LENGTH}-digit code to{' '}
                    <Text style={styles.phoneHighlight}>+233 {phone}</Text>
                  </Text>

                  <View style={styles.otpRow}>
                    {otp.map((digit, i) => (
                      <TextInput
                        key={i}
                        ref={(r) => { otpRefs.current[i] = r; }}
                        style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                        value={digit}
                        onChangeText={(v) => handleOtpChange(v, i)}
                        onKeyPress={(e) => handleOtpKeyPress(e, i)}
                        keyboardType="number-pad"
                        maxLength={1}
                        textAlign="center"
                        selectTextOnFocus
                      />
                    ))}
                  </View>

                  {/* Resend */}
                  <View style={styles.resendRow}>
                    {canResend ? (
                      <TouchableOpacity onPress={startTimer}>
                        <Text style={styles.resendActive}>Resend OTP</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.resendTimer}>
                        Resend in <Text style={styles.resendCountdown}>{resendTimer}s</Text>
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      otp.join('').length < OTP_LENGTH && styles.btnDisabled,
                    ]}
                    onPress={handleVerifyOTP}
                    activeOpacity={0.85}
                    disabled={otp.join('').length < OTP_LENGTH}
                  >
                    <Text style={styles.primaryBtnText}>Verify OTP</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* ─── STEP 3: Reset Password ─── */}
              {step === 'reset' && (
                <View style={styles.stepBlock}>
                  <Text style={styles.heading}>New Password</Text>
                  <Text style={styles.subText}>
                    Create a strong password you haven't used before.
                  </Text>

                  <View style={styles.form}>
                    {/* New Password */}
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[styles.input, styles.inputWithLeadingIcon, styles.inputWithIcon]}
                        placeholder="New password"
                        placeholderTextColor={PLACEHOLDER}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!showNew}
                        returnKeyType="next"
                      />
                      <View style={styles.leadingIcon} pointerEvents="none">
                        <Ionicons name="lock-closed-outline" size={20} color={PRIMARY} />
                      </View>
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowNew(!showNew)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={showNew ? 'Hide password' : 'Show password'}
                      >
                        <Ionicons
                          name={showNew ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color={PLACEHOLDER}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={[styles.input, styles.inputWithLeadingIcon, styles.inputWithIcon,
                          confirmPassword && newPassword !== confirmPassword
                            ? styles.inputError : null,
                        ]}
                        placeholder="Confirm password"
                        placeholderTextColor={PLACEHOLDER}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry={!showConfirm}
                        returnKeyType="done"
                      />
                      <View style={styles.leadingIcon} pointerEvents="none">
                        <Ionicons name="lock-closed-outline" size={20} color={PRIMARY} />
                      </View>
                      <TouchableOpacity
                        style={styles.eyeIcon}
                        onPress={() => setShowConfirm(!showConfirm)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={showConfirm ? 'Hide password' : 'Show password'}
                      >
                        <Ionicons
                          name={showConfirm ? 'eye-outline' : 'eye-off-outline'}
                          size={20}
                          color={PLACEHOLDER}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Mismatch warning */}
                    {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                      <Text style={styles.errorText}>Passwords do not match</Text>
                    )}

                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        (!newPassword || newPassword !== confirmPassword) && styles.btnDisabled,
                      ]}
                      onPress={handleResetPassword}
                      activeOpacity={0.85}
                      disabled={!newPassword || newPassword !== confirmPassword}
                    >
                      <Text style={styles.primaryBtnText}>Reset Password</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Animated.View>

            {/* Bottom sign in band */}
            <WaveDivider fill={PRIMARY_SOFT} />
            <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
              <Text style={styles.footerText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation?.navigate('SignIn')}>
                <Text style={styles.signInLink}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Back Button — floats over the illustration band */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 8 }]}
            onPress={handleBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={PRIMARY} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: WHITE,
  },
  shell: {
    flex: 1,
  },
  shellWide: {
    flexDirection: 'row',
  },
  formPane: {
    flex: 1,
  },

  // Back button
  backBtn: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },

  // Step dots
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BORDER,
  },
  dotActive: {
    width: 24,
    backgroundColor: PRIMARY,
    borderRadius: 4,
  },
  dotDone: {
    backgroundColor: BORDER,
  },

  // Animated content
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
  },
  contentWide: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },

  // Step block
  stepBlock: {
    flex: 1,
  },
  heading: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 28,
    color: PRIMARY,
    marginTop: 20,
    marginBottom: 10,
  },
  subText: {
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    color: GRAY,
    lineHeight: 21,
    marginBottom: 28,
  },
  phoneHighlight: {
    fontFamily: FONT_BOLD,
    color: PRIMARY,
  },

  // Form
  form: {
    gap: 14,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Phone input with prefix
  phonePrefix: {
    height: 58,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    borderRightWidth: 0,
    backgroundColor: INPUT_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontFamily: FONT_BOLD,
    fontSize: 14,
    color: PRIMARY,
  },
  inputPhoneField: {
    flex: 1,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },

  // Standard input
  input: {
    flex: 1,
    height: 58,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 30,
    paddingHorizontal: 22,
    fontSize: 15,
    color: TEXT,
    backgroundColor: INPUT_BG,
    fontFamily: FONT_MEDIUM,
  },
  inputWithLeadingIcon: {
    paddingLeft: 52,
  },
  inputWithIcon: {
    paddingRight: 50,
  },
  inputError: {
    borderColor: '#E53935',
  },
  leadingIcon: {
    position: 'absolute',
    left: 20,
    height: 58,
    justifyContent: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 18,
    height: 58,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    marginLeft: 12,
    marginTop: -6,
  },

  // OTP boxes
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  otpBox: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    backgroundColor: INPUT_BG,
    fontFamily: FONT_BOLD,
    fontSize: 22,
    color: TEXT,
    textAlign: 'center',
  },
  otpBoxFilled: {
    backgroundColor: '#D1FAE5',
    borderColor: PRIMARY,
  },

  // Resend
  resendRow: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resendTimer: {
    fontFamily: FONT_REGULAR,
    fontSize: 13,
    color: GRAY,
  },
  resendCountdown: {
    fontFamily: FONT_BOLD,
    color: PRIMARY,
  },
  resendActive: {
    fontFamily: FONT_BOLD,
    fontSize: 13,
    color: PRIMARY,
    textDecorationLine: 'underline',
  },

  // Primary button
  primaryBtn: {
    height: 58,
    backgroundColor: PRIMARY,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    fontFamily: FONT_BOLD,
    color: WHITE,
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PRIMARY_SOFT,
    paddingTop: 10,
  },
  footerText: {
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    color: '#5B6B63',
  },
  signInLink: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 14,
    color: PRIMARY,
  },
});
