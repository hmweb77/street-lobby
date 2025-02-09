"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { client } from '@/sanity/lib/client';

import { propertyQueries } from '@/lib/sanity/queries';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [locations, setLocations] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedFilters, setSelectedFilters] = useState({
    period: null,
    location: null,
    roomType: null,
    colivingCapacity: null,
    propertyType: null,
    priceValue: 650,
    selectedYear: "2024 / 2025"
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [propertiesData, locationsData, roomTypesData, propertyTypesData] = await Promise.all([
          client.fetch(propertyQueries.getAllProperties),
          client.fetch(propertyQueries.getLocations),
          client.fetch(propertyQueries.getRoomTypes),
          client.fetch(propertyQueries.getPropertyTypes),
        ]);

        setProperties(propertiesData);
        setFilteredProperties(propertiesData);
        setLocations(locationsData);
        setRoomTypes(roomTypesData);
        setPropertyTypes(propertyTypesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const updateFilters = (newFilters) => {
    setSelectedFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const updateFilteredProperties = (properties) => {
    setFilteredProperties(properties);
  };

  const value = {
    properties,
    filteredProperties,
    selectedFilters,
    locations,
    roomTypes,
    propertyTypes,
    loading,
    updateFilters,
    updateFilteredProperties
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
