import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookingModal } from '../components/BookingModal';
import { Alert } from 'react-native';

// Mock the API service
jest.mock('../services/api', () => ({
  createBooking: jest.fn(),
}));

const mockDoctor = {
  id: '1',
  name: 'Dr. John Smith',
  email: 'john.smith@example.com',
  specialization: 'Cardiology',
  phoneNumber: '+1234567890',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Medical Center, New York, NY',
  },
  rating: 4.8,
  reviewsCount: 250,
  about: 'Experienced cardiologist with 15 years of practice',
  createdAt: '2020-01-01T00:00:00',
  updatedAt: '2025-11-05T00:00:00',
};

describe('BookingModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('renders correctly when visible', () => {
    const { getByText } = render(
      <BookingModal visible={true} doctor={mockDoctor} onClose={jest.fn()} />
    );

    expect(getByText('New Appointment')).toBeTruthy();
    expect(getByText('Booking with')).toBeTruthy();
    expect(getByText('Dr. John Smith')).toBeTruthy();
    expect(getByText('Cardiology')).toBeTruthy();
  });

  it('does not render when not visible', () => {
    const { queryByText } = render(
      <BookingModal visible={false} doctor={mockDoctor} onClose={jest.fn()} />
    );

    expect(queryByText('New Appointment')).toBeNull();
  });

  it('validates required fields', async () => {
    const { getByText } = render(
      <BookingModal visible={true} doctor={mockDoctor} onClose={jest.fn()} />
    );

    const submitButton = getByText('Book Appointment');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Name is required')).toBeTruthy();
      expect(getByText('Email is required')).toBeTruthy();
      expect(getByText('Phone number is required')).toBeTruthy();
    });
  });

  it('validates email format', async () => {
    const { getByPlaceholderText, getByText } = render(
      <BookingModal visible={true} doctor={mockDoctor} onClose={jest.fn()} />
    );

    const nameInput = getByPlaceholderText('Enter your full name');
    const emailInput = getByPlaceholderText('Enter your email address');
    const phoneInput = getByPlaceholderText('Enter your phone number');

    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.changeText(phoneInput, '1234567890');

    const submitButton = getByText('Book Appointment');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Enter a valid email address')).toBeTruthy();
    });
  });

  it('validates phone number format', async () => {
    const { getByPlaceholderText, getByText } = render(
      <BookingModal visible={true} doctor={mockDoctor} onClose={jest.fn()} />
    );

    const nameInput = getByPlaceholderText('Enter your full name');
    const emailInput = getByPlaceholderText('Enter your email address');
    const phoneInput = getByPlaceholderText('Enter your phone number');

    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(emailInput, 'john@example.com');
    fireEvent.changeText(phoneInput, '123'); // Too short

    const submitButton = getByText('Book Appointment');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(getByText('Enter a valid phone number (10 digits)')).toBeTruthy();
    });
  });

  it('prevents self-booking for doctors', async () => {
    // Mock AsyncStorage to return the same doctor ID
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('1');
    
    jest.spyOn(Alert, 'alert');

    const { getByPlaceholderText, getByText } = render(
      <BookingModal visible={true} doctor={mockDoctor} onClose={jest.fn()} />
    );

    const nameInput = getByPlaceholderText('Enter your full name');
    const emailInput = getByPlaceholderText('Enter your email address');
    const phoneInput = getByPlaceholderText('Enter your phone number');

    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(emailInput, 'john@example.com');
    fireEvent.changeText(phoneInput, '1234567890');

    const submitButton = getByText('Book Appointment');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Cannot Book',
        'You cannot book an appointment with yourself.',
        expect.any(Array)
      );
    });
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <BookingModal visible={true} doctor={mockDoctor} onClose={onClose} />
    );

    // Note: You'll need to add testID="close-button" to the close button in BookingModal
    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('submits booking with valid data', async () => {
    const ApiService = require('../services/api');
    ApiService.createBooking.mockResolvedValue({ id: 123 });
    
    jest.spyOn(Alert, 'alert');

    const onSuccess = jest.fn();
    const { getByPlaceholderText, getByText } = render(
      <BookingModal 
        visible={true} 
        doctor={mockDoctor} 
        onClose={jest.fn()} 
        onSuccess={onSuccess}
      />
    );

    const nameInput = getByPlaceholderText('Enter your full name');
    const emailInput = getByPlaceholderText('Enter your email address');
    const phoneInput = getByPlaceholderText('Enter your phone number');

    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(emailInput, 'john@example.com');
    fireEvent.changeText(phoneInput, '1234567890');

    const submitButton = getByText('Book Appointment');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(ApiService.createBooking).toHaveBeenCalledWith(
        mockDoctor.id,
        expect.objectContaining({
          nameUser: 'John Doe',
          emailUser: 'john@example.com',
          phoneNumberUser: '1234567890',
          appointmentTime: expect.any(String),
        })
      );
    });
  });

  it('handles booking submission errors', async () => {
    const ApiService = require('../services/api');
    ApiService.createBooking.mockRejectedValue(new Error('Network error'));
    
    jest.spyOn(Alert, 'alert');

    const { getByPlaceholderText, getByText } = render(
      <BookingModal visible={true} doctor={mockDoctor} onClose={jest.fn()} />
    );

    const nameInput = getByPlaceholderText('Enter your full name');
    const emailInput = getByPlaceholderText('Enter your email address');
    const phoneInput = getByPlaceholderText('Enter your phone number');

    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(emailInput, 'john@example.com');
    fireEvent.changeText(phoneInput, '1234567890');

    const submitButton = getByText('Book Appointment');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Booking Failed',
        expect.any(String),
        expect.any(Array)
      );
    });
  });
});
