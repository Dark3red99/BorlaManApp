import type { WasteType } from '@borlaman/shared/types/models';
import { sizeBand, wasteMeta } from './waste';

// Customer pricing — one place, shared by the quote service, the wizard's
// live price and the recurring-plan summary. Flat across Accra for now
// (Jumeni-style zones can scale sizeGhs later); distance never shows up in
// the customer price, dispatch absorbs it.

/** Added to on-demand pickups that want the next free collector now. */
export const PRIORITY_FEE_GHS = 5;

export type PriceParts = {
  sizeGhs: number; // load-size price after the waste-type multiplier
  typeMultiplier: number;
  priorityGhs: number;
  totalGhs: number;
};

/** Price of a one-off pickup. Whole cedis so cash change is easy. */
export function pickupPrice(volumeKg: number, wasteType: WasteType, asap: boolean): PriceParts {
  const typeMultiplier = wasteMeta(wasteType).multiplier;
  const sizeGhs = Math.round(sizeBand(volumeKg).onDemandGhs * typeMultiplier);
  const priorityGhs = asap ? PRIORITY_FEE_GHS : 0;
  return { sizeGhs, typeMultiplier, priorityGhs, totalGhs: sizeGhs + priorityGhs };
}

/** Per-pickup price on a recurring plan. */
export function planPrice(volumeKg: number, wasteType: WasteType): number {
  return Math.round(sizeBand(volumeKg).planGhs * wasteMeta(wasteType).multiplier);
}

export type PlanFrequency = 'weekly' | 'biweekly';

/** Rough monthly spend for a plan: pickups/month × per-pickup price. */
export function planMonthlyEstimate(perPickupGhs: number, daysPerWeek: number, frequency: PlanFrequency): number {
  const pickupsPerMonth = daysPerWeek * (frequency === 'weekly' ? 4.33 : 2.17);
  return Math.round(perPickupGhs * pickupsPerMonth);
}
