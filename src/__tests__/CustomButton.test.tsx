import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CustomButton } from '../shared/components/CustomButton';

describe('CustomButton', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(
      <CustomButton title="Click Me" onPress={jest.fn()} />
    );

    expect(getByText('Click Me')).toBeTruthy();
  });

  it('calls onPress when button is pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <CustomButton title="Press" onPress={onPress} />
    );

    fireEvent.press(getByText('Press'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders with primary variant by default', () => {
    const { getByText } = render(
      <CustomButton title="Primary" onPress={jest.fn()} />
    );

    const button = getByText('Primary').parent;
    expect(button).toBeTruthy();
  });

  it('renders with secondary variant', () => {
    const { getByText } = render(
      <CustomButton title="Secondary" variant="secondary" onPress={jest.fn()} />
    );

    expect(getByText('Secondary')).toBeTruthy();
  });

  it('renders with outline variant', () => {
    const { getByText } = render(
      <CustomButton title="Outline" variant="outline" onPress={jest.fn()} />
    );

    expect(getByText('Outline')).toBeTruthy();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <CustomButton title="Disabled" onPress={onPress} disabled />
    );

    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders with custom style', () => {
    const customStyle = { marginTop: 20 };
    const { getByText } = render(
      <CustomButton title="Custom" onPress={jest.fn()} style={customStyle} />
    );

    expect(getByText('Custom')).toBeTruthy();
  });

  it('shows loading state when loading prop is true', () => {
    const { queryByText } = render(
      <CustomButton title="Loading" onPress={jest.fn()} loading />
    );

    expect(queryByText('Loading')).toBeFalsy();
  });
});
