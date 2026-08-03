import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../constants/theme';

interface SelectFieldProps {
  placeholder: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  error?: string;
  disabled?: boolean;
  disabledHint?: string;
}

// Pill-styled field matching the sign-up TextInputs, but opens a searchable
// bottom-sheet list instead of the keyboard — used for Region/District so
// users pick from the real Ghana list instead of free-typing it.
export default function SelectField({
  placeholder,
  value,
  options,
  onSelect,
  icon,
  error,
  disabled,
  disabledHint,
}: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  const handleOpen = () => {
    if (disabled) return;
    setQuery('');
    setOpen(true);
  };

  const handleSelect = (option: string) => {
    onSelect(option);
    setOpen(false);
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.inputWrapper, disabled && styles.inputWrapperDisabled]}
        activeOpacity={0.7}
        onPress={handleOpen}
      >
        <View
          style={[
            styles.input,
            styles.inputWithLeadingIcon,
            error ? styles.inputError : null,
          ]}
        >
          <Text style={value ? styles.valueText : styles.placeholderText} numberOfLines={1}>
            {value || placeholder}
          </Text>
        </View>
        <View style={styles.leadingIcon} pointerEvents="none">
          <Ionicons name={icon} size={20} color={Colors.primary} />
        </View>
        <View style={styles.chevron} pointerEvents="none">
          <Ionicons name="chevron-down" size={18} color={Colors.textFaint} />
        </View>
      </TouchableOpacity>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : disabled && disabledHint ? (
        <Text style={styles.hintText}>{disabledHint}</Text>
      ) : null}

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <TouchableOpacity style={styles.backdropTap} activeOpacity={1} onPress={() => setOpen(false)} />
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{placeholder}</Text>

            <View style={styles.searchWrapper}>
              <Ionicons name="search-outline" size={18} color={Colors.textFaint} />
              <TextInput
                style={styles.searchInput}
                placeholder={`Search ${placeholder.toLowerCase()}`}
                placeholderTextColor={Colors.textFaint}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              style={styles.list}
              ListEmptyComponent={<Text style={styles.emptyText}>No matches found</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.option}
                  activeOpacity={0.7}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[styles.optionText, item === value && styles.optionTextSelected]}>
                    {item}
                  </Text>
                  {item === value && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputWrapperDisabled: {
    opacity: 0.55,
  },
  input: {
    height: 58,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 30,
    paddingHorizontal: 22,
    backgroundColor: Colors.inputBg,
    justifyContent: 'center',
  },
  inputWithLeadingIcon: {
    paddingLeft: 52,
    paddingRight: 40,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  leadingIcon: {
    position: 'absolute',
    left: 20,
    height: 58,
    justifyContent: 'center',
  },
  chevron: {
    position: 'absolute',
    right: 18,
    height: 58,
    justifyContent: 'center',
  },
  valueText: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.text,
  },
  placeholderText: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    color: Colors.textFaint,
  },
  errorText: {
    fontFamily: Fonts.regular,
    color: Colors.danger,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 14,
  },
  hintText: {
    fontFamily: Fonts.regular,
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 14,
  },

  // Modal sheet
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  backdropTap: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: Fonts.bold,
    fontSize: 17,
    color: Colors.text,
    marginBottom: 12,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.inputBg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.text,
    height: '100%',
  },
  list: {
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.backgroundTinted,
  },
  optionText: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    color: Colors.text,
  },
  optionTextSelected: {
    fontFamily: Fonts.semiBold,
    color: Colors.primary,
  },
  emptyText: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: Colors.textFaint,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
