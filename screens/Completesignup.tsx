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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#2B5E2E';
const BORDER = '#5A9E5E';
const INPUT_BG = '#F3FAF3';
const WHITE = '#FFFFFF';
const PLACEHOLDER = '#85AD85';

export default function CompleteSignUp({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [gps, setGps] = useState('');

  const handleGPS = () => {
    // Hook into expo-location here
    Alert.alert('GPS', 'Fetching your location...');
  };

  const handleSubmit = () => {
    navigation?.replace('RegistrationSuccess', { name: 'Abena Dedei' });
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
          <Text style={styles.heading}>Complete your Sign Up</Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={PLACEHOLDER}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />
            </View>

            {/* Region */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Region"
                placeholderTextColor={PLACEHOLDER}
                value={region}
                onChangeText={setRegion}
                returnKeyType="next"
              />
            </View>

            {/* District */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="District"
                placeholderTextColor={PLACEHOLDER}
                value={district}
                onChangeText={setDistrict}
                returnKeyType="next"
              />
            </View>

            {/* Address / House No. */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Address /House No."
                placeholderTextColor={PLACEHOLDER}
                value={address}
                onChangeText={setAddress}
                returnKeyType="next"
              />
            </View>

            {/* Area / Neighborhood */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Area/Neighborhood"
                placeholderTextColor={PLACEHOLDER}
                value={area}
                onChangeText={setArea}
                returnKeyType="next"
              />
            </View>

            {/* GPS Location */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                placeholder="GPS location"
                placeholderTextColor={PLACEHOLDER}
                value={gps}
                onChangeText={setGps}
                returnKeyType="done"
                editable={false}
              />
              <TouchableOpacity
                style={styles.pinIcon}
                onPress={handleGPS}
                activeOpacity={0.7}
              >
                <Ionicons name="location" size={22} color={PLACEHOLDER} />
              </TouchableOpacity>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
    paddingBottom: 40,
  },

  // Heading
  heading: {
    fontSize: 28,
    fontWeight: '800',
    color: PRIMARY,
    textAlign: 'center',
    marginBottom: 32,
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
    color: PRIMARY,
    backgroundColor: INPUT_BG,
    fontWeight: '500',
  },
  inputWithIcon: {
    paddingRight: 52,
  },
  pinIcon: {
    position: 'absolute',
    right: 18,
    height: 58,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  // Submit button
  submitBtn: {
    height: 58,
    backgroundColor: PRIMARY,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  submitBtnText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});