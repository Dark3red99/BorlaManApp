import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Sizes } from '../constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export default function GlassCard({ children, style }: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={30} tint="light" style={styles.blurWrapper}>
        <View style={styles.content}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Sizes.radius,
    overflow: 'hidden', // Required for BlurView radius
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  blurWrapper: {
    flex: 1,
  },
  content: {
    padding: Sizes.padding,
  }
});