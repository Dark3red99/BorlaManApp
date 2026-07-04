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
