// src/screens/doctor/components/LocationSection.tsx
import React from 'react';
import { Text } from 'react-native';
import MapView, { Marker, Region, MapPressEvent } from 'react-native-maps';
import SectionCard from './SectionCard';
import { InputField } from '../../../shared/components/InputField';
import { CustomButton } from '../../../shared/components/CustomButton';
import { COLORS, SPACING } from '../../../shared/constants/theme';

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
  onMapPress: (e: MapPressEvent) => void;
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
      <MapView
        style={styles.map}
        region={mapRegion}
        onPress={onMapPress}
        showsUserLocation
        showsMyLocationButton
      >
        <Marker 
          coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          title="Your Clinic"
          description={location.address || 'Clinic Location'}
          pinColor={COLORS.primary}
        />
      </MapView>
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
