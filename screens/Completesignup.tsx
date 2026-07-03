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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthError } from '../services/authService';
import { validateEmail, validateRequired } from '../utils/validation';

const PRIMARY = '#059669';
const TEXT = '#0F172A';
const BORDER = '#D3E8DD';
const ERROR = '#E53935';
const INPUT_BG = '#F4FAF7';
const WHITE = '#FFFFFF';
const PLACEHOLDER = '#93A8A0';
const FONT_REGULAR = 'Poppins_400Regular';
const FONT_MEDIUM = 'Poppins_500Medium';
const FONT_BOLD = 'Poppins_700Bold';
const FONT_EXTRABOLD = 'Poppins_800ExtraBold';

type Errors = Partial<Record<'email' | 'region' | 'district' | 'address' | 'area', string>>;

export default function CompleteSignUp({ navigation, route }: RootStackScreenProps<'CompleteSignUp'>) {
  const { draft, category } = route.params;
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [gps, setGps] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleGPS = () => {
    // Hook into expo-location here (Phase 2, with the map picker)
    Alert.alert('GPS', 'GPS capture is coming with the map in the next phase.');
  };

  const clearError = (field: keyof Errors) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const handleSubmit = async () => {
    const next: Errors = {
      email: validateEmail(email) ?? undefined,
      region: validateRequired(region, 'region') ?? undefined,
      district: validateRequired(district, 'district') ?? undefined,
      address: validateRequired(address, 'address') ?? undefined,
      area: validateRequired(area, 'area or neighborhood') ?? undefined,
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    try {
      const user = await register({
        fullName: draft.fullName,
        phone: draft.phone,
        password: draft.password,
        email,
        category,
        address: {
          region: region.trim(),
          district: district.trim(),
          addressLine: address.trim(),
          area: area.trim(),
          gpsText: gps || undefined,
        },
      });
      // Reset so the signup screens (with the stale draft) can't be reached via back.
      navigation.reset({
        index: 0,
        routes: [{ name: 'RegistrationSuccess', params: { name: user.fullName } }],
      });
    } catch (e) {
      if (e instanceof AuthError && e.code === 'email-taken') {
        setErrors((prev) => ({ ...prev, email: e.message }));
      } else if (e instanceof AuthError) {
        Alert.alert('Sign Up Failed', e.message, [
          { text: 'Sign In Instead', onPress: () => navigation.navigate('SignIn') },
          { text: 'OK' },
        ]);
      } else {
        Alert.alert('Sign Up Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
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
            <View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.email ? styles.inputError : null]}
                  placeholder="Email address"
                  placeholderTextColor={PLACEHOLDER}
                  value={email}
                  onChangeText={(v) => { setEmail(v); clearError('email'); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                  autoComplete="email"
                  returnKeyType="next"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Region */}
            <View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.region ? styles.inputError : null]}
                  placeholder="Region"
                  placeholderTextColor={PLACEHOLDER}
                  value={region}
                  onChangeText={(v) => { setRegion(v); clearError('region'); }}
                  returnKeyType="next"
                />
              </View>
              {errors.region && <Text style={styles.errorText}>{errors.region}</Text>}
            </View>

            {/* District */}
            <View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.district ? styles.inputError : null]}
                  placeholder="District"
                  placeholderTextColor={PLACEHOLDER}
                  value={district}
                  onChangeText={(v) => { setDistrict(v); clearError('district'); }}
                  returnKeyType="next"
                />
              </View>
              {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
            </View>

            {/* Address / House No. */}
            <View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.address ? styles.inputError : null]}
                  placeholder="Address /House No."
                  placeholderTextColor={PLACEHOLDER}
                  value={address}
                  onChangeText={(v) => { setAddress(v); clearError('address'); }}
                  textContentType="fullStreetAddress"
                  autoComplete="street-address"
                  returnKeyType="next"
                />
              </View>
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            {/* Area / Neighborhood */}
            <View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, errors.area ? styles.inputError : null]}
                  placeholder="Area/Neighborhood"
                  placeholderTextColor={PLACEHOLDER}
                  value={area}
                  onChangeText={(v) => { setArea(v); clearError('area'); }}
                  returnKeyType="next"
                />
              </View>
              {errors.area && <Text style={styles.errorText}>{errors.area}</Text>}
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
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <Text style={styles.submitBtnText}>Submit</Text>
              )}
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
    fontFamily: FONT_EXTRABOLD,
    fontSize: 28,
    color: TEXT,
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
    color: TEXT,
    backgroundColor: INPUT_BG,
    fontFamily: FONT_MEDIUM,
  },
  inputWithIcon: {
    paddingRight: 52,
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
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitBtnText: {
    fontFamily: FONT_BOLD,
    color: WHITE,
    fontSize: 16,
    letterSpacing: 0.3,
  },
});