// src/screens/doctor/components/AboutSection.tsx
import React from 'react';
import { View, Text } from 'react-native';
import SectionCard from './SectionCard';
import { InputField } from '../../../shared/components/InputField';

interface AboutSectionProps {
  isDark: boolean;
  about: string;
  onChangeAbout: (v: string) => void;
  error?: string;
  styles: any; 
}

export const AboutSection: React.FC<AboutSectionProps> = ({ isDark, about, onChangeAbout, error, styles }) => {
  return (
    <SectionCard 
      title="About You" 
      icon="document-text" 
      isDark={isDark}
      hint="Share your experience, qualifications, and approach to patient care"
    >
      <View style={[styles.textAreaWrapper, error && styles.inputError]}>
        <InputField 
          placeholder="e.g., Board-certified cardiologist with 15+ years of experience in treating cardiovascular diseases..."
          value={about}
          onChangeText={onChangeAbout}
          multiline
          numberOfLines={6}
          style={{ minHeight: 120, textAlignVertical: 'top' }}
        />
        <Text style={styles.characterCount}>
          {(about || '').length}/500
        </Text>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </SectionCard>
  );
};

export default AboutSection;
