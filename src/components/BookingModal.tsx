// src/components/BookingModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { InputField } from '../shared/components/InputField';
import { CustomButton } from '../shared/components/CustomButton';
// import { CustomAlert } from './CustomAlert'; // TODO: Use custom alert in future for better design
import { COLORS, FONT_SIZES, SPACING, RADIUS, SHADOWS } from '../shared/constants/theme';
import ApiService from '../services/api';
import { DoctorResponseDto } from '../shared/types';

interface BookingModalProps {
  visible: boolean;
  doctor: DoctorResponseDto;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  visible,
  doctor,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // TODO: Custom alert state (for future use with CustomAlert component)
  // const [alertVisible, setAlertVisible] = useState(false);
  // const [alertConfig, setAlertConfig] = useState({
  //   title: '',
  //   message: '',
  //   icon: 'checkmark-circle' as keyof typeof Ionicons.glyphMap,
  //   iconColor: COLORS.primary,
  //   buttons: [] as Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
  // });

  // Log initial date on mount
  React.useEffect(() => {
    console.log('🎯 BookingModal opened, initial date:', appointmentDate.toLocaleString());
  }, [visible]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[0-9\s-]{8,}$/.test(phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Check if appointment is in the past
    if (appointmentDate < new Date()) {
      newErrors.date = 'Appointment must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helpers to contact the doctor when server blocks guest bookings
  const callDoctor = () => {
    if (doctor.phoneNumber) {
      Linking.openURL(`tel:${doctor.phoneNumber}`);
    }
  };

  const whatsappDoctor = async () => {
    if (!doctor.phoneNumber) return;
    const text = encodeURIComponent(
      `Hello Dr. ${doctor.name}, I'd like to request an appointment on ${formatDate(appointmentDate)} at ${formatTime(appointmentDate)}.`
    );
    const phone = doctor.phoneNumber.replace(/[^0-9+]/g, '');
    const waURI = `whatsapp://send?phone=${phone}&text=${text}`;
    const waWeb = `https://wa.me/${phone}?text=${text}`;
    const can = await Linking.canOpenURL(waURI);
    Linking.openURL(can ? waURI : waWeb);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Public booking: no login required
    // Guard: if logged-in doctor tries to book themselves, block it
    try {
      const myDoctorId = await AsyncStorage.getItem('doctorId');
      if (myDoctorId && myDoctorId === doctor.id) {
        Alert.alert(
          'Not Allowed',
          'You cannot book an appointment with yourself.',
          [{ text: 'OK' }]
        );
        return;
      }
    } catch {}

    setLoading(true);
    console.log('🚀 Creating booking with:', {
      doctorId: doctor.id,
      name,
      email,
      phone,
      appointmentISO: appointmentDate.toISOString(),
    });

    const toLocalDateTimeString = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      const ss = pad(d.getSeconds());
      return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
    };

    try {
      const booking = await ApiService.createBooking(doctor.id, {
        nameUser: name.trim(),
        emailUser: email.trim(),
        phoneNumberUser: phone.trim(),
        appointmentTime: toLocalDateTimeString(appointmentDate),
      });

      Alert.alert(
        'Booking Sent! ✓',
        `Your appointment request with Dr. ${doctor.name} has been sent successfully.\n\nThe doctor will review your request and contact you directly via phone or email to confirm.`,
        [
          {
            text: 'Done',
            onPress: () => {
              handleClose();
              onSuccess?.();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ Booking error:', {
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      const status = Number(error?.response?.status) || 0;
      const isPolicyBlock = status === 401 || status === 403;
      const message =
        error?.response?.data?.message ||
        (isPolicyBlock
          ? 'Booking is blocked by the server for guests. Please log in (doctor) to continue, or try again later.'
          : 'Failed to create booking. Please try again.');

      Alert.alert(
        'Booking Failed',
        message,
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAppointmentDate(new Date());
    setErrors({});
    onClose();
  };

  const onConfirmDate = (selectedDate: Date) => {
    setShowDatePicker(false);
    const newDate = new Date(selectedDate);
    newDate.setHours(appointmentDate.getHours());
    newDate.setMinutes(appointmentDate.getMinutes());
    console.log('✅ Date updated to:', newDate.toLocaleString());
    setAppointmentDate(newDate);
    if (errors.date) {
      const { date, ...rest } = errors;
      setErrors(rest);
    }
  };

  const onCancelDate = () => setShowDatePicker(false);

  const onConfirmTime = (selectedDate: Date) => {
    setShowTimePicker(false);
    const newDate = new Date(appointmentDate);
    newDate.setHours(selectedDate.getHours());
    newDate.setMinutes(selectedDate.getMinutes());
    console.log('✅ Time updated to:', newDate.toLocaleString());
    setAppointmentDate(newDate);
    if (errors.date) {
      const { date, ...rest } = errors;
      setErrors(rest);
    }
  };
  const onCancelTime = () => setShowTimePicker(false);
  const formatDate = (date: Date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.error('❌ Invalid date object:', date);
        return 'Select Date';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return 'Select Date';
    }
  };

  const formatTime = (date: Date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.error('❌ Invalid date object:', date);
        return 'Select Time';
      }
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('❌ Error formatting time:', error);
      return 'Select Time';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      transparent={false}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={COLORS.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Appointment</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Doctor Info Card */}
          <View style={styles.doctorCard}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.doctorAvatarText}>{doctor.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorLabel}>Booking with</Text>
              <Text style={styles.doctorName}>Dr. {doctor.name}</Text>
              <Text style={styles.doctorSpecialty}>{doctor.specialization}</Text>
            </View>
          </View>

          {/* Date & Time Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Date & Time</Text>

            {/* Date Selection Card */}
            <TouchableOpacity
              style={styles.selectionCard}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.selectionHeader}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                <Text style={styles.selectionLabel}>Appointment Date</Text>
              </View>
              <View style={styles.selectionValueContainer}>
                <Text style={styles.selectionValue}>
                  {formatDate(appointmentDate)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </View>
            </TouchableOpacity>

            {/* Time Selection Card */}
            <TouchableOpacity
              style={styles.selectionCard}
              onPress={() => setShowTimePicker(true)}
              activeOpacity={0.7}
            >
              <View style={styles.selectionHeader}>
                <Ionicons name="time-outline" size={20} color={COLORS.primary} />
                <Text style={styles.selectionLabel}>Appointment Time</Text>
              </View>
              <View style={styles.selectionValueContainer}>
                <Text style={styles.selectionValue}>
                  {formatTime(appointmentDate)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              </View>
            </TouchableOpacity>

            {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
          </View>

          {/* Patient Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Information</Text>

            <InputField
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChangeText={(text) => {
                setName(text);
                const newErrors = { ...errors };
                delete newErrors.name;
                setErrors(newErrors);
              }}
              icon="person"
              error={errors.name}
            />

            <InputField
              label="Email Address"
              placeholder="patient@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                const newErrors = { ...errors };
                delete newErrors.email;
                setErrors(newErrors);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail"
              error={errors.email}
            />

            <InputField
              label="Phone Number"
              placeholder="+212 123 456 789"
              value={phone}
              onChangeText={(text) => {
                setPhone(text);
                const newErrors = { ...errors };
                delete newErrors.phone;
                setErrors(newErrors);
              }}
              keyboardType="phone-pad"
              icon="call"
              error={errors.phone}
            />
          </View>
          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={COLORS.info || COLORS.primary} />
            <Text style={styles.infoText}>
              The doctor will review your request and contact you directly to confirm your appointment.
            </Text>
          </View>
          {/* Submit Button */}
          <CustomButton
            title="Send Booking Request"
            onPress={handleSubmit}
            variant="primary"
            size="large"
            fullWidth
            loading={loading}
            style={styles.submitButton}
          />
        </ScrollView>
        {/* Cross-platform modal pickers */}
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          date={appointmentDate}
          minimumDate={new Date()}
          display="spinner"
          onConfirm={onConfirmDate}
          onCancel={onCancelDate}
          isDarkModeEnabled={false}
          themeVariant="light"
          textColor="#000000"
          pickerContainerStyleIOS={{ backgroundColor: '#FFFFFF' }}
          confirmTextIOS="Confirm"
          cancelTextIOS="Cancel"
        />
        <DateTimePickerModal
          isVisible={showTimePicker}
          mode="time"
          date={appointmentDate}
          display="spinner"
          onConfirm={onConfirmTime}
          onCancel={onCancelTime}
          isDarkModeEnabled={false}
          themeVariant="light"
          textColor="#000000"
          pickerContainerStyleIOS={{ backgroundColor: '#FFFFFF' }}
          confirmTextIOS="Confirm"
          cancelTextIOS="Cancel"
        />

        {/* Custom Alert - Preserved for future use */}
        {/* <CustomAlert
          visible={alertVisible}
          title={alertConfig.title}
          message={alertConfig.message}
          icon={alertConfig.icon}
          iconColor={alertConfig.iconColor}
          buttons={alertConfig.buttons}
          onClose={() => setAlertVisible(false)}
        /> */}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '08',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  doctorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  doctorAvatarText: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  doctorName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  selectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small,
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  selectionLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  selectionValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    minHeight: 48,
  },
  selectionValue: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  errorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.primary + '08',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  submitButton: {
    marginBottom: SPACING.xl,
  },
});
