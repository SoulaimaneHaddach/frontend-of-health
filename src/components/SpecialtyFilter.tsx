import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { useLanguage } from '../context/LanguageContext';

const SPECIALTIES = ['All', 'Hearing', 'Leg', 'Brain', 'Cardio', 'Dental'];

// Helper to get translated specialty
const getSpecialtyTranslation = (specialty: string, t: any): string => {
  const key = specialty.toLowerCase();
  if (key === 'all') return t.allSpecialties;
  return (t[key] as string) || specialty;
};

type Props = {
  selected?: string;
  onSelect?: (s: string) => void;
};

export default function SpecialtyFilter({ selected = 'All', onSelect }: Props) {
  const { t, isRTL } = useLanguage();
  
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      style={{ marginVertical: 8 }}
      contentContainerStyle={isRTL && { flexDirection: 'row-reverse' }}
    >
      {SPECIALTIES.map((s) => (
        <TouchableOpacity
          key={s}
          style={[
            styles.btn, 
            selected === s && styles.selected,
            isRTL && { marginRight: 0, marginLeft: 8 }
          ]}
          onPress={() => onSelect?.(s)}
        >
          <Text style={[styles.txt, selected === s && styles.selectedTxt]}>
            {getSpecialtyTranslation(s, t)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
btn: {
paddingHorizontal: 12,
paddingVertical: 8,
borderRadius: 20,
backgroundColor: '#FFF',
borderWidth: 1,
borderColor: '#E5E7EB',
marginRight: 8,
},
selected: {
backgroundColor: '#3B82F6',
borderColor: '#3B82F6',
},
txt: { color: '#111827' },
selectedTxt: { color: '#fff' },
});
