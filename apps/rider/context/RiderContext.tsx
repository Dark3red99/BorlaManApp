import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase';
import * as riderService from '../services/riderService';
import type { Profile, RiderRow } from '../services/riderService';

// Who is signed in and where their rider account stands. App.tsx picks the
// screens from `stage`: sign in → details/documents → waiting for approval →
// working (map + jobs).

export type Stage = 'loading' | 'signed-out' | 'not-a-rider' | 'onboarding' | 'pending' | 'blocked' | 'approved';

type RiderContextValue = {
  stage: Stage;
  profile: Profile | null;
  rider: RiderRow | null;
  refresh: () => Promise<void>;
  setRider: (rider: RiderRow) => void;
  signOut: () => Promise<void>;
};

const RiderContext = createContext<RiderContextValue | undefined>(undefined);

// DEV ONLY shortcut: with EXPO_PUBLIC_DEV_RIDER_EMAIL/PASSWORD in .env.local,
// the app signs in as an already-approved test rider so development can
// skip sign-in, details and verification photos. `__DEV__` is false in
// release builds, so this never ships.
const DEV_RIDER_EMAIL = process.env.EXPO_PUBLIC_DEV_RIDER_EMAIL;
const DEV_RIDER_PASSWORD = process.env.EXPO_PUBLIC_DEV_RIDER_PASSWORD;
let devSignInTried = false;

async function signInDevRiderIfConfigured() {
  if (!__DEV__ || devSignInTried || !DEV_RIDER_EMAIL || !DEV_RIDER_PASSWORD) return;
  devSignInTried = true; // once per launch, so "Sign out" still shows the real screens
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  await riderService.signIn(DEV_RIDER_EMAIL, DEV_RIDER_PASSWORD).catch(() => {});
}

function stageFor(me: Awaited<ReturnType<typeof riderService.loadMe>>): Stage {
  if (!me) return 'signed-out';
  if (!me.rider) return 'not-a-rider';
  if (me.rider.status === 'approved') return 'approved';
  if (me.rider.status === 'suspended' || me.rider.status === 'rejected') return 'blocked';
  // Details not filled in yet → onboarding; otherwise waiting for review.
  return me.rider.vehicle_plate ? 'pending' : 'onboarding';
}

export function RiderProvider({ children }: { children: React.ReactNode }) {
  const [stage, setStage] = useState<Stage>('loading');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [rider, setRiderState] = useState<RiderRow | null>(null);

  const refresh = useCallback(async () => {
    try {
      await signInDevRiderIfConfigured();
      const me = await riderService.loadMe();
      setProfile(me?.profile ?? null);
      setRiderState(me?.rider ?? null);
      setStage(stageFor(me));
    } catch {
      setStage('signed-out');
    }
  }, []);

  useEffect(() => {
    refresh();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [refresh]);

  const value = useMemo<RiderContextValue>(
    () => ({
      stage,
      profile,
      rider,
      refresh,
      setRider: setRiderState,
      signOut: async () => {
        if (rider?.is_online) await riderService.setOnline(false).catch(() => {});
        await riderService.signOut();
      },
    }),
    [stage, profile, rider, refresh],
  );

  return <RiderContext.Provider value={value}>{children}</RiderContext.Provider>;
}

export function useRider(): RiderContextValue {
  const ctx = useContext(RiderContext);
  if (!ctx) throw new Error('useRider must be used within a RiderProvider');
  return ctx;
}
