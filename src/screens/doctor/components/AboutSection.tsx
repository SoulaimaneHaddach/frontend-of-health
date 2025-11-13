// src/screens/doctor/components/AboutSection.tsx
import React from 'react';
import { View, Text } from 'react-native';
import SectionCard from './SectionCard';
import { InputField } from '../../../shared/components/InputField';
import { useLanguage } from '../../../context/LanguageContext';

interface AboutSectionProps {
  isDark: boolean;
  about: string;
  onChangeAbout: (v: string) => void;
  error?: string;
  styles: any; 
}

export const AboutSection: React.FC<AboutSectionProps> = ({ isDark, about, onChangeAbout, error, styles }) => {
  const { t, isRTL } = useLanguage();
  
  return (
    <SectionCard 
      title={t.about} 
      icon="document-text" 
      isDark={isDark}
      hint={t.about}
    >
      <View style={[styles.textAreaWrapper, error && styles.inputError]}>
        <InputField 
          placeholder="e.g., Board-certified cardiologist with 15+ years of experience..."
          value={about}
          onChangeText={onChangeAbout}
          multiline
          numberOfLines={6}
          style={{ minHeight: 120, textAlignVertical: 'top', textAlign: isRTL ? 'right' : 'left' }}
        />
        <Text style={[styles.characterCount, isRTL && { textAlign: 'left' }]}>
          {(about || '').length}/500
        </Text>
      </View>
      {error ? <Text style={[styles.errorText, isRTL && { textAlign: 'right' }]}>{error}</Text> : null}
    </SectionCard>
  );
};

export default AboutSection;
