import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RiderStackParamList = {
  Auth: undefined;
  NotARider: undefined;
  Onboarding: undefined;
  Pending: undefined;
  Home: undefined;
  Job: { jobId: string };
};

export type RiderScreenProps<T extends keyof RiderStackParamList> =
  NativeStackScreenProps<RiderStackParamList, T>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RiderStackParamList {}
  }
}
