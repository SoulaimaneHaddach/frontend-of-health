# Internationalization (i18n) Guide

## Overview
The app now supports multiple languages:
- **English** (en)
- **Français** (fr) 
- **العربية** (ar) - with RTL support

## Features
- Language selection screen on first launch
- Persistent language preference
- RTL layout support for Arabic
- Easy-to-use translation hook

## Usage

### 1. Using Translations in Components

Import the `useLanguage` hook:

```tsx
import { useLanguage } from '../context/LanguageContext';

const MyComponent = () => {
  const { t, language, isRTL } = useLanguage();

  return (
    <View>
      <Text>{t.welcome}</Text>
      <Text style={isRTL && { textAlign: 'right' }}>{t.bookAppointment}</Text>
    </View>
  );
};
```

### 2. Available Translation Keys

Check `src/i18n/translations.ts` for all available keys:
- `t.welcome` - Welcome message
- `t.login` - Login text
- `t.register` - Register text
- `t.bookAppointment` - Book appointment
- And many more...

### 3. Adding New Translations

Edit `src/i18n/translations.ts`:

```typescript
export interface Translations {
  // ... existing keys
  myNewKey: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // ... existing translations
    myNewKey: 'My Text',
  },
  fr: {
    // ... existing translations
    myNewKey: 'Mon Texte',
  },
  ar: {
    // ... existing translations
    myNewKey: 'نصي',
  },
};
```

### 4. RTL Support

For Arabic, use the `isRTL` flag to adjust layouts:

```tsx
const { isRTL } = useLanguage();

<View style={[
  styles.container,
  isRTL && { flexDirection: 'row-reverse' }
]}>
  <Text style={isRTL && styles.rtlText}>{t.text}</Text>
</View>
```

### 5. Changing Language Programmatically

```tsx
const { setLanguage } = useLanguage();

// Change to French
await setLanguage('fr');

// Change to Arabic (requires app restart for full RTL)
await setLanguage('ar');
```

## App Flow

1. **First Launch**: User sees Language Selection Screen
2. **Select Language**: User chooses English, Français, or العربية
3. **Language Saved**: Preference saved to AsyncStorage
4. **Future Launches**: App loads with saved language directly to Welcome Screen

## Notes

- Arabic (RTL) requires app restart to fully apply right-to-left layout
- Language preference persists across app sessions
- All screens should use `t.keyName` instead of hard-coded strings
- Test translations in all three languages before releasing features
