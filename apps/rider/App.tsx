import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { ThemeProvider, useTheme } from '@borlaman/shared/theme/ThemeContext';
import { RiderProvider, useRider } from './context/RiderContext';
import type { RiderStackParamList } from './types/navigation';
import AuthScreen from './screens/AuthScreen';
import NotARiderScreen from './screens/NotARiderScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import PendingScreen from './screens/PendingScreen';
import HomeScreen from './screens/HomeScreen';
import JobScreen from './screens/JobScreen';

const Stack = createNativeStackNavigator<RiderStackParamList>();

// Which screens exist depends on where the account stands, so a rider can
// never reach the map before approval (the server enforces this too).
function Routes() {
  const { stage } = useRider();
  const { ui } = useTheme();

  if (stage === 'loading') {
    return (
      <View style={{ flex: 1, backgroundColor: ui.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={ui.accent} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{ ...DarkTheme, colors: { ...DarkTheme.colors, background: ui.bg, card: ui.surface, primary: ui.accent } }}
    >
      <Stack.Navigator id={undefined} screenOptions={{ headerShown: false, contentStyle: { backgroundColor: ui.bg } }}>
        {stage === 'signed-out' && <Stack.Screen name="Auth" component={AuthScreen} />}
        {stage === 'not-a-rider' && <Stack.Screen name="NotARider" component={NotARiderScreen} />}
        {stage === 'onboarding' && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
        {(stage === 'pending' || stage === 'blocked') && <Stack.Screen name="Pending" component={PendingScreen} />}
        {stage === 'approved' && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Job" component={JobScreen} />
          </>
        )}
      </Stack.Navigator>
      <StatusBar style="light" />
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: '#0D100F' }} />;

  return (
    <SafeAreaProvider>
      <ThemeProvider defaultMode="dark">
        <RiderProvider>
          <Routes />
        </RiderProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
