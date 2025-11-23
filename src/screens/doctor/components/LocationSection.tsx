// src/screens/doctor/components/LocationSection.tsx
import React from 'react';
import { Text } from 'react-native';
import { Region } from 'react-native-maps';
import OSMMap from '../../../components/OSMMap';
import SectionCard from './SectionCard';
import { InputField } from '../../../shared/components/InputField';
import { CustomButton } from '../../../shared/components/CustomButton';
import { SPACING } from '../../../shared/constants/theme';
import { useTheme } from '../../../context/ThemeContext';
import logger from '../../../shared/utils/logger';

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
}

interface LocationSectionProps {
  isDark: boolean;
  location: LocationData;
  mapRegion: Region;
  onChangeAddress: (v: string) => void;
  onChangeCity: (v: string) => void;
  onMapPress: (e: any) => void;
  onUseCurrentLocation: () => void;
  locationLoading: boolean;
  errors?: { address?: string; city?: string };
  styles: any; 
}
export const LocationSection: React.FC<LocationSectionProps> = ({
  isDark,
  location,
  mapRegion,
  onChangeAddress,
  onChangeCity,
  onMapPress,
  onUseCurrentLocation,
  locationLoading,
  errors = {},
  styles,
}) => {
  const { colors } = useTheme();
  return (
    <SectionCard title="Clinic Location" icon="location" isDark={isDark}>
      <InputField 
        label="Address" 
        placeholder="Street, Building"
        value={location.address}
        onChangeText={onChangeAddress}
        icon="location-outline"
        error={errors.address}
      />
      <InputField 
        label="City" 
        placeholder="City name"
        value={location.city}
        onChangeText={onChangeCity}
        icon="map-outline"
        error={errors.city}
      />

      <Text style={styles.mapLabel}>📍 Pin Your Clinic Location</Text>
      <Text style={styles.mapHint}>Tap on the map to set your clinic location</Text>
      <OSMMap
        style={styles.map}
        initialRegion={{ latitude: mapRegion.latitude, longitude: mapRegion.longitude }}
        userLocation={{ latitude: location.latitude, longitude: location.longitude }}
        markers={[{ id: 'clinic', latitude: location.latitude, longitude: location.longitude, title: 'Your Clinic', description: location.address || 'Clinic Location', color: colors.primary, label: 'C' }]}
        onMapPress={(lat, lng) => {
          try {
            // adapt to MapPressEvent shape expected by parent
            onMapPress({ nativeEvent: { coordinate: { latitude: lat, longitude: lng } } } as any);
          } catch (e) {
            logger.warn('OSM onMapPress handling error', e);
          }
        }}
      />
      <CustomButton 
        title={locationLoading ? ' Getting Location...' : 'Use My Current Location'}
        onPress={onUseCurrentLocation}
        variant="secondary"
        size="large"
        fullWidth
        style={{ marginBottom: SPACING.md }}
        loading={locationLoading}
        disabled={locationLoading}
      />
    </SectionCard>
  );
};

export default LocationSection;
