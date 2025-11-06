// src/types/booking.ts
// Booking-related types matching backend DTOs

export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'DONE' | 'CANCELED';

export interface BookingCreateRequest {
  phoneNumberUser: string;
  emailUser: string;
  nameUser: string;
  appointmentTime: string;
}

export interface BookingResponse {
  id: string;
  doctorId: string;
  phoneNumberUser: string;
  emailUser: string;
  nameUser: string;
  appointmentTime: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  doctorName?: string;
  doctorSpecialization?: string;
  doctorPhone?: string;
}

export interface BookingStatusUpdateRequest {
  bookingId: string;
  status: BookingStatus;
}
