# Test Suite Documentation

## Overview
This test suite provides comprehensive testing coverage for the Healthcare Platform mobile application.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

## Test Structure

### Component Tests
- **BookingModal.test.tsx** - Tests for the booking modal component
  - Form validation (name, email, phone)
  - Self-booking prevention
  - Booking submission
  - Error handling

- **CustomButton.test.tsx** - Tests for the custom button component
  - Rendering with different variants (primary, secondary, outline)
  - Button press handling
  - Disabled state
  - Loading state

- **InputField.test.tsx** - Tests for the input field component
  - Text input handling
  - Error display
  - Secure text entry
  - Multiline input
  - Label rendering

### Screen Tests
- **WelcomeScreen.test.tsx** - Tests for the welcome screen
  - Screen rendering
  - Navigation to role selection

### Utility Tests
- **helpers.test.ts** - Tests for utility functions
  - Rating formatting

### API Tests
- **api.test.ts** - Tests for API service
  - Authentication endpoints
  - Doctor operations
  - Booking operations
  - Error handling

## Test Coverage

The test suite covers:
- ✅ Component rendering
- ✅ User interactions
- ✅ Form validation
- ✅ Navigation
- ✅ API calls
- ✅ Error handling
- ✅ Edge cases

## Mocking

The following are mocked in tests:
- `AsyncStorage` - For local storage operations
- `@react-navigation/native` - For navigation
- `react-native-modal-datetime-picker` - For date/time pickers
- `@expo/vector-icons` - For icons
- `axios` - For API calls (using axios-mock-adapter)

## Adding New Tests

1. Create a new test file in `src/__tests__/`
2. Follow the naming convention: `ComponentName.test.tsx`
3. Import testing utilities from `@testing-library/react-native`
4. Write descriptive test cases using `describe` and `it` blocks
5. Use `beforeEach` for setup and cleanup
6. Mock external dependencies as needed

## Best Practices

- ✅ Test user behavior, not implementation details
- ✅ Use descriptive test names
- ✅ Keep tests isolated and independent
- ✅ Mock external dependencies
- ✅ Test both success and error cases
- ✅ Maintain high test coverage (aim for >80%)

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm test

- name: Upload Coverage
  run: npm run test:coverage
```

## Troubleshooting

### Common Issues

**Issue**: Tests fail due to missing mocks
**Solution**: Ensure all external dependencies are mocked in `jest.setup.js`

**Issue**: React Native module errors
**Solution**: Check `transformIgnorePatterns` in `jest.config.js`

**Issue**: Async tests timeout
**Solution**: Use `waitFor` from `@testing-library/react-native` for async operations

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
