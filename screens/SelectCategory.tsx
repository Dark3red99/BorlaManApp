import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const PRIMARY = '#059669';
const TEXT = '#0F172A';
const WHITE = '#FFFFFF';
const CARD_DEFAULT_BG = '#FAFCFB';
const CARD_SELECTED_BG = '#ECFDF5';
const CARD_SELECTED_BORDER = '#059669';
const CARD_DEFAULT_BORDER = '#E7EFEA';
const FONT_MEDIUM = 'Poppins_500Medium';
const FONT_BOLD = 'Poppins_700Bold';
const FONT_EXTRABOLD = 'Poppins_800ExtraBold';

type Category = {
  id: string;
  label: string;
  description: string;
  iconBg: string;
  icon: React.ReactNode;
};

const CATEGORIES: Category[] = [
  {
    id: 'household',
    label: 'HouseHold',
    description: 'Bottles, containers, packaging',
    iconBg: '#3B82F6',
    icon: <Ionicons name="home" size={32} color={WHITE} />,
  },
  {
    id: 'corporate',
    label: 'Corporate Organization',
    description: 'Newspapers, boxes, documents',
    iconBg: '#F97316',
    icon: <MaterialCommunityIcons name="newspaper-variant" size={32} color={WHITE} />,
  },
  {
    id: 'aboboyaa',
    label: 'Aboboyaa',
    description: 'Bottles, jars, broken glass',
    iconBg: '#0891B2',
    icon: <Ionicons name="car" size={32} color={WHITE} />,
  },
];

export default function SelectCategory({ navigation }: any) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleContinue = () => {
    if (selected) {
      navigation?.navigate('CompleteSignUp', { category: selected });
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Heading */}
        <Text style={styles.heading}>Select your category</Text>

        {/* Category Cards */}
        <View style={styles.cardList}>
          {CATEGORIES.map((cat) => {
            const isSelected = selected === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                ]}
                onPress={() => setSelected(cat.id)}
                activeOpacity={0.8}
              >
                {/* Icon */}
                <View style={[styles.iconBox, { backgroundColor: cat.iconBg }]}>
                  {cat.icon}
                </View>

                {/* Text */}
                <View style={styles.cardText}>
                  <Text style={styles.cardLabel}>{cat.label}</Text>
                  <Text style={styles.cardDesc}>{cat.description}</Text>
                </View>

                {/* Checkbox */}
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                  {isSelected && (
                    <Ionicons name="checkmark" size={16} color={WHITE} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Continue Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={!selected}
        >
          <Text style={styles.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: WHITE,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },

  // Heading
  heading: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 28,
    color: TEXT,
    textAlign: 'center',
    marginBottom: 32,
    marginTop: 24,
    lineHeight: 36,
  },

  // Cards
  cardList: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD_DEFAULT_BG,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: CARD_DEFAULT_BORDER,
    padding: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: CARD_SELECTED_BG,
    borderColor: CARD_SELECTED_BORDER,
  },

  // Icon box
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  // Card text
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: FONT_BOLD,
    fontSize: 17,
    color: TEXT,
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: FONT_MEDIUM,
    fontSize: 13,
    color: '#5B6B63',
    lineHeight: 18,
  },

  // Checkbox
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C9D9D0',
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
    backgroundColor: WHITE,
  },
  continueBtn: {
    height: 58,
    backgroundColor: PRIMARY,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueBtnText: {
    fontFamily: FONT_BOLD,
    color: WHITE,
    fontSize: 16,
    letterSpacing: 0.3,
  },
});