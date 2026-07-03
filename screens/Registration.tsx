import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, G, ClipPath, Defs, Rect } from 'react-native-svg';
import type { RootStackScreenProps } from '../types/navigation';
import {
  validateFullName,
  validatePhone,
  validatePassword,
  validateConfirmPassword,
} from '../utils/validation';

const PRIMARY = '#059669';
const TEXT = '#0F172A';
const BORDER = '#D3E8DD';
const ERROR = '#E53935';
const INPUT_BG = '#F4FAF7';
const GOOGLE_BTN_BG = '#F1F5F3';
const GOOGLE_TEXT = '#3C4A43';
const WHITE = '#FFFFFF';
const PLACEHOLDER = '#93A8A0';
const FONT_REGULAR = 'Poppins_400Regular';
const FONT_MEDIUM = 'Poppins_500Medium';
const FONT_SEMIBOLD = 'Poppins_600SemiBold';
const FONT_BOLD = 'Poppins_700Bold';
const FONT_EXTRABOLD = 'Poppins_800ExtraBold';

type Errors = Partial<Record<'fullName' | 'phone' | 'password' | 'confirmPassword', string>>;

export default function Registration({ navigation }: RootStackScreenProps<'Registration'>) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const handleContinue = () => {
    const next: Errors = {
      fullName: validateFullName(fullName) ?? undefined,
      phone: validatePhone(phone) ?? undefined,
      password: validatePassword(password) ?? undefined,
      confirmPassword: validateConfirmPassword(password, confirmPassword) ?? undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    navigation.navigate('SelectCategory', {
      draft: { fullName: fullName.trim(), phone: phone.trim(), password },
    });
  };

  const clearError = (field: keyof Errors) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const handleGoogleSignIn = () => {
    Alert.alert('Google Sign-In', 'Google sign-in will be available once the backend is connected.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <Text style={styles.heading}>Create your account</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.fullName ? styles.inputError : null]}
                  placeholder="Full name"
                  placeholderTextColor={PLACEHOLDER}
                  value={fullName}
                  onChangeText={(v) => { setFullName(v); clearError('fullName'); }}
                  autoCapitalize="words"
                  textContentType="name"
                  autoComplete="name"
                  returnKeyType="next"
                />
              </View>
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>

            {/* Phone Number */}
            <View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.phone ? styles.inputError : null]}
                  placeholder="Phone Number"
                  placeholderTextColor={PLACEHOLDER}
                  value={phone}
                  onChangeText={(v) => { setPhone(v); clearError('phone'); }}
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  returnKeyType="next"
                />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Password */}
            <View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.inputWithIcon, errors.password ? styles.inputError : null]}
                  placeholder="Password"
                  placeholderTextColor={PLACEHOLDER}
                  value={password}
                  onChangeText={(v) => { setPassword(v); clearError('password'); }}
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="next"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={PLACEHOLDER}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Confirm Password */}
            <View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.inputWithIcon, errors.confirmPassword ? styles.inputError : null]}
                  placeholder="Confirm Password"
                  placeholderTextColor={PLACEHOLDER}
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); clearError('confirmPassword'); }}
                  secureTextEntry={!showConfirm}
                  textContentType="newPassword"
                  autoComplete="new-password"
                  returnKeyType="done"
                  onSubmitEditing={handleContinue}
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
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>

            {/* Continue Button */}
            <TouchableOpacity
              style={styles.continueBtn}
              onPress={handleContinue}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Button */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={handleGoogleSignIn}
              activeOpacity={0.85}
            >
              <GoogleIcon />
              <Text style={styles.googleBtnText}>Continue with google</Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.signinRow}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={styles.signinLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Pixel-perfect Google "G" logo — official brand colors via SVG
function GoogleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Defs>
        <ClipPath id="googleClip">
          <Rect width={24} height={24} rx={12} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#googleClip)">
        {/* White background */}
        <Rect width={24} height={24} rx={12} fill="#fff" />
        {/* Blue — right side of G */}
        <Path
          d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.642h6.458a5.52 5.52 0 0 1-2.394 3.622v3.01h3.878c2.269-2.088 3.578-5.165 3.578-8.82z"
          fill="#4285F4"
        />
        {/* Green — bottom */}
        <Path
          d="M12 24c3.24 0 5.956-1.075 7.942-2.908l-3.878-3.01c-1.075.72-2.449 1.146-4.064 1.146-3.124 0-5.77-2.11-6.715-4.947H1.276v3.11A11.995 11.995 0 0 0 12 24z"
          fill="#34A853"
        />
        {/* Yellow — bottom left */}
        <Path
          d="M5.285 14.281A7.223 7.223 0 0 1 4.909 12c0-.79.136-1.56.376-2.281V6.609H1.276A11.995 11.995 0 0 0 0 12c0 1.936.464 3.765 1.276 5.391l4.009-3.11z"
          fill="#FBBC05"
        />
        {/* Red — top left */}
        <Path
          d="M12 4.773c1.762 0 3.344.605 4.588 1.794l3.442-3.442C17.951 1.19 15.235 0 12 0A11.995 11.995 0 0 0 1.276 6.609l4.009 3.11C6.23 6.883 8.876 4.773 12 4.773z"
          fill="#EA4335"
        />
      </G>
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: WHITE,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 48,
    paddingBottom: 32,
  },

  // Heading
  heading: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 28,
    color: TEXT,
    textAlign: 'center',
    marginBottom: 36,
    marginTop: 24,
    lineHeight: 36,
  },

  // Form
  form: {
    gap: 14,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
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
    borderColor: ERROR,
  },
  errorText: {
    fontFamily: FONT_REGULAR,
    color: ERROR,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 14,
  },
  eyeIcon: {
    position: 'absolute',
    right: 18,
    height: 58,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  // Continue button
  continueBtn: {
    height: 58,
    backgroundColor: PRIMARY,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  continueBtnText: {
    fontFamily: FONT_BOLD,
    color: WHITE,
    fontSize: 16,
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E1EDE6',
  },
  dividerText: {
    fontFamily: FONT_MEDIUM,
    marginHorizontal: 12,
    color: PLACEHOLDER,
    fontSize: 14,
  },

  // Google button
  googleBtn: {
    height: 58,
    backgroundColor: GOOGLE_BTN_BG,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E2EAE6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleBtnText: {
    fontFamily: FONT_SEMIBOLD,
    fontSize: 15,
    color: GOOGLE_TEXT,
    letterSpacing: 0.2,
  },

  // Sign in
  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  signinText: {
    fontFamily: FONT_REGULAR,
    fontSize: 14,
    color: '#5B6B63',
  },
  signinLink: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 14,
    color: PRIMARY,
  },
});
