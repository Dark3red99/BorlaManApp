import { BatteryCharging, House, Leaf, Recycle, Trash2, type LucideIcon } from 'lucide-react-native';
import type { WasteType } from '../../types/models';

/** Thin-line icon per waste type, matching the lucide family used across the UI kit. */
export const WASTE_ICONS: Record<WasteType, LucideIcon> = {
  household: House,
  recyclables: Recycle,
  organic: Leaf,
  ewaste: BatteryCharging,
  mixed: Trash2,
};

export const wasteIcon = (type: WasteType): LucideIcon => WASTE_ICONS[type] ?? Trash2;
