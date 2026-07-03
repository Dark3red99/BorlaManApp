import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const PRIMARY = '#059669';
const BG      = '#F3F8F5';
const WHITE   = '#FFFFFF';
const TEXT    = '#0F172A';
const MUTED   = '#64748B';

const LABELS: Record<string, string> = {
  Dispose: 'Dispose',
  LearnEarn: 'Learn & Earn',
  Profile: 'Profile',
};

export default function ComingSoonScreen({ route }: any) {
  const label = LABELS[route?.name] ?? route?.name ?? '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Ionicons name="construct-outline" size={26} color={PRIMARY} />
        </View>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.text}>This section is coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
    color: TEXT,
    marginBottom: 6,
  },
  text: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: MUTED,
    textAlign: 'center',
  },
});
