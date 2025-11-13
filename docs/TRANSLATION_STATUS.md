# Translation Implementation Status

## ✅ Completed Screens
- [x] LanguageSelectionScreen - Fully translated with Arabic, French, English
- [x] WelcomeScreen - Using translations (t.welcome, t.getStarted, etc.)
- [x] RoleSelectionScreen - Using translations (t.selectRole, t.imADoctor, t.imAPatient)
- [x] DoctorLoginScreen - Using translations (t.login, t.email, etc.)

## ⏳ Screens That Need Translation

### High Priority (User-Facing)
- [ ] HomeScreen - Search, filters, doctor cards
- [ ] DoctorDetailsScreen - Doctor information, booking
- [ ] BookingModal - Booking form fields
- [ ] DoctorProfileScreen - Profile edit form
- [ ] DoctorRegisterScreen - Registration form
- [ ] ForgotPasswordScreen - Password reset
- [ ] DoctorBookingsScreen - Bookings list

### Components
- [ ] DoctorCard - Doctor info display
- [ ] NearbyDoctorsList - List view
- [ ] BottomNavBar - Navigation tabs
- [ ] CustomButton - Already has title prop (pass translations)
- [ ] InputField - Already has label prop (pass translations)

## How to Add Translations to a Screen

1. Import the hook:
```tsx
import { useLanguage } from '../context/LanguageContext';
```

2. Use in component:
```tsx
const { t, isRTL } = useLanguage();
```

3. Replace hard-coded strings:
```tsx
// Before
<Text>Welcome</Text>

// After
<Text style={isRTL && { textAlign: 'right' }}>{t.welcome}</Text>
```

4. Add RTL support to styles if needed:
```tsx
const styles = StyleSheet.create({
  // ... other styles
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
```

## Quick Translation Reference

Common translations available in `src/i18n/translations.ts`:

- `t.welcome` - Welcome message
- `t.login` / `t.register` / `t.logout`
- `t.email` / `t.phone` / `t.name`
- `t.search` / `t.filter`
- `t.bookAppointment`
- `t.save` / `t.cancel` / `t.ok`
- `t.loading` / `t.error` / `t.success`
- `t.selectLanguage`
- `t.nearbyDoctors` / `t.searchDoctors`

## Adding New Translations

Edit `src/i18n/translations.ts` and add keys to all three languages (en, fr, ar):

```typescript
export const translations: Record<Language, Translations> = {
  en: {
    myNewKey: 'English text',
  },
  fr: {
    myNewKey: 'Texte français',  
  },
  ar: {
    myNewKey: 'النص العربي',
  },
};
```
