import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';


const SPECIALTIES = ['All', 'Hearing', 'Leg', 'Brain', 'Cardio', 'Dental'];


type Props = {
selected?: string;
onSelect?: (s: string) => void;
};
export default function SpecialtyFilter({ selected = 'All', onSelect }: Props) {
return (
<ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
{SPECIALTIES.map((s) => (
<TouchableOpacity
key={s}
style={[styles.btn, selected === s && styles.selected]}
onPress={() => onSelect?.(s)}
>
<Text style={[styles.txt, selected === s && styles.selectedTxt]}>{s}</Text>
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
