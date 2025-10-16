import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { formatRating } from '../utils/helpers';
import { DoctorResponseDto } from '../types';


type Props = {
doctor: DoctorResponseDto;
onPress?: () => void;
};


export default function DoctorCard({ doctor, onPress }: Props) {
return (
<TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
<View style={styles.left}>
<View style={styles.avatar}>{/* avatar placeholder */}</View>
</View>
<View style={styles.right}>
<Text style={styles.name}>{doctor.name}</Text>
<Text style={styles.spec}>{doctor.specialization}</Text>

</View>
</TouchableOpacity>
);
}


const styles = StyleSheet.create({
card: {
flexDirection: 'row',
backgroundColor: '#fff',
padding: 12,
borderRadius: 10,
marginBottom: 10,
alignItems: 'center',
shadowColor: '#000',
shadowOpacity: 0.05,
shadowRadius: 8,
elevation: 2,
},
left: { marginRight: 12 },
avatar: {
width: 56,
height: 56,
borderRadius: 28,
backgroundColor: '#E5E7EB',
},
right: { flex: 1 },
name: { fontWeight: '700', fontSize: 16 },
spec: { color: '#6B7280', marginTop: 4 },
rating: { marginTop: 6, color: '#10B981' },
});