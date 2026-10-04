import type { WasteType } from '../types/models';

// Display metadata + pricing multiplier per waste type. The multiplier feeds
// the quote formula in services/pickupService.ts and will move to the backend
// pricing table unchanged.

export type WasteTypeMeta = {
  type: WasteType;
  label: string;
  description: string;
  icon: string; // MaterialCommunityIcons name
  color: string;
  colorSoft: string;
  multiplier: number;
};

export const WASTE_TYPES: WasteTypeMeta[] = [
  {
    type: 'household',
    label: 'Household',
    description: 'General home waste, bagged',
    icon: 'home-variant-outline',
    color: '#059669',
    colorSoft: '#D1FAE5',
    multiplier: 1.0,
  },
  {
    type: 'recyclables',
    label: 'Recyclables',
    description: 'Plastics, cans, paper — sorted',
    icon: 'recycle',
    color: '#3B82F6',
    colorSoft: '#DBEAFE',
    multiplier: 0.8,
  },
  {
    type: 'organic',
    label: 'Organic',
    description: 'Food & garden waste',
    icon: 'leaf',
    color: '#84CC16',
    colorSoft: '#ECFCCB',
    multiplier: 0.9,
  },
  {
    type: 'ewaste',
    label: 'E-Waste',
    description: 'Electronics, batteries, cables',
    icon: 'battery-alert-variant-outline',
    color: '#F59E0B',
    colorSoft: '#FEF3C7',
    multiplier: 1.5,
  },
  {
    type: 'mixed',
    label: 'Mixed',
    description: 'Unsorted or bulky waste',
    icon: 'trash-can-outline',
    color: '#64748B',
    colorSoft: '#E2E8F0',
    multiplier: 1.2,
  },
];

export const wasteMeta = (type: WasteType): WasteTypeMeta =>
  WASTE_TYPES.find((w) => w.type === type) ?? WASTE_TYPES[0];

// Load sizes, described the way people actually measure waste (bags and
// wheelie bins) and priced per load — anchored to Accra market rates (Jumeni,
// 2026: GH₵40–50 on-demand / GH₵30 weekly for a 240L bin, GH₵150 for 1100L).
// `kg` is the stored key (CollectionRequest.volumeKg) and a rough weight
// estimate for impact points; it never drives price.
export type SizeBand = {
  kg: number;
  label: string;
  /** What fits, e.g. "240L bin · 5–6 bags". */
  hint: string;
  /** Short container name for lists, e.g. "240L bin". */
  short: string;
  /** One-off pickup price before the waste-type multiplier. */
  onDemandGhs: number;
  /** Per-pickup price on a recurring plan before the multiplier. */
  planGhs: number;
};

export const SIZE_BANDS: SizeBand[] = [
  { kg: 10, label: 'Small', hint: '1–2 bags', short: '1–2 bags', onDemandGhs: 20, planGhs: 15 },
  { kg: 25, label: 'Medium', hint: '120L bin · 3–4 bags', short: '120L bin', onDemandGhs: 30, planGhs: 22 },
  { kg: 50, label: 'Large', hint: '240L bin · 5–6 bags', short: '240L bin', onDemandGhs: 40, planGhs: 30 },
  { kg: 80, label: 'Bulky', hint: 'Bulky load · up to 1100L', short: 'Bulky load', onDemandGhs: 140, planGhs: 110 },
];

export const sizeBand = (kg: number): SizeBand =>
  SIZE_BANDS.find((b) => b.kg === kg) ?? SIZE_BANDS[SIZE_BANDS.length - 1];
