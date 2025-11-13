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
import { useLanguage } from '../context/LanguageContext';
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
  const { t, isRTL } = useLanguage();
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
      newErrors.name = t.requiredField;
    }

    if (!email.trim()) {
      newErrors.email = t.requiredField;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t.invalidEmail;
    }

    if (!phone.trim()) {
      newErrors.phone = t.requiredField;
    } else if (!/^\+?[0-9\s-]{8,}$/.test(phone)) {
      newErrors.phone = t.invalidPhone;
    }

    // Check if appointment is in the past
    if (appointmentDate < new Date()) {
      newErrors.date = t.error;
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
          t.error,
          t.error,
          [{ text: t.ok }]
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
        t.bookingSuccess,
        `${t.bookingSuccess}\n\n${t.bookingDetails}`,
        [
          {
            text: t.ok,
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
        t.bookingFailed,
        message,
        [{ text: t.ok }]
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
        return t.selectDate;
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return t.selectDate;
    }
  };

  const formatTime = (date: Date) => {
    try {
      if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        console.error('❌ Invalid date object:', date);
        return t.selectTime;
      }
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('❌ Error formatting time:', error);
      return t.selectTime;
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
          <Text style={[styles.headerTitle, isRTL && { textAlign: 'right' }]}>{t.bookAppointment}</Text>
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
          <View style={[styles.doctorCard, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={styles.doctorAvatar}>
              <Ionicons name="medical" size={32} color={COLORS.white} />
            </View>
            <View style={styles.doctorInfo}>
              <Text style={[styles.doctorLabel, isRTL && { textAlign: 'right' }]}>{t.bookingDetails}</Text>
              <Text style={[styles.doctorName, isRTL && { textAlign: 'right' }]}>Dr. {doctor.name}</Text>
              <Text style={[styles.doctorSpecialty, isRTL && { textAlign: 'right' }]}>{doctor.specialization}</Text>
            </View>
          </View>

          {/* Patient Info - MOVED TO TOP */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
              <Ionicons name="person-outline" size={18} color={COLORS.primary} /> {t.patientName}
            </Text>

            <InputField
              label={t.name}
              placeholder={t.name}
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
              label={t.email}
              placeholder={t.email}
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
              label={t.phone}
              placeholder={t.phone}
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

          {/* Date & Time Selection - MOVED TO BOTTOM */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && { textAlign: 'right' }]}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} /> {t.selectDate} & {t.selectTime}
            </Text>

            <View style={styles.dateTimeRow}>
              {/* Date Selection Card */}
              <TouchableOpacity
                style={styles.halfCard}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name="calendar" size={22} color={COLORS.primary} />
                </View>
                <Text style={[styles.cardLabel, isRTL && { textAlign: 'right' }]}>{t.selectDate}</Text>
                <Text style={[styles.cardValue, isRTL && { textAlign: 'right' }]} numberOfLines={2}>
                  {formatDate(appointmentDate)}
                </Text>
              </TouchableOpacity>

              {/* Time Selection Card */}
              <TouchableOpacity
                style={styles.halfCard}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Ionicons name="time" size={22} color={COLORS.secondary} />
                </View>
                <Text style={[styles.cardLabel, isRTL && { textAlign: 'right' }]}>{t.selectTime}</Text>
                <Text style={[styles.cardValue, isRTL && { textAlign: 'right' }]}>
                  {formatTime(appointmentDate)}
                </Text>
              </TouchableOpacity>
            </View>

            {errors.date && <Text style={[styles.errorText, isRTL && { textAlign: 'right' }]}>{errors.date}</Text>}
          </View>

          {/* Submit Button */}
          <CustomButton
            title={t.confirmBooking}
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
          confirmTextIOS={t.confirm}
          cancelTextIOS={t.cancel}
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
          confirmTextIOS={t.confirm}
          cancelTextIOS={t.cancel}
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
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  doctorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  doctorAvatarText: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.white + 'CC',
    fontWeight: '600',
    marginBottom: 2,
  },
  doctorName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.white + 'DD',
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
  dateTimeRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  halfCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    ...SHADOWS.medium,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  cardLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
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
