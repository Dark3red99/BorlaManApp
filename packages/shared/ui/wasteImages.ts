import type { ImageSourcePropType } from 'react-native';
import type { WasteType } from '@borlaman/shared/types/models';

/**
 * Photo per waste type for the selection cards. Types without a photo yet
 * fall back to their lucide icon on a tinted tile (see WasteTypeCard).
 * Photos are square, ~640px JPEGs in assets/waste/.
 */
export const WASTE_IMAGES: Partial<Record<WasteType, ImageSourcePropType>> = {
  household: require('../assets/waste/household.jpg'),
  recyclables: require('../assets/waste/recyclables.jpg'),
  organic: require('../assets/waste/organic.jpg'),
  ewaste: require('../assets/waste/ewaste.jpg'),
  mixed: require('../assets/waste/mixed.jpg'),
};
