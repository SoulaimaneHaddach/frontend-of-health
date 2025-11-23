// src/context/LanguageContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import logger from '../shared/utils/logger';
import { I18nManager } from 'react-native';
import { Language, translations, Translations } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: Translations;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'app_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isRTL, setIsRTL] = useState(false);

  // Load saved language on mount
  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'fr' || savedLanguage === 'ar')) {
        setLanguageState(savedLanguage as Language);
        const rtl = savedLanguage === 'ar';
        setIsRTL(rtl);
        I18nManager.forceRTL(rtl);
      }
    } catch (error) {
      logger.error('Failed to load language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
      const rtl = lang === 'ar';
      setIsRTL(rtl);
      
      // Only update RTL if it changed
      if (I18nManager.isRTL !== rtl) {
        I18nManager.forceRTL(rtl);
        // User will be notified via Alert in LanguageSelectionScreen
        if (__DEV__) {
          logger.debug(`🌍 Language changed to ${lang}${rtl ? ' (RTL enabled - restart recommended)' : ''}`);
        }
      } else {
        if (__DEV__) {
          logger.debug(`🌍 Language changed to ${lang}`);
        }
      }
    } catch (error) {
      logger.error('Failed to save language:', error);
    }
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
