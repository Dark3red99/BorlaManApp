import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { UserCategory } from './models';

// Fields collected on the Registration screen, carried through
// SelectCategory → CompleteSignUp until the account is created.
export type SignupDraft = {
  fullName: string;
  phone: string;
  password: string;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Registration: undefined;
  SignIn: undefined;
  ForgotPassword: undefined;
  SelectCategory: { draft: SignupDraft };
  CompleteSignUp: { draft: SignupDraft; category: UserCategory };
  RegistrationSuccess: { name: string };
  Dashboard: undefined;
  RequestPickup: undefined;
  TrackPickup: { requestId: string };
  PickupComplete: { requestId: string };
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
