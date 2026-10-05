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
