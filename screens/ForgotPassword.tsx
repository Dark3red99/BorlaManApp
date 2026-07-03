import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#059669';
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

type Step = 'phone' | 'otp' | 'reset';

const OTP_LENGTH = 6;

export default function ForgotPassword({ navigation }: any) {
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

  const handleResetPassword = () => {
    if (!newPassword || newPassword !== confirmPassword) return;
    // TODO: call your reset password API here
    navigation?.navigate('SignIn');
  };

  const handleBack = () => {
    if (step === 'otp') animateToNext('phone');
    else if (step === 'reset') animateToNext('otp');
    else navigation?.goBack();
  };

  // Step indicator
  const stepIndex = step === 'phone' ? 0 : step === 'otp' ? 1 : 2;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={PRIMARY} />
        </TouchableOpacity>

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
                    style={[styles.input, styles.inputWithIcon]}
                    placeholder="New password"
                    placeholderTextColor={PLACEHOLDER}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNew}
                    returnKeyType="next"
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowNew(!showNew)}
                    activeOpacity={0.7}
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
                    style={[styles.input, styles.inputWithIcon,
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
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirm(!showConfirm)}
                    activeOpacity={0.7}
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

        {/* Bottom sign in link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Remember your password? </Text>
          <TouchableOpacity onPress={() => navigation?.navigate('SignIn')}>
            <Text style={styles.signInLink}>Sign In</Text>
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

  // Back button
  backBtn: {
    marginTop: 8,
    marginLeft: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: INPUT_BG,
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

  // Step block
  stepBlock: {
    flex: 1,
  },
  heading: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 28,
    color: TEXT,
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
  inputWithIcon: {
    paddingRight: 50,
  },
  inputError: {
    borderColor: '#E53935',
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
    paddingBottom: 36,
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