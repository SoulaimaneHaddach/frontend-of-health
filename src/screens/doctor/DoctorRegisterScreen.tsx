// src/screens/doctor/DoctorRegisterScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { CustomButton } from '../../components/CustomButton';
import { InputField } from '../../components/InputField';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/theme';
import ApiService from '../../services/api';

type DoctorRegisterScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const DoctorRegisterScreen: React.FC<DoctorRegisterScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) setErrors({ ...errors, [field]: '' });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
    if (!formData.specialty.trim()) newErrors.specialty = 'Specialty is required';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await ApiService.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        specialization: formData.specialty,
        phoneNumber: formData.phone,
        latitude: 0,
        longitude: 0,
        address: 'Unknown',
      });
      Alert.alert('Success', 'Account created successfully.');
      navigation.replace('DoctorLogin');
    } catch (error: any) {
      console.error('Registration error:', error.response || error);
      Alert.alert('Registration Failed', error.response?.data?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl }} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: SPACING.md, marginBottom: SPACING.lg }}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={{ fontSize: FONT_SIZES.xxxl, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm }}>Create Account</Text>
          <Text style={{ fontSize: FONT_SIZES.base, color: COLORS.textSecondary, marginBottom: SPACING.lg }}>Join as a healthcare professional</Text>

          <InputField label="Full Name" placeholder="Dr. John Doe" value={formData.name} onChangeText={(v) => updateField('name', v)} icon="person" error={errors.name} />
          <InputField label="Email Address" placeholder="doctor@example.com" value={formData.email} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" icon="mail" error={errors.email} />
          <InputField label="Phone Number" placeholder="+1 234 567 8900" value={formData.phone} onChangeText={(v) => updateField('phone', v)} keyboardType="phone-pad" icon="call" error={errors.phone} />
          <InputField label="Specialty" placeholder="Cardiology" value={formData.specialty} onChangeText={(v) => updateField('specialty', v)} icon="fitness" error={errors.specialty} />
          <InputField label="Password" placeholder="Create a strong password" value={formData.password} onChangeText={(v) => updateField('password', v)} isPassword icon="lock-closed" error={errors.password} />
          <InputField label="Confirm Password" placeholder="Re-enter your password" value={formData.confirmPassword} onChangeText={(v) => updateField('confirmPassword', v)} isPassword icon="lock-closed" error={errors.confirmPassword} />

          <CustomButton title="Create Account" onPress={handleRegister} variant="secondary" size="large" fullWidth loading={loading} />
          <View style={{ flexDirection: 'row', justifyContent: 'center', paddingVertical: SPACING.lg }}>
            <Text style={{ fontSize: FONT_SIZES.base, color: COLORS.textSecondary }}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('DoctorLogin')}><Text style={{ fontSize: FONT_SIZES.base, color: COLORS.secondary, fontWeight: '600' }}>Sign In</Text></TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
});
