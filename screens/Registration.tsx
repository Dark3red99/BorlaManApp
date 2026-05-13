import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, G, ClipPath, Defs, Rect } from 'react-native-svg';

const PRIMARY = '#2B5E2E';
const BORDER = '#5A9E5E';
const INPUT_BG = '#F3FAF3';
const GOOGLE_BTN_BG = '#E6F2E6';
const WHITE = '#FFFFFF';
const PLACEHOLDER = '#85AD85';

export default function Registration({ navigation }: any) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleContinue = () => {
    navigation.navigate('SelectCategory');
  };

  const handleGoogleSignIn = () => {
    // Handle Google sign-in logic here
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
          {/* Logo + Brand */}
          <View style={styles.brandRow}>
            <Ionicons name="trash-outline" size={52} color={PRIMARY} />
            <Text style={styles.brandName}>BorlaMan</Text>
          </View>

          {/* Heading */}
          <Text style={styles.heading}>Create your account</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor={PLACEHOLDER}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Phone Number */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={PLACEHOLDER}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Password"
                placeholderTextColor={PLACEHOLDER}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
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

            {/* Confirm Password */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="Confirm Password"
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
            <TouchableOpacity onPress={() => navigation?.navigate('SignIn')}>
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

  // Brand
  brandRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    color: PRIMARY,
    marginTop: 6,
    letterSpacing: 0.3,
  },

  // Heading
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: PRIMARY,
    textAlign: 'center',
    marginBottom: 36,
    marginTop: 4,
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
    color: PRIMARY,
    backgroundColor: INPUT_BG,
    fontWeight: '500',
  },
  inputWithIcon: {
    paddingRight: 50,
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
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: '#C8DEC8',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#7A9E7A',
    fontSize: 14,
    fontWeight: '500',
  },

  // Google button
  googleBtn: {
    height: 58,
    backgroundColor: GOOGLE_BTN_BG,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#C5DCC5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: PRIMARY,
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
    fontSize: 14,
    color: '#555',
    fontWeight: '400',
  },
  signinLink: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '800',
  },
});