import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { WelcomeScreen } from '../screens/WelcomeScreen';

const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  dispatch: jest.fn(),
  reset: jest.fn(),
  isFocused: jest.fn(),
  canGoBack: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  setOptions: jest.fn(),
  setParams: jest.fn(),
  getParent: jest.fn(),
  getState: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));

describe('WelcomeScreen', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders welcome screen correctly', () => {
    const { getByText } = render(<WelcomeScreen navigation={mockNavigation as any} />);

    expect(getByText(/Welcome/i)).toBeTruthy();
  });

  it('renders Get Started button', () => {
    const { getByText } = render(<WelcomeScreen navigation={mockNavigation as any} />);

    const button = getByText(/Get Started/i);
    expect(button).toBeTruthy();
  });

  it('navigates to role selection when Get Started is pressed', () => {
    const { getByText } = render(<WelcomeScreen navigation={mockNavigation as any} />);

    const button = getByText(/Get Started/i);
    fireEvent.press(button);

    expect(mockNavigate).toHaveBeenCalledWith('RoleSelection');
  });
});
