import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import SplashScreen from './screens/SplashScreen';
import Onboarding from './screens/Onboarding';
import Registration from './screens/Registration';
import SignIn from './screens/SignIn';
import ForgotPassword from './screens/ForgotPassword';
import SelectCategory from './screens/SelectCategory';
import CompleteSignUp from './screens/Completesignup';
import RegistrationSuccess from './screens/RegistrationSuccess';
import Dashboard from './screens/Dashboard';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
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
  );
}
