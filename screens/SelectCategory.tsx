import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { RootStackScreenProps } from '../types/navigation';
import type { UserCategory } from '../types/models';
import AuthHero from '../components/AuthHero';
import communityArt from '../assets/community-flat-vector.svg';

const PRIMARY = '#059669';
const PRIMARY_SOFT = '#ECFDF5';
const TEXT = '#0F172A';
const WHITE = '#FFFFFF';
const CARD_DEFAULT_BG = '#FAFCFB';
const CARD_SELECTED_BG = '#ECFDF5';
const CARD_SELECTED_BORDER = '#059669';
const CARD_DEFAULT_BORDER = '#E7EFEA';
const FONT_MEDIUM = 'Poppins_500Medium';
const FONT_BOLD = 'Poppins_700Bold';
const FONT_EXTRABOLD = 'Poppins_800ExtraBold';
const WIDE_BREAKPOINT = 768;

type Category = {
  id: UserCategory;
  label: string;
  description: string;
  iconBg: string;
  icon: React.ReactNode;
};

const CATEGORIES: Category[] = [
  {
    id: 'household',
    label: 'HouseHold',
    description: 'Homes and residences requesting pickups',
    iconBg: '#3B82F6',
    icon: <Ionicons name="home" size={32} color={WHITE} />,
  },
  {
    id: 'corporate',
    label: 'Corporate Organization',
    description: 'Offices, shops and businesses',
    iconBg: '#F97316',
    icon: <MaterialCommunityIcons name="newspaper-variant" size={32} color={WHITE} />,
  },
  {
    id: 'aboboyaa',
    label: 'Aboboyaa',
    description: 'Waste collectors with tricycles',
    iconBg: '#0891B2',
    icon: <Ionicons name="car" size={32} color={WHITE} />,
  },
];

export default function SelectCategory({ navigation, route }: RootStackScreenProps<'SelectCategory'>) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const [selected, setSelected] = useState<UserCategory | null>(null);

  const handleContinue = () => {
    if (selected) {
      navigation.navigate('CompleteSignUp', { draft: route.params.draft, category: selected });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={PRIMARY_SOFT} />

      <View style={[styles.shell, isWide && styles.shellWide]}>
        {/* Illustration header — top band on phones, left panel on wide screens */}
        <AuthHero wide={isWide} asset={communityArt} artWidth={260} artHeight={173} />

        <View style={styles.formPane}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.column, isWide && styles.columnWide]}>
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
            </View>
          </ScrollView>

          {/* Sticky Continue Button */}
          <View style={[styles.footer, isWide && styles.footerWide, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
              onPress={handleContinue}
              activeOpacity={0.85}
              disabled={!selected}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: WHITE,
  },
  shell: {
    flex: 1,
  },
  shellWide: {
    flexDirection: 'row',
  },
  formPane: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  column: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  columnWide: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },

  // Heading
  heading: {
    fontFamily: FONT_EXTRABOLD,
    fontSize: 28,
    color: PRIMARY,
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
    paddingTop: 12,
    backgroundColor: WHITE,
  },
  footerWide: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
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
