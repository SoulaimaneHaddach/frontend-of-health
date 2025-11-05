import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { InputField } from '../components/InputField';

describe('InputField', () => {
  it('renders correctly with placeholder', () => {
    const { getByPlaceholderText } = render(
      <InputField
        placeholder="Enter email"
        value=""
        onChangeText={jest.fn()}
      />
    );

    expect(getByPlaceholderText('Enter email')).toBeTruthy();
  });

  it('displays label when provided', () => {
    const { getByText } = render(
      <InputField
        label="Email Address"
        placeholder="Enter email"
        value=""
        onChangeText={jest.fn()}
      />
    );

    expect(getByText('Email Address')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <InputField
        placeholder="Enter text"
        value=""
        onChangeText={onChangeText}
      />
    );

    const input = getByPlaceholderText('Enter text');
    fireEvent.changeText(input, 'new text');

    expect(onChangeText).toHaveBeenCalledWith('new text');
  });

  it('displays error message when error prop is provided', () => {
    const { getByText } = render(
      <InputField
        placeholder="Enter email"
        value=""
        onChangeText={jest.fn()}
        error="Email is required"
      />
    );

    expect(getByText('Email is required')).toBeTruthy();
  });

  it('renders with secure text entry for password fields', () => {
    const { getByPlaceholderText } = render(
      <InputField
        placeholder="Enter password"
        value=""
        onChangeText={jest.fn()}
        secureTextEntry
      />
    );

    const input = getByPlaceholderText('Enter password');
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('is editable by default', () => {
    const { getByPlaceholderText } = render(
      <InputField
        placeholder="Enter text"
        value=""
        onChangeText={jest.fn()}
      />
    );

    const input = getByPlaceholderText('Enter text');
    expect(input.props.editable).not.toBe(false);
  });

  it('can be disabled with editable prop', () => {
    const { getByPlaceholderText } = render(
      <InputField
        placeholder="Enter text"
        value=""
        onChangeText={jest.fn()}
        editable={false}
      />
    );

    const input = getByPlaceholderText('Enter text');
    expect(input.props.editable).toBe(false);
  });

  it('renders multiline input when multiline prop is true', () => {
    const { getByPlaceholderText } = render(
      <InputField
        placeholder="Enter description"
        value=""
        onChangeText={jest.fn()}
        multiline
      />
    );

    const input = getByPlaceholderText('Enter description');
    expect(input.props.multiline).toBe(true);
  });

  it('applies custom style when provided', () => {
    const customStyle = { marginTop: 10 };
    const { getByPlaceholderText } = render(
      <InputField
        placeholder="Enter text"
        value=""
        onChangeText={jest.fn()}
        style={customStyle}
      />
    );

    expect(getByPlaceholderText('Enter text')).toBeTruthy();
  });
});
