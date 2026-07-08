import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Wave in a 380x40 box; the filled region is the surface the wave flows into,
// so pass the color of the band *below* (or, when vertical, to the right).
const HORIZONTAL_PATH = 'M0 22 C 70 2, 130 40, 200 22 S 320 2, 380 20 L380 40 L0 40 Z';
// Same wave transposed into a 40x380 box, filling toward the right edge.
const VERTICAL_PATH = 'M22 0 C 2 70, 40 130, 22 200 S 2 320, 20 380 L40 380 L40 0 Z';

interface WaveDividerProps {
  /** Color of the surface the wave flows into. */
  fill: string;
  orientation?: 'horizontal' | 'vertical';
  /** Height (horizontal) or width (vertical) of the wave strip. */
  thickness?: number;
  style?: StyleProp<ViewStyle>;
}

export default function WaveDivider({
  fill,
  orientation = 'horizontal',
  thickness = 40,
  style,
}: WaveDividerProps) {
  const horizontal = orientation === 'horizontal';
  return (
    <Svg
      width={horizontal ? '100%' : thickness}
      height={horizontal ? thickness : '100%'}
      viewBox={horizontal ? '0 0 380 40' : '0 0 40 380'}
      preserveAspectRatio="none"
      style={style}
    >
      <Path d={horizontal ? HORIZONTAL_PATH : VERTICAL_PATH} fill={fill} />
    </Svg>
  );
}
