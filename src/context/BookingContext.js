"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Initial state
export const initialState = {
  bookingPeriods: [],
  commonUserDetails: {
    email: "",
    name: "",
    age: 0,
    genre: "",
    permanentAddress: "",
    nationality: "",
    idNumber: "",
    currentProfession: "",
    currentLocation: "",
  },
  totalPrice: 0,
  useCommonDetails: false, // Added useCommonDetails flag
};

const BookingContext = createContext();

export const BookingContextProvider = ({ children }) => {
  const [state, setState] = useState(initialState);

  // Automatic total price calculation
  // Automatic total price calculation
  useEffect(() => {
    const newTotal = state.bookingPeriods.reduce(
      (sum, period) =>
        sum +
        (period.price || 0) +
        (period.services?.reduce(
          (sSum, service) => sSum + (service.price || 0),
          0
        ) || 0),
      0
    );
    setState((prev) => ({ ...prev, totalPrice: newTotal }));
  }, [state.bookingPeriods]);

  // Enhanced setBooking with room details
  const setBooking = (roomId, roomDetails, year, semester, data) => {
    setState((prev) => {
      const existingIndex = prev.bookingPeriods.findIndex(
        (period) =>
          period.roomId === roomId &&
          period.year === year &&
          period.semester === semester
      );

      let updatedPeriod;

      if (existingIndex >= 0) {
        // Merge existing period with updates
        const existing = prev.bookingPeriods[existingIndex];
        updatedPeriod = {
          ...existing,
          ...roomDetails,
          ...data,
          userDetails: data.userDetails ?? existing.userDetails,
        };
      } else {
        // Create new period
        updatedPeriod = {
          roomId,
          ...roomDetails,
          year,
          semester,
          services: [],
          ...data,
          userDetails: data.userDetails ?? prev.commonUserDetails,
        };
      }

      const updatedPeriods = [...prev.bookingPeriods];
      if (existingIndex >= 0) {
        updatedPeriods[existingIndex] = updatedPeriod;
      } else {
        updatedPeriods.push(updatedPeriod);
      }

      return { ...prev, bookingPeriods: updatedPeriods };
    });
  };

  // Service management functions
  const addServiceToBooking = (roomId, year, semester, service) => {
    setState((prev) => {
      const index = prev.bookingPeriods.findIndex(
        (period) =>
          period.roomId === roomId &&
          period.year === year &&
          period.semester === semester
      );
      if (index === -1) return prev;

      const updatedPeriods = [...prev.bookingPeriods];
      updatedPeriods[index].services = [
        ...updatedPeriods[index].services,
        { ...service, roomId },
      ];

      return { ...prev, bookingPeriods: updatedPeriods };
    });
  };

  const removeServiceFromBooking = (roomId, year, semester, serviceId) => {
    setState((prev) => {
      const index = prev.bookingPeriods.findIndex(
        (period) =>
          period.roomId === roomId &&
          period.year === year &&
          period.semester === semester
      );
      if (index === -1) return prev;

      const updatedPeriods = [...prev.bookingPeriods];
      updatedPeriods[index].services = updatedPeriods[index].services.filter(
        (service) => service.id !== serviceId
      );

      return { ...prev, bookingPeriods: updatedPeriods };
    });
  };

  // Booking management functions
  const removeBooking = (roomId, year, semester) => {
    setState((prev) => ({
      ...prev,
      bookingPeriods: prev.bookingPeriods.filter(
        (period) =>
          !(
            period.roomId === roomId &&
            period.year === year &&
            period.semester === semester
          )
      ),
    }));
  };

  const getBooking = (roomId, year, semester) => {
    return state.bookingPeriods.find(
      (period) =>
        period.roomId === roomId &&
        period.year === year &&
        period.semester === semester
    );
  };

  // Common details management
  const setCommonUserDetails = (details) => {
    setState((prev) => ({
      ...prev,
      commonUserDetails: { ...prev.commonUserDetails, ...details },
      useCommonDetails: true,
    }));
  };

  const applyCommonToAll = () => {
    setState((prev) => ({
      ...prev,
      bookingPeriods: prev.bookingPeriods.map((period) => ({
        ...period,
        userDetails: { ...prev.commonUserDetails },
      })),
    }));
  };

  // Common details mode management
  // const setUseCommonDetails = (value) => {
  //   setState((prev) => ({
  //     ...prev,
  //     useCommonDetails: value,
  //   }));
  // };

  const clearAllBookings = () => {
    setState({
      ...initialState,
      useCommonDetails: false, // Reset to initial false state
    });
  };

  // Helper function
  const getRoomDetails = (roomId) => {
    const period = state.bookingPeriods.find((p) => p.roomId === roomId);
    return period
      ? {
          id: period.roomId,
          title: period.roomTitle,
          propertyTitle: period.propertyTitle,
          imageUrl: period.imageUrl,
        }
      : null;
  };

  return (
    <BookingContext.Provider
      value={{
        state,
        setBooking,
        removeBooking,
        getBooking,
        addServiceToBooking,
        removeServiceFromBooking,
        setCommonUserDetails,
        applyCommonToAll,
        clearAllBookings,
        // setUseCommonDetails, // Expose the setter
        getRoomDetails,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};

export const useBookingState = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error(
      "useBookingState must be used within a BookingContextProvider"
    );
  }
  return context;
};
