import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';

import SplashScreen from './screens/SplashScreen';
import Onboarding from './screens/Onboarding';
import Registration from './screens/Registration';
import SignIn from './screens/SignIn';
import ForgotPassword from './screens/ForgotPassword';
import SelectCategory from './screens/SelectCategory';
import CompleteSignUp from './screens/Completesignup';
import RegistrationSuccess from './screens/RegistrationSuccess';
import Dashboard from './screens/Dashboard';
import { Colors } from './constants/theme';
import { AuthProvider } from './context/AuthContext';
import type { RootStackParamList } from './types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: Colors.primaryDark }} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator
            id={undefined}
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={Onboarding} />
            <Stack.Screen name="Registration" component={Registration} />
            <Stack.Screen name="SignIn" component={SignIn} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            <Stack.Screen name="SelectCategory" component={SelectCategory} />
            <Stack.Screen name="CompleteSignUp" component={CompleteSignUp} />
            <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccess} />
            <Stack.Screen name="Dashboard" component={Dashboard} />
          </Stack.Navigator>
          <StatusBar style="light" />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
