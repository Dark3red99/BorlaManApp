import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Truck, MapPin, Award, ChevronRight } from 'lucide-react-native';
import GlassCard from '../components/GlassCard';
import { Colors, Sizes } from '../constants/theme';

export default function Onboarding({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>Recycling made simple.</Text>
      </View>

      <View style={styles.featureList}>
        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <Truck color={Colors.primary} size={30} />
            <View style={styles.textCol}>
              <Text style={styles.cardTitle}>Schedule Pickups</Text>
              <Text style={styles.cardSub}>Request a collection in just 3 taps.</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <MapPin color={Colors.primary} size={30} />
            <View style={styles.textCol}>
              <Text style={styles.cardTitle}>Live Tracking</Text>
              <Text style={styles.cardSub}>Watch your collector arrive in real-time.</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <Award color={Colors.primary} size={30} />
            <View style={styles.textCol}>
              <Text style={styles.cardTitle}>Earn Rewards</Text>
              <Text style={styles.cardSub}>Get points for every gram recycled.</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      <TouchableOpacity 
        style={styles.btn} 
        onPress={() => navigation.navigate('SelectCategory')}
      >
        <Text style={styles.btnText}>Let's Start</Text>
        <ChevronRight color="#FFF" size={20} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
  header: { marginTop: 60, marginBottom: 40 },
  mainTitle: { fontSize: 32, fontWeight: '800', color: Colors.primary, width: '70%' },
  featureList: { gap: 16 },
  card: { width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center' },
  textCol: { marginLeft: 15, flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  cardSub: { fontSize: 14, color: Colors.textLight, marginTop: 4 },
  btn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20
  },
  btnText: { color: '#FFF', fontSize: 18, fontWeight: '700', marginRight: 8 }
});