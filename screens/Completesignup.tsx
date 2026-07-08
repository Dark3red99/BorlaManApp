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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { AuthError } from '../services/authService';
import { validateEmail, validateRequired } from '../utils/validation';
import AuthHero from '../components/AuthHero';
import collectorsArt from '../assets/man-woman-pushing-bin.svg';

const PRIMARY = '#059669';
const PRIMARY_SOFT = '#ECFDF5';
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
const WIDE_BREAKPOINT = 768;

type Errors = Partial<Record<'email' | 'region' | 'district' | 'address' | 'area', string>>;

export default function CompleteSignUp({ navigation, route }: RootStackScreenProps<'CompleteSignUp'>) {
  const { draft, category } = route.params;
  const { register } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

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
    <SafeAreaView style={styles.safe} edges={['bottom', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_SOFT} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.shell, isWide && styles.shellWide]}>
          {/* Illustration header — top band on phones, left panel on wide screens */}
          <AuthHero wide={isWide} asset={collectorsArt} artWidth={240} artHeight={160} />

          <ScrollView
            style={styles.formPane}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.formColumn, isWide && styles.formColumnWide]}>
              {/* Heading */}
              <Text style={styles.heading}>Complete your Sign Up</Text>

              {/* Form */}
              <View style={styles.form}>
                {/* Email */}
                <View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithLeadingIcon, errors.email ? styles.inputError : null]}
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
                    <View style={styles.leadingIcon} pointerEvents="none">
                      <Ionicons name="mail-outline" size={20} color={PRIMARY} />
                    </View>
                  </View>
                  {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                </View>

                {/* Region */}
                <View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithLeadingIcon, errors.region ? styles.inputError : null]}
                      placeholder="Region"
                      placeholderTextColor={PLACEHOLDER}
                      value={region}
                      onChangeText={(v) => { setRegion(v); clearError('region'); }}
                      returnKeyType="next"
                    />
                    <View style={styles.leadingIcon} pointerEvents="none">
                      <Ionicons name="map-outline" size={20} color={PRIMARY} />
                    </View>
                  </View>
                  {errors.region && <Text style={styles.errorText}>{errors.region}</Text>}
                </View>

                {/* District */}
                <View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithLeadingIcon, errors.district ? styles.inputError : null]}
                      placeholder="District"
                      placeholderTextColor={PLACEHOLDER}
                      value={district}
                      onChangeText={(v) => { setDistrict(v); clearError('district'); }}
                      returnKeyType="next"
                    />
                    <View style={styles.leadingIcon} pointerEvents="none">
                      <Ionicons name="business-outline" size={20} color={PRIMARY} />
                    </View>
                  </View>
                  {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
                </View>

                {/* Address / House No. */}
                <View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithLeadingIcon, errors.address ? styles.inputError : null]}
                      placeholder="Address /House No."
                      placeholderTextColor={PLACEHOLDER}
                      value={address}
                      onChangeText={(v) => { setAddress(v); clearError('address'); }}
                      textContentType="fullStreetAddress"
                      autoComplete="street-address"
                      returnKeyType="next"
                    />
                    <View style={styles.leadingIcon} pointerEvents="none">
                      <Ionicons name="home-outline" size={20} color={PRIMARY} />
                    </View>
                  </View>
                  {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
                </View>

                {/* Area / Neighborhood */}
                <View>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.input, styles.inputWithLeadingIcon, errors.area ? styles.inputError : null]}
                      placeholder="Area/Neighborhood"
                      placeholderTextColor={PLACEHOLDER}
                      value={area}
                      onChangeText={(v) => { setArea(v); clearError('area'); }}
                      returnKeyType="next"
                    />
                    <View style={styles.leadingIcon} pointerEvents="none">
                      <Ionicons name="navigate-outline" size={20} color={PRIMARY} />
                    </View>
                  </View>
                  {errors.area && <Text style={styles.errorText}>{errors.area}</Text>}
                </View>

                {/* GPS Location */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.inputWithLeadingIcon, styles.inputWithIcon]}
                    placeholder="GPS location"
                    placeholderTextColor={PLACEHOLDER}
                    value={gps}
                    onChangeText={setGps}
                    returnKeyType="done"
                    editable={false}
                  />
                  <View style={styles.leadingIcon} pointerEvents="none">
                    <Ionicons name="locate-outline" size={20} color={PRIMARY} />
                  </View>
                  <TouchableOpacity
                    style={styles.pinIcon}
                    onPress={handleGPS}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Use current location"
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
            </View>
          </ScrollView>
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
  scroll: {
    flexGrow: 1,
  },
  formColumn: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  formColumnWide: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },

  // Heading
  heading: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 28,
    color: PRIMARY,
    textAlign: 'center',
    marginBottom: 28,
    marginTop: 20,
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
  inputWithLeadingIcon: {
    paddingLeft: 52,
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
  leadingIcon: {
    position: 'absolute',
    left: 20,
    height: 58,
    justifyContent: 'center',
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
