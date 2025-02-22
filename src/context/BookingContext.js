"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Initial state
export const initialState = {
  bookingPeriods: [{
    year: '',
    semester: '',
    price: 0,
  }],
  services: [],
  room: {
    id: '',
    title: '',
    propertyTitle: '',
  },
  userDetails: {
    email: '',
    name: '',
    age: 0,
    genre: '',
    permanentAddress: '',
    nationality: '',
    idNumber: '',
    currentProfession: '',
    currentLocation: '',
  },
  totalPrice: 0,
};

const BookingContext = createContext();

export const BookingContextProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

  // Calculate total price whenever booking periods change
  useEffect(() => {
    const newTotal = state.bookingPeriods.reduce((sum, period) => sum + (period.price || 0), 0);
    setState(prev => ({ ...prev, totalPrice: newTotal }));
  }, [state.bookingPeriods]);

  // Update specific booking period by index
  const setBookingPeriod = (index, period) => {
    setState(prev => {
      const updatedPeriods = [...prev.bookingPeriods];
      updatedPeriods[index] = { ...updatedPeriods[index], ...period };
      return { ...prev, bookingPeriods: updatedPeriods };
    });
  };

  // Add new booking period
  const addBookingPeriod = () => {
    setState(prev => ({
      ...prev,
      bookingPeriods: [...prev.bookingPeriods, { year: '', semester: '', price: 0 }]
    }));
  };

  const clearAllBooking = () => {
    setState(prev => ({
      ...prev,
      bookingPeriods: initialState.bookingPeriods,
      room: initialState.room,
      services: initialState.services,
      totalPrice: initialState.totalPrice
    }));
  }


  // In your booking context provider
const toggleBookingPeriod = (year, semester, price) => {
  setState(prev => {
    const existingIndex = prev.bookingPeriods.findIndex(
      period => period.year === year && period.semester === semester
    );
    
    if (existingIndex >= 0) {
      // Remove period
      const updatedPeriods = prev.bookingPeriods.filter((_, i) => i !== existingIndex);
      return { ...prev, bookingPeriods: updatedPeriods };
    } else {
      // Add new period
      const newPeriod = { year, semester, price };
      return { ...prev, bookingPeriods: [...prev.bookingPeriods, newPeriod] };
    }
  });
};


  const setServices = (services) => {
    setState(prev => ({
      ...prev,
      services: Array.isArray(services) ? services : [],
    }));
  };

  // Update room information
  const setRoom = (roomInfo) => {
    setState(prev => ({
      ...prev,
      room: { ...prev.room, ...roomInfo },
    }));
  };

  // Update user details
  const setUserDetails = (details) => {
    setState(prev => ({
      ...prev,
      userDetails: { ...prev.userDetails, ...details },
    }));
  };

  return (
    <BookingContext.Provider value={{
      state,
      setState,
      clearAllBooking,
      setBookingPeriod,
      addBookingPeriod,
      setServices,
      setRoom,
      setUserDetails,
      toggleBookingPeriod
    }}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBookingState = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookingState must be used within a BookingContextProvider');
  }
  return context;
};