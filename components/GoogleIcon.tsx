import React from 'react';
import Svg, { Path, G, ClipPath, Defs, Rect } from 'react-native-svg';

// Pixel-perfect Google "G" logo — official brand colors via SVG
export default function GoogleIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Defs>
        <ClipPath id="googleClip">
          <Rect width={24} height={24} rx={12} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#googleClip)">
        {/* White background */}
        <Rect width={24} height={24} rx={12} fill="#fff" />
        {/* Blue — right side of G */}
        <Path
          d="M23.52 12.273c0-.851-.076-1.67-.218-2.455H12v4.642h6.458a5.52 5.52 0 0 1-2.394 3.622v3.01h3.878c2.269-2.088 3.578-5.165 3.578-8.82z"
          fill="#4285F4"
        />
        {/* Green — bottom */}
        <Path
          d="M12 24c3.24 0 5.956-1.075 7.942-2.908l-3.878-3.01c-1.075.72-2.449 1.146-4.064 1.146-3.124 0-5.77-2.11-6.715-4.947H1.276v3.11A11.995 11.995 0 0 0 12 24z"
          fill="#34A853"
        />
        {/* Yellow — bottom left */}
        <Path
          d="M5.285 14.281A7.223 7.223 0 0 1 4.909 12c0-.79.136-1.56.376-2.281V6.609H1.276A11.995 11.995 0 0 0 0 12c0 1.936.464 3.765 1.276 5.391l4.009-3.11z"
          fill="#FBBC05"
        />
        {/* Red — top left */}
        <Path
          d="M12 4.773c1.762 0 3.344.605 4.588 1.794l3.442-3.442C17.951 1.19 15.235 0 12 0A11.995 11.995 0 0 0 1.276 6.609l4.009 3.11C6.23 6.883 8.876 4.773 12 4.773z"
          fill="#EA4335"
        />
      </G>
    </Svg>
  );
}
